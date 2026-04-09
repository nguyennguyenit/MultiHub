// Package terminal manages PTY processes and terminal lifecycle.
package terminal

import (
	"context"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/multihub/multihub/pkg/types"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	ghostCacheMax = 50                // max number of exited terminal sessions to keep
	ghostCacheTTL = 30 * time.Minute // how long to retain ghost sessions
)

// CreateOptions configures a new terminal.
type CreateOptions struct {
	Shell     string
	Cwd       string
	ProjectID string
	Title     string
}

// ghostEntry wraps a TerminalSession with its expiry time.
type ghostEntry struct {
	session  types.TerminalSession
	expiresAt time.Time
}

// Manager manages the lifecycle of all PTY processes.
// All public methods are safe for concurrent use.
type Manager struct {
	mu              sync.RWMutex
	appCtx          context.Context
	terminals       map[string]*PTYProcess
	titleIndex      map[string]string  // title → terminal UUID (for PtyCreate compat)
	exitedTerminals map[string]ghostEntry // ghost cache
	nextTerminalNum int
	systemSuspended bool
}

// NewManager creates a Manager. appCtx must be the Wails application context.
func NewManager(appCtx context.Context) *Manager {
	return &Manager{
		appCtx:          appCtx,
		terminals:       make(map[string]*PTYProcess),
		titleIndex:      make(map[string]string),
		exitedTerminals: make(map[string]ghostEntry),
	}
}

// ── Public API ────────────────────────────────────────────────────────────────

// Create spawns a new terminal and returns its metadata.
func (m *Manager) Create(opts CreateOptions) (types.Terminal, error) {
	shell := opts.Shell
	if shell == "" {
		shell = ResolveDefaultShell()
	}
	cwd := opts.Cwd
	if cwd == "" {
		if wd, err := os.Getwd(); err == nil {
			cwd = wd
		} else {
			cwd = os.Getenv("HOME")
		}
	}

	m.mu.Lock()
	m.nextTerminalNum++
	num := m.nextTerminalNum
	m.mu.Unlock()

	title := opts.Title
	if title == "" {
		title = fmt.Sprintf("Terminal %d", num)
	}

	meta := types.Terminal{
		ID:               uuid.New().String(),
		Title:            title,
		Cwd:              cwd,
		ProjectID:        opts.ProjectID,
		CreatedAt:        time.Now(),
		AllowTitleUpdate: true,
	}

	p, err := newProcess(m.appCtx, meta, shell, cwd)
	if err != nil {
		return types.Terminal{}, fmt.Errorf("create terminal: %w", err)
	}

	// Register before starting read loop so callbacks can access map.
	m.mu.Lock()
	m.terminals[meta.ID] = p
	if opts.Title != "" {
		m.titleIndex[opts.Title] = meta.ID // for title-based lookups (PtyCreate compat)
	}
	m.mu.Unlock()

	// Wire output/exit callbacks and start reading.
	p.startReadLoop(m.handleOutput, m.handleExit)

	// Notify frontend.
	wailsRuntime.EventsEmit(m.appCtx, "terminal:created", meta)
	return meta, nil
}

// Write sends keyboard input to the terminal. Returns false if not found or suspended.
func (m *Manager) Write(id, data string) bool {
	p := m.lookup(id)
	if p == nil {
		return false
	}

	// Agent detection on write (runs only until agent is identified).
	p.mu.Lock()
	agentType := p.ProcessInputForAgentDetection(data)
	p.mu.Unlock()
	if agentType != nil {
		wailsRuntime.EventsEmit(m.appCtx, "terminal:agent-detected", map[string]interface{}{
			"terminalId": id,
			"agentType":  *agentType,
		})
	}

	return p.Write([]byte(data))
}

// Resize updates the PTY window dimensions. Returns false if not found.
func (m *Manager) Resize(id string, cols, rows int) bool {
	p := m.lookup(id)
	if p == nil {
		return false
	}
	return p.Resize(uint16(cols), uint16(rows)) == nil
}

// Destroy removes and closes a terminal synchronously. Returns false if not found.
func (m *Manager) Destroy(id string) bool {
	m.mu.Lock()
	p, ok := m.terminals[id]
	if ok {
		delete(m.terminals, id)
	}
	m.mu.Unlock()
	if !ok {
		return false
	}
	_ = p.Close()
	return true
}

// DestroyAsync removes a terminal from the map immediately and closes it in the background.
func (m *Manager) DestroyAsync(id string) bool {
	m.mu.Lock()
	p, ok := m.terminals[id]
	if ok {
		delete(m.terminals, id)
	}
	m.mu.Unlock()
	if !ok {
		return false
	}
	go func() { _ = p.Close() }()
	return true
}

// DestroyAll closes all active terminals. Called on app shutdown.
func (m *Manager) DestroyAll() {
	m.mu.Lock()
	ids := make([]string, 0, len(m.terminals))
	for id := range m.terminals {
		ids = append(ids, id)
	}
	m.mu.Unlock()
	for _, id := range ids {
		m.Destroy(id)
	}
}

// List returns metadata snapshots of all active terminals.
func (m *Manager) List() []types.Terminal {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]types.Terminal, 0, len(m.terminals))
	for _, p := range m.terminals {
		p.mu.Lock()
		meta := p.Metadata
		p.mu.Unlock()
		out = append(out, meta)
	}
	return out
}

