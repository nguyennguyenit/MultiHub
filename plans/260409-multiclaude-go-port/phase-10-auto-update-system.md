---
phase: "10"
title: "Auto-Update System"
status: pending
effort: 8h
risk: Medium
depends_on: ["01"]
---

# Phase 10: Auto-Update System

**Priority:** P3 -- Can run in parallel
**Status:** Pending

## Context Links
- Source: `src/main/updater/auto-updater.ts` (~400 lines)
- Source: `src/main/updater/mac-installer.ts` (~60 lines)
- GitHub Releases API: `https://api.github.com/repos/{owner}/{repo}/releases/latest`

## Overview

Replace `electron-updater` with a custom GitHub Releases checker. Wails doesn't have a built-in update mechanism, so we build: check for new version -> download binary -> prompt install.

## Key Insights

- Source uses `electron-updater` which handles everything (check, download, verify, install, restart)
- Go replacement: HTTP check GitHub Releases API -> download asset -> platform-specific install
- macOS: download .dmg, mount, copy .app to /Applications (or use Sparkle framework)
- Linux: download .AppImage or .deb, prompt user to install
- Windows: download .exe installer, launch and quit
- Version comparison: semver parsing
- Auto-check interval: configurable (default: every 4 hours)

## Architecture

```go
// internal/updater/checker.go
package updater

import (
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
    "path/filepath"
    "runtime"
    "strings"
    "sync"
    "time"

    wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

type UpdateStatus string

const (
    StatusIdle        UpdateStatus = "idle"
    StatusChecking    UpdateStatus = "checking"
    StatusUpToDate    UpdateStatus = "up-to-date"
    StatusAvailable   UpdateStatus = "available"
    StatusDownloading UpdateStatus = "downloading"
    StatusReady       UpdateStatus = "ready"
    StatusError       UpdateStatus = "error"
)

type UpdateState struct {
    Status      UpdateStatus `json:"status"`
    CurrentVer  string       `json:"currentVersion"`
    LatestVer   string       `json:"latestVersion,omitempty"`
    DownloadURL string       `json:"downloadUrl,omitempty"`
    ReleaseNotes string      `json:"releaseNotes,omitempty"`
    Error       string       `json:"error,omitempty"`
    Progress    float64      `json:"progress,omitempty"` // 0-100
    LocalPath   string       `json:"localPath,omitempty"`
}

type GitHubRelease struct {
    TagName     string              `json:"tag_name"`
    Body        string              `json:"body"`
    Assets      []GitHubReleaseAsset `json:"assets"`
    PublishedAt string              `json:"published_at"`
}

type GitHubReleaseAsset struct {
    Name        string `json:"name"`
    DownloadURL string `json:"browser_download_url"`
    Size        int64  `json:"size"`
}

type Checker struct {
    ctx         context.Context
    mu          sync.RWMutex
    state       UpdateState
    client      *http.Client
    repoOwner   string
    repoName    string
    currentVer  string
    checkTicker *time.Ticker
    downloadDir string
}

func NewChecker(ctx context.Context, owner, repo, currentVersion, downloadDir string) *Checker {
    return &Checker{
        ctx:         ctx,
        client:      &http.Client{Timeout: 30 * time.Second},
        repoOwner:   owner,
        repoName:    repo,
        currentVer:  currentVersion,
        downloadDir: downloadDir,
        state:       UpdateState{Status: StatusIdle, CurrentVer: currentVersion},
    }
}

func (c *Checker) GetState() UpdateState {
    c.mu.RLock()
    defer c.mu.RUnlock()
    return c.state
}

func (c *Checker) Check() (UpdateState, error) {
    c.setState(UpdateState{Status: StatusChecking, CurrentVer: c.currentVer})

    url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest",
        c.repoOwner, c.repoName)
    resp, err := c.client.Get(url)
    if err != nil {
        return c.setError(err), nil
    }
    defer resp.Body.Close()

    var release GitHubRelease
    if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
        return c.setError(err), nil
    }

    latestVer := strings.TrimPrefix(release.TagName, "v")
    if !isNewer(latestVer, c.currentVer) {
        state := UpdateState{Status: StatusUpToDate, CurrentVer: c.currentVer, LatestVer: latestVer}
        c.setState(state)
        return state, nil
    }

    asset := c.findPlatformAsset(release.Assets)
    if asset == nil {
        return c.setError(fmt.Errorf("no asset for %s/%s", runtime.GOOS, runtime.GOARCH)), nil
    }

    state := UpdateState{
        Status:       StatusAvailable,
        CurrentVer:   c.currentVer,
        LatestVer:    latestVer,
        DownloadURL:  asset.DownloadURL,
        ReleaseNotes: release.Body,
    }
    c.setState(state)
    return state, nil
}

func (c *Checker) Download() error {
    c.mu.RLock()
    url := c.state.DownloadURL
    c.mu.RUnlock()

    if url == "" {
        return fmt.Errorf("no download URL")
    }

    c.setState(UpdateState{Status: StatusDownloading, CurrentVer: c.currentVer, Progress: 0})

    resp, err := c.client.Get(url)
    if err != nil { return err }
    defer resp.Body.Close()

    filename := filepath.Base(url)
    localPath := filepath.Join(c.downloadDir, filename)
    f, err := os.Create(localPath)
    if err != nil { return err }
    defer f.Close()

    // Track download progress
    total := resp.ContentLength
    var downloaded int64
    buf := make([]byte, 32*1024)
    for {
        n, readErr := resp.Body.Read(buf)
        if n > 0 {
            f.Write(buf[:n])
            downloaded += int64(n)
            if total > 0 {
                progress := float64(downloaded) / float64(total) * 100
                c.emitProgress(progress)
            }
        }
        if readErr == io.EOF { break }
        if readErr != nil { return readErr }
    }

    state := UpdateState{
        Status:     StatusReady,
        CurrentVer: c.currentVer,
        LocalPath:  localPath,
    }
    c.setState(state)
    return nil
}

func (c *Checker) Install() error {
    c.mu.RLock()
    localPath := c.state.LocalPath
    c.mu.RUnlock()

    return platformInstall(localPath)
}

func (c *Checker) findPlatformAsset(assets []GitHubReleaseAsset) *GitHubReleaseAsset {
    suffix := platformAssetSuffix()
    for _, a := range assets {
        if strings.Contains(strings.ToLower(a.Name), suffix) {
            return &a
        }
    }
    return nil
}

func (c *Checker) setState(state UpdateState) {
    c.mu.Lock()
    c.state = state
    c.mu.Unlock()
    wailsRuntime.EventsEmit(c.ctx, "update:status-changed", state)
}

func (c *Checker) setError(err error) UpdateState {
    state := UpdateState{Status: StatusError, CurrentVer: c.currentVer, Error: err.Error()}
    c.setState(state)
    return state
}

func (c *Checker) emitProgress(progress float64) {
    c.mu.Lock()
    c.state.Progress = progress
    c.mu.Unlock()
    wailsRuntime.EventsEmit(c.ctx, "update:status-changed", c.state)
}

// StartAutoCheck begins periodic update checks.
func (c *Checker) StartAutoCheck(interval time.Duration) {
    c.checkTicker = time.NewTicker(interval)
    go func() {
        for range c.checkTicker.C {
            c.Check()
        }
    }()
}

func (c *Checker) Stop() {
    if c.checkTicker != nil {
        c.checkTicker.Stop()
    }
}
```

