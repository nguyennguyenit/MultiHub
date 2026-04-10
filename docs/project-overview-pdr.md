# MultiHub Project Overview & PDR

## Executive Summary

MultiHub is a native desktop terminal manager built with **Go 1.24 + Wails v2** frontend in **React 19 + TypeScript**. The application provides a unified interface to manage multiple terminal sessions with integrated shell environment support, running as a single cross-platform binary (7.9MB macOS arm64).

**Target Users:** Developers requiring side-by-side terminal management, project workspace control, and integrated system notifications.

## Project Goals

1. **Phase 01-02 (Complete):** Establish Wails scaffold, PTY engine, event streaming to React frontend
2. **Phase 03 (Complete):** Terminal metadata, agent detection, title parsing, suspend/resume, Claude integration, ghost cache
3. **Phase 04 (Complete):** Frontend migration from Electron to Wails, API adapter layer, all 60+ bindings exposed
4. **Phase 05+:** Project management, Git integration, GitHub integration, notifications, settings, auto-update, cross-platform packaging
5. **Long-term:** Stability, performance optimization, and extensibility

## Architecture at a Glance

```
┌─────────────────────────────┐
│  React 19 + TypeScript      │  frontend/src/
│  - PtyTerminal (xterm.js)   │  - components/terminal/
│  - Tab management           │  - App.tsx
└──────────── │ ──────────────┘
             │ Wails IPC
┌──────────── ↓ ──────────────┐
│ Go Backend (github.com/    │  main.go + internal/
│  multihub/multihub)        │  - app.go (App struct, bindings)
│ - PTY Manager              │  - terminal/ (PTY lifecycle)
│ - Event streaming          │  - git/, project/, notification/
│ - Terminal lifecycle       │  - platform/ (OS-specific)
└─────────────────────────────┘
```

## Current Implementation (Phases 01 + 02 + 03)

### Go Backend (Phase 03 Complete)
- **Entry:** `main.go` → `app.go` (App struct)
- **Module:** `github.com/multihub/multihub` (Go 1.24)
- **PTY Engine:** `internal/terminal/` (Phase 03 enhanced)
  - `manager.go` → manages terminal lifecycle, ghost cache, agent detection, suspend/resume
  - `pty_process.go` → wraps `creack/pty`, I/O buffering, metadata tracking
  - `agent_detection.go` → keystroke-based detection (Claude/Codex/Gemini/Aider)
  - `osc_parser.go` → terminal title extraction from OSC escape sequences
  - `shell_resolver.go` → platform-aware login shell detection (dscl/SHELL/bash)
- **Dependencies:** Wails v2.12.0, creack/pty v1.1.24, google/uuid
- **Key Constants:** 8ms flush, 4KB buffer, 30min ghost cache TTL, 50 ghost max

### React Frontend (Phase 04 Complete)
- **Entry:** `frontend/src/App.tsx` → multi-tab app with project/terminal/settings UI
- **API Adapter:** `frontend/src/api/index.ts` → maps Wails bindings to ElectronAPI shape (60+ methods)
- **Stores:** Zustand stores in `frontend/src/stores/` (app, settings, notification, update, image, toast)
- **Hooks:** `frontend/src/hooks/` (use-terminal, use-git-panel, use-file-drop, use-keyboard-shortcuts)
- **Components:** Terminal pane (xterm.js), git panel (status/diff/branch), github setup/view, settings panel
  - xterm.js v5 with dark GitHub theme, FitAddon for responsive resizing
  - Handles keyboard input via `onData` → `api.terminal.write()`
  - Receives output via Wails events: `pty:output:{id}` (Phase 02 legacy) and new Phase 03 events
  - Phase 03 events: `terminal:created`, `terminal:exit`, `terminal:title-change`, `terminal:state-change`, `terminal:agent-detected`, `system:terminal-resumed`
