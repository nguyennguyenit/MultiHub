// Package github provides GitHub integration via the gh CLI.
package github

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"

	"github.com/multihub/multihub/pkg/types"
)

// Client wraps the gh CLI binary for GitHub operations.
// All operations are stateless exec calls; gh manages auth tokens.
type Client struct{}

// NewClient returns a GitHub client. Call Available() to check whether gh is installed.
func NewClient() *Client { return &Client{} }

// Available returns true if the gh binary is present in PATH.
func (c *Client) Available() bool {
	_, err := exec.LookPath("gh")
	return err == nil
}

// AuthStatus reports current GitHub CLI authentication state.
func (c *Client) AuthStatus() (types.GitHubAuth, error) {
	out, err := c.run("auth", "status", "--hostname", "github.com")
	if err != nil {
		return types.GitHubAuth{IsAuthenticated: false}, nil
	}
	return types.GitHubAuth{
		IsAuthenticated: true,
		Username:        parseUsername(out),
		Hostname:        "github.com",
	}, nil
}

// Login initiates the GitHub OAuth web flow and returns the device code (if any).
func (c *Client) Login() (map[string]interface{}, error) {
	cmd := exec.Command("gh", "auth", "login", "--web", "--hostname", "github.com")
	out, err := cmd.CombinedOutput()
	if err != nil {
		return map[string]interface{}{"success": false, "error": err.Error()}, nil
	}
	return map[string]interface{}{
		"success":    true,
		"deviceCode": parseDeviceCode(string(out)),
	}, nil
}

// Logout signs out of GitHub.
func (c *Client) Logout() (types.GitOperationResult, error) {
	_, err := c.run("auth", "logout", "--hostname", "github.com")
	if err != nil {
		return types.GitOperationResult{Success: false, Error: err.Error()}, nil
	}
	return types.GitOperationResult{Success: true}, nil
}

// CreateRepo creates a new GitHub repository and returns its URL.
func (c *Client) CreateRepo(name string, isPrivate bool, cwd string) (map[string]interface{}, error) {
	vis := "--public"
	if isPrivate {
		vis = "--private"
	}
	args := []string{"repo", "create", name, vis}
	if cwd != "" {
		args = append(args, "--source", cwd)
	}
	out, err := c.run(args...)
	if err != nil {
		return map[string]interface{}{"success": false, "error": err.Error()}, nil
	}
	return map[string]interface{}{"success": true, "url": strings.TrimSpace(out)}, nil
}

// ListIssues returns open issues for the repo at projectPath.
func (c *Client) ListIssues(projectPath, state string) (map[string]interface{}, error) {
	if state == "" {
		state = "open"
	}
	out, err := c.runInDir(projectPath, "issue", "list",
		"--state", state,
		"--json", "number,title,state,createdAt,author,labels,body",
		"--limit", "50",
	)
	if err != nil {
		return map[string]interface{}{"success": false, "data": []interface{}{}, "error": err.Error()}, nil
	}
	var issues []types.GitHubIssue
	_ = json.Unmarshal([]byte(out), &issues)
	return map[string]interface{}{"success": true, "data": issues}, nil
}

// ListPRs returns pull requests for the repo at projectPath.
func (c *Client) ListPRs(projectPath, state string) (map[string]interface{}, error) {
	if state == "" {
		state = "open"
	}
	out, err := c.runInDir(projectPath, "pr", "list",
		"--state", state,
		"--json", "number,title,state,createdAt,author,headRefName,mergeable",
		"--limit", "50",
	)
	if err != nil {
		return map[string]interface{}{"success": false, "data": []interface{}{}, "error": err.Error()}, nil
	}
	var prs []types.GitHubPR
	_ = json.Unmarshal([]byte(out), &prs)
	return map[string]interface{}{"success": true, "data": prs}, nil
}

// ── Internal helpers ──────────────────────────────────────────────────────────

func (c *Client) run(args ...string) (string, error) {
	cmd := exec.Command("gh", args...)
	out, err := cmd.Output()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return "", fmt.Errorf("gh %s: %s", args[0], strings.TrimSpace(string(exitErr.Stderr)))
		}
		return "", err
	}
	return string(out), nil
}

func (c *Client) runInDir(dir string, args ...string) (string, error) {
	cmd := exec.Command("gh", args...)
	cmd.Dir = dir
	out, err := cmd.Output()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return "", fmt.Errorf("gh %s: %s", args[0], strings.TrimSpace(string(exitErr.Stderr)))
		}
		return "", err
	}
	return string(out), nil
}
