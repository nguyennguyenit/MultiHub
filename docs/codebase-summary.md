# MultiHub Codebase Summary

**Last Updated:** 2026-04-10 (Phase 04 Complete)

## Directory Structure

```
/Users/plateau/Project/MultiHub/
├── main.go                          # Wails app entry point
├── app.go                           # App struct + 60+ IPC binding stubs
├── go.mod / go.sum                  # Go dependencies (Wails, creack/pty, etc.)
├── wails.json                       # Wails framework config
├── frontend/
│   ├── src/
│   │   ├── App.tsx                  # Root React component (multi-tab)
│   │   ├── api/
│   │   │   ├── index.ts            # API adapter (maps Wails → ElectronAPI shape)
│   │   │   └── events.ts           # Event subscription helpers
│   │   ├── shared/
│   │   │   ├── types.ts            # Shared type definitions
│   │   │   └── constants.ts        # App constants
│   │   ├── stores/
│   │   │   ├── app-store.ts        # Terminal + project state (Zustand)
│   │   │   ├── settings-store.ts   # Settings (Zustand)
│   │   │   ├── notification-store.ts # Notifications (Zustand)
│   │   │   ├── update-store.ts     # Update status (Zustand)
│   │   │   ├── image-store.ts      # Image clipboard (Zustand)
│   │   │   └── toast-store.ts      # Toast notifications (Zustand, frontend-only)
│   │   ├── hooks/
│   │   │   ├── use-terminal.ts     # Terminal I/O + events
│   │   │   ├── use-git-panel.ts    # Git operations
│   │   │   ├── use-keyboard-shortcuts.ts # Hotkeys (Cmd/Ctrl+T/W/etc)
│   │   │   ├── use-file-drop.ts    # File drag-drop → Wails dialog
│   │   │   └── use-terminal-resize.ts # ResizeObserver integration
│   │   ├── components/
│   │   │   ├── terminal/
│   │   │   │   ├── terminal-pane.tsx       # xterm.js wrapper
│   │   │   │   ├── terminal-grid.tsx       # Multi-tab layout
│   │   │   │   ├── terminal-view.tsx       # Container
│   │   │   │   ├── terminal-action-bar.tsx # Controls
│   │   │   │   ├── shell-selector-dropdown.tsx # WSL/shell picker
│   │   │   │   └── image-preview-popup.tsx # Image display
│   │   │   ├── git-panel/                  # Git UI (10 files)
│   │   │   │   ├── git-panel.tsx
│   │   │   │   ├── diff-renderer.tsx
│   │   │   │   ├── branch-selector.tsx
│   │   │   │   └── ...
│   │   │   ├── github-setup/               # OAuth flow (3 files)
│   │   │   ├── github-view/                # Issues/PRs (8 files)
│   │   │   ├── settings/                   # Settings UI (8 files)
│   │   │   │   ├── settings-panel.tsx
│   │   │   │   ├── notification-settings.tsx
│   │   │   │   ├── terminal-settings.tsx
│   │   │   │   ├── theme-selector.tsx
│   │   │   │   └── ...
│   │   │   ├── toolbar/                    # Top bar (5 files)
│   │   │   │   ├── project-dropdown.tsx
│   │   │   │   ├── window-controls.tsx
│   │   │   │   └── ...
│   │   │   ├── slide-panel/
│   │   │   │   └── slide-panel.tsx
│   │   │   ├── toast-container.tsx
│   │   │   ├── update-banner.tsx
│   │   │   └── welcome-screen.tsx
│   │   ├── styles/
│   │   │   └── globals.css         # Tailwind + theme variables
│   │   ├── utils/
│   │   │   ├── shortcut-utils.ts
│   │   │   ├── keyboard-enhancement-utils.ts
│   │   │   └── font-utils.ts
│   │   ├── wailsjs/                # Auto-generated Wails IPC stubs
│   │   │   ├── go/main/App.d.ts    # Binding declarations (~60 methods)
│   │   │   ├── go/main/App.js      # Binding implementations
│   │   │   ├── models.ts           # Type definitions
│   │   │   └── runtime/            # Wails runtime API
│   │   ├── main.tsx                # React entry (Vite)
│   │   └── index.html              # HTML template
│   ├── package.json                 # npm dependencies
│   ├── tsconfig.json                # TS config + @shared/* alias
│   ├── vite.config.ts               # Vite + path alias config
│   └── wailsjs/                     # Wails auto-gen output
├── internal/
│   ├── terminal/
│   │   ├── manager.go              # PTY lifecycle + ghost cache
│   │   ├── pty_process.go          # creack/pty wrapper + I/O
│   │   ├── agent_detection.go      # Claude/Codex/Gemini detection
│   │   ├── osc_parser.go           # Terminal title extraction
│   │   └── shell_resolver.go       # Platform shell detection
│   ├── git/                        # Stub (not yet implemented)
│   ├── github/                     # Stub (not yet implemented)
│   ├── project/                    # Stub (not yet implemented)
│   ├── notification/               # Stub (not yet implemented)
│   ├── settings/                   # Stub (not yet implemented)
│   ├── platform/                   # OS-specific helpers (future)
│   └── updater/                    # Stub (not yet implemented)
├── pkg/types/                       # Shared Go types
├── docs/
│   ├── project-overview-pdr.md     # Project overview + roadmap
│   ├── system-architecture.md      # Technical architecture
│   ├── code-standards.md           # Coding conventions
│   ├── codebase-summary.md         # This file
│   ├── design-guidelines.md        # UI/UX principles
│   ├── development-roadmap.md      # Milestone tracking
│   └── project-changelog.md        # Change history
└── plans/
    └── 260409-multiclaude-go-port/
        ├── plan.md                 # Phase overview
        ├── phase-01-*.md
        ├── phase-02-*.md
        ├── phase-03-*.md
        ├── phase-04-*.md
        └── ...
```

