---
phase: "09"
title: "GitHub Integration"
status: pending
effort: 6h
risk: Low
depends_on: ["06"]
---

# Phase 09: GitHub Integration

**Priority:** P3
**Status:** Pending

## Context Links
- Source: `src/main/ipc/github-handlers.ts` (~60 lines)
- Source: `src/renderer/components/github-view/` (8 components)
- Source: `src/renderer/components/github-setup/` (3 components)

## Overview

Port GitHub integration using `gh` CLI wrapper. Source already uses `gh` CLI for all GitHub operations (auth, repo creation, issues/PRs listing). Go port wraps `os/exec` calls to `gh` binary.

## Key Insights

- Source uses `gh` CLI (not GitHub API directly) -- simplifies porting
- Auth flow: `gh auth status` / `gh auth login --web` / `gh auth logout`
- Repo creation: `gh repo create --public/--private`
- Issues/PRs: `gh issue list --json ...` / `gh pr list --json ...`
- All operations are stateless exec calls -- no persistent connection
- `gh` must be installed; graceful error if missing

## Architecture

```go
// internal/github/client.go
package github

import (
    "encoding/json"
    "fmt"
    "os/exec"
    "strings"

    "github.com/<org>/multihub/pkg/types"
)

type Client struct{}

func NewClient() *Client { return &Client{} }

func (c *Client) AuthStatus() (types.GitHubAuth, error) {
    out, err := c.exec("auth", "status", "--hostname", "github.com")
    if err != nil {
        return types.GitHubAuth{IsAuthenticated: false}, nil
    }
    // Parse "Logged in to github.com account USERNAME"
    username := parseUsername(out)
    return types.GitHubAuth{
        IsAuthenticated: true,
        Username:        username,
    }, nil
}

func (c *Client) Login() (map[string]interface{}, error) {
    // gh auth login --web triggers browser OAuth flow
    cmd := exec.Command("gh", "auth", "login", "--web", "--hostname", "github.com")
    out, err := cmd.CombinedOutput()
    if err != nil {
        return map[string]interface{}{"success": false}, nil
    }
    // Parse device code if present
    code := parseDeviceCode(string(out))
    return map[string]interface{}{
        "success":    true,
        "deviceCode": code,
    }, nil
}

func (c *Client) Logout() (types.GitOperationResult, error) {
    _, err := c.exec("auth", "logout", "--hostname", "github.com")
    if err != nil {
        return types.GitOperationResult{Success: false, Error: err.Error()}, nil
    }
    return types.GitOperationResult{Success: true}, nil
}

func (c *Client) CreateRepo(name string, isPrivate bool, cwd string) (map[string]interface{}, error) {
    visibility := "--public"
    if isPrivate {
        visibility = "--private"
    }
    args := []string{"repo", "create", name, visibility, "--source", "."}
    if cwd != "" {
        args = append(args, "--source", cwd)
    }
    out, err := c.exec(args...)
    if err != nil {
        return map[string]interface{}{"success": false, "error": err.Error()}, nil
    }
    url := strings.TrimSpace(out)
    return map[string]interface{}{"success": true, "url": url}, nil
}

func (c *Client) ListIssues(projectPath, state string) (map[string]interface{}, error) {
    args := []string{"issue", "list",
        "--state", state,
        "--json", "number,title,state,createdAt,author,labels,body",
        "--limit", "50",
    }
    out, err := c.execInDir(projectPath, args...)
    if err != nil {
        return map[string]interface{}{"success": false, "data": []interface{}{}, "error": err.Error()}, nil
    }
    var issues []types.GitHubIssue
    json.Unmarshal([]byte(out), &issues)
    return map[string]interface{}{"success": true, "data": issues}, nil
}

func (c *Client) ListPRs(projectPath, state string) (map[string]interface{}, error) {
    args := []string{"pr", "list",
        "--state", state,
        "--json", "number,title,state,createdAt,author,headRefName,mergeable",
        "--limit", "50",
    }
    out, err := c.execInDir(projectPath, args...)
    if err != nil {
        return map[string]interface{}{"success": false, "data": []interface{}{}, "error": err.Error()}, nil
    }
    var prs []types.GitHubPR
    json.Unmarshal([]byte(out), &prs)
    return map[string]interface{}{"success": true, "data": prs}, nil
}

func (c *Client) exec(args ...string) (string, error) {
    cmd := exec.Command("gh", args...)
    out, err := cmd.Output()
    if err != nil {
        if exitErr, ok := err.(*exec.ExitError); ok {
            return "", fmt.Errorf("gh %s: %s", args[0], string(exitErr.Stderr))
        }
        return "", err
    }
    return string(out), nil
}

func (c *Client) execInDir(dir string, args ...string) (string, error) {
    cmd := exec.Command("gh", args...)
    cmd.Dir = dir
    out, err := cmd.Output()
    if err != nil {
        if exitErr, ok := err.(*exec.ExitError); ok {
            return "", fmt.Errorf("gh %s: %s", args[0], string(exitErr.Stderr))
        }
        return "", err
    }
    return string(out), nil
}
```

## Wails Bindings

```go
// app.go additions
func (a *App) GitHubAuthStatus() (types.GitHubAuth, error) { return a.githubClient.AuthStatus() }
func (a *App) GitHubLogin() (map[string]interface{}, error) { return a.githubClient.Login() }
func (a *App) GitHubLogout() (types.GitOperationResult, error) { return a.githubClient.Logout() }
func (a *App) GitHubCreateRepo(name string, isPrivate bool, cwd string) (map[string]interface{}, error) {
    return a.githubClient.CreateRepo(name, isPrivate, cwd)
}
func (a *App) GitHubListIssues(projectPath, state string) (map[string]interface{}, error) {
    return a.githubClient.ListIssues(projectPath, state)
}
func (a *App) GitHubListPRs(projectPath, state string) (map[string]interface{}, error) {
    return a.githubClient.ListPRs(projectPath, state)
}
```

## Related Code Files

**Create:**
- `internal/github/client.go`
- `internal/github/parser.go` (output parsing helpers)
- `internal/github/client_test.go`

**Modify:**
- `app.go` -- Add 6 GitHub binding methods

## Implementation Steps

1. Create GitHub client with exec wrapper
2. Implement auth status/login/logout
3. Implement repo creation
4. Implement issues list with JSON parsing
5. Implement PRs list with JSON parsing
6. Add gh availability check at startup
7. Add Wails bindings
8. Unit tests with mock exec (or skip if gh not installed)

## Todo List

- [ ] Create GitHub client with exec wrapper
- [ ] Implement auth operations (status/login/logout)
- [ ] Implement repo creation
- [ ] Implement issues listing (JSON parsing)
- [ ] Implement PRs listing (JSON parsing)
- [ ] Add gh availability detection
- [ ] Add 6 Wails binding methods
- [ ] Unit tests (mock or skip-if-no-gh)

## Success Criteria

1. Auth status correctly reports logged-in/logged-out state
2. Login opens browser for OAuth flow
3. Issues/PRs list returns properly typed data matching frontend expectations
4. Missing `gh` CLI returns graceful error, not crash
5. JSON parsing handles all GitHub API fields

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| gh CLI not installed | Medium | Med | Detect at startup; show install instructions in UI |
| gh output format changes | Low | Low | Pin to gh 2.x; parse defensively |
| OAuth flow blocked by browser | Low | Low | Show device code fallback |

## Rollback

Delete `internal/github/`. Revert `app.go` bindings. No persistent state.
