# MultiHub Warp-Inspired Shell Refresh Plan Journal

## Context

Created a deep TDD implementation plan after the user approved `Approach 2`.
Scope is Warp-inspired shell evolution, not a Warp clone.

## What Happened

- Scanned existing plans. Relevant Warp/UI plans were already completed, so no blocking dependency update was needed.
- Audited current shell, palette, drawer, workspace, and Wails window config surfaces.
- Wrote a 5-phase plan focused on titlebar ownership, session hierarchy, workspace density, drawer polish, and omnibox promotion.
- Added internal red-team and validation reports so the plan records its key constraints instead of pretending they are obvious.

## Decisions

- Keep PTY model unchanged
- Stay inside supported Wails window behavior
- Keep attached right drawers
- Promote palette, but not into a semantic command editor
- Add modularization checkpoints for oversized shell files

## Next

- Execute with `/ck:cook` in TDD mode

## Unresolved Questions

- None blocking
