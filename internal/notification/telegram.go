package notification

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

// TelegramNotifier sends messages via the Telegram Bot API.
type TelegramNotifier struct {
	botToken string
	chatID   string
	client   *http.Client
}

func newTelegramNotifier(botToken, chatID string) *TelegramNotifier {
	return &TelegramNotifier{
		botToken: botToken,
		chatID:   chatID,
		client:   &http.Client{Timeout: 10 * time.Second},
	}
}

// Send posts message to the configured Telegram chat.
func (t *TelegramNotifier) Send(message string) error {
	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", t.botToken)
	resp, err := t.client.PostForm(apiURL, url.Values{
		"chat_id":    {t.chatID},
		"text":       {message},
		"parse_mode": {"HTML"},
	})
	if err != nil {
		return fmt.Errorf("telegram send: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 {
		return nil
	}

	var result map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&result)
	desc, _ := result["description"].(string)
	if desc == "" {
		desc = fmt.Sprintf("HTTP %d", resp.StatusCode)
	}
	return fmt.Errorf("telegram API: %s", desc)
}
