//go:build darwin

package updater

import "os/exec"

// platformInstall opens the downloaded DMG or archive with the default app.
func platformInstall(path string) error {
	return exec.Command("open", path).Run()
}

func platformAssetSuffix() string { return "darwin" }
