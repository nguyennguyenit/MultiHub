---
title: "MultiHub Warp Shell-First Refactor"
description: "Refactor the MultiHub shell into a denser Warp-inspired workspace with attached right drawers and a lightweight quick switcher while preserving current backend behavior."
status: completed
priority: P1
effort: 28h
branch: main
tags: [frontend, refactor, ui, ux, tdd]
blockedBy: []
blocks: []
created: 2026-04-10
mode: deep
tdd: true
---

# MultiHub Warp Shell-First Refactor

## Overview

Delivered shell-first, cross-platform, right drawer, lightweight `Cmd/Ctrl+K` switcher refactor in phase-1 release scope.
Do not clone Warp blocks, editor, or agent model.
Keep Wails bindings, Zustand stores, terminal engine, and current backend behavior intact.

## Context

- Brainstorm: [../reports/260410-2217-multihub-warp-shell-first-brainstorm.md](../reports/260410-2217-multihub-warp-shell-first-brainstorm.md)
- Research audit: [./research/current-shell-first-refactor-audit.md](./research/current-shell-first-refactor-audit.md)
- Red team review: [./reports/red-team-review.md](./reports/red-team-review.md)
- Validation: [./reports/validation-review.md](./reports/validation-review.md)
- Prior shell work: [../260410-1825-multihub-ui-ux-workbench-redesign/plan.md](../260410-1825-multihub-ui-ux-workbench-redesign/plan.md)
- Prior GitHub panel work: [../260410-1946-github-panel-ux-ui-redesign/plan.md](../260410-1946-github-panel-ux-ui-redesign/plan.md)

## Cross-Plan Dependencies

| Relationship | Plan | Status |
|-------------|------|--------|
| Reference only | [MultiHub UI/UX Workbench Redesign](../260410-1825-multihub-ui-ux-workbench-redesign/plan.md) | completed |
| Reference only | [GitHub Panel UX/UI Redesign](../260410-1946-github-panel-ux-ui-redesign/plan.md) | completed |

No blocking plan dependencies detected.

## Scope Challenge

- Existing code: `Toolbar`, `ProjectDropdown`, `TerminalGrid`, `TerminalPane`, `SlidePanel`, `GitHubPanelContent`, and `SettingsPanelContent` are reusable seams.
- Minimum changes: refactor shell hierarchy, workspace chrome, drawer language, and keyboard switcher. Do not change backend contracts or clone Warp product model.
- Complexity: touches 15+ existing files, adds palette UI and new tests, and must preserve terminal state + panel behavior. Seven phases justified.
- Selected mode: HOLD SCOPE

## Constraints

- No Go/Wails/backend behavior changes.
- Keep drawers overlayed but visually docked in first pass; do not shrink terminal workspace yet.
- Preserve `visibility:hidden` state-retention strategy in `TerminalGrid` and `SlidePanel`.
- Keep `SettingsPanelContent` tab persistence and current cancel/save semantics.
- Do not remove `--mc-*` alias variables in this pass; normalize short-token ownership first.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Regression Harness And Shell Contract](./phase-01-regression-harness-and-shell-contract.md) | Completed |
| 2 | [Token Ownership And Shell Frame Stabilization](./phase-02-token-ownership-and-shell-frame-stabilization.md) | Completed |
| 3 | [Compressed Top Shell And Project Navigation](./phase-03-compressed-top-shell-and-project-navigation.md) | Completed |
| 4 | [Terminal Workspace Density And Pane Chrome](./phase-04-terminal-workspace-density-and-pane-chrome.md) | Completed |
| 5 | [Attached Right Drawers And Panel Lifecycle](./phase-05-attached-right-drawers-and-panel-lifecycle.md) | Completed |
| 6 | [Quick Switcher Palette And Keyboard Routing](./phase-06-quick-switcher-palette-and-keyboard-routing.md) | Completed |
| 7 | [Cleanup Docs And Final Regression Lock](./phase-07-cleanup-docs-and-final-regression-lock.md) | Completed |

## TDD Strategy

- Component-first Vitest is the main regression harness.
- Playwright remains targeted smoke only.
- Each phase starts with failing tests for selectors, interaction semantics, and focus/state retention before visual refactor begins.

## Success Criteria

- App reads terminal-first at first glance.
- Toolbar, action stack, and pane chrome are materially denser without harming usability.
- GitHub and Settings feel like attached utility drawers, not floating cards.
- `Cmd/Ctrl+K` switcher opens fast and routes projects, terminals, drawers, and common actions.
- Frontend tests, build, and targeted E2E smoke stay green.

## Docs Impact

- Minor to medium.
- Roadmap/changelog updated in phase 07.
- No new evergreen design doc required unless the refactor establishes a durable shell-token contract worth documenting.
