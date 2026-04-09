# MultiHub Project Overview & PDR

## Executive Summary

MultiHub is a native desktop terminal manager built with **Go 1.24 + Wails v2** frontend in **React 19 + TypeScript**. The application provides a unified interface to manage multiple terminal sessions with integrated shell environment support, running as a single cross-platform binary (7.9MB macOS arm64).

**Target Users:** Developers requiring side-by-side terminal management, project workspace control, and integrated system notifications.

## Project Goals

1. **Phase 01-02 (Complete):** Establish Wails scaffold, PTY engine, event streaming to React frontend
2. **Phase 03+:** Add project workspace management, Git integration, deployment workflows, and notification system
3. **Long-term:** Cross-platform stability (macOS, Linux, Windows), performance optimization, and extensibility

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

## Current Implementation (Phases 01 + 02)

### Go Backend
- **Entry:** `main.go` → `app.go` (App struct)
- **Module:** `github.com/multihub/multihub` (Go 1.24)
- **PTY Engine:** `internal/terminal/`
  - `manager.go` → manages map of active `PTYProcess` objects
  - `pty_process.go` → wraps `creack/pty`, handles I/O buffering, emits Wails events
- **Dependencies:** Wails v2.12.0, creack/pty v1.1.24
- **Key Constants:** 8ms flush timer, 4KB buffer threshold, 8KB read buffer

### React Frontend
- **Entry:** `frontend/src/App.tsx` → spawns demo PTY on mount
- **Terminal Component:** `components/terminal/pty-terminal.tsx`
  - xterm.js v5 with dark GitHub theme, FitAddon for responsive resizing
  - Handles keyboard input via `onData` → `PtyWrite()`
  - Receives output via Wails events: `pty:output:{id}`, `pty:exit:{id}`
- **Dependencies:** React 19, TypeScript 5.9, Vite, Tailwind v4
- **Build:** `npm run build` → static assets embedded in binary

### IPC Bindings (App struct methods)
- `PtyCreate(id, shell, cwd)` → spawn PTY
- `PtyWrite(id, data)` → send keyboard input
- `PtyResize(id, cols, rows)` → update window size
- `PtyDestroy(id)` → gracefully close (SIGINT → SIGKILL)
- `PtyLatencyTest(id)` → echo marker for latency measurement
- `PtyActiveCount()` → get active PTY count
- Window controls: `WindowMinimize()`, `WindowMaximize()`, `WindowClose()`

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

## Success Metrics (Phases 01 + 02)

- ✅ Single cross-platform binary builds without errors
- ✅ PTY spawns and responds to keyboard input
- ✅ Output streams to xterm.js with <50ms latency
- ✅ Terminal resizing works responsively
- ✅ App gracefully shuts down active PTY processes
- ✅ No memory leaks during extended sessions (verified with pprof)

## File Ownership & Responsibilities

| Component | Files | Owner | Status |
|-----------|-------|-------|--------|
| PTY Engine | `internal/terminal/` | Backend | Complete |
| Frontend UI | `frontend/src/components/terminal/` | Frontend | Complete |
| IPC Bindings | `app.go` + `wailsjs/` | Backend | Complete |
| Window Controls | `app.go` WindowXxx methods | Backend | Complete |

## Versioning & Release Info

- **Current Version:** 0.1.0-alpha (Phases 01 + 02 complete)
- **Go Version:** 1.24.0
- **Wails Version:** 2.12.0
- **React Version:** 19.2.5
- **Binary Size:** 7.9MB (macOS arm64)

## Next Phase Dependencies

Phases 03+ depend on:
- Stable PTY engine (✅ complete in Phase 02)
- Multi-tab UI framework (todo: implement tab lifecycle)
- Project config store (todo: implement in Phase 03)
- Git integration (todo: implement in Phase 03)

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-09  
**Author:** Plateau Nguyen
