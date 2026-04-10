package types

// GitHubIssue represents a GitHub issue returned by `gh issue list --json`.
type GitHubIssue struct {
	Number    int          `json:"number"`
	Title     string       `json:"title"`
	State     string       `json:"state"`
	CreatedAt string       `json:"createdAt"`
	Author    GitHubActor  `json:"author"`
	Labels    []GitHubLabel `json:"labels"`
	Body      string       `json:"body"`
}

// GitHubPR represents a GitHub pull request returned by `gh pr list --json`.
type GitHubPR struct {
	Number      int        `json:"number"`
	Title       string     `json:"title"`
	State       string     `json:"state"`
	CreatedAt   string     `json:"createdAt"`
	Author      GitHubActor `json:"author"`
	HeadRefName string     `json:"headRefName"`
	Mergeable   string     `json:"mergeable"`
}

// GitHubActor is an abbreviated GitHub user (login only).
type GitHubActor struct {
	Login string `json:"login"`
}

// GitHubLabel is a GitHub issue/PR label.
type GitHubLabel struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}
