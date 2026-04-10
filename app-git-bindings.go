package main

import (
	"github.com/multihub/multihub/pkg/types"
)

// ── Git bindings ──────────────────────────────────────────────────────────────

// GitStatus returns the git status for the given directory.
func (a *App) GitStatus(cwd string) (types.GitStatus, error) {
	return a.gitMgr.Status(cwd)
}

// GitInit initializes a new git repository.
func (a *App) GitInit(cwd string) error {
	return a.gitMgr.Init(cwd)
}

// GitAddRemote adds a remote to the repository.
func (a *App) GitAddRemote(cwd, url, name string) error {
	return a.gitMgr.AddRemote(cwd, name, url)
}

// GitPush pushes to the remote branch.
func (a *App) GitPush(cwd, branch string, setUpstream bool) error {
	return a.gitMgr.Push(cwd, branch, setUpstream)
}

// GitFileStatus returns the per-file status for the working tree.
func (a *App) GitFileStatus(cwd string) ([]types.GitFileStatus, error) {
	return a.gitMgr.FileStatus(cwd)
}

// GitStageFile stages a specific file.
func (a *App) GitStageFile(cwd, file string) error {
	return a.gitMgr.StageFile(cwd, file)
}

// GitUnstageFile unstages a specific file.
func (a *App) GitUnstageFile(cwd, file string) error {
	return a.gitMgr.UnstageFile(cwd, file)
}

// GitStageAll stages all modified files.
func (a *App) GitStageAll(cwd string) error {
	return a.gitMgr.StageAll(cwd)
}

// GitCommit creates a commit with the given message.
func (a *App) GitCommit(cwd, msg string) types.GitCommitResult {
	return a.gitMgr.Commit(cwd, msg)
}

// GitDiff returns the diff for the given file.
func (a *App) GitDiff(cwd, file string, staged bool, oldPath string) types.GitDiffResult {
	return a.gitMgr.Diff(cwd, file, staged, oldPath)
}

// GitDiscard discards changes to a file.
func (a *App) GitDiscard(cwd, file string) error {
	return a.gitMgr.Discard(cwd, file)
}

// GitPull pulls changes from the remote.
func (a *App) GitPull(cwd string) error {
	return a.gitMgr.Pull(cwd)
}

// GitFetch fetches changes from the remote without merging.
func (a *App) GitFetch(cwd string) error {
	return a.gitMgr.Fetch(cwd)
}

// GitBranches returns all branches in the repository.
func (a *App) GitBranches(cwd string) ([]types.GitBranch, error) {
	return a.gitMgr.Branches(cwd)
}

// GitCreateBranch creates a new branch, optionally checking it out.
func (a *App) GitCreateBranch(cwd, name string, checkout bool) error {
	return a.gitMgr.CreateBranch(cwd, name, checkout)
}

// GitCheckoutBranch checks out an existing branch.
func (a *App) GitCheckoutBranch(cwd, name string) error {
	return a.gitMgr.CheckoutBranch(cwd, name)
}

// GitDeleteBranch deletes a branch, optionally with force.
func (a *App) GitDeleteBranch(cwd, name string, force bool) error {
	return a.gitMgr.DeleteBranch(cwd, name, force)
}

// GitMerge merges the given branch into the current branch.
func (a *App) GitMerge(cwd, branch string) error {
	return a.gitMgr.Merge(cwd, branch)
}

// GitLog returns recent commit log entries.
func (a *App) GitLog(cwd string, max int) ([]types.GitLogEntry, error) {
	return a.gitMgr.Log(cwd, max)
}

// GitStashList returns all stash entries.
func (a *App) GitStashList(cwd string) ([]types.GitStashEntry, error) {
	return a.gitMgr.StashList(cwd)
}

// GitStashSave creates a new stash with the given message.
func (a *App) GitStashSave(cwd, msg string) error {
	return a.gitMgr.StashSave(cwd, msg)
}

// GitStashApply applies a stash entry by index.
func (a *App) GitStashApply(cwd string, index int) error {
	return a.gitMgr.StashApply(cwd, index)
}

// GitStashPop applies and removes a stash entry by index.
func (a *App) GitStashPop(cwd string, index int) error {
	return a.gitMgr.StashPop(cwd, index)
}

// GitStashDrop removes a stash entry by index.
func (a *App) GitStashDrop(cwd string, index int) error {
	return a.gitMgr.StashDrop(cwd, index)
}

// GitConfigGet returns the global git config (user.name, user.email).
func (a *App) GitConfigGet() (types.GitConfig, error) {
	return a.gitMgr.ConfigGet()
}

// GitConfigSet updates the global git config.
func (a *App) GitConfigSet(cfg map[string]interface{}) error {
	name, _ := cfg["userName"].(string)
	email, _ := cfg["userEmail"].(string)
	return a.gitMgr.ConfigSet(types.GitConfig{UserName: name, UserEmail: email})
}

// GitDiffBranch returns the diff between HEAD and the given branch.
func (a *App) GitDiffBranch(cwd, branch string) (types.GitBranchDiff, error) {
	return a.gitMgr.DiffBranch(cwd, branch)
}

// GitDiffAgainstBranch returns the diff of a file against the given branch.
func (a *App) GitDiffAgainstBranch(cwd, branch, file string) types.GitDiffResult {
	return a.gitMgr.DiffAgainstBranch(cwd, branch, file)
}

// GitWatchProject starts watching a project directory for git branch changes.
func (a *App) GitWatchProject(path string) error {
	return a.headWatcher.Watch(path)
}

// GitUnwatchProject stops watching a project directory.
func (a *App) GitUnwatchProject(path string) error {
	a.headWatcher.Unwatch(path)
	return nil
}
