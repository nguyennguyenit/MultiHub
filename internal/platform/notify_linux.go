//go:build linux

// Package platform provides OS-specific helper implementations.
package platform

import "os/exec"

// Notify shows a native Linux notification via notify-send.
// If notify-send is not installed, the error is silently ignored by the caller.
func Notify(title, body string) error {
	return exec.Command("notify-send", title, body).Run()
}