// Get returns a copy of the terminal metadata, or nil if not found.
func (m *Manager) Get(id string) *types.Terminal {
	p := m.lookup(id)
	if p == nil {
		return nil
	}
	p.mu.Lock()
	meta := p.Metadata
	p.mu.Unlock()
	return &meta
}

// GetSessions returns session snapshots of all active terminals (for persistence).
func (m *Manager) GetSessions() []types.TerminalSession {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]types.TerminalSession, 0, len(m.terminals))
	for _, p := range m.terminals {
		out = append(out, p.Snapshot(0))
	}
	return out
}

// GetExitedSession returns a ghost-cached session for a terminated terminal.
func (m *Manager) GetExitedSession(id string) *types.TerminalSession {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if entry, ok := m.exitedTerminals[id]; ok {
		s := entry.session
		return &s
	}
	return nil
}

// InvokeClaudeCode sends the `claude` command to a terminal and records the session ID.
func (m *Manager) InvokeClaudeCode(id, sessionID string) bool {
	p := m.lookup(id)
	if p == nil {
		return false
	}
	p.mu.Lock()
	p.Metadata.ClaudeSessionID = sessionID
	p.Metadata.IsClaudeMode = true
	p.Metadata.AgentType = types.AgentClaude
	p.mu.Unlock()

	wailsRuntime.EventsEmit(m.appCtx, "terminal:state-change", map[string]interface{}{
		"terminalId":   id,
		"isClaudeMode": true,
	})
	return p.Write([]byte("claude\n"))
}

// FindByClaudeSessionID returns the terminal ID associated with a Claude session ID.
func (m *Manager) FindByClaudeSessionID(sessionID string) string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	for id, p := range m.terminals {
		if p.Metadata.ClaudeSessionID == sessionID {
			return id
		}
	}
	return ""
}

// LookupByTitle returns the UUID for a terminal registered with the given title.
// Returns empty string if not found. Used for PtyCreate backward compatibility.
func (m *Manager) LookupByTitle(title string) string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.titleIndex[title]
}

// Count returns the number of active terminals.
func (m *Manager) Count() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.terminals)
}

// ── Suspend / Resume ──────────────────────────────────────────────────────────

// HandleSuspend marks all terminals as suspended to prevent writes to invalid fds
// during system sleep.
func (m *Manager) HandleSuspend() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.systemSuspended = true
	for _, p := range m.terminals {
		p.mu.Lock()
		p.Suspended = true
		p.mu.Unlock()
	}
}

// HandleResume clears the suspended flag and notifies the frontend.
func (m *Manager) HandleResume() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.systemSuspended = false
	for id, p := range m.terminals {
		p.mu.Lock()
		p.Suspended = false
		p.mu.Unlock()
		wailsRuntime.EventsEmit(m.appCtx, "system:terminal-resumed", id)
	}
}

// ── Internal helpers ──────────────────────────────────────────────────────────

func (m *Manager) lookup(id string) *PTYProcess {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.terminals[id]
}

// handleOutput is called by the PTY read loop when output arrives.
// It runs OSC parsing and emits title-change events on the manager side.
func (m *Manager) handleOutput(id, data string) {
	p := m.lookup(id)
	if p == nil {
		return
	}
	p.mu.Lock()
	newTitle := p.ParseOscTitle(data)
	p.mu.Unlock()
	if newTitle != "" {
		wailsRuntime.EventsEmit(m.appCtx, "terminal:title-change", map[string]interface{}{
			"terminalId": id,
			"title":      newTitle,
		})
	}
}

// handleExit is called by the PTY read loop when the process exits.
// It moves the terminal to the ghost cache and emits a terminal:exit event.
func (m *Manager) handleExit(id string, code int) {
	m.mu.Lock()
	p, ok := m.terminals[id]
	if ok {
		delete(m.terminals, id)
	}
	m.mu.Unlock()

	if !ok {
		return
	}

	exitedAt := time.Now().UnixMilli()
	session := p.Snapshot(exitedAt)

	m.mu.Lock()
	m.addGhost(id, session)
	m.mu.Unlock()

	wailsRuntime.EventsEmit(m.appCtx, "terminal:exit", map[string]interface{}{
		"terminalId": id,
		"exitCode":   code,
	})
}

// addGhost adds a session to the ghost cache, enforcing the max-size limit.
// Must be called with m.mu held (write lock).
func (m *Manager) addGhost(id string, session types.TerminalSession) {
	// Evict expired entries first.
	now := time.Now()
	for k, e := range m.exitedTerminals {
		if now.After(e.expiresAt) {
			delete(m.exitedTerminals, k)
		}
	}
	// If still at cap, evict the oldest by re-adding (simple LRU-lite).
	if len(m.exitedTerminals) >= ghostCacheMax {
		var oldest string
		var oldestTime time.Time
		for k, e := range m.exitedTerminals {
			if oldest == "" || e.expiresAt.Before(oldestTime) {
				oldest = k
				oldestTime = e.expiresAt
			}
		}
		delete(m.exitedTerminals, oldest)
	}
	m.exitedTerminals[id] = ghostEntry{
		session:   session,
		expiresAt: time.Now().Add(ghostCacheTTL),
	}
}
