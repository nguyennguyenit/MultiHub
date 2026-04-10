package git

import (
	"strconv"
	"strings"

	"github.com/multihub/multihub/pkg/types"
)

func (m *Manager) statusViaExec(cwd string) (types.GitStatus, error) {
	if err := m.ensureGitRepo(cwd); err != nil {
		if isNotRepoError(err) {
			return types.GitStatus{IsRepo: false}, nil
		}
		return types.GitStatus{IsRepo: false}, err
	}

	result := types.GitStatus{IsRepo: true}
	if branch, _ := m.currentBranchViaExec(cwd); branch != "" {
		result.Branch = branch
	}
	if remoteName, remoteURL := m.remoteViaExec(cwd); remoteName != "" {
		result.HasRemote = true
		result.RemoteName = remoteName
		result.RemoteURL = remoteURL
	}

	out, err := m.execGit(cwd, "status", "--porcelain=1", "--branch")
	if err != nil {
		return result, err
	}
	for _, line := range splitNonEmptyLines(out) {
		if strings.HasPrefix(line, "## ") {
			continue
		}
		if len(line) < 2 {
			continue
		}
		x, y := line[0], line[1]
		result.IsDirty = true
		if x == '?' && y == '?' {
			result.Untracked++
			continue
		}
		if x != ' ' && x != '?' {
			result.Staged++
		}
		if y != ' ' && y != '?' {
			result.Unstaged++
		}
	}
	return result, nil
}

func (m *Manager) fileStatusViaExec(cwd string) ([]types.GitFileStatus, error) {
	if err := m.ensureGitRepo(cwd); err != nil {
		if isNotRepoError(err) {
			return nil, nil
		}
		return nil, err
	}

	out, err := m.execGit(cwd, "status", "--porcelain=1", "--renames")
	if err != nil {
		return nil, err
	}

	files := make([]types.GitFileStatus, 0)
	for _, line := range splitNonEmptyLines(out) {
		if len(line) < 4 {
			continue
		}
		x, y := line[0], line[1]
		pathPart := strings.TrimSpace(line[3:])
		path, oldPath := parseStatusPath(pathPart)
		if x == '?' && y == '?' {
			files = append(files, types.GitFileStatus{Path: path, Status: "untracked"})
			continue
		}
		label, staged := fileStatusLabelFromPorcelain(x, y)
		files = append(files, types.GitFileStatus{
			Path:    path,
			Status:  label,
			Staged:  staged,
			OldPath: oldPath,
		})
	}
	return files, nil
}

func (m *Manager) branchesViaExec(cwd string) ([]types.GitBranch, error) {
	if err := m.ensureGitRepo(cwd); err != nil {
		return nil, err
	}
	current, _ := m.currentBranchViaExec(cwd)
	branches := make([]types.GitBranch, 0)
	appendRefs := func(pattern string, remote bool) error {
		out, err := m.execGit(cwd, "for-each-ref", "--format=%(refname:short) %(objectname)", pattern)
		if err != nil {
			return err
		}
		for _, line := range splitNonEmptyLines(out) {
			parts := strings.SplitN(line, " ", 2)
			if len(parts) != 2 || strings.HasSuffix(parts[0], "/HEAD") {
				continue
			}
			branches = append(branches, types.GitBranch{
				Name:     parts[0],
				Current:  !remote && parts[0] == current,
				Commit:   parts[1],
				Label:    parts[0],
				IsRemote: remote,
			})
		}
		return nil
	}
	if err := appendRefs("refs/heads", false); err != nil {
		return nil, err
	}
	if err := appendRefs("refs/remotes", true); err != nil {
		return nil, err
	}
	return branches, nil
}

func (m *Manager) logViaExec(cwd string, maxCount int) ([]types.GitLogEntry, error) {
	if err := m.ensureGitRepo(cwd); err != nil {
		return nil, err
	}
	if maxCount <= 0 {
		maxCount = 50
	}
	out, err := m.execGit(cwd, "log", "-n", strconv.Itoa(maxCount), "--format=%H%x1f%h%x1f%an%x1f%ae%x1f%aI%x1f%s")
	if err != nil {
		return nil, err
	}
	entries := make([]types.GitLogEntry, 0)
	for _, line := range splitNonEmptyLines(out) {
		parts := strings.SplitN(line, "\x1f", 6)
		if len(parts) != 6 {
			continue
		}
		entries = append(entries, types.GitLogEntry{
			Hash:      parts[0],
			HashShort: parts[1],
			Author:    parts[2],
			Email:     parts[3],
			Date:      parts[4],
			Message:   parts[5],
		})
	}
	return entries, nil
}

