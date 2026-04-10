package notification

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// DiscordNotifier sends messages via a Discord incoming webhook.
type DiscordNotifier struct {
	webhookURL string
	client     *http.Client
}

func newDiscordNotifier(webhookURL string) *DiscordNotifier {
	return &DiscordNotifier{
		webhookURL: webhookURL,
		client:     &http.Client{Timeout: 10 * time.Second},
	}
}

// Send posts message to the Discord webhook.
func (d *DiscordNotifier) Send(message string) error {
	payload, err := json.Marshal(map[string]string{"content": message})
	if err != nil {
		return fmt.Errorf("discord marshal: %w", err)
	}

	resp, err := d.client.Post(d.webhookURL, "application/json", bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("discord send: %w", err)
	}
	defer resp.Body.Close()

	// Discord returns 204 No Content on success.
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}
	return fmt.Errorf("discord webhook: HTTP %d", resp.StatusCode)
}
