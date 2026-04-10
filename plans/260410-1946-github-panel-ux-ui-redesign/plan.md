---
title: "GitHub Panel UX/UI Redesign"
description: "Restructure the GitHub side panel into a wider, tabbed repo cockpit with clearer hierarchy while preserving existing Git and GitHub behavior"
status: completed
priority: P1
effort: 14h
branch: main
tags: [frontend, ui, ux, github, react, tdd]
blockedBy: []
blocks: []
created: 2026-04-10
mode: deep
tdd: true
---

# GitHub Panel UX/UI Redesign Plan

## Overview

Approved design: keep one `GitHub` panel, but stop treating it like a cramped accordion dump.
Goal: turn current panel into a repo cockpit with better hierarchy, clearer actions, and a desktop-sized layout.
Backend behavior stays intact. Existing hooks and API surface stay intact unless a small view-model seam is needed.

Implementation complete and verified locally: frontend vitest 10/10 files, 26/26 tests; frontend build passes; targeted Playwright smoke 5/5; GitHub width band finalized at 460px.

## Context

- Brainstorm: [GitHub Panel UX/UI Brainstorm](../reports/260410-1940-github-panel-ux-ui-brainstorm.md)
- Related completed shell work: [MultiHub UI/UX Workbench Redesign](../260410-1825-multihub-ui-ux-workbench-redesign/plan.md)
- Research audit: [Current GitHub Panel UI Audit](./research/current-github-panel-ui-audit.md)
- Scout report: [GitHub Panel Scout Report](./reports/scout-report.md)
- Red team review: [Red Team Review](./reports/red-team-review.md)
- Validation: [Validation Review](./reports/validation-review.md)

## Scope Challenge

- Existing code:
  - `SlidePanel` already provides the container shell.
  - `useGitPanel` already centralizes repo state and local Git actions.
  - `RepoInfoHeader` and `GitHubActionBar` already contain reusable summary/action ideas.
  - `SettingsPanelContent` already shows a cleaner tabbed side-panel language worth copying.
- Minimum changes:
  - widen panel
  - replace top-level accordion stack with summary + tabs
  - move auth/account out of footer treatment
  - re-balance commit composer
  - add regression coverage for the new IA
- Complexity:
  - touches 10+ existing frontend files
  - likely needs 4-6 new focused components because current files exceed the repo’s modularity threshold
  - 5 phases justified because tests, panel shell, changes workflow, GitHub/history surfaces, and regression/polish are distinct risk buckets
- Selected mode:
  - HOLD SCOPE
  - user already approved one specific direction; do not expand into a full shell redesign or split local Git into a second panel

## Cross-Plan Dependencies

| Relationship | Plan | Status |
|-------------|------|--------|
| Reference only | [MultiHub UI/UX Workbench Redesign](../260410-1825-multihub-ui-ux-workbench-redesign/plan.md) | completed |

No blocking plan dependencies detected. Relevant prior work is complete.

## Phase Overview

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Regression Harness And Panel Contract](./phase-01-regression-harness-and-panel-contract.md) | Completed |
| 2 | [Panel Shell Width And Repo Summary](./phase-02-panel-shell-width-and-repo-summary.md) | Completed |
| 3 | [Changes Tab And Commit Composer Refactor](./phase-03-changes-tab-and-commit-composer-refactor.md) | Completed |
| 4 | [History And GitHub Collaboration Tabs](./phase-04-history-and-github-collaboration-tabs.md) | Completed |
| 5 | [Integration Polish And Final Regression](./phase-05-integration-polish-and-final-regression.md) | Completed |

## Constraints

- Keep panel label `GitHub`.
- Do not change Go backend or Wails bindings.
- Keep `useGitPanel` behavior stable unless extracting a local presentational seam.
- Respect current keyboard entry points and close behavior.
- Prefer modifying existing files, but split files that already violate the project’s modularity threshold.
- `docs/development-rules.md` is missing; use `docs/code-standards.md`, `docs/codebase-summary.md`, and current repo instructions as the operative standard.

## TDD Strategy

- Every phase starts with tests or selector work that fails against the current UI contract.
- Prefer unit coverage for structure/state, then Playwright smoke for open/close and tab-level visibility.
- Add focused `data-testid` anchors for new tabs/summary blocks before visual refactors.
- Protect behavior first, then move structure.

## Deep-Mode Focus

- Each phase includes a file inventory table, test matrix, function/interface checklist, and dependency map.
- Main risk is not logic correctness. Main risk is UI drift, selector breakage, and hidden regressions from moving large components around.
- Component decomposition is part of the plan, not an optional cleanup.

## Success Criteria

- GitHub panel reads like one deliberate workflow: status first, actions second, detail third.
- Desktop panel no longer feels width-starved.
- `Changes`, `History`, and `GitHub` tabs isolate concerns cleanly.
- Commit composer no longer dominates the panel when the user is only inspecting repo state.
- Auth, issues, and PRs remain available without polluting local Git workflows.
- Frontend tests and smoke coverage describe the new panel contract.

## Risks

- Wider panel can steal too much width from terminals if not capped carefully.
- Large files (`github-view.tsx`, `github-account-section.tsx`, `commit-form.tsx`, `globals.css`, `App.tsx`) invite messy edits if not modularized.
- Hidden/conditional tab content can regress keyboard focus or stale data assumptions.
- Playwright smoke can become brittle if selectors rely on text instead of stable ids.

## Docs Impact

- Minor.
- Implementation should update roadmap/changelog only if user-facing shell behavior materially changes.

## Unresolved Questions

- None blocking. Default desktop width band settled at `460px`.
