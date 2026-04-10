package types

// NotificationChannel identifies an outbound notification channel.
type NotificationChannel string

const (
	ChannelTelegram NotificationChannel = "telegram"
	ChannelDiscord  NotificationChannel = "discord"
)

// NotificationEvent is emitted to the frontend when a pattern is matched.
type NotificationEvent struct {
	Type       string `json:"type"`
	TerminalID string `json:"terminalId,omitempty"`
	ProjectID  string `json:"projectId,omitempty"`
	Message    string `json:"message"`
	Timestamp  int64  `json:"timestamp"`
}

// NotificationSettings controls which events trigger notifications
// and where they are delivered.
type NotificationSettings struct {
	TaskComplete         bool `json:"taskComplete"`
	TaskFailed           bool `json:"taskFailed"`
	ReviewNeeded         bool `json:"reviewNeeded"`
	NotifyOnlyBackground bool `json:"notifyOnlyBackground"`
	SoundEnabled         bool `json:"soundEnabled"`
	OSNativeEnabled      bool `json:"osNativeEnabled"`
	TelegramEnabled      bool `json:"telegramEnabled"`
	DiscordEnabled       bool `json:"discordEnabled"`
}

// CredentialStatus reports whether a notification channel is configured.
type CredentialStatus struct {
	Configured bool   `json:"configured"`
	Label      string `json:"label,omitempty"` // e.g. Telegram chat title
	Error      string `json:"error,omitempty"`
}
