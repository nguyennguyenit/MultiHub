---
title: "MultiHub UI/UX Workbench Redesign"
description: "Refactor the Wails app shell to improve hierarchy, project navigation, terminal focus, panel consistency, and product identity without changing backend behavior"
status: completed
priority: P1
effort: 20h
branch: main
tags: [frontend, ui, ux, react, wails, tdd]
created: 2026-04-10
blockedBy: []
blocks: []
mode: deep
tdd: true
---

# MultiHub UI/UX Workbench Redesign Plan

## Summary

Approved direction: workbench redesign, not cosmetic-only cleanup.
Keep stores, API adapter, Wails bindings, and terminal logic intact.
Change the shell, hierarchy, empty states, and panel consistency.
Current sync: all planned work complete. Frontend verification passed with Vitest, production build, and Playwright smoke coverage.

## Context

- Brainstorm: [../reports/260410-1845-ui-ux-workbench-redesign-brainstorm.md](../reports/260410-1845-ui-ux-workbench-redesign-brainstorm.md)
- Research audit: [research/current-ui-ux-state-audit.md](./research/current-ui-ux-state-audit.md)
- Red team review: [reports/red-team-review.md](./reports/red-team-review.md)
- Validation: [reports/validation-review.md](./reports/validation-review.md)

## Phase Overview

| # | Phase | Effort | Status | Deps | Risk |
|---|-------|--------|--------|------|------|
| 01 | [Regression Harness And Style Boundaries](phase-01-regression-harness-and-style-boundaries.md) | 4h | completed | -- | Med |
| 02 | [App Shell Header And Project Navigation](phase-02-app-shell-header-and-project-navigation.md) | 5h | completed | 01 | High |
| 03 | [Terminal Workspace And Empty States](phase-03-terminal-workspace-and-empty-states.md) | 4h | completed | 02 | Med |
| 04 | [Unified Side Panels And Settings Experience](phase-04-unified-side-panels-and-settings-experience.md) | 4h | completed | 01,02 | Med |
| 05 | [Brand Sweep Docs And Final Regression](phase-05-brand-sweep-docs-and-final-regression.md) | 3h | completed | 02,03,04 | Med |

## Constraints

- No backend behavior changes.
- Preserve terminal/project/GitHub/settings flows.
- Respect Wails drag regions and macOS traffic-light spacing.
- Prefer modifying existing components; extract only when file growth/readability demands it.
- Apply tests first for every shell-level behavior touched.

## TDD Strategy

- Phase 01 introduces component-level UI regression tests and selector cleanup.
- Each later phase starts by adding or updating failing tests for the intended shell behavior.
- Use Vitest + jsdom for component structure/state tests.
- Keep Playwright smoke tests aligned with new selectors for cross-surface sanity checks.

## Success Criteria

- MultiHub branding consistent across visible UI and update links.
- Header/project navigation feels coherent and replaces the split-shell feel.
- Terminal workspace is visually primary and active-state clarity improves.
- GitHub and Settings share one panel language.
- Existing user flows still work.
- Frontend unit tests and e2e smoke coverage reflect the new shell.

## Docs Impact

- Minor.
- Roadmap/changelog updates landed with implementation.
- Missing `docs/design-guidelines.md` remains explicitly deferred.
