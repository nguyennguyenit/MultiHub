---
phase: "05"
title: "Project Management"
status: completed
effort: 6h
risk: Low
depends_on: ["01"]
---

# Phase 05: Project Management

**Priority:** P2 -- Can run in parallel with terminal track
**Status:** Completed

## Context Links
- Source: `src/main/project/project-store.ts` (~130 lines)
- Source: `src/main/ipc/handlers.ts` (project handler section)

## Overview

Port project CRUD operations and persistence. Replaces `electron-store` with JSON file storage. Projects are the organizational unit: each project has a path, terminals, and git context.

## Key Insights

- Source uses `electron-store` which wraps JSON file with atomic writes
- Data shape is simple: array of Project objects + activeProjectId
- Session data includes terminal layouts per project
- Folder picker uses Electron's `dialog.showOpenDialog` -> Wails `runtime.OpenDirectoryDialog`
- checkFolder validates path exists, is directory, checks for .git

## Requirements

### Functional
- CRUD operations for projects
- Active project tracking
- Folder picker dialog (native)
- Folder validation (exists, isEmpty, isGitRepo, fileCount)
- Session persistence (save/restore terminal state per project)
- Atomic JSON file writes (prevent corruption on crash)

### Non-Functional
- File I/O must not block UI (all ops async from frontend perspective)
- Handle corrupt JSON gracefully (reset to defaults)

## Architecture

```go
// internal/project/store.go
package project

import (
    "encoding/json"
    "os"
    "path/filepath"
    "sync"
    "time"

    "github.com/<org>/multihub/pkg/types"
)

type Store struct {
    mu       sync.RWMutex
    projects []types.Project
    activeID string
    filePath string
}

type persistedState struct {
    Projects []types.Project `json:"projects"`
    ActiveID string          `json:"activeProjectId"`
}

func NewStore(dataDir string) (*Store, error) {
    fp := filepath.Join(dataDir, "projects.json")
    s := &Store{filePath: fp}
    if err := s.load(); err != nil {
        // Corrupt file -> start fresh
        s.projects = nil
        s.activeID = ""
    }
    return s, nil
}

func (s *Store) List() []types.Project {
    s.mu.RLock()
    defer s.mu.RUnlock()
    result := make([]types.Project, len(s.projects))
    copy(result, s.projects)
    return result
}

func (s *Store) Create(name, path string) (types.Project, error) {
    s.mu.Lock()
    defer s.mu.Unlock()
    p := types.Project{
        ID:        generateID(),
        Name:      name,
        Path:      path,
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }
    s.projects = append(s.projects, p)
    return p, s.save()
}

func (s *Store) Update(id string, updates map[string]interface{}) (*types.Project, error) {
    s.mu.Lock()
    defer s.mu.Unlock()
    for i := range s.projects {
        if s.projects[i].ID == id {
            if name, ok := updates["name"].(string); ok {
                s.projects[i].Name = name
            }
            if path, ok := updates["path"].(string); ok {
                s.projects[i].Path = path
            }
            if remote, ok := updates["gitRemote"].(string); ok {
                s.projects[i].GitRemote = remote
            }
            if skip, ok := updates["skipGitSetup"].(bool); ok {
                s.projects[i].SkipGitSetup = skip
            }
            s.projects[i].UpdatedAt = time.Now()
            err := s.save()
            return &s.projects[i], err
        }
    }
    return nil, nil // not found
}

func (s *Store) Delete(id string) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    for i, p := range s.projects {
        if p.ID == id {
            s.projects = append(s.projects[:i], s.projects[i+1:]...)
            if s.activeID == id {
                s.activeID = ""
            }
            return s.save()
        }
    }
    return nil
}

func (s *Store) SetActive(id string) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.activeID = id
    s.save()
}

// save writes atomically: write temp file, rename over target
func (s *Store) save() error {
    data, err := json.MarshalIndent(persistedState{
        Projects: s.projects,
        ActiveID: s.activeID,
    }, "", "  ")
    if err != nil {
        return err
    }
    tmp := s.filePath + ".tmp"
    if err := os.WriteFile(tmp, data, 0644); err != nil {
        return err
    }
    return os.Rename(tmp, s.filePath)
}
```

### Session Store

