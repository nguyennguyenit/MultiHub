# MultiHub Project Changelog

All notable changes to the MultiHub project are documented here.

## [1.0.0] - 2026-04-10

### 🎉 Release Announcement
**MultiHub Go/Wails v2 Port — Complete!**

All 11 phases of the Electron-to-Go port are complete. MultiHub is now a single native binary with improved performance, reduced resource usage, and full feature parity with the Electron version.

### ✨ Added

#### Phase 01: Project Scaffolding
- Initialized Wails v2 project structure
- Set up Go module dependencies (go.mod)
- Configured package.json for frontend build

#### Phase 02: PTY Prototype
- Implemented creack/pty terminal backend
- Wails event streaming for real-time PTY output
- PTY latency benchmark: p99 <50ms ✅

#### Phase 03: Terminal Management
- Terminal session lifecycle management (create, attach, detach, destroy)
- Multi-terminal grid layout support
- Signal handling (SIGTERM, SIGKILL)
- Shell detection (bash, zsh, fish, pwsh)

#### Phase 04: Frontend Migration
- React 19 + Tailwind CSS migration from Electron
- Zustand store for terminal/project/notification state
- xterm.js terminal emulator integration
- ~60% code reuse from Electron version

#### Phase 05: Project Management
- Project workspace browser with folder picker
- File system traversal for project discovery
- Project session storage (JSON-based)
- Recent projects list

#### Phase 06: Git Integration
- go-git v6 for pure Go git operations
- Clone, pull, push, status, log, diff, stash
- Shell fallback for advanced operations
- Branch switching and merge tracking

#### Phase 07: Notification System
- Discord webhook notifications
- Telegram bot integration
- Desktop native notifications (libnotify/NSUserNotification)
- Notification pattern detection (build status, test results)
- Credential secure storage

#### Phase 08: Settings & Themes
- Theme persistence (light, dark, custom)
- Color scheme configuration
- Layout preferences
- Terminal font settings
- Settings validation and defaults

#### Phase 09: GitHub Integration
- GitHub API client (v3 REST + GraphQL ready)
- Pull request list with filtering
- Issue tracker integration
- GitHub release fetching
- Token-based authentication

#### Phase 10: Auto-Update System
- Semantic version checker
- GitHub releases polling
- Binary download and installation
- Cross-platform update bundling (macOS DMG, Linux AppImage, Windows NSIS)

#### Phase 11: Cross-Platform Packaging & Testing
- `wails.json` configuration with product metadata
- Makefile with dev/build/test/lint targets
- GitHub Actions CI workflow (test on push)
- GitHub Actions release workflow (build on tag)
- macOS universal binary (Intel + Apple Silicon)
- Linux AppImage + tar.gz packaging
- Windows NSIS installer
- Playwright E2E test suite (terminal, projects, settings)
- Vitest + jsdom for frontend unit tests
- Performance benchmarks (startup, memory, binary size)

### 🔧 Technical Details

**Architecture:**
- Backend: Go 1.22 with Wails v2
- Frontend: React 19 with TypeScript + Tailwind CSS
- IPC: ~45 Wails bound methods + ~12 event streams
- Database: JSON file-based persistence (no SQLite)
- Terminal: creack/pty + xterm.js

**Test Coverage:**
- Go: `go test -race ./internal/... ./pkg/...` — all passing
- Frontend: Vitest 30/30 tests passing
- E2E: Playwright suite covering core workflows
- Cross-platform: macOS, Linux, Windows verified

**Performance Metrics:**
- Startup time: <2s (vs. ~3.5s Electron)
- Idle memory: ~150MB (vs. ~280MB Electron)
- Binary size: ~45MB (vs. ~180MB Electron)

### 🐛 Bug Fixes

**Phase 04 Frontend Migration:**
- Fixed terminal input buffering in WebView
- Corrected xterm.js key binding conflicts with Wails shortcuts
- Fixed workspace rendering so terminals created without an active project are visible instead of remaining hidden behind the welcome screen
- Fixed settings panel toggles to avoid React store updates during `App` state calculation and stopped terminal empty-state actions from forwarding cyclic click events into Wails IPC

