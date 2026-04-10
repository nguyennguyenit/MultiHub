package notification

import "github.com/multihub/multihub/pkg/types"

// ── Telegram ──────────────────────────────────────────────────────────────────

// SetTelegram stores Telegram credentials and reinitialises the notifier.
func (m *Manager) SetTelegram(token, chatID string) error {
	if err := m.secureStore.Set("telegram-token", token); err != nil {
		return err
	}
	if err := m.secureStore.Set("telegram-chat-id", chatID); err != nil {
		return err
	}
	m.mu.Lock()
	m.telegram = newTelegramNotifier(token, chatID)
	m.mu.Unlock()
	return nil
}

// ClearTelegram removes stored Telegram credentials and disables the notifier.
func (m *Manager) ClearTelegram() error {
	_ = m.secureStore.Delete("telegram-token")
	_ = m.secureStore.Delete("telegram-chat-id")
	m.mu.Lock()
	m.telegram = nil
	m.mu.Unlock()
	return nil
}

// TelegramStatus reports whether Telegram credentials are stored.
func (m *Manager) TelegramStatus() types.CredentialStatus {
	_, hasToken := m.secureStore.Get("telegram-token")
	_, hasChatID := m.secureStore.Get("telegram-chat-id")
	return types.CredentialStatus{Configured: hasToken && hasChatID}
}

// TestTelegram sends a test message using the provided credentials.
func (m *Manager) TestTelegram(token, chatID string) error {
	n := newTelegramNotifier(token, chatID)
	return n.Send("MultiHub test notification — connection successful!")
}

// ── Discord ───────────────────────────────────────────────────────────────────

// SetDiscord stores the Discord webhook URL and reinitialises the notifier.
func (m *Manager) SetDiscord(webhookURL string) error {
	if err := m.secureStore.Set("discord-webhook-url", webhookURL); err != nil {
		return err
	}
	m.mu.Lock()
	m.discord = newDiscordNotifier(webhookURL)
	m.mu.Unlock()
	return nil
}

// ClearDiscord removes the stored Discord webhook URL.
func (m *Manager) ClearDiscord() error {
	_ = m.secureStore.Delete("discord-webhook-url")
	m.mu.Lock()
	m.discord = nil
	m.mu.Unlock()
	return nil
}

// DiscordStatus reports whether a Discord webhook URL is stored.
func (m *Manager) DiscordStatus() types.CredentialStatus {
	_, hasURL := m.secureStore.Get("discord-webhook-url")
	return types.CredentialStatus{Configured: hasURL}
}

// TestDiscord sends a test message to the provided webhook URL.
func (m *Manager) TestDiscord(webhookURL string) error {
	n := newDiscordNotifier(webhookURL)
	return n.Send("MultiHub test notification — connection successful!")
}

// GetTelegram returns the stored Telegram token and chatID (empty strings if not set).
func (m *Manager) GetTelegram() (token, chatID string) {
	token, _ = m.secureStore.Get("telegram-token")
	chatID, _ = m.secureStore.Get("telegram-chat-id")
	return
}

// SetActiveTerminal updates which terminal is currently active (for notification context).
func (m *Manager) SetActiveTerminal(id string) {
	// No-op: active terminal context is tracked per ProcessOutput call.
	// Exposed for frontend compatibility.
}

// GetRemoteControlStatus returns the Telegram remote-control connection status.
// Currently always "disconnected" — remote control via Telegram bot is not yet implemented.
func (m *Manager) GetRemoteControlStatus() string {
	return "disconnected"
}

// ── Internal ──────────────────────────────────────────────────────────────────

// refreshNotifiers reinitialises Telegram and Discord from stored credentials.
func (m *Manager) refreshNotifiers() {
	token, hasToken := m.secureStore.Get("telegram-token")
	chatID, hasChatID := m.secureStore.Get("telegram-chat-id")
	if hasToken && hasChatID && token != "" && chatID != "" {
		m.telegram = newTelegramNotifier(token, chatID)
	}

	webhookURL, hasURL := m.secureStore.Get("discord-webhook-url")
	if hasURL && webhookURL != "" {
		m.discord = newDiscordNotifier(webhookURL)
	}
}
