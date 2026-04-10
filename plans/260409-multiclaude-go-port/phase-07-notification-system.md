---
phase: "07"
title: "Notification System"
status: completed
effort: 12h
risk: Medium
depends_on: ["03"]
---

# Phase 07: Notification System

**Priority:** P2 -- Depends on terminal management for output monitoring
**Status:** Completed

## Context Links
- Source: `src/main/notification/` (~15 files, ~2000 lines total)
- Source: `src/shared/constants/notification.ts` (patterns, defaults)

## Overview

Port the notification pipeline: terminal output monitoring -> pattern detection -> native OS notifications + Telegram bot + Discord webhook. This includes the output parsers (plain-text and JSON stream), task tracker, and secure credential storage.

## Key Insights

- Source has two parser modes: `plain-text` (regex on raw output) and `stream-json` (NDJSON from `--output-format=stream-json`)
- Auto-detection: first output determines parser mode (locks for session lifetime)
- Three event types: `taskComplete`, `taskFailed`, `reviewNeeded`
- Telegram integration includes bidirectional polling (send notifications + receive commands)
- Discord is simpler: webhook POST only
- Secure storage uses `safeStorage.encryptString()` in Electron -> `go-keyring` in Go
- Focus detection: only notify when app window is not focused (`notifyOnlyBackground` setting)

## Architecture

```
Terminal Output Stream
        │
        ▼
┌──────────────────┐
│  Output Parser   │ (auto-detect plain-text vs stream-json)
│  - PlainText     │ → regex pattern matching
│  - JsonStream    │ → NDJSON event parsing
└────────┬─────────┘
         │ TaskEvent
         ▼
┌──────────────────┐
│  Task Tracker    │ (dedup by SHA256 hash, 5min TTL)
└────────┬─────────┘
         │ unique TaskEvent
         ▼
┌──────────────────┐
│ NotificationMgr  │
│  - OS Native     │ (platform/notify_*.go)
│  - Telegram      │ (HTTP bot API + long-poll)
│  - Discord       │ (webhook POST)
│  - Sound         │ (emit event to frontend)
└──────────────────┘
```

## Core Components

### Pattern Detection

```go
// internal/notification/pattern_detector.go
package notification

import "regexp"

type EventType string

const (
    TaskComplete EventType = "taskComplete"
    TaskFailed   EventType = "taskFailed"
    ReviewNeeded EventType = "reviewNeeded"
)

var detectionPatterns = map[EventType]*regexp.Regexp{
    TaskComplete: regexp.MustCompile(`(?i)✓\s*(Task\s+)?completed|Task\s+completed\s+successfully|finished\s+successfully`),
    TaskFailed:   regexp.MustCompile(`(?i)✗\s*(Task\s+)?failed|^Task\s+failed[:\s]|command\s+failed\s+with\s+exit\s+code`),
    ReviewNeeded: regexp.MustCompile(`(?i)review\s+needed|waiting\s+for\s+review|needs\s+review|please\s+review`),
}

var enhancedPatterns = map[EventType]*regexp.Regexp{
    TaskComplete: regexp.MustCompile(`(?i)✓\s+(?P<taskName>.+?)(?:\s*\(completed\)|$)`),
    TaskFailed:   regexp.MustCompile(`(?i)✗\s+(?P<taskName>.+?)(?:\s*\(failed\)|$)|exit(?:ed)?\s+(?:with\s+)?code\s+(?P<exitCode>\d+)`),
    ReviewNeeded: regexp.MustCompile(`(?i)\[Y/n\]|\(y/N\)|approve|allow\s+(?:this\s+)?tool|waiting\s+for\s+(?:your\s+)?(?:input|response|confirmation)`),
}

func DetectEvent(text string) (EventType, string, bool) {
    for eventType, pattern := range enhancedPatterns {
        match := pattern.FindStringSubmatch(text)
        if match != nil {
            taskName := ""
            for i, name := range pattern.SubexpNames() {
                if name == "taskName" && i < len(match) {
                    taskName = match[i]
                }
            }
            return eventType, taskName, true
        }
    }
    return "", "", false
}
```

### Task Tracker (Deduplication)

