package git

import (
	"fmt"
	"os/exec"
	"strconv"
	"strings"

	"github.com/multihub/multihub/pkg/types"
)

// execGit runs a git command in the given directory and returns stdout.
func (m *Manager) execGit(cwd string, args ...string) (string, error) {
	cmd := exec.Command("git", args...)
	cmd.Dir = cwd
	out, err := cmd.Output()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return "", fmt.Errorf("%s", strings.TrimSpace(string(exitErr.Stderr)))
		}
		return "", err
	}
	return string(out), nil
}

// execGitOK runs git and wraps the result in a GitOperationResult.
func (m *Manager) execGitOK(cwd string, args ...string) types.GitOperationResult {
	_, err := m.execGit(cwd, args...)
	if err != nil {
		return types.GitOperationResult{Success: false, Error: err.Error()}
	}
	return types.GitOperationResult{Success: true}
}

// ── Staging / Commit ──────────────────────────────────────────────────────────

// StageFile stages a specific file.
func (m *Manager) StageFile(cwd, file string) error {
	_, err := m.execGit(cwd, "add", "--", file)
	return err
}

// UnstageFile removes a file from the staging area.
func (m *Manager) UnstageFile(cwd, file string) error {
	_, err := m.execGit(cwd, "restore", "--staged", "--", file)
	return err
}

// StageAll stages all tracked and new files.
func (m *Manager) StageAll(cwd string) error {
	_, err := m.execGit(cwd, "add", "-A")
	return err
}

// Commit creates a commit with the given message. Returns hash on success.
func (m *Manager) Commit(cwd, message string) types.GitCommitResult {
	_, err := m.execGit(cwd, "commit", "-m", message)
	if err != nil {
		return types.GitCommitResult{Success: false, Error: err.Error()}
	}
	hash, _ := m.execGit(cwd, "rev-parse", "HEAD")
	return types.GitCommitResult{Success: true, Hash: strings.TrimSpace(hash)}
}

// Discard discards working-tree changes to a specific file.
func (m *Manager) Discard(cwd, file string) error {
	_, err := m.execGit(cwd, "restore", "--", file)
	return err
}

// ── Remotes / Network ─────────────────────────────────────────────────────────

// AddRemote adds a remote URL.
func (m *Manager) AddRemote(cwd, name, url string) error {
	_, err := m.execGit(cwd, "remote", "add", name, url)
	return err
}

// Push pushes to the remote branch. setUpstream adds -u flag.
func (m *Manager) Push(cwd, branch string, setUpstream bool) error {
	args := []string{"push"}
	if setUpstream {
		args = append(args, "-u", "origin", branch)
	}
	_, err := m.execGit(cwd, args...)
	return err
}

// Pull pulls from the current tracking branch.
func (m *Manager) Pull(cwd string) error {
	_, err := m.execGit(cwd, "pull")
	return err
}

// Fetch fetches from all remotes.
func (m *Manager) Fetch(cwd string) error {
	_, err := m.execGit(cwd, "fetch", "--all")
	return err
}

// ── Branches ──────────────────────────────────────────────────────────────────

// CreateBranch creates a branch, optionally checking it out.
func (m *Manager) CreateBranch(cwd, name string, checkout bool) error {
	if checkout {
		_, err := m.execGit(cwd, "checkout", "-b", name)
		return err
	}
	_, err := m.execGit(cwd, "branch", name)
	return err
}

// CheckoutBranch checks out an existing branch.
func (m *Manager) CheckoutBranch(cwd, name string) error {
	_, err := m.execGit(cwd, "checkout", name)
	return err
}

// DeleteBranch deletes a branch.
func (m *Manager) DeleteBranch(cwd, name string, force bool) error {
	flag := "-d"
	if force {
		flag = "-D"
	}
	_, err := m.execGit(cwd, "branch", flag, name)
	return err
}

// Merge merges the given branch into the current branch.
func (m *Manager) Merge(cwd, branch string) error {
	_, err := m.execGit(cwd, "merge", branch)
	return err
}

// ── Diff ──────────────────────────────────────────────────────────────────────

// Diff returns the diff for a file, optionally staged.
func (m *Manager) Diff(cwd, file string, staged bool, oldFile string) types.GitDiffResult {
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
		return types.GitDiffResult{Success: false, Error: err.Error()}
	}
	return types.GitDiffResult{Success: true, Diff: out}
}

