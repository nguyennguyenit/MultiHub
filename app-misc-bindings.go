package main

import (
	"os"

	internalproject "github.com/multihub/multihub/internal/project"
	"github.com/multihub/multihub/internal/updater"
	"github.com/multihub/multihub/pkg/types"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// ── Settings bindings ─────────────────────────────────────────────────────────

// SettingsGet returns the current application settings.
func (a *App) SettingsGet() (types.AppSettings, error) {
	return a.settingsStore.Get(), nil
}

// SettingsSet merges partial settings and persists them.
func (a *App) SettingsSet(s map[string]interface{}) (types.AppSettings, error) {
	return a.settingsStore.Set(s)
}

// SettingsReset resets application settings to factory defaults.
func (a *App) SettingsReset() (types.AppSettings, error) {
	return a.settingsStore.Reset()
}

// ── GitHub bindings ───────────────────────────────────────────────────────────

// GitHubAuthStatus returns GitHub CLI authentication state.
func (a *App) GitHubAuthStatus() (types.GitHubAuth, error) {
	return a.githubClient.AuthStatus()
}

// GitHubLogin initiates the GitHub OAuth web flow.
func (a *App) GitHubLogin() (map[string]interface{}, error) {
	return a.githubClient.Login()
}

// GitHubLogout signs out of GitHub.
func (a *App) GitHubLogout() (types.GitOperationResult, error) {
	return a.githubClient.Logout()
}

// GitHubCreateRepo creates a new GitHub repository.
func (a *App) GitHubCreateRepo(name string, isPrivate bool, cwd string) (map[string]interface{}, error) {
	return a.githubClient.CreateRepo(name, isPrivate, cwd)
}

// GitHubListIssues returns open issues for the repository at projectPath.
func (a *App) GitHubListIssues(projectPath, state string) (map[string]interface{}, error) {
	return a.githubClient.ListIssues(projectPath, state)
}

// GitHubListPRs returns pull requests for the repository at projectPath.
func (a *App) GitHubListPRs(projectPath, state string) (map[string]interface{}, error) {
	return a.githubClient.ListPRs(projectPath, state)
}

// ── Update bindings ───────────────────────────────────────────────────────────

// UpdateGetState returns the current auto-update state.
func (a *App) UpdateGetState() updater.UpdateState {
	return a.updaterChecker.GetState()
}

// UpdateCheck polls GitHub Releases for a newer version.
func (a *App) UpdateCheck() (updater.UpdateState, error) {
	return a.updaterChecker.Check()
}

// UpdateDownload downloads the available update asset.
func (a *App) UpdateDownload() error {
	return a.updaterChecker.Download()
}

// UpdateInstall launches the downloaded installer.
func (a *App) UpdateInstall() error {
	return a.updaterChecker.Install()
}

// ── Session bindings ──────────────────────────────────────────────────────────

// SessionSave persists the current terminal and window state.
func (a *App) SessionSave() error {
	if a.sessionStore == nil {
		return nil
	}
	sessions := a.terminalMgr.GetSessions()
	return a.sessionStore.Save(internalproject.AppSession{
		Terminals: sessions,
	})
}

// SessionRestore loads the last-saved session state.
func (a *App) SessionRestore() (*internalproject.AppSession, error) {
	if a.sessionStore == nil {
		return nil, nil
	}
	return a.sessionStore.Restore()
}

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

// AppGetVersion returns the application version string injected at build time.
func (a *App) AppGetVersion() string {
	if a.version == "" {
		return "dev"
	}
	return a.version
}

// AppGetPath returns common OS paths (home, appData, temp).
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
