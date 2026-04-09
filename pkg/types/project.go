package types

import "time"

type Project struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Path         string    `json:"path"`
	GitRemote    string    `json:"gitRemote,omitempty"`
	SkipGitSetup bool      `json:"skipGitSetup,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}