```go
// internal/project/session_store.go
package project

type SessionStore struct {
    mu       sync.RWMutex
    filePath string
}

type AppSession struct {
    Terminals       []types.TerminalSession `json:"terminals"`
    ActiveTerminalID string                 `json:"activeTerminalId"`
    WindowBounds    *WindowBounds           `json:"windowBounds,omitempty"`
}

type WindowBounds struct {
    X      int `json:"x"`
    Y      int `json:"y"`
    Width  int `json:"width"`
    Height int `json:"height"`
}

func (ss *SessionStore) Save(session AppSession) error { /* atomic JSON write */ }
func (ss *SessionStore) Restore() (*AppSession, error) { /* JSON read */ }
```

### Folder Validation

```go
// internal/project/folder_check.go
func CheckFolder(cwd string) (FolderStatus, error) {
    info, err := os.Stat(cwd)
    if err != nil {
        return FolderStatus{Exists: false}, nil
    }
    if !info.IsDir() {
        return FolderStatus{Exists: false}, nil
    }
    entries, _ := os.ReadDir(cwd)
    _, gitErr := os.Stat(filepath.Join(cwd, ".git"))
    return FolderStatus{
        Exists:    true,
        IsEmpty:   len(entries) == 0,
        IsGitRepo: gitErr == nil,
        FileCount: len(entries),
    }, nil
}
```

## Wails Bindings

```go
// app.go additions
func (a *App) ProjectList() []types.Project { return a.projectStore.List() }
func (a *App) ProjectCreate(input map[string]string) (types.Project, error) {
    return a.projectStore.Create(input["name"], input["path"])
}
func (a *App) ProjectUpdate(id string, updates map[string]interface{}) (*types.Project, error) {
    return a.projectStore.Update(id, updates)
}
func (a *App) ProjectDelete(id string) error { return a.projectStore.Delete(id) }
func (a *App) ProjectSetActive(id string) { a.projectStore.SetActive(id) }
func (a *App) ProjectOpenFolder() (string, error) {
    return wailsRuntime.OpenDirectoryDialog(a.ctx, wailsRuntime.OpenDialogOptions{
        Title: "Select Project Folder",
    })
}
func (a *App) ProjectCheckFolder(cwd string) (project.FolderStatus, error) {
    return project.CheckFolder(cwd)
}
func (a *App) SessionSave(bounds map[string]int) error {
    return a.sessionStore.Save(/* build from terminal manager state */)
}
func (a *App) SessionRestore() (*project.AppSession, error) {
    return a.sessionStore.Restore()
}
```

## Related Code Files

**Create:**
- `internal/project/store.go`
- `internal/project/session_store.go`
- `internal/project/folder_check.go`
- `internal/project/store_test.go`
- `internal/project/id.go` (ID generation helper)

**Modify:**
- `app.go` -- Add project/session binding methods

## Implementation Steps

1. Create `internal/project/` package
2. Implement ID generation (same format as source: `proj-{timestamp}-{random}`)
3. Implement `Store` with atomic JSON persistence
4. Implement `SessionStore` for terminal session data
5. Implement `CheckFolder` utility
6. Add Wails binding methods to App struct
7. Wire store initialization in `app.startup()` with data directory from Wails
8. Write unit tests for CRUD operations and atomic write safety
9. Test corrupt JSON recovery

## Todo List

- [x] Create project store with CRUD operations
- [x] Implement atomic JSON file writes (write-tmp-rename)
- [x] Create session store for terminal state persistence
- [x] Implement folder validation (exists, isEmpty, isGitRepo)
- [x] Add Wails binding methods to App struct
- [x] Wire store initialization in app startup
- [x] Unit tests: CRUD operations
- [x] Unit tests: atomic write (simulate crash during write)
- [x] Unit tests: corrupt JSON recovery

## Success Criteria

1. Projects persist across app restarts
2. Session restore recreates terminal layout
3. Corrupt JSON file triggers clean reset (no crash)
4. Folder picker opens native OS dialog
5. All CRUD operations < 10ms (file I/O)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| JSON corruption on crash | Low | Med | Atomic write (tmp + rename); OS guarantees rename atomicity |
| Data dir permissions | Low | Low | Use Wails `app.GetDir()` for platform-correct data location |
| Concurrent access from multiple windows | N/A | N/A | Single-window app; mutex is defense-in-depth |

## Rollback

Delete `internal/project/` package and revert `app.go` additions. No persistent state needs cleanup.
