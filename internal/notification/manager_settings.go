package notification

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"

	"github.com/multihub/multihub/pkg/types"
)

// NewManager creates a Manager backed by the given data directory.
func NewManager(ctx context.Context, dataDir string) *Manager {
	m := &Manager{
		ctx:          ctx,
		tracker:      NewTaskTracker(),
		secureStore:  NewSecureStore(dataDir),
		settingsPath: filepath.Join(dataDir, "notif-settings.json"),
		settings:     notifDefaults(),
	}
	m.loadSettings()
	m.refreshNotifiers()
	return m
}

// notifDefaults returns factory-default notification settings.
func notifDefaults() types.NotificationSettings {
	return types.NotificationSettings{
		TaskComplete:         true,
		TaskFailed:           true,
		ReviewNeeded:         true,
		NotifyOnlyBackground: true,
		SoundEnabled:         true,
		OSNativeEnabled:      true,
		TelegramEnabled:      false,
		DiscordEnabled:       false,
	}
}

// GetSettings returns a copy of the current notification settings.
func (m *Manager) GetSettings() types.NotificationSettings {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.settings
}

// SetSettings replaces the notification settings and persists them to disk.
func (m *Manager) SetSettings(s types.NotificationSettings) error {
	m.mu.Lock()
	m.settings = s
	m.mu.Unlock()
	return m.saveSettings()
}

// UpdateSettings merges a partial map into current settings via JSON round-trip.
func (m *Manager) UpdateSettings(partial map[string]interface{}) error {
	m.mu.Lock()
	current, _ := json.Marshal(m.settings)
	var merged map[string]interface{}
	_ = json.Unmarshal(current, &merged)
	for k, v := range partial {
		merged[k] = v
	}
	data, _ := json.Marshal(merged)
	var updated types.NotificationSettings
	if err := json.Unmarshal(data, &updated); err != nil {
		m.mu.Unlock()
		return err
	}
	m.settings = updated
	m.mu.Unlock()
	return m.saveSettings()
}

func (m *Manager) loadSettings() {
	raw, err := os.ReadFile(m.settingsPath)
	if err != nil {
		return
	}
	var s types.NotificationSettings
	if err := json.Unmarshal(raw, &s); err != nil {
		return
	}
	m.settings = s
}

func (m *Manager) saveSettings() error {
	raw, err := json.MarshalIndent(m.settings, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(m.settingsPath, raw, 0644)
}