- **Shared Types:** `frontend/src/shared/` (types, constants from MultiClaude source)
- **Dependencies:** React 19, TypeScript 5.9, Vite, Tailwind v4, Zustand, @xterm/*, font packages
- **Build:** `npm run build` → static assets embedded in binary, zero TypeScript errors

### IPC Bindings (App struct methods, Phase 04 Exposed)

**Terminal Management:** ~11 methods
- `TerminalCreate(opts)` → spawn with options (shell, cwd, projectId, title)
- `TerminalWrite(id, data)` → send input + agent detection
- `TerminalResize(id, cols, rows)`, `TerminalDestroy(id)`, `TerminalList()`, `TerminalGet(id)`
- `TerminalGetSessions()`, `TerminalGetExitedSession(id)` → persistence/recovery
- `TerminalInvokeClaude(id, sessionID)`, `TerminalFindByClaudeSession(sessionID)` → Claude integration
- `TerminalCount()` → active terminal count

**Project Management:** ~7 methods (stubs)
- `ProjectList()`, `ProjectCreate(p)`, `ProjectUpdate(id, u)`, `ProjectDelete(id)`, `ProjectSetActive(id)`, `ProjectCheckFolder(cwd)`

**Git Integration:** ~26 methods (stubs)
- Status, init, add remote, push, pull, fetch, commit, stage/unstage, branch ops, stash, diff, log, config

**GitHub Integration:** ~6 methods (stubs)
- `GitHubAuthStatus()`, `GitHubLogin()`, `GitHubLogout()`, `GitHubCreateRepo()`, `GitHubListIssues()`, `GitHubListPRs()`

**Notification System:** ~14 methods (stubs)
- Settings, Telegram config/test, Discord config/test, remote control status

**Settings:** ~3 methods (stubs)
- `SettingsGet()`, `SettingsSet(s)`, `SettingsReset()`

**Update System:** ~4 methods (stubs)
- `UpdateGetState()`, `UpdateCheck()`, `UpdateDownload()`, `UpdateInstall()`

**Window/App/Misc:** ~10 methods (stubs + some Wails runtime calls)
- `WindowGetState()`, `AppGetPath(name)`, `ClipboardSaveImage(b64)`, `Image*()` methods

**Legacy PTY (Phase 02 compat):**
- `PtyCreate/Write/Resize/Destroy/LatencyTest/PtyActiveCount` → backward compatible

**Total:** ~60 stub bindings, all compile cleanly, ready for backend implementation in later phases

## Non-Functional Requirements (Realized)

| Requirement | Status | Details |
|-------------|--------|---------|
| Cross-platform binary | Complete | Single go build produces native executable |
| Latency < 50ms (PTY→xterm) | Verified | 8ms flush + network overhead measured |
| Memory efficiency | Complete | Goroutine per PTY, buffered I/O |
| Event streaming | Complete | Wails EventsEmit with backpressure handling |

## Known Limitations & Tech Debt

1. **Demo PTY only:** `App.tsx` hardcodes single "demo-pty-1" for testing
2. **No persistence:** No project/workspace config saved between sessions
3. **Minimal UI:** Tab-based layout, no tab creation/destruction UI yet
4. **No Git integration:** `internal/git/` and `internal/github/` exist but unused

## Directory Structure

```
.
├── main.go                          # Entry point, Wails initialization
├── app.go                           # App struct, IPC bindings
├── go.mod / go.sum                  # Go dependencies
├── wails.json                       # Wails config
├── internal/
│   ├── terminal/                    # PTY engine (Manager, PTYProcess)
│   ├── git/                         # Git integration (future)
│   ├── github/                      # GitHub API client (future)
│   ├── project/                     # Project management (future)
│   ├── notification/                # Discord/Telegram/system (future)
│   ├── settings/                    # Config store (future)
│   ├── platform/                    # OS-specific (Darwin/Linux/Windows)
│   └── updater/                     # App update checker (future)
├── pkg/types/                       # Shared types
├── frontend/
│   ├── src/
│   │   ├── App.tsx                  # Main React app
│   │   ├── components/
│   │   │   └── terminal/
│   │   │       ├── pty-terminal.tsx # xterm.js wrapper
│   │   │       └── latency-harness.tsx
│   │   └── wailsjs/                 # Generated IPC stubs
│   ├── package.json                 # React/Vite deps
│   └── vite.config.ts
└── build/                           # Native build artifacts

```

## Success Metrics (Phases 01 + 02 + 03 + 04)

**Phase 01 + 02:**
- ✅ Single cross-platform binary builds without errors
- ✅ PTY spawns and responds to keyboard input
- ✅ Output streams to xterm.js with <50ms latency
- ✅ Terminal resizing works responsively
- ✅ App gracefully shuts down active PTY processes
- ✅ No memory leaks during extended sessions

**Phase 03:**
- ✅ Terminal metadata (UUID, title, cwd, projectId, timestamps)
- ✅ Agent detection on keystroke input (Claude/Codex/Gemini/Aider)
- ✅ Dynamic terminal title via OSC escape sequence parsing
- ✅ Ghost cache retains 50 exited sessions for 30min
- ✅ Suspend/resume prevents PTY writes during system sleep
- ✅ Claude session tracking and terminal lookup by session ID
- ✅ Platform-aware shell resolution (dscl on macOS, $SHELL fallback)

**Phase 04 (Frontend Migration):**
- ✅ 60+ stub Go methods for Project, Git, GitHub, Settings, Notification, Update, Session, Window, App, Clipboard, Image bindings
- ✅ All Go stub methods compile cleanly
- ✅ API adapter layer (`frontend/src/api/`) maps Wails bindings to ElectronAPI shape
- ✅ All Zustand stores migrated to use api.* instead of window.electron.*
- ✅ All components migrated (terminal, git-panel, github, settings, toolbar, etc.)
- ✅ Shared types/constants copied to frontend/src/shared/
- ✅ Frontend dependencies updated (zustand, @xterm/addon-webgl, font packages)
- ✅ Path aliases configured (@shared/*)
- ✅ Zero window.electron references remain in frontend code
- ✅ Zero TypeScript errors in `npm run build`
- ✅ Go backend builds cleanly (`go build .`)

## File Ownership & Responsibilities

| Component | Files | Owner | Status |
|-----------|-------|-------|--------|
| PTY Engine | `internal/terminal/` | Backend | Complete |
| Frontend UI | `frontend/src/components/terminal/` | Frontend | Complete |
| IPC Bindings | `app.go` + `wailsjs/` | Backend | Complete |
| Window Controls | `app.go` WindowXxx methods | Backend | Complete |

## Versioning & Release Info

- **Current Version:** 0.3.0-alpha (Phases 01 + 02 + 03 + 04 complete)
- **Go Version:** 1.24.0
- **Wails Version:** 2.12.0
- **React Version:** 19.2.5
- **TypeScript Version:** 5.9.0
- **Binary Size:** 7.9MB (macOS arm64)
- **Phase 03 Completion Date:** 2026-04-09
- **Phase 04 Completion Date:** 2026-04-10

## Next Phase Dependencies

**Phase 05 (Project Management)** depends on:
- ✅ All infrastructure (Phases 01-04)
- Frontend components for project CRUD
- Project persistence (JSON file store)
- Project-to-terminal association

**Phase 06 (Git Integration)** depends on:
- ✅ Project management (Phase 05)
- Go git bindings (go-git v6)
- Git status/commit/push/pull/branch operations
- Frontend UI for git workflow

**Phase 07 (Notification System)** depends on:
- ✅ Terminal management (Phase 03)
- Telegram integration backend
- Discord webhook integration
- Remote control over notifications

**Phase 08 (Settings & Themes)** depends on:
- ✅ Frontend framework (Phase 04)
- Settings persistence backend
- Theme switching
- Preference management

**Phase 09 (GitHub Integration)** depends on:
- ✅ Git integration (Phase 06)
- GitHub OAuth flow
- Issue/PR fetching and display

**Phase 10 (Auto-Update System)** depends on:
- Go update checker
- Binary signing/verification
- Self-update mechanism

**Phase 11 (Cross-Platform Packaging)** depends on:
- All features (Phases 05-10)
- macOS/Linux/Windows build scripts
- Installer creation
- Notarization/signing

---

**Document Version:** 1.2 (Phase 04 Update)  
**Last Updated:** 2026-04-10  
**Author:** Plateau Nguyen
