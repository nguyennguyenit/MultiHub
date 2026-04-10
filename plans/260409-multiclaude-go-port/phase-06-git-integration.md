---
phase: "06"
title: "Git Integration"
status: completed
effort: 16h
risk: Medium
depends_on: ["05"]
---

# Phase 06: Git Integration

**Priority:** P2 -- Large scope, high value
**Status:** Completed

## Context Links
- Source: `src/main/git/git-manager.ts` (~1000 lines, 38 operations)
- Source: `src/main/git/git-head-watcher.ts` (~150 lines)
- [go-git v6 docs](https://github.com/go-git/go-git)

## Overview

Port 38 git operations from simple-git (Node.js) to go-git v6 (pure Go) with os/exec fallback for operations go-git doesn't support well (stash, some diff edge cases). Also port the HEAD file watcher for detecting external branch changes.

## Key Insights

- Source uses `simple-git` which wraps the `git` CLI binary
- go-git v6 is pure Go, covers ~95% of needed operations
- **Stash operations** are not well-supported in go-git -> use `os/exec` git fallback
- **Diff operations** with specific file paths may need exec fallback for accuracy
- HEAD watcher uses `fs.watch` on `.git/HEAD` file -> use `fsnotify` in Go
- All operations are per-CWD (stateless; open repo fresh each call)

## Operation Classification

### Tier 1: go-git Native (25 operations)

| Operation | go-git API |
|-----------|-----------|
| `status(cwd)` | `worktree.Status()` |
| `init(cwd)` | `git.PlainInit(cwd, false)` |
| `addRemote(cwd, url, name)` | `repo.CreateRemote()` |
| `push(cwd, branch, upstream)` | `repo.Push()` |
| `fileStatus(cwd)` | `worktree.Status()` + parse |
| `stageFile(cwd, file)` | `worktree.Add(file)` |
| `unstageFile(cwd, file)` | `worktree.Reset()` on file |
| `stageAll(cwd)` | `worktree.AddGlob(".")` |
| `commit(cwd, message)` | `worktree.Commit(msg, opts)` |
| `pull(cwd)` | `worktree.Pull()` |
| `fetch(cwd)` | `repo.Fetch()` |
| `branches(cwd)` | `repo.Branches()` + `repo.References()` |
| `createBranch(cwd, name, checkout)` | `worktree.Checkout(&CheckoutOpts{Branch: name, Create: true})` |
| `checkoutBranch(cwd, name)` | `worktree.Checkout()` |
| `deleteBranch(cwd, name, force)` | `repo.DeleteBranch()` |
| `merge(cwd, branch)` | Exec fallback (go-git merge is basic) |
| `log(cwd, maxCount)` | `repo.Log(&LogOptions{})` |
| `configGet()` | `repo.Config()` |
| `configSet(config)` | `repo.SetConfig()` or global git config |
| `discard(cwd, file)` | `worktree.Checkout()` on file |

### Tier 2: Exec Fallback Required (13 operations)

| Operation | Reason | Exec Command |
|-----------|--------|-------------|
| `diff(cwd, file, staged, oldFile)` | go-git diff is limited for file-level | `git diff [--cached] -- file` |
| `diffBranch(cwd, baseBranch)` | Branch comparison not in go-git | `git diff base...HEAD --stat` |
| `diffAgainstBranch(cwd, file, base, old)` | File diff against branch | `git diff base -- file` |
| `merge(cwd, branch)` | go-git merge incomplete | `git merge branch` |
| `stashList(cwd)` | Not in go-git | `git stash list --format=...` |
| `stashSave(cwd, message)` | Not in go-git | `git stash push -m "msg"` |
| `stashApply(cwd, index)` | Not in go-git | `git stash apply stash@{i}` |
| `stashPop(cwd, index)` | Not in go-git | `git stash pop stash@{i}` |
| `stashDrop(cwd, index)` | Not in go-git | `git stash drop stash@{i}` |

## Architecture

```go
// internal/git/manager.go
package git

import (
    "context"
    "fmt"
    "os/exec"
    "strings"

    gogit "github.com/go-git/go-git/v6"
    "github.com/go-git/go-git/v6/plumbing"
    "github.com/<org>/multihub/pkg/types"
)

type Manager struct{}

func NewManager() *Manager { return &Manager{} }

// openRepo opens a git repository at the given path.
func (m *Manager) openRepo(cwd string) (*gogit.Repository, error) {
    return gogit.PlainOpen(cwd)
}

// Status returns the git status for a directory.
func (m *Manager) Status(cwd string) (types.GitStatus, error) {
    repo, err := m.openRepo(cwd)
    if err != nil {
        return types.GitStatus{IsRepo: false}, nil
    }
    w, err := repo.Worktree()
    if err != nil {
        return types.GitStatus{IsRepo: false}, err
    }
    status, err := w.Status()
    if err != nil {
        return types.GitStatus{IsRepo: true}, err
    }

    result := types.GitStatus{
        IsRepo: true,
        IsDirty: !status.IsClean(),
    }

    // Count staged/unstaged/untracked
    for _, s := range status {
        if s.Staging != gogit.Unmodified && s.Staging != gogit.Untracked {
            result.Staged++
        }
        if s.Worktree != gogit.Unmodified && s.Worktree != gogit.Untracked {
            result.Unstaged++
        }
        if s.Worktree == gogit.Untracked {
            result.Untracked++
        }
    }

    // Branch info
    head, err := repo.Head()
    if err == nil {
        result.Branch = head.Name().Short()
    }

    // Remote info
    remotes, _ := repo.Remotes()
    if len(remotes) > 0 {
        result.HasRemote = true
        result.RemoteName = remotes[0].Config().Name
        urls := remotes[0].Config().URLs
        if len(urls) > 0 {
            result.RemoteURL = urls[0]
        }
    }

    return result, nil
}

// Diff uses exec fallback for accurate file-level diffs.
func (m *Manager) Diff(cwd string, file string, staged bool, oldFile string) (types.GitDiffResult, error) {
    args := []string{"diff"}
    if staged {
        args = append(args, "--cached")
    }
    args = append(args, "--")
    if file != "" {
        args = append(args, file)
    }
    out, err := m.execGit(cwd, args...)
    if err != nil {
        return types.GitDiffResult{Success: false, Error: err.Error()}, nil
    }
    return types.GitDiffResult{Success: true, Diff: out}, nil
}

// StashList uses exec fallback.
func (m *Manager) StashList(cwd string) ([]types.GitStashEntry, error) {
    out, err := m.execGit(cwd, "stash", "list",
        "--format=%gd||%H||%gs||%ci")
    if err != nil {
        return nil, err
    }
    var entries []types.GitStashEntry
    for i, line := range strings.Split(strings.TrimSpace(out), "\n") {
        if line == "" { continue }
        parts := strings.SplitN(line, "||", 4)
        if len(parts) < 4 { continue }
        entries = append(entries, types.GitStashEntry{
            Index:   i,
            Hash:    parts[1],
            Message: parts[2],
            Date:    parts[3],
        })
    }
    return entries, nil
}

// execGit runs a git command and returns stdout.
func (m *Manager) execGit(cwd string, args ...string) (string, error) {
    cmd := exec.Command("git", args...)
    cmd.Dir = cwd
    out, err := cmd.Output()
    if err != nil {
        if exitErr, ok := err.(*exec.ExitError); ok {
            return "", fmt.Errorf("git %s: %s", args[0], string(exitErr.Stderr))
        }
        return "", err
    }
    return string(out), nil
}
```

### HEAD Watcher

```go
// internal/git/head_watcher.go
package git

import (
    "path/filepath"
    "sync"

    "github.com/fsnotify/fsnotify"
)

type HeadWatcher struct {
    mu       sync.Mutex
    watchers map[string]*fsnotify.Watcher // projectPath -> watcher
    onChange func(projectPath string)
}

func NewHeadWatcher(onChange func(projectPath string)) *HeadWatcher {
    return &HeadWatcher{
        watchers: make(map[string]*fsnotify.Watcher),
        onChange: onChange,
    }
}

func (hw *HeadWatcher) Watch(projectPath string) error {
    hw.mu.Lock()
    defer hw.mu.Unlock()

    if _, exists := hw.watchers[projectPath]; exists {
        return nil // already watching
    }

    watcher, err := fsnotify.NewWatcher()
    if err != nil {
        return err
    }

    gitHead := filepath.Join(projectPath, ".git", "HEAD")
    if err := watcher.Add(gitHead); err != nil {
        watcher.Close()
        return err
    }

    hw.watchers[projectPath] = watcher

    go func() {
        for {
            select {
            case event, ok := <-watcher.Events:
                if !ok { return }
                if event.Has(fsnotify.Write) {
                    hw.onChange(projectPath)
                }
            case _, ok := <-watcher.Errors:
                if !ok { return }
            }
        }
    }()

    return nil
}

func (hw *HeadWatcher) Unwatch(projectPath string) {
    hw.mu.Lock()
    defer hw.mu.Unlock()
    if w, ok := hw.watchers[projectPath]; ok {
        w.Close()
        delete(hw.watchers, projectPath)
    }
}

func (hw *HeadWatcher) Destroy() {
    hw.mu.Lock()
    defer hw.mu.Unlock()
    for _, w := range hw.watchers {
        w.Close()
    }
    hw.watchers = nil
}
```

## Go Type Definitions

```go
// pkg/types/git.go
package types

type GitStatus struct {
    IsRepo     bool   `json:"isRepo"`
    Branch     string `json:"branch,omitempty"`
    HasRemote  bool   `json:"hasRemote"`
    RemoteName string `json:"remoteName,omitempty"`
    RemoteURL  string `json:"remoteUrl,omitempty"`
    IsDirty    bool   `json:"isDirty"`
    Staged     int    `json:"staged"`
    Unstaged   int    `json:"unstaged"`
    Untracked  int    `json:"untracked"`
}

type GitFileStatus struct {
    Path      string `json:"path"`
    Status    string `json:"status"` // added|staged|modified|untracked|deleted|renamed|copied
    Staged    bool   `json:"staged"`
    OldPath   string `json:"oldPath,omitempty"`
    Additions int    `json:"additions,omitempty"`
    Deletions int    `json:"deletions,omitempty"`
}

type GitBranch struct {
    Name     string `json:"name"`
    Current  bool   `json:"current"`
    Commit   string `json:"commit"`
    Label    string `json:"label"`
    IsRemote bool   `json:"isRemote"`
}

type GitLogEntry struct {
    Hash      string `json:"hash"`
    HashShort string `json:"hashShort"`
    Author    string `json:"author"`
    Email     string `json:"email"`
    Date      string `json:"date"`
    Message   string `json:"message"`
}

type GitStashEntry struct {
    Index   int    `json:"index"`
    Hash    string `json:"hash"`
    Message string `json:"message"`
    Date    string `json:"date"`
}

type GitOperationResult struct {
    Success bool   `json:"success"`
    Message string `json:"message,omitempty"`
    Error   string `json:"error,omitempty"`
}

type GitCommitResult struct {
    Success bool   `json:"success"`
    Hash    string `json:"hash,omitempty"`
    Error   string `json:"error,omitempty"`
}

type GitDiffResult struct {
    Success bool   `json:"success"`
    Diff    string `json:"diff,omitempty"`
    Error   string `json:"error,omitempty"`
}

type GitBranchDiff struct {
    BaseBranch string              `json:"baseBranch"`
    Files      []GitBranchDiffFile `json:"files"`
    AheadBy    int                 `json:"aheadBy"`
    BehindBy   int                 `json:"behindBy"`
}

type GitBranchDiffFile struct {
    Path      string `json:"path"`
    Status    string `json:"status"`
    OldPath   string `json:"oldPath,omitempty"`
    Additions int    `json:"additions"`
    Deletions int    `json:"deletions"`
}

type GitHubAuth struct {
    IsAuthenticated bool   `json:"isAuthenticated"`
    Username        string `json:"username,omitempty"`
}

type GitConfig struct {
    UserName  string `json:"userName,omitempty"`
    UserEmail string `json:"userEmail,omitempty"`
}
```

## Related Code Files

**Create:**
- `internal/git/manager.go` -- Main git operations
- `internal/git/head_watcher.go` -- .git/HEAD file watcher
- `internal/git/exec_helpers.go` -- os/exec wrappers for fallback commands
- `internal/git/manager_test.go` -- Unit tests
- `pkg/types/git.go` -- Git type definitions

**Modify:**
- `app.go` -- Add ~30 git binding methods
- `go.mod` -- Add `github.com/fsnotify/fsnotify`

## Implementation Steps

1. Define all Git types in `pkg/types/git.go`
2. Create `Manager` with `openRepo()` helper
3. Implement Tier 1 operations (go-git native): status, init, addRemote, push, pull, fetch, branches, createBranch, checkoutBranch, deleteBranch, log, fileStatus, stageFile, unstageFile, stageAll, commit, discard, configGet, configSet
4. Implement Tier 2 operations (exec fallback): diff, diffBranch, diffAgainstBranch, merge, stashList, stashSave, stashApply, stashPop, stashDrop
5. Create `HeadWatcher` with fsnotify
6. Wire HeadWatcher onChange to Wails EventsEmit("git:branch-changed")
7. Add all Wails binding methods to App struct (30 methods)
8. Unit test: status on real git repo (use temp dir with `git init`)
9. Unit test: stage/commit/log cycle
10. Unit test: stash operations via exec

## Todo List

- [x] Define Git types in pkg/types/git.go
- [x] Implement go-git native operations (25 ops)
- [x] Implement exec fallback operations (13 ops)
- [x] Create HeadWatcher with fsnotify
- [x] Wire branch change events to Wails
- [x] Add 30 Wails binding methods to App
- [x] Unit tests: status/init/add/commit cycle
- [x] Unit tests: branch operations
- [x] Unit tests: stash operations (exec fallback)
- [x] Integration test: full workflow (init -> add -> commit -> branch -> merge)

## Success Criteria

1. All 38 git operations callable from frontend
2. go-git operations work without `git` binary installed
3. exec fallback operations detect missing `git` and return clear error
4. HEAD watcher emits branch change events within 500ms
5. Stash operations parse output correctly
6. Unit test coverage > 60%

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| go-git v6 API breaking changes | Low | Med | Pin version in go.mod; check release notes |
| exec fallback: git not installed | Medium | Med | Detect at startup; show warning in UI |
| Stash output format varies by git version | Low | Med | Parse defensively; test with git 2.x |
| Large repo performance (go-git) | Medium | Low | Use exec fallback for operations > 5s |
| fsnotify misses HEAD changes on some platforms | Low | Med | Debounce + periodic fallback check |

## Rollback

Delete `internal/git/` package and revert `app.go` git bindings. No persistent state.
