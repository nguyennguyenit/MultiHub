---
phase: "03"
title: "Terminal Management Backend"
status: completed
effort: 12h
risk: Medium
depends_on: ["02"]
---

# Phase 03: Terminal Management Backend

**Priority:** P1 -- Core functionality
**Status:** Completed

## Context Links
- Source: `src/main/terminal/terminal-manager.ts` (610 lines)
- Source: `src/main/terminal/wsl-detector.ts` (100 lines)
- Phase 02 PTY prototype

## Overview

Full Go port of `TerminalManager` class. Manages multiple PTY processes with lifecycle, output buffering, OSC title parsing, agent detection, system suspend/resume, and ghost terminal cache.

## Key Insights

- Source TerminalManager is an EventEmitter with 7 event types
- Ghost cache preserves exited terminal state for notification button lookups (50 max, 30min TTL)
- Agent detection watches keystroke input for known CLI binaries (claude, codex, gemini, aider)
- OSC title parsing extracts `\x1b]0;title\x07` sequences from PTY output
- System suspend/resume guards prevent SIGTRAP on invalid file descriptors
- Output buffer capped at 1MB with trim-to-500KB strategy

## Requirements

### Functional
- Create/destroy terminals with configurable shell and CWD
- Write input and resize PTY
- Stream output to frontend via Wails events
- Parse OSC sequences for title changes
- Detect agent type from input commands
- Track Claude session IDs
- Ghost cache for exited terminals
- System suspend/resume handling
- Async destroy with graceful exit + force kill
- Session state export for persistence

### Non-Functional
- Thread-safe: concurrent terminal operations from multiple goroutines
- Max terminals: configurable limit (2/4/9/custom)
- Memory: output buffer per terminal capped at 1MB

## Architecture

```go
// internal/terminal/manager.go -- public API surface

type Manager struct {
    ctx              context.Context
    mu               sync.RWMutex
    terminals        map[string]*PTYProcess
    exitedTerminals  map[string]*types.TerminalSession // ghost cache
    nextTerminalNum  int
    systemSuspended  bool
    
    // Event callbacks (replaces EventEmitter)
    onOutput         func(terminalID, data string)
    onExit           func(terminalID string, exitCode int)
    onTitleChange    func(terminalID, title string)
    onStateChange    func(terminalID string, isClaudeMode bool)
    onCreated        func(terminal types.Terminal)
    onAgentDetected  func(terminalID string, agentType types.AgentType)
    onResumed        func(terminalID string)
}

// Methods exposed via Wails bindings (through App struct)
func (m *Manager) Create(opts CreateOptions) (types.Terminal, error)
func (m *Manager) Destroy(id string) bool
func (m *Manager) DestroyAsync(id string) bool
func (m *Manager) DestroyAll()
func (m *Manager) Write(id string, data string) bool
func (m *Manager) Resize(id string, cols, rows int) bool
func (m *Manager) List() []types.Terminal
func (m *Manager) Get(id string) *types.Terminal
func (m *Manager) InvokeClaudeCode(id string, sessionID string) bool
func (m *Manager) GetSessions() []types.TerminalSession
func (m *Manager) GetExitedSession(id string) *types.TerminalSession
func (m *Manager) HandleSuspend()
func (m *Manager) HandleResume()
```

### Event Mapping (Electron EventEmitter -> Go callbacks)

| Source Event | Go Callback | Wails Event Name |
|-------------|-------------|------------------|
| `output` | `onOutput` | `pty:output:{id}` |
| `exit` | `onExit` | `terminal:exit` |
| `titleChange` | `onTitleChange` | `terminal:title-change` |
| `stateChange` | `onStateChange` | `terminal:state-change` |
| `created` | `onCreated` | `terminal:created` |
| `agentDetected` | `onAgentDetected` | `terminal:agent-detected` |
| `terminal-resumed` | `onResumed` | `system:terminal-resumed` |

### PTYProcess Enhancement (from Phase 02)

Add to the Phase 02 `PTYProcess`:

```go
type PTYProcess struct {
    // ... Phase 02 fields ...
    Metadata        types.Terminal
    OutputBuffer    []byte
    InputBuffer     []byte
    LastOutputAt    int64   // unix ms
    OscBuffer       string
    Destroying      bool
    Suspended       bool
}
```

## Agent Detection Logic (Port)

```go
// internal/terminal/agent_detection.go

var agentPatterns = map[string]types.AgentType{
    "claude": types.AgentClaude,
    "codex":  types.AgentCodex,
    "gemini": types.AgentGemini,
    "aider":  types.AgentAider,
}

// ProcessInputForAgentDetection watches keystrokes for agent commands.
// Called on every Write() if agent not yet detected.
func (p *PTYProcess) ProcessInputForAgentDetection(data string) *types.AgentType {
    if p.Metadata.AgentType != "" {
        return nil // already detected
    }

    for _, ch := range data {
        if ch == '\r' || ch == '\n' {
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
            continue
        }
        if ch == '\u007f' || ch == '\b' {
            if len(p.InputBuffer) > 0 {
                p.InputBuffer = p.InputBuffer[:len(p.InputBuffer)-1]
            }
            continue
        }
        if ch >= ' ' || ch == '\t' {
            p.InputBuffer = append(p.InputBuffer, byte(ch))
            if len(p.InputBuffer) > 1024 {
                p.InputBuffer = p.InputBuffer[len(p.InputBuffer)-1024:]
            }
        }
    }
    return nil
}
```

## OSC Title Parsing (Port)

