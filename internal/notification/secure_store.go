package notification

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

// SecureStore persists sensitive credentials to a JSON file with restrictive
// permissions (0600 on UNIX = owner read/write only).
// For stronger isolation, replace with go-keyring; this implementation is
// sufficient for single-user desktop deployments.
type SecureStore struct {
	mu       sync.RWMutex
	filePath string
	data     map[string]string
}

// NewSecureStore creates a store backed by <dataDir>/.notif-creds.json.
func NewSecureStore(dataDir string) *SecureStore {
	s := &SecureStore{
		filePath: filepath.Join(dataDir, ".notif-creds.json"),
		data:     make(map[string]string),
	}
	s.load()
	return s
}

func (s *SecureStore) load() {
	raw, err := os.ReadFile(s.filePath)
	if err != nil {
		return // file absent on first run
	}
	_ = json.Unmarshal(raw, &s.data)
}

func (s *SecureStore) save() error {
	raw, err := json.Marshal(s.data)
	if err != nil {
		return err
	}
	return os.WriteFile(s.filePath, raw, 0600)
}

// Set stores a key-value credential pair.
func (s *SecureStore) Set(key, value string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data[key] = value
	return s.save()
}

// Get retrieves a credential by key. Returns the value and whether it exists.
func (s *SecureStore) Get(key string) (string, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	v, ok := s.data[key]
	return v, ok
}

// Delete removes a credential by key.
func (s *SecureStore) Delete(key string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.data, key)
	return s.save()
}
