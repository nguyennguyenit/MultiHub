package terminal

import (
	"fmt"
	"testing"
	"time"

	"github.com/multihub/multihub/pkg/types"
)

// ── Agent detection tests ─────────────────────────────────────────────────────

func newTestProcess(id string) *PTYProcess {
	return &PTYProcess{
		ID:       id,
		Metadata: types.Terminal{ID: id},
	}
}

func TestAgentDetection_KnownAgents(t *testing.T) {
	tests := []struct {
		name     string
		input    []string
		wantType types.AgentType
	}{
		{"claude direct", []string{"claude\r"}, types.AgentClaude},
		{"claude with args", []string{"claude --continue\r"}, types.AgentClaude},
		{"codex", []string{"codex\r"}, types.AgentCodex},
		{"gemini", []string{"gemini\r"}, types.AgentGemini},
		{"aider", []string{"aider\r"}, types.AgentAider},
		{"CLAUDE uppercase", []string{"CLAUDE\r"}, types.AgentClaude},
		{"multiline: type then enter", []string{"cla", "ude", "\r"}, types.AgentClaude},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			p := newTestProcess("test")
			var detected *types.AgentType
			for _, chunk := range tc.input {
				detected = p.ProcessInputForAgentDetection(chunk)
			}
			if detected == nil {
				t.Fatalf("expected %q to be detected, got nil", tc.wantType)
			}
			if *detected != tc.wantType {
				t.Errorf("got %q, want %q", *detected, tc.wantType)
			}
			if p.Metadata.AgentType != tc.wantType {
				t.Errorf("Metadata.AgentType = %q, want %q", p.Metadata.AgentType, tc.wantType)
			}
		})
	}
}

func TestAgentDetection_UnknownCommand(t *testing.T) {
	p := newTestProcess("test")
	result := p.ProcessInputForAgentDetection("ls -la\r")
	if result != nil {
		t.Errorf("expected nil for unknown command, got %q", *result)
	}
	if p.Metadata.AgentType != "" {
		t.Errorf("expected empty AgentType, got %q", p.Metadata.AgentType)
	}
}

func TestAgentDetection_OnlyOnce(t *testing.T) {
	p := newTestProcess("test")
	p.ProcessInputForAgentDetection("claude\r")
	// Second call should return nil even for another agent.
	result := p.ProcessInputForAgentDetection("codex\r")
	if result != nil {
		t.Error("expected nil on second detection (already set)")
	}
	if p.Metadata.AgentType != types.AgentClaude {
		t.Errorf("AgentType should still be claude, got %q", p.Metadata.AgentType)
	}
}

func TestAgentDetection_Backspace(t *testing.T) {
	p := newTestProcess("test")
	// Type "codex", erase last char, correct to "claude"
	p.ProcessInputForAgentDetection("codex")
	p.ProcessInputForAgentDetection("\u007f\u007f\u007f\u007f\u007f") // erase all
	result := p.ProcessInputForAgentDetection("claude\r")
	if result == nil || *result != types.AgentClaude {
		t.Errorf("expected claude after backspace correction, got %v", result)
	}
}

func TestAgentDetection_InputBufferCap(t *testing.T) {
	p := newTestProcess("test")
	// Fill buffer beyond inputBufMax with junk.
	junk := make([]byte, inputBufMax*3)
	for i := range junk {
		junk[i] = 'x'
	}
	p.ProcessInputForAgentDetection(string(junk))
	if len(p.InputBuffer) > inputBufMax {
		t.Errorf("InputBuffer len %d exceeds cap %d", len(p.InputBuffer), inputBufMax)
	}
}

// ── OSC title parsing tests ───────────────────────────────────────────────────

func TestOscParser_BasicTitle(t *testing.T) {
	p := newTestProcess("test")
	p.Metadata.AllowTitleUpdate = true

	title := p.ParseOscTitle("\x1b]0;My Terminal\x07")
	if title != "My Terminal" {
		t.Errorf("got %q, want %q", title, "My Terminal")
	}
	if p.Metadata.Title != "My Terminal" {
		t.Errorf("Metadata.Title = %q, want %q", p.Metadata.Title, "My Terminal")
	}
}

func TestOscParser_StringTerminator(t *testing.T) {
	p := newTestProcess("test")
	p.Metadata.AllowTitleUpdate = true
	title := p.ParseOscTitle("\x1b]2;Fish shell\x1b\\")
	if title != "Fish shell" {
		t.Errorf("got %q, want %q", title, "Fish shell")
	}
}

