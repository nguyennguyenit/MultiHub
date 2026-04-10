package main

import (
	"os"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// ── Settings bindings (stub – real impl in Phase 08) ─────────────────────────

// SettingsGet returns application settings.
func (a *App) SettingsGet() (interface{}, error) { return nil, nil }

// SettingsSet persists application settings.
func (a *App) SettingsSet(s map[string]interface{}) (interface{}, error) { return s, nil }

// SettingsReset resets application settings to defaults.
func (a *App) SettingsReset() (interface{}, error) { return nil, nil }

// ── GitHub bindings (stub – real impl in Phase 09) ───────────────────────────

// GitHubAuthStatus returns GitHub authentication status.
func (a *App) GitHubAuthStatus() (interface{}, error) { return nil, nil }

// GitHubLogin initiates the GitHub OAuth flow.
func (a *App) GitHubLogin() error { return nil }

// GitHubLogout clears stored GitHub credentials.
func (a *App) GitHubLogout() error { return nil }

// GitHubCreateRepo creates a new GitHub repository.
func (a *App) GitHubCreateRepo(data map[string]interface{}) (interface{}, error) {
	return nil, nil
}

// GitHubListIssues returns open issues for the given repository.
func (a *App) GitHubListIssues(data map[string]interface{}) (interface{}, error) {
	return nil, nil
}

// GitHubListPRs returns open pull requests for the given repository.
func (a *App) GitHubListPRs(data map[string]interface{}) (interface{}, error) {
	return nil, nil
}

// ── Update bindings (stub – real impl in Phase 10) ───────────────────────────

// UpdateGetState returns the current auto-update state.
func (a *App) UpdateGetState() (interface{}, error) { return nil, nil }

// UpdateCheck checks for a new release.
func (a *App) UpdateCheck() (interface{}, error) { return nil, nil }

// UpdateDownload starts downloading the available update.
func (a *App) UpdateDownload() error { return nil }

// UpdateInstall installs the downloaded update and restarts.
func (a *App) UpdateInstall() error { return nil }

// ── Session bindings (stub) ───────────────────────────────────────────────────

// SessionSave persists the current window and terminal state.
func (a *App) SessionSave() error { return nil }

// SessionRestore loads the last-saved session state.
func (a *App) SessionRestore() (interface{}, error) { return nil, nil }

// ── Terminal additional bindings ──────────────────────────────────────────────

// TerminalDetectWsl detects available WSL distributions (Windows only).
func (a *App) TerminalDetectWsl() (interface{}, error) {
	return map[string]interface{}{"available": false, "distros": []interface{}{}}, nil
}

// ── Window state ──────────────────────────────────────────────────────────────

// WindowGetState returns whether the window is maximized / full-screen.
func (a *App) WindowGetState() (interface{}, error) {
	return map[string]interface{}{"isMaximized": false, "isFullScreen": false}, nil
}

// ── App bindings ──────────────────────────────────────────────────────────────

// AppGetPath returns common OS paths (home, appData, etc.).
func (a *App) AppGetPath(name string) (string, error) {
	switch name {
	case "home":
		return os.UserHomeDir()
	case "appData":
		dir, err := os.UserConfigDir()
		return dir, err
	case "temp":
		return os.TempDir(), nil
	default:
		return os.UserHomeDir()
	}
}

// AppOpenExternal opens a URL in the default browser.
func (a *App) AppOpenExternal(url string) {
	wailsRuntime.BrowserOpenURL(a.ctx, url)
}

// ── Clipboard bindings ────────────────────────────────────────────────────────

// ClipboardSaveImage saves a base64-encoded image to a temp file and returns its path.
func (a *App) ClipboardSaveImage(base64Data string) (string, error) { return "", nil }

// ── Image bindings ────────────────────────────────────────────────────────────

// ImageReadBase64 reads an image file and returns its base64-encoded content.
func (a *App) ImageReadBase64(filePath string) (string, error) { return "", nil }

// ImageListScreenshots lists screenshot files in the app's data directory.
func (a *App) ImageListScreenshots() (interface{}, error) { return []interface{}{}, nil }

// ImageOpen opens an image file in the default viewer.
func (a *App) ImageOpen(filePath string) error {
	wailsRuntime.BrowserOpenURL(a.ctx, "file://"+filePath)
	return nil
}

// FilePicker opens a native file picker dialog and returns the chosen path.
func (a *App) FilePicker() (string, error) {
	path, err := wailsRuntime.OpenFileDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Select File",
	})
	return path, err
}
