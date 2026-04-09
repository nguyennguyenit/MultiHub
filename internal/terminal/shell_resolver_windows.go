//go:build windows

package terminal

import "os"

// ResolveDefaultShell returns the default shell on Windows.
func ResolveDefaultShell() string {
	if s := os.Getenv("COMSPEC"); s != "" {
		return s
	}
	return "cmd.exe"
}
