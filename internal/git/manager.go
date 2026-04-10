// Package git provides git operations via go-git with exec fallback.
package git

import (
	gogit "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/multihub/multihub/pkg/types"
)

// Manager provides all git operations for the application.
type Manager struct{}

// NewManager creates a new Manager instance.
func NewManager() *Manager { return &Manager{} }

// openRepo opens a git repository at the given path.
func (m *Manager) openRepo(cwd string) (*gogit.Repository, error) {
	return gogit.PlainOpen(cwd)
}

// Status returns a summary of the working tree state.
func (m *Manager) Status(cwd string) (types.GitStatus, error) {
	repo, err := m.openRepo(cwd)
	if err != nil {
		return m.statusViaExec(cwd)
	}
	wt, err := repo.Worktree()
	if err != nil {
		return m.statusViaExec(cwd)
	}
	status, err := wt.Status()
	if err != nil {
		return m.statusViaExec(cwd)
	}

	result := types.GitStatus{IsRepo: true, IsDirty: !status.IsClean()}
	for _, fs := range status {
		if fs.Staging != gogit.Unmodified && fs.Staging != gogit.Untracked {
			result.Staged++
		}
		if fs.Worktree != gogit.Unmodified && fs.Worktree != gogit.Untracked {
			result.Unstaged++
		}
		if fs.Worktree == gogit.Untracked {
			result.Untracked++
		}
	}

	if head, err := repo.Head(); err == nil {
		result.Branch = head.Name().Short()
	}
	if remotes, _ := repo.Remotes(); len(remotes) > 0 {
		result.HasRemote = true
		cfg := remotes[0].Config()
		result.RemoteName = cfg.Name
		if len(cfg.URLs) > 0 {
			result.RemoteURL = cfg.URLs[0]
		}
	}
	return result, nil
}

// FileStatus returns per-file status for all changed/untracked files.
func (m *Manager) FileStatus(cwd string) ([]types.GitFileStatus, error) {
	repo, err := m.openRepo(cwd)
	if err != nil {
		return m.fileStatusViaExec(cwd)
	}
	wt, err := repo.Worktree()
	if err != nil {
		return m.fileStatusViaExec(cwd)
	}
	status, err := wt.Status()
	if err != nil {
		return m.fileStatusViaExec(cwd)
	}

	var files []types.GitFileStatus
	for path, fs := range status {
		if fs.Staging == gogit.Unmodified && fs.Worktree == gogit.Unmodified {
			continue
		}
		label, staged := fileStatusLabel(fs.Staging, fs.Worktree)
		files = append(files, types.GitFileStatus{
			Path:   path,
			Status: label,
			Staged: staged,
		})
	}
	return files, nil
}

// Init initializes a new git repository at the given path.
func (m *Manager) Init(cwd string) error {
	_, err := gogit.PlainInit(cwd, false)
	return err
}

// Branches returns all local and remote branches.
func (m *Manager) Branches(cwd string) ([]types.GitBranch, error) {
	repo, err := m.openRepo(cwd)
	if err != nil {
		return m.branchesViaExec(cwd)
	}
	head, _ := repo.Head()
	currentBranch := ""
	if head != nil {
		currentBranch = head.Name().Short()
	}

	var branches []types.GitBranch
	branchIter, err := repo.Branches()
	if err != nil {
		return m.branchesViaExec(cwd)
	}
	_ = branchIter.ForEach(func(ref *plumbing.Reference) error {
		name := ref.Name().Short()
		commit := ""
		if c, err := repo.CommitObject(ref.Hash()); err == nil {
			commit = c.Hash.String()
		}
		branches = append(branches, types.GitBranch{
			Name:    name,
			Current: name == currentBranch,
			Commit:  commit,
			Label:   name,
		})
		return nil
	})

	// Remote branches
	refIter, _ := repo.References()
	_ = refIter.ForEach(func(ref *plumbing.Reference) error {
		if ref.Name().IsRemote() {
			name := ref.Name().Short()
			commit := ref.Hash().String()
			branches = append(branches, types.GitBranch{
				Name:     name,
				IsRemote: true,
				Commit:   commit,
				Label:    name,
			})
		}
		return nil
	})
	return branches, nil
}

// Log returns up to maxCount recent commit log entries.
func (m *Manager) Log(cwd string, maxCount int) ([]types.GitLogEntry, error) {
	repo, err := m.openRepo(cwd)
	if err != nil {
		return m.logViaExec(cwd, maxCount)
	}
	if maxCount <= 0 {
		maxCount = 50
	}
	logIter, err := repo.Log(&gogit.LogOptions{Order: gogit.LogOrderCommitterTime})
	if err != nil {
		return m.logViaExec(cwd, maxCount)
	}

	var entries []types.GitLogEntry
	count := 0
	_ = logIter.ForEach(func(c *object.Commit) error {
		if count >= maxCount {
			return object.ErrCanceled
		}
		entries = append(entries, types.GitLogEntry{
			Hash:      c.Hash.String(),
			HashShort: c.Hash.String()[:7],
			Author:    c.Author.Name,
			Email:     c.Author.Email,
			Date:      c.Author.When.Format("2006-01-02T15:04:05Z07:00"),
			Message:   c.Message,
		})
		count++
		return nil
	})
	return entries, nil
}

// fileStatusLabel converts go-git staging/worktree status codes to a string label.
func fileStatusLabel(staging, worktree gogit.StatusCode) (string, bool) {
	switch staging {
	case gogit.Added:
		return "added", true
	case gogit.Modified:
		return "staged", true
	case gogit.Deleted:
		return "deleted", true
	case gogit.Renamed:
		return "renamed", true
	case gogit.Copied:
		return "copied", true
	}
	switch worktree {
	case gogit.Modified:
		return "modified", false
	case gogit.Untracked:
		return "untracked", false
	case gogit.Deleted:
		return "deleted", false
	}
	return "modified", false
}
