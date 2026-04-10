package notification

import (
	"crypto/sha256"
	"fmt"
	"sync"
	"time"
)

const (
	taskTTL         = 5 * time.Minute
	cleanupInterval = 1 * time.Minute
)

// TaskTracker deduplicates notification events within a TTL window.
// The same (terminal, event type, task name) tuple is suppressed for 5 minutes.
type TaskTracker struct {
	mu   sync.Mutex
	seen map[string]time.Time
	done chan struct{}
}

// NewTaskTracker creates a tracker and starts its background cleanup goroutine.
func NewTaskTracker() *TaskTracker {
	tt := &TaskTracker{
		seen: make(map[string]time.Time),
		done: make(chan struct{}),
	}
	go tt.cleanupLoop()
	return tt
}

// IsDuplicate returns true if this (terminalID, eventType, taskName) combination
// has already been seen within the TTL window; otherwise registers it and returns false.
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

func (tt *TaskTracker) makeID(terminalID string, et EventType, taskName string) string {
	h := sha256.Sum256([]byte(fmt.Sprintf("%s:%s:%s", terminalID, et, taskName)))
	return fmt.Sprintf("%x", h[:8])
}

func (tt *TaskTracker) cleanupLoop() {
	ticker := time.NewTicker(cleanupInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			now := time.Now()
			tt.mu.Lock()
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

// Destroy stops the background cleanup goroutine.
func (tt *TaskTracker) Destroy() {
	close(tt.done)
}