func TestOscParser_DisabledWhenAllowFalse(t *testing.T) {
	p := newTestProcess("test")
	p.Metadata.AllowTitleUpdate = false
	title := p.ParseOscTitle("\x1b]0;Should Be Ignored\x07")
	if title != "" {
		t.Errorf("expected empty title when AllowTitleUpdate=false, got %q", title)
	}
}

func TestOscParser_SameTitle(t *testing.T) {
	p := newTestProcess("test")
	p.Metadata.AllowTitleUpdate = true
	p.Metadata.Title = "same"
	title := p.ParseOscTitle("\x1b]0;same\x07")
	if title != "" {
		t.Errorf("expected empty string when title unchanged, got %q", title)
	}
}

func TestOscParser_SpanningChunks(t *testing.T) {
	p := newTestProcess("test")
	p.Metadata.AllowTitleUpdate = true
	// Send incomplete sequence first.
	p.ParseOscTitle("\x1b]0;Spann")
	// Complete it in the next chunk.
	title := p.ParseOscTitle("ing Title\x07")
	if title != "Spanning Title" {
		t.Errorf("got %q, want %q", title, "Spanning Title")
	}
}

func TestOscParser_MultipleSequences(t *testing.T) {
	p := newTestProcess("test")
	p.Metadata.AllowTitleUpdate = true
	// Two OSC sequences in one chunk — should return the last distinct title.
	title := p.ParseOscTitle("\x1b]0;First\x07\x1b]0;Second\x07")
	if title != "Second" {
		t.Errorf("got %q, want %q", title, "Second")
	}
}

// ── Ghost cache tests ─────────────────────────────────────────────────────────

func newTestManager() *Manager {
	return &Manager{
		terminals:       make(map[string]*PTYProcess),
		exitedTerminals: make(map[string]ghostEntry),
	}
}

func TestGhostCache_AddAndRetrieve(t *testing.T) {
	m := newTestManager()
	session := types.TerminalSession{ID: "t1", Title: "Test"}

	m.mu.Lock()
	m.addGhost("t1", session)
	m.mu.Unlock()

	result := m.GetExitedSession("t1")
	if result == nil {
		t.Fatal("expected ghost session, got nil")
	}
	if result.ID != "t1" {
		t.Errorf("got ID %q, want %q", result.ID, "t1")
	}
}

func TestGhostCache_TTLEviction(t *testing.T) {
	m := newTestManager()
	session := types.TerminalSession{ID: "t1"}

	m.mu.Lock()
	// Add with already-expired TTL.
	m.exitedTerminals["t1"] = ghostEntry{
		session:   session,
		expiresAt: time.Now().Add(-time.Hour),
	}
	// Adding a new entry should evict the expired one.
	m.addGhost("t2", types.TerminalSession{ID: "t2"})
	m.mu.Unlock()

	if m.GetExitedSession("t1") != nil {
		t.Error("expired ghost t1 should have been evicted")
	}
	if m.GetExitedSession("t2") == nil {
		t.Error("ghost t2 should still exist")
	}
}

func TestGhostCache_MaxSize(t *testing.T) {
	m := newTestManager()

	// Fill cache to max.
	m.mu.Lock()
	for i := 0; i < ghostCacheMax; i++ {
		id := fmt.Sprintf("t%d", i)
		m.exitedTerminals[id] = ghostEntry{
			session:   types.TerminalSession{ID: id},
			expiresAt: time.Now().Add(ghostCacheTTL),
		}
	}
	// One more should evict the oldest.
	m.addGhost("overflow", types.TerminalSession{ID: "overflow"})
	m.mu.Unlock()

	if len(m.exitedTerminals) > ghostCacheMax {
		t.Errorf("ghost cache size %d exceeds max %d", len(m.exitedTerminals), ghostCacheMax)
	}
	if m.GetExitedSession("overflow") == nil {
		t.Error("overflow entry should be in cache")
	}
}

// ── Shell resolver test ───────────────────────────────────────────────────────

func TestResolveDefaultShell_NotEmpty(t *testing.T) {
	shell := ResolveDefaultShell()
	if shell == "" {
		t.Error("ResolveDefaultShell returned empty string")
	}
}

