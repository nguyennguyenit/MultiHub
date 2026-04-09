package terminal

import (
	"strings"

	"github.com/multihub/multihub/pkg/types"
)

// agentPatterns maps CLI binary names to their agent type.
var agentPatterns = map[string]types.AgentType{
	"claude": types.AgentClaude,
	"codex":  types.AgentCodex,
	"gemini": types.AgentGemini,
	"aider":  types.AgentAider,
}

// ProcessInputForAgentDetection watches keystroke input for known AI agent CLI binaries.
// Should be called on every Write() before the agent type is known.
// Returns non-nil AgentType pointer when a new agent is detected; nil otherwise.
//
// Input tracking rules:
//   - Printable chars appended to InputBuffer
//   - Backspace/DEL removes last char
//   - Enter (\r or \n) evaluates the buffered command
//   - Buffer capped at inputBufMax to prevent unbounded growth
func (p *PTYProcess) ProcessInputForAgentDetection(data string) *types.AgentType {
	if p.Metadata.AgentType != "" {
		return nil // already detected, skip processing
	}

	for _, ch := range data {
		switch {
		case ch == '\r' || ch == '\n':
			// Command submitted — evaluate buffered input.
			command := strings.TrimSpace(string(p.InputBuffer))
			p.InputBuffer = p.InputBuffer[:0]
			if command == "" {
				continue
			}
			binary := strings.ToLower(strings.Fields(command)[0])
			if agentType, ok := agentPatterns[binary]; ok {
				p.Metadata.AgentType = agentType
				return &agentType
			}

		case ch == '\u007f' || ch == '\b':
			// Backspace / DEL — remove last byte.
			if len(p.InputBuffer) > 0 {
				p.InputBuffer = p.InputBuffer[:len(p.InputBuffer)-1]
			}

		case ch >= ' ' || ch == '\t':
			// Printable character.
			p.InputBuffer = append(p.InputBuffer, byte(ch))
			if len(p.InputBuffer) > inputBufMax {
				p.InputBuffer = p.InputBuffer[len(p.InputBuffer)-inputBufMax:]
			}
		}
	}
	return nil
}
