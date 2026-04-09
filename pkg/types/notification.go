package types

type NotificationChannel string

const (
	ChannelTelegram NotificationChannel = "telegram"
	ChannelDiscord  NotificationChannel = "discord"
	ChannelSlack    NotificationChannel = "slack"
)

type NotificationConfig struct {
	Channel NotificationChannel `json:"channel"`
	Enabled bool                `json:"enabled"`
	Token   string              `json:"token,omitempty"`
	ChatID  string              `json:"chatId,omitempty"`
	WebhookURL string           `json:"webhookUrl,omitempty"`
}

type NotificationEvent struct {
	Type      string `json:"type"`
	TerminalID string `json:"terminalId,omitempty"`
	ProjectID  string `json:"projectId,omitempty"`
	Message   string `json:"message"`
	Timestamp int64  `json:"timestamp"`
}
