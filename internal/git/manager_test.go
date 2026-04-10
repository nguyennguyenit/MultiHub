package git

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

// hasGit checks whether the git binary is available.
func hasGit() bool {
	_, err := exec.LookPath("git")
	return err == nil
}

// initRepo creates a temp dir with a bare git repo and initial commit.
func initRepo(t *testing.T) string {
	t.Helper()
	dir, err := os.MkdirTemp("", "multihub-git-*")
	if err != nil {
		t.Fatalf("TempDir: %v", err)
	}
	t.Cleanup(func() { os.RemoveAll(dir) })

	run := func(args ...string) {
		cmd := exec.Command("git", args...)
		cmd.Dir = dir
		if out, err := cmd.CombinedOutput(); err != nil {
			t.Fatalf("git %v: %v\n%s", args, err, out)
		}
	}
	run("init")
	run("config", "user.email", "test@test.com")
	run("config", "user.name", "Test User")
	// initial commit so HEAD resolves
	f := filepath.Join(dir, "README.md")
	os.WriteFile(f, []byte("# test\n"), 0644)
	run("add", "README.md")
	run("commit", "-m", "init")
	return dir
}

// ── Status ────────────────────────────────────────────────────────────────────

func TestManager_Status_IsRepo(t *testing.T) {
	if !hasGit() {
		t.Skip("git not installed")
	}
	dir := initRepo(t)
	m := NewManager()
	status, err := m.Status(dir)
	if err != nil {
		t.Fatalf("Status: %v", err)
	}
	if !status.IsRepo {
		t.Error("should be a git repo")
	}
	if status.Branch == "" {
		t.Error("branch should not be empty")
	}
}

func TestManager_Status_NotRepo(t *testing.T) {
	dir, _ := os.MkdirTemp("", "notgit-*")
	defer os.RemoveAll(dir)
	m := NewManager()
	status, err := m.Status(dir)
	if err != nil {
		t.Fatalf("Status on non-repo: %v", err)
	}
	if status.IsRepo {
		t.Error("should NOT be a git repo")
	}
}

// ── Init ─────────────────────────────────────────────────────────────────────