## Frontend Structure (Phase 04 Complete)

### Layers

1. **API Adapter (`frontend/src/api/`)**
   - Maps Wails bindings to ElectronAPI shape
   - No components use `window.electron.*` directly
   - All calls routed through `api.X.method(args)`

2. **Stores (`frontend/src/stores/`)**
   - Zustand state management
   - Call `api.*` methods instead of IPC
   - Manage UI state (tabs, settings, notifications, updates)

3. **Hooks (`frontend/src/hooks/`)**
   - Encapsulate IPC patterns (terminal I/O, git operations)
   - Manage lifecycle (mount/unmount, cleanup)
   - Event subscription management

4. **Components (`frontend/src/components/`)**
   - React components using hooks + stores
   - Terminal pane uses xterm.js v5 + FitAddon
   - All other components unchanged from MultiClaude source

5. **Shared Types (`frontend/src/shared/`)**
   - Copied from MultiClaude source
   - Provides type definitions for all APIs
   - Path alias: `@shared/*`

### Key Dependencies

- **React 19.2.5** — UI framework
- **TypeScript 5.9.0** — Type safety
- **Zustand 4.5+** — Lightweight state management
- **Vite 6** — Fast dev/build
- **Tailwind 4** — CSS framework
- **@xterm/xterm 5.5.0** — Terminal emulator
- **@xterm/addon-fit 0.10.0** — Auto-resize
- **@xterm/addon-webgl 0.16.0** — GPU rendering (optional)
- **Font packages:** Roboto, JetBrains Mono, Noto Sans CJK

## Backend Structure (Phases 01-03 + Phase 04 Stubs)

### Go Modules

1. **`app.go`**
   - App struct (owned by Wails runtime)
   - 60+ stub methods grouped by domain:
     - Terminal (11 methods) — implemented, working
     - Project (7 methods) — stubs, ready for Phase 05
     - Git (26 methods) — stubs, ready for Phase 06
     - GitHub (6 methods) — stubs, ready for Phase 09
     - Notification (14 methods) — stubs, ready for Phase 07
     - Settings (3 methods) — stubs, ready for Phase 08
     - Update (4 methods) — stubs, ready for Phase 10
     - Window/App/Misc (10 methods) — stubs + Wails runtime calls