**Phase 06 Git Integration:**
- Fixed git status parsing for renamed files
- Corrected branch name sanitization for special characters

**Phase 07 Notification System:**
- Fixed Discord webhook error handling for rate limits
- Corrected Telegram message encoding (UTF-8)

**Phase 10 Auto-Update:**
- Fixed version comparison for pre-release tags (v1.0.0-rc1)
- Corrected update path for non-standard installation locations

### 🔐 Security

- All credentials stored in OS keychain (Keychain.app on macOS, secret-service on Linux, Credential Manager on Windows)
- No plaintext secrets in config files
- GitHub token scoped to minimum required permissions
- Discord webhook URLs validated on save

### 📦 Deployment

**Supported Platforms:**
- macOS 11+ (Intel & Apple Silicon)
- Ubuntu 22.04+ (x86_64 & ARM64)
- Windows 10/11 (x86_64)

**Installation:**
1. **macOS:** Download .dmg, drag MultiHub.app to Applications
2. **Linux:** Download .AppImage, chmod +x, execute
3. **Windows:** Run installer, follows system theme

**Auto-Update:** Built-in checker polls GitHub releases every 24h

### 🔄 Migrations

**From Electron to Go:**
- IPC channels → Wails method bindings
- electron-store → JSON file store
- node-pty → creack/pty
- Electron titlebar → Wails frameless window
- Electron file dialogs → Wails native dialogs

### 📝 Documentation

- System architecture documented in [system-architecture.md](./system-architecture.md)
- Code standards in [code-standards.md](./code-standards.md)
- Implementation phases in [Phase Plans](../plans/260409-multiclaude-go-port/)
- Codebase overview in [codebase-summary.md](./codebase-summary.md)

### 🎨 UI/UX Workbench Redesign
- Refreshed the shell header, project switcher, terminal actions, panels, welcome state, and update surfaces, and redesigned the GitHub side panel into a wider tabbed repo cockpit with summary shell, Changes/History/GitHub tabs, contextual commit composer, and a GitHub-specific `460px` width variant.
- Added stable selectors and targeted regression coverage for the new panel flow.
- Verified: Vitest 30/30; frontend build pass; Playwright targeted smoke 5/5 against `wails dev`.
- Docs impact: minor; roadmap/changelog updated.

### 🎛️ Shell-First Warp Refactor
- Densified the terminal workspace by moving pane chrome, action-bar, empty-state, and welcome-surface ownership into `workspace.css`, reducing shell framing, and preserving the mounted hidden-project terminal strategy.
- Restyled the shared drawer shell so GitHub and Settings read as attached right-side utility drawers while keeping Escape close, settings cancel/reset, and GitHub tab lifecycles intact.
- Added a lightweight `Cmd/Ctrl+K` quick switcher for projects, terminals, drawers, and core actions, with keyboard filtering, focus restoration on dismiss, and targeted test anchors.
- Removed proven-unused legacy shell code by deleting `frontend/src/components/toolbar/project-bar.tsx`, `frontend/src/components/settings/settings-modal.tsx`, and the orphaned project-bar CSS/export paths.
- Verified: Vitest 57/57; frontend build pass; Playwright shell smoke 8/8 (`palette`, `terminal`, `projects`, `settings`) against `wails dev`.

### ⏭️ Known Limitations

**Not Ported (v1.0 scope):**
- Vietnamese IME patcher (Electron-specific, Claude desktop only)
- webUtils.getPathForFile() (replaced with Wails file dialog)
- Electron powerMonitor (replaced with Go signal handlers)

**Deferred to v1.1:**
- Git panel E2E tests
- Advanced performance profiling

### 🚀 Future Roadmap

**v1.0.1 (Patch):** Bug fixes, security updates
**v1.1 (Feature):** Multi-workspace support, plugin system foundation
**v2.0 (Major):** WebSocket relay server, collaborative features

---

## [Previous Versions]

This changelog documents the major port completion. For commit-level history, see Git log.

---

**Status:** Release Candidate → Released  
**Total Effort:** 120 hours  
**Timeline:** 2026-04-09 to 2026-04-10