### Platform-Specific Installers

```go
// internal/updater/install_darwin.go
//go:build darwin

package updater

import "os/exec"

func platformInstall(path string) error {
    // Mount DMG and copy app
    return exec.Command("open", path).Run()
}

func platformAssetSuffix() string { return "darwin" }
```

```go
// internal/updater/install_linux.go
//go:build linux

package updater

import "os/exec"

func platformInstall(path string) error {
    // Make AppImage executable and launch
    exec.Command("chmod", "+x", path).Run()
    return exec.Command(path).Start()
}

func platformAssetSuffix() string { return "linux" }
```

```go
// internal/updater/install_windows.go
//go:build windows

package updater

import "os/exec"

func platformInstall(path string) error {
    return exec.Command("cmd", "/C", "start", path).Start()
}

func platformAssetSuffix() string { return "windows" }
```

## Wails Bindings

```go
func (a *App) UpdateGetState() UpdateState { return a.updater.GetState() }
func (a *App) UpdateCheck() (UpdateState, error) { return a.updater.Check() }
func (a *App) UpdateDownload() error { return a.updater.Download() }
func (a *App) UpdateInstall() error { return a.updater.Install() }
```

## Related Code Files

**Create:**
- `internal/updater/checker.go`
- `internal/updater/semver.go` (version comparison)
- `internal/updater/install_darwin.go`
- `internal/updater/install_linux.go`
- `internal/updater/install_windows.go`
- `internal/updater/checker_test.go`

**Modify:**
- `app.go` -- Add 4 update binding methods + startup auto-check

## Implementation Steps

1. Create semver comparison utility
2. Implement GitHub Releases API checker
3. Implement download with progress tracking
4. Create platform-specific installers (3 files)
5. Add auto-check ticker (every 4 hours)
6. Add Wails bindings
7. Wire status-changed events to frontend
8. Test: version comparison edge cases
9. Test: download with mock HTTP server

## Todo List

- [ ] Implement semver comparison
- [ ] Create GitHub Releases checker
- [ ] Implement download with progress
- [ ] Create platform installers (macOS/Linux/Windows)
- [ ] Add auto-check timer
- [ ] Add 4 Wails binding methods
- [ ] Wire update events to frontend
- [ ] Unit tests: semver comparison
- [ ] Unit tests: release API parsing
- [ ] Integration test: download from real GitHub release (manual)

## Success Criteria

1. Check correctly detects newer versions
2. Download shows progress (0-100%) in UI
3. Platform-specific installer launches correctly
4. Auto-check runs without blocking UI
5. Error states handled gracefully (no network, API rate limit)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| GitHub API rate limit (60/hr unauthenticated) | Low | Low | Check every 4h; cache last result |
| DMG mount fails on macOS | Low | Med | Fall back to opening Finder |
| Download interrupted | Medium | Low | Delete partial file; retry on next check |
| Code signing verification | Medium | Med | Phase 11 addresses signing; updater trusts GitHub URL |

## Rollback

Delete `internal/updater/`. Revert `app.go` bindings. No persistent state.
