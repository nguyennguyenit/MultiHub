package github

import (
	"regexp"
	"strings"
)

var usernameRe = regexp.MustCompile(`(?i)account\s+(\S+)`)
var deviceCodeRe = regexp.MustCompile(`(?i)one-time code[:\s]+(\S+)`)

// parseUsername extracts a GitHub username from `gh auth status` output.
// Example line: "Logged in to github.com account octocat (oauth_token)"
func parseUsername(out string) string {
	m := usernameRe.FindStringSubmatch(out)
	if len(m) >= 2 {
		return strings.TrimRight(m[1], " (")
	}
	return ""
}

// parseDeviceCode extracts the device/one-time code from `gh auth login` output.
func parseDeviceCode(out string) string {
	m := deviceCodeRe.FindStringSubmatch(out)
	if len(m) >= 2 {
		return m[1]
	}
	return ""
}
