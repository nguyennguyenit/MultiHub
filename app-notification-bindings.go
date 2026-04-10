package main

// ── Notification bindings (stub – real impl in Phase 07) ─────────────────────

// NotificationGetSettings returns notification settings.
func (a *App) NotificationGetSettings() (interface{}, error) { return nil, nil }

// NotificationSetSettings updates notification settings.
func (a *App) NotificationSetSettings(s map[string]interface{}) error { return nil }

// NotificationGetTelegram returns Telegram credentials status.
func (a *App) NotificationGetTelegram() (interface{}, error) { return nil, nil }

// NotificationSetTelegram configures the Telegram bot.
func (a *App) NotificationSetTelegram(token, chatID string) error { return nil }

// NotificationSetDiscord configures the Discord webhook.
func (a *App) NotificationSetDiscord(url string) error { return nil }

// NotificationGetTelegramStatus returns the Telegram connection status.
func (a *App) NotificationGetTelegramStatus() (interface{}, error) { return nil, nil }

// NotificationGetDiscordStatus returns the Discord connection status.
func (a *App) NotificationGetDiscordStatus() (interface{}, error) { return nil, nil }

// NotificationTestTelegram sends a test message via Telegram.
func (a *App) NotificationTestTelegram(token, chatID string) (interface{}, error) {
	return nil, nil
}

// NotificationTestDiscord sends a test message via Discord.
func (a *App) NotificationTestDiscord(url string) (interface{}, error) { return nil, nil }

// NotificationClearTelegram removes stored Telegram credentials.
func (a *App) NotificationClearTelegram() error { return nil }

// NotificationClearDiscord removes stored Discord credentials.
func (a *App) NotificationClearDiscord() error { return nil }

// NotificationSetActiveTerminal sets which terminal receives notifications.
func (a *App) NotificationSetActiveTerminal(id string) error { return nil }

// NotificationGetRemoteControlStatus returns the remote-control connection status.
func (a *App) NotificationGetRemoteControlStatus() (interface{}, error) { return nil, nil }
