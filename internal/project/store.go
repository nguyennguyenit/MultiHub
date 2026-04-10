// Package project manages project persistence using JSON file storage.
package project

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/multihub/multihub/pkg/types"
)

// Store manages projects with atomic JSON persistence.
type Store struct {
	mu       sync.RWMutex
	projects []types.Project
	activeID string
	filePath string
}

type persistedState struct {
	Projects []types.Project `json:"projects"`
	ActiveID string          `json:"activeProjectId"`
}

// NewStore loads or initializes the project store at the given data directory.
func NewStore(dataDir string) (*Store, error) {
	if err := os.MkdirAll(dataDir, 0750); err != nil {
		return nil, err
	}
	s := &Store{filePath: filepath.Join(dataDir, "projects.json")}
	if err := s.load(); err != nil {
		// Corrupt or missing file — start fresh.
		s.projects = nil
		s.activeID = ""
	}
	return s, nil
}

// List returns a snapshot of all projects.
func (s *Store) List() []types.Project {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]types.Project, len(s.projects))
	copy(result, s.projects)
	return result
}

// GetActive returns the active project ID.
func (s *Store) GetActive() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.activeID
}

// Create adds a new project and persists the state.
func (s *Store) Create(name, path string) (types.Project, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now()
	p := types.Project{
		ID:        generateID(),
		Name:      name,
		Path:      path,
		CreatedAt: now,
		UpdatedAt: now,
	}
	s.projects = append(s.projects, p)
	return p, s.save()
}

// Update applies the provided field updates to the project with the given ID.
func (s *Store) Update(id string, updates map[string]interface{}) (*types.Project, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.projects {
		if s.projects[i].ID != id {
			continue
		}
		if v, ok := updates["name"].(string); ok {
			s.projects[i].Name = v
		}
		if v, ok := updates["path"].(string); ok {
			s.projects[i].Path = v
		}
		if v, ok := updates["gitRemote"].(string); ok {
			s.projects[i].GitRemote = v
		}
		if v, ok := updates["skipGitSetup"].(bool); ok {
			s.projects[i].SkipGitSetup = v
		}
		s.projects[i].UpdatedAt = time.Now()
		if err := s.save(); err != nil {
			return nil, err
		}
		p := s.projects[i]
		return &p, nil
	}
	return nil, nil // not found — not an error
}

// Delete removes the project with the given ID.
func (s *Store) Delete(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, p := range s.projects {
		if p.ID == id {
			s.projects = append(s.projects[:i], s.projects[i+1:]...)
			if s.activeID == id {
				s.activeID = ""
			}
			return s.save()
		}
	}
	return nil
}

// SetActive marks a project as active and persists the state.
func (s *Store) SetActive(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.activeID = id
	return s.save()
}

// load reads and parses the JSON file.
func (s *Store) load() error {
	data, err := os.ReadFile(s.filePath)
	if err != nil {
		return err
	}
	var state persistedState
	if err := json.Unmarshal(data, &state); err != nil {
		return err
	}
	s.projects = state.Projects
	s.activeID = state.ActiveID
	return nil
}

// save writes state atomically using a temp-file + rename pattern.
func (s *Store) save() error {
	data, err := json.MarshalIndent(persistedState{
		Projects: s.projects,
		ActiveID: s.activeID,
	}, "", "  ")
	if err != nil {
		return err
	}
	tmp := s.filePath + ".tmp"
	if err := os.WriteFile(tmp, data, 0600); err != nil {
		return err
	}
	return os.Rename(tmp, s.filePath)
}
