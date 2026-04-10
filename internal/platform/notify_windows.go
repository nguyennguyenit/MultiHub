//go:build windows

// Package platform provides OS-specific helper implementations.
package platform

import (
	"fmt"
	"os/exec"
	"strings"
)

// Notify shows a Windows balloon notification via PowerShell.
func Notify(title, body string) error {
	// Escape single quotes for PowerShell string literals.
	t := strings.ReplaceAll(title, "'", "''")
	b := strings.ReplaceAll(body, "'", "''")
	script := fmt.Sprintf(
		`[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null;`+
			`$n = New-Object System.Windows.Forms.NotifyIcon;`+
			`$n.Icon = [System.Drawing.SystemIcons]::Information;`+
			`$n.BalloonTipTitle = '%s';`+
			`$n.BalloonTipText = '%s';`+
			`$n.Visible = $true;`+
			`$n.ShowBalloonTip(3000)`,
		t, b,
	)
	return exec.Command("powershell", "-NoProfile", "-Command", script).Run()
}
