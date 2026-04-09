//go:build !windows

// Package terminal — shell_resolver.go resolves the user's default login shell.
package terminal

import (
	"os"
	"os/exec"
	"strings"
)


// ResolveDefaultShell returns the best available login shell for the current user.
// Priority: dscl (macOS) → $SHELL env → /bin/bash fallback.
func ResolveDefaultShell() string {
	// macOS: dscl gives the actual login shell set in Directory Services.
	if shell := macOSLoginShell(); shell != "" {
		return shell
	}
	// Cross-platform: $SHELL env (set by login process on most Unix systems).
	if s := os.Getenv("SHELL"); s != "" {
		return s
	}
	return "/bin/bash"
}

// macOSLoginShell queries dscl for the current user's LoginShell attribute.
// Returns empty string on non-macOS or if dscl is unavailable.
func macOSLoginShell() string {
	username := os.Getenv("USER")
	// Guard against path traversal via a malformed USER env variable.
	if username == "" || strings.ContainsAny(username, "/\\ \t") {
		return ""
	}
	dscl, err := exec.LookPath("dscl")
	if err != nil {
		return ""
	}
	out, err := exec.Command(dscl, ".", "-read", "/Users/"+username, "UserShell").Output()
	if err != nil {
		return ""
	}
	// Output: "UserShell: /bin/zsh\n"
	line := strings.TrimSpace(string(out))
	parts := strings.SplitN(line, ": ", 2)
	if len(parts) == 2 {
		return strings.TrimSpace(parts[1])
	}
	return ""
}
