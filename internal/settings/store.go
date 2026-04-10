// Package settings manages app settings persistence using JSON file storage.
package settings

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"

	"github.com/multihub/multihub/pkg/types"
)

// validThemes is the set of accepted colorTheme values.
var validThemes = map[string]bool{
	"tokyo-night": true, "catppuccin": true, "dracula": true,
	"rose-pine": true, "pro-dark": true,
	// Legacy themes (accepted but not remapped here; frontend handles CSS).
	"default": true, "dusk": true, "lime": true, "ocean": true,
	"retro": true, "neo": true, "forest": true, "neon-cyber": true, "vibrant": true,
}

// validRenderModes is the set of accepted terminalRenderMode values.
var validRenderModes = map[string]bool{
	"performance": true, "balanced": true, "quality": true,
}

// Store is a thread-safe JSON settings store.
type Store struct {
	mu       sync.RWMutex
	settings types.AppSettings
	filePath string
}

// NewStore creates or loads a settings store at <dataDir>/settings.json.
// If the file is absent or corrupt the factory defaults are used.
func NewStore(dataDir string) (*Store, error) {
	fp := filepath.Join(dataDir, "settings.json")
	s := &Store{
		filePath: fp,
		settings: types.DefaultAppSettings(),
	}
	if err := s.load(); err != nil && !os.IsNotExist(err) {
		// Corrupt file → reset to defaults (non-fatal).
		s.settings = types.DefaultAppSettings()
	}
	return s, nil
}

// Get returns a copy of the current settings.
func (s *Store) Get() types.AppSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.settings
}

// Set merges a partial key-value map into the current settings via JSON round-trip,
// validates the result, persists it, and returns the new settings.
func (s *Store) Set(partial map[string]interface{}) (types.AppSettings, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// JSON round-trip merge: marshal current → overlying partial → unmarshal.
	current, err := json.Marshal(s.settings)
	if err != nil {
		return s.settings, err
	}
	var merged map[string]interface{}
	_ = json.Unmarshal(current, &merged)
	for k, v := range partial {
		merged[k] = v
	}
	data, _ := json.Marshal(merged)

	var updated types.AppSettings
	if err := json.Unmarshal(data, &updated); err != nil {
		return s.settings, err
	}

	updated = s.validate(updated)
	s.settings = updated
	return updated, s.save()
}

// Reset restores factory defaults and persists them.
func (s *Store) Reset() (types.AppSettings, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.settings = types.DefaultAppSettings()
	return s.settings, s.save()
}

// ── Internal ──────────────────────────────────────────────────────────────────

func (s *Store) load() error {
	raw, err := os.ReadFile(s.filePath)
	if err != nil {
		return err
	}
	return json.Unmarshal(raw, &s.settings)
}

func (s *Store) save() error {
	raw, err := json.MarshalIndent(s.settings, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.filePath, raw, 0644)
}

func (s *Store) validate(cfg types.AppSettings) types.AppSettings {
	if !validThemes[cfg.ColorTheme] {
		cfg.ColorTheme = "tokyo-night"
	}
	if !validRenderModes[cfg.TerminalRenderMode] {
		cfg.TerminalRenderMode = "balanced"
	}
	// Validate custom terminal limit.
	if cfg.TerminalLimit.Preset == "custom" && cfg.TerminalLimit.CustomValue != nil {
		v := *cfg.TerminalLimit.CustomValue
		if v < 1 || v > 20 {
			safe := 4
			cfg.TerminalLimit.CustomValue = &safe
		}
	}
	return cfg
}