```go
// internal/terminal/osc_parser.go

import "regexp"

var oscPattern = regexp.MustCompile(`\x1b\]([012]);([^\x07\x1b]*?)(?:\x07|\x1b\\)`)

// ParseOscTitle extracts title from OSC escape sequences.
// Returns new title if found, empty string otherwise.
func (p *PTYProcess) ParseOscTitle(data string) string {
    if !p.Metadata.AllowTitleUpdate {
        return ""
    }
    p.OscBuffer += data
    if len(p.OscBuffer) > 2000 {
        p.OscBuffer = p.OscBuffer[len(p.OscBuffer)-1000:]
    }

    var newTitle string
    matches := oscPattern.FindAllStringSubmatch(p.OscBuffer, -1)
    for _, match := range matches {
        title := strings.TrimSpace(match[2])
        if title != "" && title != p.Metadata.Title {
            p.Metadata.Title = title
            newTitle = title
        }
    }

    // Clear processed buffer, keep potential incomplete sequence
    lastEsc := strings.LastIndex(p.OscBuffer, "\x1b]")
    if lastEsc >= 0 {
        after := p.OscBuffer[lastEsc:]
        if strings.Contains(after, "\x07") || strings.Contains(after, "\x1b\\") {
            p.OscBuffer = ""
        } else {
            p.OscBuffer = after
        }
    } else {
        p.OscBuffer = ""
    }
    return newTitle
}
```

## Wails Bindings (App methods)

```go
// app.go additions

func (a *App) TerminalCreate(opts map[string]interface{}) (types.Terminal, error) {
    cwd, _ := opts["cwd"].(string)
    projectID, _ := opts["projectId"].(string)
    return a.terminalMgr.Create(terminal.CreateOptions{
        Cwd:       cwd,
        ProjectID: projectID,
    })
}

func (a *App) TerminalDestroy(id string) bool {
    return a.terminalMgr.DestroyAsync(id)
}

func (a *App) TerminalWrite(id string, data string) bool {
    return a.terminalMgr.Write(id, data)
}

func (a *App) TerminalResize(id string, cols, rows int) bool {
    return a.terminalMgr.Resize(id, cols, rows)
}

func (a *App) TerminalList() []types.Terminal {
    return a.terminalMgr.List()
}

func (a *App) TerminalInvokeClaude(id string, sessionID string) bool {
    return a.terminalMgr.InvokeClaudeCode(id, sessionID)
}
```

## Related Code Files

**Create:**
- `internal/terminal/manager.go` -- TerminalManager port
- `internal/terminal/agent_detection.go` -- Agent detection logic
- `internal/terminal/osc_parser.go` -- OSC title parsing
- `internal/terminal/shell_resolver.go` -- Default shell detection (platform-specific)
- `internal/terminal/manager_test.go` -- Unit tests

**Modify:**
- `internal/terminal/pty_process.go` -- Add Metadata, buffers, suspend fields
- `app.go` -- Add terminal binding methods

## Implementation Steps

1. Enhance `PTYProcess` struct with metadata and buffer fields
2. Create `Manager` struct with concurrent-safe terminal map
3. Port `getDefaultShell()` -- use `dscl` on macOS, `SHELL` env on Linux, `COMSPEC` on Windows
4. Port `Create()` -- spawn PTY, wire up output/exit handlers, emit events
5. Port `Write()` with agent detection and suspend guard
6. Port `Resize()` with suspend guard
7. Port `Destroy()/DestroyAsync()` with graceful exit + force kill
8. Port OSC title parser
9. Port agent detection from input keystrokes
10. Port ghost cache with TTL eviction
11. Port system suspend/resume handlers
12. Port `InvokeClaudeCode()` and Claude session ID tracking
13. Port `attachClaudeSession()` and `findByClaudeSessionId()`
14. Wire all Manager events to Wails EventsEmit in app.go startup
15. Add Wails binding methods to App struct
16. Write unit tests for agent detection, OSC parsing, ghost cache

## Todo List

- [x] Enhance PTYProcess with metadata and buffer fields
- [x] Create Manager struct with sync.RWMutex
- [x] Port shell detection (platform-specific)
- [x] Port Create() with PTY spawn and event wiring
- [x] Port Write() with agent detection + suspend guard
- [x] Port Resize() with suspend guard
- [x] Port DestroyAsync() with graceful exit + force kill fallback
- [x] Port OSC title parser
- [x] Port agent detection logic
- [x] Port ghost cache (50 max, 30min TTL)
- [x] Port suspend/resume handling
- [x] Port InvokeClaudeCode() and session ID tracking
- [x] Port attachClaudeSession() and findByClaudeSessionId()
- [x] Wire Manager events to Wails EventsEmit
- [x] Add Wails binding methods to App struct
- [x] Unit tests: agent detection
- [x] Unit tests: OSC title parsing
- [x] Unit tests: ghost cache eviction
- [x] Integration test: full create->write->output->destroy cycle

## Success Criteria

1. All source TerminalManager methods ported and callable from frontend
2. Agent detection correctly identifies claude/codex/gemini/aider from input
3. OSC title changes propagate to frontend within 100ms
4. Ghost cache correctly evicts after 30min or at 50-entry cap
5. Suspend/resume cycle does not crash or leak
6. Unit test coverage > 70% for agent detection and OSC parsing

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Race conditions in terminal map | Medium | High | sync.RWMutex on all map ops; run tests with `-race` |
| Platform shell detection fails | Low | Med | Fallback chain: dscl -> $SHELL -> /bin/bash |
| Force kill leaves zombie processes | Low | Med | SIGKILL after 3s timeout; test on process group |
| Output buffer OOM | Low | Med | Hard cap at 1MB per terminal |

## Rollback

Manager is self-contained in `internal/terminal/`. Remove package and revert `app.go` binding additions.
