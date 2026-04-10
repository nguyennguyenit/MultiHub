//go:build darwin

// Package platform provides OS-specific helper implementations.
package platform

import (
	"os/exec"
	"strings"
)

// Notify shows a native macOS notification via AppleScript.
func Notify(title, body string) error {
	// Escape double quotes to prevent AppleScript injection.
	t := strings.ReplaceAll(title, `"`, `\"`)
	b := strings.ReplaceAll(body, `"`, `\"`)
	script := `display notification "` + b + `" with title "` + t + `"`
	return exec.Command("osascript", "-e", script).Run()
}
