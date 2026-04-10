package main

// ── Git bindings (stub – real impl in Phase 06) ──────────────────────────────

// GitStatus returns the git status for the given directory.
func (a *App) GitStatus(cwd string) (interface{}, error) { return nil, nil }

// GitInit initializes a new git repository.
func (a *App) GitInit(cwd string) error { return nil }

// GitAddRemote adds a remote to the repository.
func (a *App) GitAddRemote(cwd, url, name string) error { return nil }

// GitPush pushes to the remote branch.
func (a *App) GitPush(cwd, branch string, setUpstream bool) error { return nil }

// GitFileStatus returns the per-file status for the working tree.
func (a *App) GitFileStatus(cwd string) (interface{}, error) { return nil, nil }

// GitStageFile stages a specific file.
func (a *App) GitStageFile(cwd, file string) error { return nil }

// GitUnstageFile unstages a specific file.
func (a *App) GitUnstageFile(cwd, file string) error { return nil }

// GitStageAll stages all modified files.
func (a *App) GitStageAll(cwd string) error { return nil }

// GitCommit creates a commit with the given message.
func (a *App) GitCommit(cwd, msg string) (interface{}, error) { return nil, nil }

// GitDiff returns the diff for the given file.
func (a *App) GitDiff(cwd, file string, staged bool, oldPath string) (interface{}, error) {
	return nil, nil
}

// GitDiscard discards changes to a file.
func (a *App) GitDiscard(cwd, file string) error { return nil }

// GitPull pulls changes from the remote.
func (a *App) GitPull(cwd string) error { return nil }

// GitFetch fetches changes from the remote without merging.
func (a *App) GitFetch(cwd string) error { return nil }

// GitBranches returns all branches in the repository.
func (a *App) GitBranches(cwd string) (interface{}, error) { return nil, nil }

// GitCreateBranch creates a new branch, optionally checking it out.
func (a *App) GitCreateBranch(cwd, name string, checkout bool) error { return nil }

// GitCheckoutBranch checks out an existing branch.
func (a *App) GitCheckoutBranch(cwd, name string) error { return nil }

// GitDeleteBranch deletes a branch, optionally with force.
func (a *App) GitDeleteBranch(cwd, name string, force bool) error { return nil }

// GitMerge merges the given branch into the current branch.
func (a *App) GitMerge(cwd, branch string) error { return nil }

// GitLog returns recent commit log entries.
func (a *App) GitLog(cwd string, max int) (interface{}, error) { return nil, nil }

// GitStashList returns all stash entries.
func (a *App) GitStashList(cwd string) (interface{}, error) { return nil, nil }

// GitStashSave creates a new stash with the given message.
func (a *App) GitStashSave(cwd, msg string) error { return nil }

// GitStashApply applies a stash entry by index.
func (a *App) GitStashApply(cwd string, index int) error { return nil }

// GitStashPop applies and removes a stash entry by index.
func (a *App) GitStashPop(cwd string, index int) error { return nil }

// GitStashDrop removes a stash entry by index.
func (a *App) GitStashDrop(cwd string, index int) error { return nil }

// GitConfigGet returns the global git config (user.name, user.email).
func (a *App) GitConfigGet() (interface{}, error) { return nil, nil }

// GitConfigSet updates the global git config.
func (a *App) GitConfigSet(cfg map[string]interface{}) error { return nil }

// GitDiffBranch returns the diff between HEAD and the given branch.
func (a *App) GitDiffBranch(cwd, branch string) (interface{}, error) { return nil, nil }

// GitDiffAgainstBranch returns the diff of a file against the given branch.
func (a *App) GitDiffAgainstBranch(cwd, branch, file string) (interface{}, error) {
	return nil, nil
}

// GitWatchProject starts watching a project directory for git changes.
func (a *App) GitWatchProject(path string) error { return nil }

// GitUnwatchProject stops watching a project directory.
func (a *App) GitUnwatchProject(path string) error { return nil }
