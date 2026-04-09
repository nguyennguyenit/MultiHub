package types

type GitStatus struct {
	Branch     string   `json:"branch"`
	Ahead      int      `json:"ahead"`
	Behind     int      `json:"behind"`
	Modified   []string `json:"modified"`
	Staged     []string `json:"staged"`
	Untracked  []string `json:"untracked"`
	HasChanges bool     `json:"hasChanges"`
}

type GitCommit struct {
	Hash      string `json:"hash"`
	ShortHash string `json:"shortHash"`
	Message   string `json:"message"`
	Author    string `json:"author"`
	Timestamp int64  `json:"timestamp"`
}

type GitRemote struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}