func TestManager_Init(t *testing.T) {
	dir, _ := os.MkdirTemp("", "gitinit-*")
	defer os.RemoveAll(dir)
	m := NewManager()
	if err := m.Init(dir); err != nil {
		t.Fatalf("Init: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dir, ".git")); err != nil {
		t.Error(".git directory should exist after init")
	}
}

// ── Stage / Commit / Log ──────────────────────────────────────────────────────

func TestManager_StageCommitLog(t *testing.T) {
	if !hasGit() {
		t.Skip("git not installed")
	}
	dir := initRepo(t)
	m := NewManager()

	// Write a file and stage it
	os.WriteFile(filepath.Join(dir, "hello.txt"), []byte("hello"), 0644)
	if err := m.StageFile(dir, "hello.txt"); err != nil {
		t.Fatalf("StageFile: %v", err)
	}

	// Commit
	result := m.Commit(dir, "add hello.txt")
	if !result.Success {
		t.Fatalf("Commit failed: %s", result.Error)
	}
	if len(result.Hash) != 40 {
		t.Errorf("expected 40-char hash, got %q", result.Hash)
	}

	// Log should have at least 2 entries
	entries, err := m.Log(dir, 10)
	if err != nil {
		t.Fatalf("Log: %v", err)
	}
	if len(entries) < 2 {
		t.Errorf("expected >=2 log entries, got %d", len(entries))
	}
	if len(entries[0].HashShort) != 7 {
		t.Errorf("expected 7-char short hash, got %q", entries[0].HashShort)
	}
}

// ── FileStatus ────────────────────────────────────────────────────────────────

func TestManager_FileStatus(t *testing.T) {
	if !hasGit() {
		t.Skip("git not installed")
	}
	dir := initRepo(t)
	m := NewManager()

	// Create an untracked file
	os.WriteFile(filepath.Join(dir, "new.txt"), []byte("new"), 0644)
	files, err := m.FileStatus(dir)
	if err != nil {
		t.Fatalf("FileStatus: %v", err)
	}
	found := false
	for _, f := range files {
		if f.Path == "new.txt" && f.Status == "untracked" {
			found = true
		}
	}
	if !found {
		t.Errorf("expected untracked 'new.txt' in file status: %+v", files)
	}
}

// ── Branches ─────────────────────────────────────────────────────────────────

func TestManager_Branches(t *testing.T) {
	if !hasGit() {
		t.Skip("git not installed")
	}
	dir := initRepo(t)
	m := NewManager()

	branches, err := m.Branches(dir)
	if err != nil {
		t.Fatalf("Branches: %v", err)
	}
	if len(branches) == 0 {
		t.Fatal("expected at least one branch")
	}
	hasCurrent := false
	for _, b := range branches {
		if b.Current {
			hasCurrent = true
		}
	}
	if !hasCurrent {
		t.Error("expected one branch to be marked as current")
	}
}

func TestManager_CreateCheckoutDeleteBranch(t *testing.T) {
	if !hasGit() {
		t.Skip("git not installed")
	}
	dir := initRepo(t)
	m := NewManager()

	// Create without checkout
	if err := m.CreateBranch(dir, "feature-x", false); err != nil {
		t.Fatalf("CreateBranch: %v", err)
	}

	// Checkout
	if err := m.CheckoutBranch(dir, "feature-x"); err != nil {
		t.Fatalf("CheckoutBranch: %v", err)
	}

	// Status should show feature-x branch
	status, _ := m.Status(dir)
	if status.Branch != "feature-x" {
		t.Errorf("expected branch 'feature-x', got %q", status.Branch)
	}

	// Return to default and delete
	m.CheckoutBranch(dir, "master")
	if err := m.DeleteBranch(dir, "feature-x", false); err != nil {
		// try main
		m.CheckoutBranch(dir, "main")
		m.DeleteBranch(dir, "feature-x", false)
	}
}

// ── Diff ─────────────────────────────────────────────────────────────────────

func TestManager_Diff(t *testing.T) {
	if !hasGit() {
		t.Skip("git not installed")
	}
	dir := initRepo(t)
	m := NewManager()

	// Modify README
	os.WriteFile(filepath.Join(dir, "README.md"), []byte("# modified\n"), 0644)
	result := m.Diff(dir, "README.md", false, "")
	if !result.Success {
		t.Fatalf("Diff failed: %s", result.Error)
	}
	if !strings.Contains(result.Diff, "@@") {
		t.Errorf("expected unified diff markers in output: %q", result.Diff)
	}
}

// ── Stash ─────────────────────────────────────────────────────────────────────

func TestManager_Stash(t *testing.T) {
	if !hasGit() {
		t.Skip("git not installed")
	}
	dir := initRepo(t)
	m := NewManager()

	// Empty stash list
	entries, err := m.StashList(dir)
	if err != nil {
		t.Fatalf("StashList: %v", err)
	}
	if len(entries) != 0 {
		t.Errorf("expected empty stash list, got %d entries", len(entries))
	}

	// Modify a file and stash
	os.WriteFile(filepath.Join(dir, "README.md"), []byte("# stashed\n"), 0644)
	if err := m.StashSave(dir, "my stash"); err != nil {
		t.Fatalf("StashSave: %v", err)
	}

	entries, err = m.StashList(dir)
	if err != nil {
		t.Fatalf("StashList after save: %v", err)
	}
	if len(entries) != 1 {
		t.Errorf("expected 1 stash entry, got %d", len(entries))
	}
	if entries[0].Message != "my stash" {
		t.Errorf("unexpected stash message: %q", entries[0].Message)
	}

	// Pop the stash
	if err := m.StashPop(dir, 0); err != nil {
		t.Fatalf("StashPop: %v", err)
	}

	entries, _ = m.StashList(dir)
	if len(entries) != 0 {
		t.Errorf("expected empty stash list after pop, got %d", len(entries))
	}
}

// ── Config ────────────────────────────────────────────────────────────────────

func TestManager_ConfigGet(t *testing.T) {
	if !hasGit() {
		t.Skip("git not installed")
	}
	m := NewManager()
	cfg, err := m.ConfigGet()
	if err != nil {
		t.Fatalf("ConfigGet: %v", err)
	}
	// Just check it doesn't error; values depend on the system's git config
	_ = cfg
}

// ── HeadWatcher ───────────────────────────────────────────────────────────────

func TestHeadWatcher_Watch(t *testing.T) {
	if !hasGit() {
		t.Skip("git not installed")
	}
	dir := initRepo(t)
	called := make(chan string, 1)
	hw := NewHeadWatcher(func(p string) { called <- p })
	defer hw.Destroy()

	if err := hw.Watch(dir); err != nil {
		t.Fatalf("Watch: %v", err)
	}
	// Watching the same path twice should be a no-op
	if err := hw.Watch(dir); err != nil {
		t.Fatalf("second Watch: %v", err)
	}
	hw.Unwatch(dir)
}
