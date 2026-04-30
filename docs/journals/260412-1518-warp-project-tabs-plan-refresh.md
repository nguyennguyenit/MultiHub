---
title: "Warp Project Tabs Plan Refresh"
date: 2026-04-12 15:18
status: done
plan: /Users/plateau/Project/MultiHub/plans/260412-1415-multihub-warp-inspired-shell-refresh/plan.md
---

# Warp Project Tabs Plan Refresh

## Context

- Existing Warp-inspired shell plan stayed in place; this session refreshed it, not replaced it.
- Approval shifted the shell from "Warp-like" shape language to real project-tabs semantics.
- The top strip is now scoped as `1 top tab = 1 project`, with `activeProjectId` persistence/hydration treated as core scope, not a follow-up.

## What Happened

- Reworked the plan text to match the approved real-project-tabs direction.
- Folded `activeProjectId` store persistence + hydration into the main flow so tab selection survives reloads and stays honest after project changes.
- Updated phase 03 to cover the project-tab/session-strip refactor instead of a generic chrome pass.
- Updated phase 05 to cover the validation/red-team pass around the new tab contract, not just the palette polish.
- Tightened the deep/TDD framing so the plan tests the semantics first, then the shell polish.

## Decisions

- Keep the existing plan and edit it in place.
- Treat project tabs as first-class navigation, not visual garnish.
- Preserve terminal-pane tabs as second-level workspace chrome.
- Make `activeProjectId` persistence/hydration a required part of correctness.
- Refresh red-team and validation work to check state truth, overflow behavior, and regression risk.

## Next

- Execute the refreshed plan against the real project-tab contract.
- Verify reload, delete, and switch flows keep `activeProjectId` aligned with the visible tab.
- Carry the updated phase 03 and phase 05 scope into implementation and validation.

## Unresolved Questions

- How should overflowed project tabs behave at small widths without falling back to dropdown-first navigation?
- Should invalid persisted `activeProjectId` self-heal silently or leave a visible no-selection state?
- Is any extra red-team case needed for project deletion while a tab is active?

**Status:** DONE
**Summary:** Plan refreshed in place for approved real project tabs and `activeProjectId` hydration.
**Concerns/Blockers:** None
