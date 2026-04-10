package project

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func tempDir(t *testing.T) string {
	t.Helper()
	dir, err := os.MkdirTemp("", "multihub-project-*")
	if err != nil {
		t.Fatalf("tempDir: %v", err)
	}
	t.Cleanup(func() { os.RemoveAll(dir) })
	return dir
}

// ── Store ─────────────────────────────────────────────────────────────────────

func TestStore_CRUD(t *testing.T) {
	dir := tempDir(t)
	s, err := NewStore(dir)
	if err != nil {
		t.Fatalf("NewStore: %v", err)
	}

	// Create
	p, err := s.Create("MyProject", "/tmp/myproject")
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if p.ID == "" {
		t.Error("ID must not be empty")
	}
	if !strings.HasPrefix(p.ID, "proj-") {
		t.Errorf("ID format wrong: %s", p.ID)
	}

	// List
	list := s.List()
	if len(list) != 1 {
		t.Fatalf("expected 1 project, got %d", len(list))
	}

	// Update
	updated, err := s.Update(p.ID, map[string]interface{}{"name": "Renamed"})
	if err != nil {
		t.Fatalf("Update: %v", err)
	}
	if updated.Name != "Renamed" {
		t.Errorf("expected 'Renamed', got %q", updated.Name)
	}

	// SetActive
	if err := s.SetActive(p.ID); err != nil {
		t.Fatalf("SetActive: %v", err)
	}
	if s.GetActive() != p.ID {
		t.Error("active ID not set")
	}

	// Delete
	if err := s.Delete(p.ID); err != nil {
		t.Fatalf("Delete: %v", err)
	}
	if len(s.List()) != 0 {
		t.Error("project list should be empty after delete")
	}
	// activeID cleared after deleting the active project
	if s.GetActive() != "" {
		t.Error("activeID should be cleared after deleting active project")
	}
}

func TestStore_Persistence(t *testing.T) {
	dir := tempDir(t)

	s1, _ := NewStore(dir)
	p, _ := s1.Create("Persist", "/tmp/persist")
	_ = s1.SetActive(p.ID)

	// Reload from same directory
	s2, err := NewStore(dir)
	if err != nil {
		t.Fatalf("second NewStore: %v", err)
	}
	list := s2.List()
	if len(list) != 1 || list[0].Name != "Persist" {
		t.Errorf("persistence failed: %+v", list)
	}
	if s2.GetActive() != p.ID {
		t.Error("activeID not persisted")
	}
}

func TestStore_CorruptJSON(t *testing.T) {
	dir := tempDir(t)
	// Write corrupt JSON
	_ = os.WriteFile(filepath.Join(dir, "projects.json"), []byte("{corrupt"), 0600)

	s, err := NewStore(dir)
	if err != nil {
		t.Fatalf("NewStore with corrupt file should not return error: %v", err)
	}
	// Should start fresh
	if len(s.List()) != 0 {
		t.Error("corrupt file should result in empty store")
	}
}

func TestStore_AtomicWrite(t *testing.T) {
	dir := tempDir(t)
	s, _ := NewStore(dir)
	s.Create("A", "/a")
	s.Create("B", "/b")

	// No .tmp file should remain after successful writes
	tmp := filepath.Join(dir, "projects.json.tmp")
	if _, err := os.Stat(tmp); err == nil {
		t.Error(".tmp file should not exist after successful write")
	}

	// Main file should exist
	if _, err := os.Stat(filepath.Join(dir, "projects.json")); err != nil {
		t.Error("projects.json should exist after write")
	}
}

// ── SessionStore ──────────────────────────────────────────────────────────────

func TestSessionStore_SaveRestore(t *testing.T) {
	dir := tempDir(t)
	ss, err := NewSessionStore(dir)
	if err != nil {
		t.Fatalf("NewSessionStore: %v", err)
	}

	session := AppSession{ActiveTerminalID: "term-1"}
	if err := ss.Save(session); err != nil {
		t.Fatalf("Save: %v", err)
	}

	got, err := ss.Restore()
	if err != nil {
		t.Fatalf("Restore: %v", err)
	}
	if got == nil {
		t.Fatal("expected non-nil session")
	}
	if got.ActiveTerminalID != "term-1" {
		t.Errorf("expected term-1, got %q", got.ActiveTerminalID)
	}
}

func TestSessionStore_NoSessionReturnsNil(t *testing.T) {
	dir := tempDir(t)
	ss, _ := NewSessionStore(dir)
	got, err := ss.Restore()
	if err != nil {
		t.Fatalf("Restore on empty store: %v", err)
	}
	if got != nil {
		t.Error("expected nil when no session file exists")
	}
}

func TestSessionStore_CorruptSessionReturnsNil(t *testing.T) {
	dir := tempDir(t)
	ss, _ := NewSessionStore(dir)
	_ = os.WriteFile(filepath.Join(dir, "session.json"), []byte("not-json"), 0600)
	got, err := ss.Restore()
	if err != nil {
		t.Fatalf("unexpected error on corrupt session: %v", err)
	}
	if got != nil {
		t.Error("corrupt session should return nil")
	}
}

// ── FolderCheck ───────────────────────────────────────────────────────────────

func TestCheckFolder_Exists(t *testing.T) {
	dir := tempDir(t)
	status, err := CheckFolder(dir)
	if err != nil {
		t.Fatalf("CheckFolder: %v", err)
	}
	if !status.Exists {
		t.Error("should exist")
	}
	if !status.IsEmpty {
		t.Error("freshly created dir should be empty")
	}
}

func TestCheckFolder_GitRepo(t *testing.T) {
	dir := tempDir(t)
	_ = os.MkdirAll(filepath.Join(dir, ".git"), 0750)
	status, _ := CheckFolder(dir)
	if !status.IsGitRepo {
		t.Error("should detect .git directory")
	}
}

func TestCheckFolder_NonExistent(t *testing.T) {
	status, err := CheckFolder("/this/path/does/not/exist/42")
	if err != nil {
		t.Fatalf("CheckFolder: %v", err)
	}
	if status.Exists {
		t.Error("non-existent path should not exist")
	}
}

// ── ID generation ─────────────────────────────────────────────────────────────

func TestGenerateID_Format(t *testing.T) {
	id := generateID()
	if !strings.HasPrefix(id, "proj-") {
		t.Errorf("ID should start with 'proj-': %s", id)
	}
	parts := strings.Split(id, "-")
	if len(parts) != 3 {
		t.Errorf("ID should have 3 parts: %s", id)
	}
}

func TestGenerateID_Unique(t *testing.T) {
	ids := make(map[string]struct{})
	for i := 0; i < 100; i++ {
		id := generateID()
		if _, dup := ids[id]; dup {
			t.Errorf("duplicate ID generated: %s", id)
		}
		ids[id] = struct{}{}
	}
}