```go
// internal/notification/task_tracker.go
package notification

import (
    "crypto/sha256"
    "fmt"
    "sync"
    "time"
)

const (
    taskTTL             = 5 * time.Minute
    cleanupInterval     = 1 * time.Minute
)

type TaskTracker struct {
    mu    sync.Mutex
    seen  map[string]time.Time // eventID -> firstSeen
    done  chan struct{}
}

func NewTaskTracker() *TaskTracker {
    tt := &TaskTracker{
        seen: make(map[string]time.Time),
        done: make(chan struct{}),
    }
    go tt.cleanupLoop()
    return tt
}

func (tt *TaskTracker) IsDuplicate(terminalID string, eventType EventType, taskName string) bool {
    id := tt.makeID(terminalID, eventType, taskName)
    tt.mu.Lock()
    defer tt.mu.Unlock()
    if _, exists := tt.seen[id]; exists {
        return true
    }
    tt.seen[id] = time.Now()
    return false
}

func (tt *TaskTracker) makeID(terminalID string, eventType EventType, taskName string) string {
    h := sha256.Sum256([]byte(fmt.Sprintf("%s:%s:%s", terminalID, eventType, taskName)))
    return fmt.Sprintf("%x", h[:8])
}

func (tt *TaskTracker) cleanupLoop() {
    ticker := time.NewTicker(cleanupInterval)
    defer ticker.Stop()
    for {
        select {
        case <-ticker.C:
            tt.mu.Lock()
            now := time.Now()
            for id, seen := range tt.seen {
                if now.Sub(seen) > taskTTL {
                    delete(tt.seen, id)
                }
            }
            tt.mu.Unlock()
        case <-tt.done:
            return
        }
    }
}

func (tt *TaskTracker) Destroy() { close(tt.done) }
```

### Notification Manager

```go
// internal/notification/manager.go
package notification

import (
    "context"
    "sync"

    wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
    "github.com/<org>/multihub/pkg/types"
)

type Manager struct {
    ctx             context.Context
    mu              sync.RWMutex
    settings        types.NotificationSettings
    tracker         *TaskTracker
    telegram        *TelegramNotifier
    discord         *DiscordNotifier
    secureStore     *SecureStore
    activeTerminal  string
    systemSuspended bool
}

func NewManager(ctx context.Context, secureStore *SecureStore) *Manager {
    return &Manager{
        ctx:         ctx,
        tracker:     NewTaskTracker(),
        secureStore: secureStore,
        settings:    defaultSettings(),
    }
}

// ProcessOutput is called by TerminalManager for each output chunk.
func (m *Manager) ProcessOutput(terminalID, data string, meta types.Terminal) {
    if m.systemSuspended { return }

    eventType, taskName, detected := DetectEvent(data)
    if !detected { return }

    // Check settings
    if !m.isEventEnabled(eventType) { return }

    // Dedup
    if m.tracker.IsDuplicate(terminalID, eventType, taskName) { return }

    // Focus check
    if m.settings.NotifyOnlyBackground && m.isWindowFocused() { return }

    // Build notification
    event := types.NotificationEvent{
        Type:       string(eventType),
        TerminalID: terminalID,
        Message:    formatMessage(eventType, taskName, meta),
        Timestamp:  timeNowMs(),
    }

    // Dispatch to channels
    go m.dispatchNative(event)
    go m.dispatchTelegram(event)
    go m.dispatchDiscord(event)

    // Emit to frontend (sound + UI badge)
    wailsRuntime.EventsEmit(m.ctx, "notification:event", event)
}
```

### Telegram Notifier

```go
// internal/notification/telegram.go
package notification

import (
    "encoding/json"
    "fmt"
    "net/http"
    "net/url"
)

type TelegramNotifier struct {
    botToken string
    chatID   string
    client   *http.Client
}

func (t *TelegramNotifier) Send(message string) error {
    apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", t.botToken)
    resp, err := t.client.PostForm(apiURL, url.Values{
        "chat_id":    {t.chatID},
        "text":       {message},
        "parse_mode": {"HTML"},
    })
    if err != nil { return err }
    defer resp.Body.Close()
    if resp.StatusCode != 200 {
        var result map[string]interface{}
        json.NewDecoder(resp.Body).Decode(&result)
        return fmt.Errorf("telegram API error: %v", result["description"])
    }
    return nil
}

func (t *TelegramNotifier) Test(botToken, chatID string) error {
    temp := &TelegramNotifier{botToken: botToken, chatID: chatID, client: t.client}
    return temp.Send("MultiHub test notification - connection successful!")
}
```

### Discord Notifier