// DiffBranch returns stat-level diff between HEAD and the given base branch.
func (m *Manager) DiffBranch(cwd, baseBranch string) (types.GitBranchDiff, error) {
	resolvedBase, err := m.resolveDiffBaseBranch(cwd, baseBranch)
	result := types.GitBranchDiff{BaseBranch: resolvedBase}
	if err != nil {
		return result, err
	}
	if resolvedBase == "" {
		return result, nil
	}

	out, err := m.execGit(cwd, "diff", resolvedBase+"...HEAD", "--name-status")
	if err != nil {
		return result, err
	}
	for _, line := range strings.Split(strings.TrimSpace(out), "\n") {
		if line == "" {
			continue
		}
		parts := strings.Split(line, "\t")
		if len(parts) < 2 {
			continue
		}
		f := types.GitBranchDiffFile{Status: mapDiffStatus(parts[0]), Path: unquoteGitPath(parts[1])}
		if strings.HasPrefix(parts[0], "R") && len(parts) >= 3 {
			f.OldPath = unquoteGitPath(parts[1])
			f.Path = unquoteGitPath(parts[2])
		}
		result.Files = append(result.Files, f)
	}
	// ahead/behind
	ab, _ := m.execGit(cwd, "rev-list", "--left-right", "--count", resolvedBase+"...HEAD")
	fields := strings.Fields(strings.TrimSpace(ab))
	if len(fields) == 2 {
		result.BehindBy, _ = strconv.Atoi(fields[0])
		result.AheadBy, _ = strconv.Atoi(fields[1])
	}
	return result, nil
}

// DiffAgainstBranch returns the diff of a specific file against a branch.
func (m *Manager) DiffAgainstBranch(cwd, branch, file string) types.GitDiffResult {
	resolvedBase, err := m.resolveDiffBaseBranch(cwd, branch)
	if err != nil {
		return types.GitDiffResult{Success: false, Error: err.Error()}
	}
	if resolvedBase == "" {
		return types.GitDiffResult{Success: true, Diff: ""}
	}

	out, err := m.execGit(cwd, "diff", resolvedBase+"...HEAD", "--", file)
	if err != nil {
		return types.GitDiffResult{Success: false, Error: err.Error()}
	}
	return types.GitDiffResult{Success: true, Diff: out}
}

// ── Stash ─────────────────────────────────────────────────────────────────────

// StashList returns all stash entries.
func (m *Manager) StashList(cwd string) ([]types.GitStashEntry, error) {
	out, err := m.execGit(cwd, "stash", "list", "--format=%H\x1f%gs\x1f%ci")
	if err != nil {
		return nil, err
	}
	var entries []types.GitStashEntry
	for i, line := range strings.Split(strings.TrimSpace(out), "\n") {
		if line == "" {
			continue
		}
		parts := strings.SplitN(line, "\x1f", 3)
		if len(parts) < 3 {
			continue
		}
		msg := parts[1]
		// strip "On branch: " or "WIP on branch: " prefix
		if idx := strings.Index(msg, ": "); idx >= 0 {
			msg = msg[idx+2:]
		}
		entries = append(entries, types.GitStashEntry{
			Index:   i,
			Hash:    parts[0],
			Message: msg,
			Date:    parts[2],
		})
	}
	return entries, nil
}

// StashSave creates a new stash entry.
func (m *Manager) StashSave(cwd, message string) error {
	args := []string{"stash", "push"}
	if message != "" {
		args = append(args, "-m", message)
	}
	_, err := m.execGit(cwd, args...)
	return err
}

// StashApply applies a stash entry by index without removing it.
func (m *Manager) StashApply(cwd string, index int) error {
	_, err := m.execGit(cwd, "stash", "apply", fmt.Sprintf("stash@{%d}", index))
	return err
}

// StashPop applies and removes a stash entry by index.
func (m *Manager) StashPop(cwd string, index int) error {
	_, err := m.execGit(cwd, "stash", "pop", fmt.Sprintf("stash@{%d}", index))
	return err
}

// StashDrop removes a stash entry by index.
func (m *Manager) StashDrop(cwd string, index int) error {
	_, err := m.execGit(cwd, "stash", "drop", fmt.Sprintf("stash@{%d}", index))
	return err
}

// ── Config ────────────────────────────────────────────────────────────────────

// ConfigGet returns the global git user config.
func (m *Manager) ConfigGet() (types.GitConfig, error) {
	name, _ := m.execGit("", "config", "--global", "user.name")
	email, _ := m.execGit("", "config", "--global", "user.email")
	return types.GitConfig{
		UserName:  strings.TrimSpace(name),
		UserEmail: strings.TrimSpace(email),
	}, nil
}

// ConfigSet updates the global git user config.
func (m *Manager) ConfigSet(cfg types.GitConfig) error {
	if cfg.UserName != "" {
		if _, err := m.execGit("", "config", "--global", "user.name", cfg.UserName); err != nil {
			return err
		}
	}
	if cfg.UserEmail != "" {
		if _, err := m.execGit("", "config", "--global", "user.email", cfg.UserEmail); err != nil {
			return err
		}
	}
	return nil
}

// mapDiffStatus converts a git diff status letter to a label.
func mapDiffStatus(s string) string {
	switch {
	case strings.HasPrefix(s, "A"):
		return "added"
	case strings.HasPrefix(s, "M"):
		return "modified"
	case strings.HasPrefix(s, "D"):
		return "deleted"
	case strings.HasPrefix(s, "R"):
		return "renamed"
	}
	return "modified"
}
