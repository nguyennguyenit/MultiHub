package types

// GitStatus summarizes the state of a git working directory.
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

// GitFileStatus describes the state of a single file in the working tree.
type GitFileStatus struct {
	Path      string `json:"path"`
	Status    string `json:"status"` // added|staged|modified|untracked|deleted|renamed|copied
	Staged    bool   `json:"staged"`
	OldPath   string `json:"oldPath,omitempty"`
	Additions int    `json:"additions,omitempty"`
	Deletions int    `json:"deletions,omitempty"`
}

// GitBranch describes a local or remote branch.
type GitBranch struct {
	Name     string `json:"name"`
	Current  bool   `json:"current"`
	Commit   string `json:"commit"`
	Label    string `json:"label"`
	IsRemote bool   `json:"isRemote"`
}

// GitLogEntry is a single commit log entry.
type GitLogEntry struct {
	Hash      string `json:"hash"`
	HashShort string `json:"hashShort"`
	Author    string `json:"author"`
	Email     string `json:"email"`
	Date      string `json:"date"`
	Message   string `json:"message"`
}

// GitStashEntry is a single stash entry.
type GitStashEntry struct {
	Index   int    `json:"index"`
	Hash    string `json:"hash"`
	Message string `json:"message"`
	Date    string `json:"date"`
}

// GitOperationResult is a generic success/error result for git operations.
type GitOperationResult struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
}

// GitCommitResult is the result of a commit operation.
type GitCommitResult struct {
	Success bool   `json:"success"`
	Hash    string `json:"hash,omitempty"`
	Error   string `json:"error,omitempty"`
}

// GitDiffResult holds the diff output for a file.
type GitDiffResult struct {
	Success bool   `json:"success"`
	Diff    string `json:"diff,omitempty"`
	Error   string `json:"error,omitempty"`
}

// GitBranchDiff summarizes the difference between the current branch and a base branch.
type GitBranchDiff struct {
	BaseBranch string              `json:"baseBranch"`
	Files      []GitBranchDiffFile `json:"files"`
	AheadBy    int                 `json:"aheadBy"`
	BehindBy   int                 `json:"behindBy"`
}

// GitBranchDiffFile describes a file's changes between branches.
type GitBranchDiffFile struct {
	Path      string `json:"path"`
	Status    string `json:"status"`
	OldPath   string `json:"oldPath,omitempty"`
	Additions int    `json:"additions"`
	Deletions int    `json:"deletions"`
}

// GitHubAuth describes GitHub authentication state.
type GitHubAuth struct {
	IsAuthenticated bool   `json:"isAuthenticated"`
	Username        string `json:"username,omitempty"`
	Hostname        string `json:"hostname,omitempty"`
}

// GitConfig holds global git user configuration.
type GitConfig struct {
	UserName  string `json:"userName,omitempty"`
	UserEmail string `json:"userEmail,omitempty"`
}