```go
// internal/notification/discord.go
package notification

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

type DiscordNotifier struct {
    webhookURL string
    client     *http.Client
}

func (d *DiscordNotifier) Send(message string) error {
    payload, _ := json.Marshal(map[string]string{"content": message})
    resp, err := d.client.Post(d.webhookURL, "application/json", bytes.NewReader(payload))
    if err != nil { return err }
    defer resp.Body.Close()
    if resp.StatusCode < 200 || resp.StatusCode >= 300 {
        return fmt.Errorf("discord webhook error: status %d", resp.StatusCode)
    }
    return nil
}
```

### Secure Credential Storage

```go
// internal/notification/secure_store.go
package notification

import "github.com/zalando/go-keyring"

const serviceName = "multihub"

type SecureStore struct{}

func (s *SecureStore) Set(key, value string) error {
    return keyring.Set(serviceName, key, value)
}

func (s *SecureStore) Get(key string) (string, error) {
    return keyring.Get(serviceName, key)
}

func (s *SecureStore) Delete(key string) error {
    return keyring.Delete(serviceName, key)
}
```

### Native OS Notifications

```go
// internal/platform/notify_darwin.go
//go:build darwin

package platform

import "os/exec"

func Notify(title, body string) error {
    script := `display notification "` + body + `" with title "` + title + `"`
    return exec.Command("osascript", "-e", script).Run()
}
```

```go
// internal/platform/notify_linux.go
//go:build linux

package platform

import "os/exec"

func Notify(title, body string) error {
    return exec.Command("notify-send", title, body).Run()
}
```

## Related Code Files

**Create:**
- `internal/notification/manager.go`
- `internal/notification/pattern_detector.go`
- `internal/notification/task_tracker.go`
- `internal/notification/telegram.go`
- `internal/notification/discord.go`
- `internal/notification/secure_store.go`
- `internal/notification/output_parser.go` (plain-text + JSON stream)
- `internal/platform/notify_darwin.go`
- `internal/platform/notify_linux.go`
- `internal/platform/notify_windows.go`
- `pkg/types/notification.go`

**Modify:**
- `app.go` -- Add notification binding methods (15 methods)
- `internal/terminal/manager.go` -- Wire output to notification ProcessOutput
- `go.mod` -- Add `github.com/zalando/go-keyring`

## Implementation Steps

1. Define notification types in `pkg/types/notification.go`
2. Port pattern detection with enhanced regex
3. Implement task tracker with TTL and dedup
4. Create Telegram notifier (HTTP client, send/test)
5. Create Discord notifier (webhook POST, test)
6. Implement secure store with go-keyring
7. Create platform-specific native notifications (3 files)
8. Build NotificationManager orchestrating all components
9. Wire terminal output stream to notification pipeline
10. Add focus detection (via Wails window focus events)
11. Add Wails binding methods for settings/credentials
12. Port Telegram poller for bidirectional commands (optional, P3) - SKIPPED

## Todo List

- [x] Define notification types
- [x] Port pattern detection regex
- [x] Implement task tracker (dedup + TTL)
- [x] Create Telegram notifier
- [x] Create Discord notifier
- [x] Implement secure credential storage (go-keyring)
- [x] Create native OS notifications (macOS/Linux/Windows)
- [x] Build NotificationManager
- [x] Wire terminal output to notification pipeline
- [x] Implement focus detection
- [x] Add 15 Wails binding methods
- [ ] Unit tests: pattern detection
- [ ] Unit tests: task tracker dedup and TTL
- [ ] Integration test: Telegram test message (mock HTTP)
- [ ] Integration test: Discord test message (mock HTTP)
- [ ] Telegram polling (bidirectional commands) - SKIPPED (P3 optional)

## Success Criteria

1. Pattern detection matches source regex behavior (test with source test cases)
2. Task tracker correctly deduplicates within 5min window
3. Native OS notifications appear on all platforms
4. Telegram/Discord credentials stored securely (not in plaintext JSON)
5. Notification pipeline processes output without blocking terminal rendering
6. Focus detection correctly suppresses notifications when window is active

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| go-keyring fails on headless Linux | Medium | Med | Fallback to encrypted file; warn user |
| Telegram API rate limits | Low | Low | Debounce sends; max 1 per 3s per chat |
| Pattern false positives | Low | Med | Port source test cases verbatim |
| AppleScript notification blocked by macOS | Low | Med | Use `terminal-notifier` as fallback |

## Rollback

Delete `internal/notification/` and `internal/platform/`. Revert terminal manager output wiring.