func (m *Manager) resolveDiffBaseBranch(cwd, requested string) (string, error) {
	candidates := make([]string, 0, 12)
	seen := map[string]struct{}{}
	addCandidate := func(ref string) {
		ref = strings.TrimSpace(ref)
		if ref == "" {
			return
		}
		if _, ok := seen[ref]; ok {
			return
		}
		seen[ref] = struct{}{}
		candidates = append(candidates, ref)
	}

	current, _ := m.currentBranchViaExec(cwd)
	addCandidate(requested)
	if remoteHead, err := m.execGit(cwd, "symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"); err == nil {
		addCandidate(strings.TrimSpace(remoteHead))
		addCandidate(strings.TrimPrefix(strings.TrimSpace(remoteHead), "origin/"))
	}
	for _, ref := range []string{"main", "master", "trunk", "develop"} {
		addCandidate(ref)
		addCandidate("origin/" + ref)
	}
	if out, err := m.execGit(cwd, "for-each-ref", "--format=%(refname:short)", "refs/heads", "refs/remotes"); err == nil {
		for _, ref := range splitNonEmptyLines(out) {
			if strings.HasSuffix(ref, "/HEAD") || ref == current {
				continue
			}
			addCandidate(ref)
			if strings.HasPrefix(ref, "origin/") {
				addCandidate(strings.TrimPrefix(ref, "origin/"))
			}
		}
	}
	addCandidate(current)

	for _, ref := range candidates {
		if !m.refExists(cwd, ref) {
			continue
		}
		if strings.HasPrefix(ref, "origin/") {
			localRef := strings.TrimPrefix(ref, "origin/")
			if m.refExists(cwd, localRef) {
				return localRef, nil
			}
		}
		return ref, nil
	}
	return "", nil
}

func (m *Manager) ensureGitRepo(cwd string) error {
	_, err := m.execGit(cwd, "rev-parse", "--is-inside-work-tree")
	return err
}

func (m *Manager) currentBranchViaExec(cwd string) (string, error) {
	out, err := m.execGit(cwd, "symbolic-ref", "--quiet", "--short", "HEAD")
	return strings.TrimSpace(out), err
}

func (m *Manager) remoteViaExec(cwd string) (string, string) {
	out, err := m.execGit(cwd, "remote")
	if err != nil {
		return "", ""
	}
	names := splitNonEmptyLines(out)
	if len(names) == 0 {
		return "", ""
	}
	url, err := m.execGit(cwd, "remote", "get-url", names[0])
	if err != nil {
		return names[0], ""
	}
	return names[0], strings.TrimSpace(url)
}

func (m *Manager) refExists(cwd, ref string) bool {
	_, err := m.execGit(cwd, "rev-parse", "--verify", "--quiet", ref+"^{commit}")
	return err == nil
}

func fileStatusLabelFromPorcelain(staged, worktree byte) (string, bool) {
	switch staged {
	case 'A':
		return "added", true
	case 'M':
		return "staged", true
	case 'D':
		return "deleted", true
	case 'R':
		return "renamed", true
	case 'C':
		return "copied", true
	}
	switch worktree {
	case 'M':
		return "modified", false
	case 'D':
		return "deleted", false
	}
	return "modified", false
}

func parseStatusPath(pathPart string) (string, string) {
	if idx := strings.Index(pathPart, " -> "); idx >= 0 {
		return unquoteGitPath(pathPart[idx+4:]), unquoteGitPath(pathPart[:idx])
	}
	return unquoteGitPath(pathPart), ""
}

func unquoteGitPath(path string) string {
	path = strings.TrimSpace(path)
	if unquoted, err := strconv.Unquote(path); err == nil {
		return unquoted
	}
	return path
}

func splitNonEmptyLines(out string) []string {
	lines := strings.Split(strings.TrimSpace(out), "\n")
	if len(lines) == 1 && lines[0] == "" {
		return nil
	}
	return lines
}

func isNotRepoError(err error) bool {
	msg := err.Error()
	return strings.Contains(msg, "not a git repository") || strings.Contains(msg, "does not appear to be a git repository")
}
