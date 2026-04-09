package main

import (
	"context"
	"fmt"
	"time"

	"github.com/multihub/multihub/internal/terminal"
	"github.com/multihub/multihub/pkg/types"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App is the Wails application struct. All exported methods are auto-bound to the frontend.
type App struct {
	ctx         context.Context
	terminalMgr *terminal.Manager
}

// NewApp creates a new App instance.
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved for runtime calls.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.terminalMgr = terminal.NewManager(ctx)
}

// shutdown is called when the app is closing.
func (a *App) shutdown(_ context.Context) {
	if a.terminalMgr != nil {
		a.terminalMgr.DestroyAll()
	}
}

// ── Terminal management bindings ──────────────────────────────────────────────

// TerminalCreate spawns a new terminal. opts keys: cwd, projectId, title, shell.
func (a *App) TerminalCreate(opts map[string]interface{}) (types.Terminal, error) {
	return a.terminalMgr.Create(terminal.CreateOptions{
		Shell:     strOpt(opts, "shell"),
		Cwd:       strOpt(opts, "cwd"),
		ProjectID: strOpt(opts, "projectId"),
		Title:     strOpt(opts, "title"),
	})
}

// TerminalWrite sends keyboard input to a terminal.
func (a *App) TerminalWrite(id, data string) bool {
	return a.terminalMgr.Write(id, data)
}

// TerminalResize updates PTY window dimensions.
func (a *App) TerminalResize(id string, cols, rows int) bool {
	return a.terminalMgr.Resize(id, cols, rows)
}

// TerminalDestroy closes a terminal asynchronously.
func (a *App) TerminalDestroy(id string) bool {
	return a.terminalMgr.DestroyAsync(id)
}

// TerminalList returns metadata for all active terminals.
func (a *App) TerminalList() []types.Terminal {
	return a.terminalMgr.List()
}

// TerminalGet returns metadata for a single terminal, or nil if not found.
func (a *App) TerminalGet(id string) *types.Terminal {
	return a.terminalMgr.Get(id)
}

// TerminalGetSessions returns session state for all active terminals (for persistence).
func (a *App) TerminalGetSessions() []types.TerminalSession {
	return a.terminalMgr.GetSessions()
}

// TerminalGetExitedSession returns the ghost-cached session for a terminated terminal.
func (a *App) TerminalGetExitedSession(id string) *types.TerminalSession {
	return a.terminalMgr.GetExitedSession(id)
}

// TerminalInvokeClaude sends `claude` to a terminal and records the session ID.
func (a *App) TerminalInvokeClaude(id, sessionID string) bool {
	return a.terminalMgr.InvokeClaudeCode(id, sessionID)
}

// TerminalFindByClaudeSession returns the terminal ID for a given Claude session ID.
func (a *App) TerminalFindByClaudeSession(sessionID string) string {
	return a.terminalMgr.FindByClaudeSessionID(sessionID)
}

// TerminalCount returns the number of active terminals.
func (a *App) TerminalCount() int {
	return a.terminalMgr.Count()
}

// ── PTY low-level bindings (retained for latency harness / Phase 02 compat) ──

// PtyCreate spawns a terminal using raw PTY API (used by latency harness).
// The `id` argument is used as the terminal title; the real UUID is stored in
// the manager's title index so subsequent Pty* calls can resolve it.
func (a *App) PtyCreate(id, shell, cwd string) error {
	_, err := a.terminalMgr.Create(terminal.CreateOptions{
		Shell: shell,
		Cwd:   cwd,
		Title: id,
	})
	return err
}

// resolveID maps a Pty* id (which may be a title) to the real UUID.
func (a *App) resolveID(id string) string {
	if uuid := a.terminalMgr.LookupByTitle(id); uuid != "" {
		return uuid
	}
	return id // assume it's already a UUID
}

// PtyWrite sends keyboard input via the low-level PTY API.
func (a *App) PtyWrite(id, data string) error {
	if !a.terminalMgr.Write(a.resolveID(id), data) {
		return fmt.Errorf("terminal %s not found or closed", id)
	}
	return nil
}

// PtyResize updates dimensions via the low-level PTY API.
func (a *App) PtyResize(id string, cols, rows int) error {
	if !a.terminalMgr.Resize(a.resolveID(id), cols, rows) {
		return fmt.Errorf("terminal %s not found", id)
	}
	return nil
}

// PtyDestroy closes a terminal via the low-level PTY API.
func (a *App) PtyDestroy(id string) error {
	a.terminalMgr.DestroyAsync(a.resolveID(id))
	return nil
}

// PtyLatencyTest writes an echo marker to the PTY and returns the marker key.
func (a *App) PtyLatencyTest(id string) string {
	key := fmt.Sprintf("%d", time.Now().UnixNano()%1_000_000)
	cmd := fmt.Sprintf("echo '__latency_%s__'\n", key)
	a.terminalMgr.Write(a.resolveID(id), cmd)
	return key
}

// PtyActiveCount returns the number of active terminals.
func (a *App) PtyActiveCount() int {
	return a.terminalMgr.Count()
}

// ── Window controls ───────────────────────────────────────────────────────────

// WindowMinimize minimizes the application window.
func (a *App) WindowMinimize() {
	wailsRuntime.WindowMinimise(a.ctx)
}

// WindowMaximize toggles maximize state.
func (a *App) WindowMaximize() {
	wailsRuntime.WindowToggleMaximise(a.ctx)
}

// WindowClose closes the application.
func (a *App) WindowClose() {
	wailsRuntime.Quit(a.ctx)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func strOpt(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}
