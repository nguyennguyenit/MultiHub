package project

import (
	"os"
	"path/filepath"
)

// FolderStatus describes the state of a filesystem directory.
type FolderStatus struct {
	Exists    bool `json:"exists"`
	IsEmpty   bool `json:"isEmpty"`
	IsGitRepo bool `json:"isGitRepo"`
	FileCount int  `json:"fileCount"`
}

// CheckFolder inspects the directory at cwd and returns its status.
func CheckFolder(cwd string) (FolderStatus, error) {
	info, err := os.Stat(cwd)
	if err != nil || !info.IsDir() {
		return FolderStatus{Exists: false}, nil
	}
	entries, _ := os.ReadDir(cwd)
	_, gitErr := os.Stat(filepath.Join(cwd, ".git"))
	return FolderStatus{
		Exists:    true,
		IsEmpty:   len(entries) == 0,
		IsGitRepo: gitErr == nil,
		FileCount: len(entries),
	}, nil
}
