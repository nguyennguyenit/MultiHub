package main

import "github.com/multihub/multihub/pkg/types"

// ── Notification bindings ─────────────────────────────────────────────────────

// NotificationGetSettings returns the current notification settings.
func (a *App) NotificationGetSettings() (types.NotificationSettings, error) {
	return a.notificationMgr.GetSettings(), nil
}

// NotificationSetSettings updates notification settings (partial merge).
func (a *App) NotificationSetSettings(s map[string]interface{}) error {
	return a.notificationMgr.UpdateSettings(s)
}

// NotificationGetTelegramStatus returns whether Telegram credentials are stored.
func (a *App) NotificationGetTelegramStatus() (types.CredentialStatus, error) {
	return a.notificationMgr.TelegramStatus(), nil
}

// NotificationGetDiscordStatus returns whether a Discord webhook URL is stored.
func (a *App) NotificationGetDiscordStatus() (types.CredentialStatus, error) {
	return a.notificationMgr.DiscordStatus(), nil
}

// NotificationSetTelegram stores Telegram bot credentials.
func (a *App) NotificationSetTelegram(token, chatID string) error {
	return a.notificationMgr.SetTelegram(token, chatID)
}

// NotificationSetDiscord stores the Discord webhook URL.
func (a *App) NotificationSetDiscord(url string) error {
	return a.notificationMgr.SetDiscord(url)
}

// NotificationTestTelegram sends a test message via Telegram.
func (a *App) NotificationTestTelegram(token, chatID string) error {
	return a.notificationMgr.TestTelegram(token, chatID)
}

// NotificationTestDiscord sends a test message to the Discord webhook.
func (a *App) NotificationTestDiscord(url string) error {
	return a.notificationMgr.TestDiscord(url)
}

// NotificationClearTelegram removes stored Telegram credentials.
func (a *App) NotificationClearTelegram() error {
	return a.notificationMgr.ClearTelegram()
}

// NotificationClearDiscord removes the stored Discord webhook URL.
func (a *App) NotificationClearDiscord() error {
	return a.notificationMgr.ClearDiscord()
}

// NotificationSetWindowFocused tracks window focus to suppress background-only notifications.
func (a *App) NotificationSetWindowFocused(focused bool) {
	a.notificationMgr.SetWindowFocused(focused)
}
