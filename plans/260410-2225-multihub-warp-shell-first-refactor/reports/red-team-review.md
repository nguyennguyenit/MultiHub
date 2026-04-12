---
title: "Red Team Review"
date: "2026-04-10 22:36"
status: "completed"
---

# Red Team Review

## Findings

1. Medium: top-shell scope originally ignored `UpdateBanner`, so the toolbar could get denser while the total top stack still stayed tall. Fixed in [phase-03-compressed-top-shell-and-project-navigation.md](../phase-03-compressed-top-shell-and-project-navigation.md).
2. Medium: workspace plan originally did not lock the ambiguous `activeProjectId === null` + scoped-terminals case before visual refactor. Fixed in [phase-04-terminal-workspace-density-and-pane-chrome.md](../phase-04-terminal-workspace-density-and-pane-chrome.md).
3. Low: cleanup phase originally implied alias removal could happen late, which conflicted with the plan-level constraint to preserve `--mc-*` compatibility. Fixed in [phase-07-cleanup-docs-and-final-regression-lock.md](../phase-07-cleanup-docs-and-final-regression-lock.md).

## Summary

No blocking plan flaw remains after the follow-up edits.
Main residual risk is execution discipline on hotspot files:
- `frontend/src/App.tsx`
- `frontend/src/styles/globals.css`
- `frontend/src/styles/panels.css`
- `frontend/src/components/terminal/terminal-pane.tsx`

## Recommendations

- Keep one owner per hotspot file per phase.
- Do not merge phase 01 and phase 02 during execution.
- Treat `visibility:hidden` behavior as a hard regression boundary.

## Unresolved Questions

- None
