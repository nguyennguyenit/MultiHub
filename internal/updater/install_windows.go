//go:build windows

package updater

import "os/exec"

// platformInstall launches the downloaded installer via cmd /C start.
func platformInstall(path string) error {
	return exec.Command("cmd", "/C", "start", path).Start()
}

func platformAssetSuffix() string { return "windows" }
