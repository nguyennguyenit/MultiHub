//go:build linux

package updater

import "os/exec"

// platformInstall makes the AppImage executable and launches it.
func platformInstall(path string) error {
	_ = exec.Command("chmod", "+x", path).Run()
	return exec.Command(path).Start()
}

func platformAssetSuffix() string { return "linux" }