2. **`internal/terminal/`**
   - **manager.go** — PTY lifecycle, ghost cache (50 entries, 30min TTL), suspend/resume
   - **pty_process.go** — creack/pty wrapper, I/O buffering (8ms flush, 4KB threshold)
   - **agent_detection.go** — keystroke parsing for Claude/Codex/Gemini/Aider CLI
   - **osc_parser.go** — OSC 0/1/2 escape sequence title extraction
   - **shell_resolver.go** — Platform shell detection (dscl/SHELL/bash)

3. **`internal/git/`, `internal/github/`, `internal/project/`, `internal/notification/`, `internal/settings/`, `internal/updater/`**
   - Stub packages, not yet implemented
   - Bindings exist in `app.go` for frontend compatibility

### Go Dependencies

- **Wails v2.12.0** — Framework + event emission
- **creack/pty v1.1.24** — PTY operations (Unix)
- **google/uuid** — Terminal ID generation
- **go-git v6** — Git operations (future phases)
- **github.com/cli** — GitHub CLI API (future phases)

## Build & Development

### Frontend
```bash
cd frontend
npm install
npm run dev        # Hot reload, localhost:5173
npm run build      # Production build, embedded in binary
npm run lint       # TypeScript check
```

### Backend
```bash
go mod tidy
wails dev          # Auto-rebuild on Go changes
go build .         # Native binary
```

### Both
```bash
npm run build && go build .  # Full build process
```

## Compile Status (Phase 04)

- **Go:** ✅ Clean build, no errors
- **TypeScript:** ✅ Zero errors in `npm run build`
- **Bindings:** ✅ 60+ methods compile cleanly (stubs)
- **Frontend:** ✅ All components migrated, no window.electron references
- **API Adapter:** ✅ Full Electron API surface area covered

## Migration Notes (Phase 04)

### Before Migration
- Electron IPC: 86 channels via `ipcRenderer.invoke/on`
- Frontend API: `window.electron.X.Y(args)` pattern
- Type system: Electron preload types + custom interfaces

### After Migration
- Wails IPC: ~45 bound methods + ~12 event streams
- Frontend API: `api.X.Y(args)` adapter pattern
- Type system: Wails auto-gen types + shared types in `frontend/src/shared/`

### Key Changes
- Replaced `window.electron.*` with `api.*` adapter
- Updated all Zustand stores to use new adapter
- Migrated all component IPC calls
- Removed Electron-specific patterns (preload, contextBridge)
- Added path alias `@shared/*` for type imports
- Updated dependencies: added Zustand, @xterm/addon-webgl, font packages

### Dropped Features
- Vietnamese IME patcher (Electron-specific)
- `webUtils.getPathForFile()` (use Wails native dialog)
- `powerMonitor` (use OS signal handlers in Go)
- `titleBarStyle: 'hidden'` (use Wails window options)

## File Ownership

| Component | Files | Owner | Status |
|-----------|-------|-------|--------|
| PTY Engine | `internal/terminal/*` | Backend | Complete (Phase 03) |
| Terminal UI | `frontend/src/components/terminal/*` | Frontend | Complete (Phase 04) |
| API Adapter | `frontend/src/api/*` | Frontend | Complete (Phase 04) |
| Zustand Stores | `frontend/src/stores/*` | Frontend | Complete (Phase 04) |
| Git Backend | `internal/git/*` | Backend | Stub (Phase 06) |
| Settings Backend | `internal/settings/*` | Backend | Stub (Phase 08) |
| Project Backend | `internal/project/*` | Backend | Stub (Phase 05) |

---

**Codebase Version:** 0.3.0-alpha  
**Last Update:** 2026-04-10  
**Status:** Phase 04 Complete, Ready for Phase 05 (Project Management)
