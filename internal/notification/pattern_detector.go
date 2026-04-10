// Package notification handles outbound notifications (Telegram, Discord, OS native).
package notification

import "regexp"

// EventType classifies a detected terminal output event.
type EventType string

const (
	TaskComplete EventType = "taskComplete"
	TaskFailed   EventType = "taskFailed"
	ReviewNeeded EventType = "reviewNeeded"
)

// enhancedPatterns are tried first; they capture optional named groups.
var enhancedPatterns = map[EventType]*regexp.Regexp{
	TaskComplete: regexp.MustCompile(
		`(?i)✓\s+(?P<taskName>.+?)(?:\s*\(completed\)|$)`),
	TaskFailed: regexp.MustCompile(
		`(?i)✗\s+(?P<taskName>.+?)(?:\s*\(failed\)|$)|exit(?:ed)?\s+(?:with\s+)?code\s+(?P<exitCode>\d+)`),
	ReviewNeeded: regexp.MustCompile(
		`(?i)\[Y/n\]|\(y/N\)|approve|allow\s+(?:this\s+)?tool|waiting\s+for\s+(?:your\s+)?(?:input|response|confirmation)`),
}

// basePatterns are simpler fallbacks for plain-text output.
var basePatterns = map[EventType]*regexp.Regexp{
	TaskComplete: regexp.MustCompile(
		`(?i)✓\s*(Task\s+)?completed|Task\s+completed\s+successfully|finished\s+successfully`),
	TaskFailed: regexp.MustCompile(
		`(?i)✗\s*(Task\s+)?failed|^Task\s+failed[:\s]|command\s+failed\s+with\s+exit\s+code`),
	ReviewNeeded: regexp.MustCompile(
		`(?i)review\s+needed|waiting\s+for\s+review|needs\s+review|please\s+review`),
}

// DetectEvent scans text for known event patterns.
// Returns the event type, an optional task name, and whether anything matched.
func DetectEvent(text string) (EventType, string, bool) {
	// Try enhanced patterns first (capture task name).
	for et, re := range enhancedPatterns {
		match := re.FindStringSubmatch(text)
		if match == nil {
			continue
		}
		taskName := ""
		for i, name := range re.SubexpNames() {
			if name == "taskName" && i < len(match) {
				taskName = match[i]
			}
		}
		return et, taskName, true
	}

	// Fall back to base patterns.
	for et, re := range basePatterns {
		if re.MatchString(text) {
			return et, "", true
		}
	}

	return "", "", false
}
