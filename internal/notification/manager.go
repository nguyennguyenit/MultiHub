// Package notification handles outbound notifications (Telegram, Discord, OS native).
package notification

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/multihub/multihub/internal/platform"
	"github.com/multihub/multihub/pkg/types"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// Manager orchestrates all notification channels for a running session.
type Manager struct {
	ctx          context.Context
	mu           sync.RWMutex
	settings     types.NotificationSettings
	tracker      *TaskTracker
	telegram     *TelegramNotifier
	discord      *DiscordNotifier
	secureStore  *SecureStore
	settingsPath string
	// windowFocused is updated by the App layer via SetWindowFocused.
	windowFocused bool
}

// ProcessOutput is called by the terminal manager for each output chunk.
// It runs pattern detection and dispatches matched events to all enabled channels.
func (m *Manager) ProcessOutput(terminalID, data string, meta types.Terminal) {
	m.mu.RLock()
	focused := m.windowFocused
	s := m.settings
	telegram := m.telegram
	discord := m.discord
	m.mu.RUnlock()

	if focused && s.NotifyOnlyBackground {
		return
	}

	eventType, taskName, detected := DetectEvent(data)
	if !detected {
		return
	}
	if !isEventEnabled(s, eventType) {
		return
	}
	if m.tracker.IsDuplicate(terminalID, eventType, taskName) {
		return
	}

	event := types.NotificationEvent{
		Type:       string(eventType),
		TerminalID: terminalID,
		Message:    formatMessage(eventType, taskName, meta),
		Timestamp:  time.Now().UnixMilli(),
	}

	if s.OSNativeEnabled {
		go func() { _ = platform.Notify("MultiHub", event.Message) }()
	}
	if s.TelegramEnabled && telegram != nil {
		go func() { _ = telegram.Send(event.Message) }()
	}
	if s.DiscordEnabled && discord != nil {
		go func() { _ = discord.Send(event.Message) }()
	}

	// Emit to frontend for sound + UI badge.
	wailsRuntime.EventsEmit(m.ctx, "notification:event", event)
}

// SetWindowFocused is called by the App layer to track window focus state.
func (m *Manager) SetWindowFocused(focused bool) {
	m.mu.Lock()
	m.windowFocused = focused
	m.mu.Unlock()
}

// Destroy cleans up background goroutines owned by the manager.
func (m *Manager) Destroy() {
	m.tracker.Destroy()
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func isEventEnabled(s types.NotificationSettings, et EventType) bool {
	switch et {
	case TaskComplete:
		return s.TaskComplete
	case TaskFailed:
		return s.TaskFailed
	case ReviewNeeded:
		return s.ReviewNeeded
	}
	return false
}

func formatMessage(et EventType, taskName string, meta types.Terminal) string {
	label := meta.Title
	if label == "" {
		label = "Terminal"
	}
	switch et {
	case TaskComplete:
		if taskName != "" {
			return fmt.Sprintf("[%s] Task completed: %s", label, taskName)
		}
		return fmt.Sprintf("[%s] Task completed", label)
	case TaskFailed:
		if taskName != "" {
			return fmt.Sprintf("[%s] Task failed: %s", label, taskName)
		}
		return fmt.Sprintf("[%s] Task failed", label)
	case ReviewNeeded:
		return fmt.Sprintf("[%s] Review / confirmation needed", label)
	}
	return fmt.Sprintf("[%s] Notification", label)
}
