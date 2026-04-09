// Package terminal manages PTY processes and terminal lifecycle.
package terminal

import (
	"context"
	"fmt"
	"os"
	"sync"
)

// Manager holds all active PTY processes keyed by terminal ID.
type Manager struct {
	mu        sync.RWMutex
	processes map[string]*PTYProcess
	appCtx    context.Context
}

// NewManager creates a Manager. appCtx is the Wails application context.
func NewManager(appCtx context.Context) *Manager {
	return &Manager{
		processes: make(map[string]*PTYProcess),
		appCtx:    appCtx,
	}
}

// Spawn creates a new PTY process and registers it.
func (m *Manager) Spawn(id, shell, cwd string) error {
	if shell == "" {
		shell = defaultShell()
	}
	if cwd == "" {
		var err error
		cwd, err = os.Getwd()
		if err != nil {
			cwd = os.Getenv("HOME")
		}
	}

	p, err := Spawn(m.appCtx, id, shell, cwd)
	if err != nil {
		return fmt.Errorf("spawn %s: %w", id, err)
	}

	m.mu.Lock()
	m.processes[id] = p
	m.mu.Unlock()
	return nil
}

// Write sends input to the PTY identified by id.
func (m *Manager) Write(id string, data []byte) error {
	p, err := m.get(id)
	if err != nil {
		return err
	}
	return p.Write(data)
}

// Resize updates window dimensions for the PTY identified by id.
func (m *Manager) Resize(id string, cols, rows uint16) error {
	p, err := m.get(id)
	if err != nil {
		return err
	}
	return p.Resize(cols, rows)
}

// Destroy closes and removes the PTY process identified by id.
func (m *Manager) Destroy(id string) error {
	m.mu.Lock()
	p, ok := m.processes[id]
	if ok {
		delete(m.processes, id)
	}
	m.mu.Unlock()
	if !ok {
		return nil
	}
	return p.Close()
}

// DestroyAll closes all active PTY processes. Called on app shutdown.
func (m *Manager) DestroyAll() {
	m.mu.Lock()
	ids := make([]string, 0, len(m.processes))
	for id := range m.processes {
		ids = append(ids, id)
	}
	m.mu.Unlock()
	for _, id := range ids {
		_ = m.Destroy(id)
	}
}

// Count returns the number of active PTY processes.
func (m *Manager) Count() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.processes)
}

func (m *Manager) get(id string) (*PTYProcess, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	p, ok := m.processes[id]
	if !ok {
		return nil, fmt.Errorf("terminal %s not found", id)
	}
	return p, nil
}

// defaultShell returns the user's login shell or falls back to /bin/bash.
func defaultShell() string {
	if s := os.Getenv("SHELL"); s != "" {
		return s
	}
	return "/bin/bash"
}
