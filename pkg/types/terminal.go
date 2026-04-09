package types

import "time"

type AgentType string

const (
	AgentClaude  AgentType = "claude"
	AgentCodex   AgentType = "codex"
	AgentGemini  AgentType = "gemini"
	AgentAider   AgentType = "aider"
	AgentGeneric AgentType = "generic"
)

type Terminal struct {
	ID               string    `json:"id"`
	Title            string    `json:"title"`
	Cwd              string    `json:"cwd"`
	IsClaudeMode     bool      `json:"isClaudeMode"`
	ClaudeSessionID  string    `json:"claudeSessionId,omitempty"`
	ProjectID        string    `json:"projectId,omitempty"`
	CreatedAt        time.Time `json:"createdAt"`
	AllowTitleUpdate bool      `json:"allowTitleUpdate"`
	AgentType        AgentType `json:"agentType,omitempty"`
}

type TerminalSession struct {
	ID              string `json:"id"`
	Title           string `json:"title"`
	Cwd             string `json:"cwd"`
	ProjectID       string `json:"projectId,omitempty"`
	ClaudeSessionID string `json:"claudeSessionId,omitempty"`
	OutputBuffer    string `json:"outputBuffer"`
	LastOutputAt    int64  `json:"lastOutputAt,omitempty"`
	ExitedAt        int64  `json:"exitedAt,omitempty"`
}
