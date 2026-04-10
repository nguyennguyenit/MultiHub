// Package updater checks for and applies application updates via GitHub Releases.
package updater

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// UpdateStatus is the current state of the update pipeline.
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

// UpdateState is emitted to the frontend whenever the state changes.
type UpdateState struct {
	Status       UpdateStatus `json:"status"`
	CurrentVer   string       `json:"currentVersion"`
	LatestVer    string       `json:"latestVersion,omitempty"`
	DownloadURL  string       `json:"downloadUrl,omitempty"`
	ReleaseNotes string       `json:"releaseNotes,omitempty"`
	Error        string       `json:"error,omitempty"`
	Progress     float64      `json:"progress,omitempty"` // 0–100
	LocalPath    string       `json:"localPath,omitempty"`
}

type gitHubRelease struct {
	TagName string               `json:"tag_name"`
	Body    string               `json:"body"`
	Assets  []gitHubReleaseAsset `json:"assets"`
}

type gitHubReleaseAsset struct {
	Name        string `json:"name"`
	DownloadURL string `json:"browser_download_url"`
}

// Checker polls GitHub Releases and manages the download/install lifecycle.
type Checker struct {
	ctx         context.Context
	mu          sync.RWMutex
	state       UpdateState
	client      *http.Client
	repoOwner   string
	repoName    string
	currentVer  string
	downloadDir string
	ticker      *time.Ticker
}

// NewChecker creates a Checker. currentVersion should be "MAJOR.MINOR.PATCH".
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

// GetState returns the current update state (thread-safe).
func (c *Checker) GetState() UpdateState {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.state
}

// Check queries GitHub Releases API for a newer version.
func (c *Checker) Check() (UpdateState, error) {
	c.setState(UpdateState{Status: StatusChecking, CurrentVer: c.currentVer})

	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest",
		c.repoOwner, c.repoName)
	resp, err := c.client.Get(url)
	if err != nil {
		return c.setError(err), nil
	}
	defer resp.Body.Close()

	var release gitHubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return c.setError(err), nil
	}

	latestVer := strings.TrimPrefix(release.TagName, "v")
	if !isNewer(latestVer, c.currentVer) {
		s := UpdateState{Status: StatusUpToDate, CurrentVer: c.currentVer, LatestVer: latestVer}
		c.setState(s)
		return s, nil
	}

	asset := c.findPlatformAsset(release.Assets)
	if asset == nil {
		return c.setError(fmt.Errorf("no release asset for current platform")), nil
	}

	s := UpdateState{
		Status:       StatusAvailable,
		CurrentVer:   c.currentVer,
		LatestVer:    latestVer,
		DownloadURL:  asset.DownloadURL,
		ReleaseNotes: release.Body,
	}
	c.setState(s)
	return s, nil
}

// Download fetches the update asset to disk, reporting progress via Wails events.
func (c *Checker) Download() error {
	c.mu.RLock()
	url := c.state.DownloadURL
	c.mu.RUnlock()
	if url == "" {
		return fmt.Errorf("no download URL: call Check first")
	}
	c.setState(UpdateState{Status: StatusDownloading, CurrentVer: c.currentVer})

	resp, err := c.client.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	filename := filepath.Base(url)
	localPath := filepath.Join(c.downloadDir, filename)
	f, err := os.Create(localPath)
	if err != nil {
		return err
	}
	defer f.Close()

	total := resp.ContentLength
	var downloaded int64
	buf := make([]byte, 32*1024)
	for {
		n, readErr := resp.Body.Read(buf)
		if n > 0 {
			_, _ = f.Write(buf[:n])
			downloaded += int64(n)
			if total > 0 {
				c.emitProgress(float64(downloaded)/float64(total)*100, localPath)
			}
		}
		if readErr == io.EOF {
			break
		}
		if readErr != nil {
			return readErr
		}
	}
	c.setState(UpdateState{Status: StatusReady, CurrentVer: c.currentVer, LocalPath: localPath})
	return nil
}

// Install launches the downloaded installer using platform-specific logic.
func (c *Checker) Install() error {
	c.mu.RLock()
	localPath := c.state.LocalPath
	c.mu.RUnlock()
	if localPath == "" {
		return fmt.Errorf("no downloaded asset: call Download first")
	}
	return platformInstall(localPath)
}

// StartAutoCheck begins periodic checks at the given interval.
func (c *Checker) StartAutoCheck(interval time.Duration) {
	c.ticker = time.NewTicker(interval)
	go func() {
		for {
			select {
			case <-c.ticker.C:
				_, _ = c.Check()
			case <-c.ctx.Done():
				return
			}
		}
	}()
}

// Stop cancels periodic auto-checks.
func (c *Checker) Stop() {
	if c.ticker != nil {
		c.ticker.Stop()
	}
}

func (c *Checker) findPlatformAsset(assets []gitHubReleaseAsset) *gitHubReleaseAsset {
	suffix := platformAssetSuffix()
	for i := range assets {
		if strings.Contains(strings.ToLower(assets[i].Name), suffix) {
			return &assets[i]
		}
	}
	return nil
}

func (c *Checker) setState(s UpdateState) {
	c.mu.Lock()
	c.state = s
	c.mu.Unlock()
	wailsRuntime.EventsEmit(c.ctx, "update:status-changed", s)
}

func (c *Checker) setError(err error) UpdateState {
	s := UpdateState{Status: StatusError, CurrentVer: c.currentVer, Error: err.Error()}
	c.setState(s)
	return s
}

func (c *Checker) emitProgress(progress float64, localPath string) {
	c.mu.Lock()
	c.state.Progress = progress
	c.state.LocalPath = localPath
	s := c.state
	c.mu.Unlock()
	wailsRuntime.EventsEmit(c.ctx, "update:status-changed", s)
}
