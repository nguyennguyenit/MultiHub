---
title: "MultiHub Warp-Inspired Shell Refresh"
description: "Refactor window chrome around real project tabs, persisted active-project hydration, workspace density, and palette flow so MultiHub feels closer to Warp without changing the PTY model."
status: in-progress
priority: P1
effort: 28h
branch: main
tags: [frontend, ui, ux, refactor, tdd]
blockedBy: []
blocks: []
created: 2026-04-12
mode: deep
tdd: true
---

# MultiHub Warp-Inspired Shell Refresh Plan

## Overview

Approved direction: `Approach 2`.
Goal: make MultiHub feel closer to Warp in screenshot, hierarchy, and keyboard flow.
Keep the current PTY engine, project model, right-drawer model, and shell-first architecture.
Top shell becomes a real project tab strip: `1 top tab = 1 project`.
Project tabs own project navigation; terminal pane tabs stay inside the workspace.
Persist and hydrate `activeProjectId` through the Wails project store so the selected tab stays honest across reloads and delete/switch flows.
Do not clone Warp blocks, sticky command headers, or a semantic input editor.
Current slice is implemented: persisted active-project hydration/readback, real top-shell project tabs, compact add-project affordance, overflow dropdown fallback, and palette project selection all use the same active-project path. Full plan remains open for workspace density, drawer polish, docs sync, and final regression.

## Context

- Brainstorm: [Warp-Inspired Shell Brainstorm](../reports/260412-1356-multihub-warp-inspired-shell-brainstorm.md)
- Project-tabs refinement: [Warp Project Tabs Brainstorm](../reports/260412-1459-multihub-warp-project-tabs-brainstorm.md)
- Prior shell work: [MultiHub Warp Shell-First Refactor](../260410-2225-multihub-warp-shell-first-refactor/plan.md)
- Research audit: [Current Warp-Inspired Shell Refresh Audit](./research/current-warp-inspired-shell-refresh-audit.md)
- Scout report: [Warp-Inspired Shell Refresh Scout Report](./reports/scout-report.md)
- Red team review: [Red Team Review](./reports/red-team-review.md)
- Validation: [Validation Review](./reports/validation-review.md)

## Cross-Plan Dependencies

| Relationship | Plan | Status |
|-------------|------|--------|
| Reference only | [260410-2225-multihub-warp-shell-first-refactor](../260410-2225-multihub-warp-shell-first-refactor/plan.md) | completed |
| Reference only | [260410-1825-multihub-ui-ux-workbench-redesign](../260410-1825-multihub-ui-ux-workbench-redesign/plan.md) | completed |
| Reference only | [260410-1946-github-panel-ux-ui-redesign](../260410-1946-github-panel-ux-ui-redesign/plan.md) | completed |

No blocking plan dependencies detected.

## Phase Overview

| # | Phase | Effort | Status | Deps | Risk |
|---|-------|--------|--------|------|------|
| 01 | [Regression Harness And Window-Chrome Contract](./phase-01-regression-harness-and-window-chrome-contract.md) | 4h | in-progress | -- | High |
| 02 | [Titlebar Ownership And Top-Shell Architecture](./phase-02-titlebar-ownership-and-top-shell-architecture.md) | 6h | in-progress | 01 | High |
| 03 | [Real Project Tabs And Active Project Persistence](./phase-03-session-strip-and-project-navigation-refactor.md) | 7h | completed | 02 | High |
| 04 | [Workspace Density And Attached Drawer Polish](./phase-04-workspace-density-and-attached-drawer-polish.md) | 6h | in-progress | 02,03 | Med |
| 05 | [Palette Alignment Docs And Final Regression](./phase-05-omnibox-palette-promotion-docs-and-final-regression.md) | 5h | in-progress | 03,04 | Med |

## Dependencies

- Wails-supported window/titlebar behavior only; no private native hacks
- Existing Vitest shell contract tests plus targeted e2e smoke
- Stable project/terminal lifecycle in `frontend/src/App.tsx` and `frontend/src/components/terminal/terminal-grid.tsx`
- Existing project persistence in `app-project-bindings.go` and `internal/project/store.go`
- Single source of truth for active project must stay `Toolbar/App -> api.project.setActive|getActive -> Wails project bindings -> internal/project/store.go`
- CSS ownership discipline across `shell.css`, `workspace.css`, and `panels.css`

## Success Criteria

- Window reads terminal-native, not dashboard-native, at first glance
- Top edge feels much closer to Warp in screenshot and use flow
- Real project tabs become the obvious top-shell navigation model within one glance
- Active project tab restores cleanly after reload and clears predictably on delete
- Invalid persisted `activeProjectId` self-heals to an empty/no-highlight state after folder validation
- Overflowed project tabs stay usable without reverting to dropdown-first navigation
- Palette becomes a central navigation/action entry point without pretending to be a semantic command editor
- Existing project, terminal, drawer, and keyboard behaviors stay intact under test
