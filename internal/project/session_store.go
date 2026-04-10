package project

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"

	"github.com/multihub/multihub/pkg/types"
)

// WindowBounds stores the application window position and size.
type WindowBounds struct {
	X      int `json:"x"`
	Y      int `json:"y"`
	Width  int `json:"width"`
	Height int `json:"height"`
}

// AppSession holds the restorable application state between launches.
type AppSession struct {
	Terminals        []types.TerminalSession `json:"terminals"`
	ActiveTerminalID string                  `json:"activeTerminalId"`
	WindowBounds     *WindowBounds           `json:"windowBounds,omitempty"`
}

// SessionStore persists and restores application session state.
type SessionStore struct {
	mu       sync.Mutex
	filePath string
}

// NewSessionStore creates a SessionStore backed by a file in the given data directory.
func NewSessionStore(dataDir string) (*SessionStore, error) {
	if err := os.MkdirAll(dataDir, 0750); err != nil {
		return nil, err
	}
	return &SessionStore{filePath: filepath.Join(dataDir, "session.json")}, nil
}

// Save writes the session to disk atomically.
func (ss *SessionStore) Save(session AppSession) error {
	ss.mu.Lock()
	defer ss.mu.Unlock()

	data, err := json.MarshalIndent(session, "", "  ")
	if err != nil {
		return err
	}
	tmp := ss.filePath + ".tmp"
	if err := os.WriteFile(tmp, data, 0600); err != nil {
		return err
	}
	return os.Rename(tmp, ss.filePath)
}

// Restore reads the last-saved session. Returns nil, nil if no session exists.
func (ss *SessionStore) Restore() (*AppSession, error) {
	ss.mu.Lock()
	defer ss.mu.Unlock()

	data, err := os.ReadFile(ss.filePath)
	if os.IsNotExist(err) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var session AppSession
	if err := json.Unmarshal(data, &session); err != nil {
		// Corrupt session — return nil so the app starts fresh.
		return nil, nil
	}
	return &session, nil
}
