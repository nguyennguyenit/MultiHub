---
title: "MultiHub: Go/Wails v2 Port of MultiClaude"
description: "Port Electron-based terminal manager to Go backend + Wails v2 WebView frontend, producing a single native binary"
status: pending
priority: P1
effort: 120h
branch: main
tags: [go, wails, port, desktop, terminal-manager]
created: 2026-04-09
---

# MultiHub -- Go/Wails v2 Port Plan

## Summary

Port MultiClaude (Electron 33 + React 19 + node-pty) to Go + Wails v2 + creack/pty. Result: single native binary, ~60% frontend reuse, full Go backend. Renamed to **MultiHub**.

## Architecture

```
Frontend (WebView)             Backend (Go)
React 19 + Tailwind + xterm.js  <-->  Wails bindings (auto-gen TS)
Zustand stores                  <-->  Go service structs
window.go.backend.Method()      <-->  func (s *Service) Method() Result
Wails runtime.EventsOn()        <-->  runtime.EventsEmit(ctx, ...)
```

IPC Migration: 86 Electron IPC channels --> ~45 Wails bound methods + ~12 event streams.

## Phase Overview

| # | Phase | Effort | Status | Deps | Risk |
|---|-------|--------|--------|------|------|
| 01 | [Project Scaffolding](phase-01-project-scaffolding.md) | 4h | completed | -- | Low |
| 02 | [PTY Prototype](phase-02-pty-prototype.md) | 8h | completed | 01 | **HIGH** |
| 03 | [Terminal Management](phase-03-terminal-management.md) | 12h | pending | 02 | Med |
| 04 | [Frontend Migration](phase-04-frontend-migration.md) | 20h | pending | 03 | Med |
| 05 | [Project Management](phase-05-project-management.md) | 6h | pending | 01 | Low |
| 06 | [Git Integration](phase-06-git-integration.md) | 16h | pending | 05 | Med |
| 07 | [Notification System](phase-07-notification-system.md) | 12h | pending | 03 | Med |
| 08 | [Settings & Themes](phase-08-settings-and-themes.md) | 8h | pending | 04 | Low |
| 09 | [GitHub Integration](phase-09-github-integration.md) | 6h | pending | 06 | Low |
| 10 | [Auto-Update System](phase-10-auto-update-system.md) | 8h | pending | 01 | Med |
| 11 | [Cross-Platform Packaging](phase-11-cross-platform-packaging.md) | 20h | pending | all | Med |

## Critical Path

`01 --> 02 (gate) --> 03 --> 04 --> 08 --> 11`

Phase 02 is a **go/no-go gate**: if PTY-to-xterm.js latency exceeds 50ms p99, re-evaluate Wails event emission strategy before proceeding.

## Parallel Tracks

- Track A (terminal): 01 -> 02 -> 03 -> 04
- Track B (data): 05 -> 06 -> 09
- Track C (infra): 07, 08, 10

Track B can start after Phase 01. Track C components can start after their deps.

## Key Decisions

1. **Wails v2 not v3** -- v3 is experimental; v2 is production-stable (33.6k stars)
2. **go-git v6 + exec fallback** -- pure Go for 95% of ops; shell-out for stash/edge cases
3. **JSON file persistence** -- replaces electron-store; no SQLite needed for this data shape
4. **creack/pty** -- industry standard Go PTY lib; no CGO required
5. **Reuse xterm.js** -- no Go terminal emulator matches xterm.js feature parity

## Drop List (features NOT ported)

- Vietnamese IME patcher (Electron-specific, Claude desktop only)
- `webUtils.getPathForFile()` (use Wails native file dialog instead)
- Electron-specific `powerMonitor` (replace with OS signal handlers in Go)
- `titleBarStyle: 'hidden'` (use Wails frameless window option)
