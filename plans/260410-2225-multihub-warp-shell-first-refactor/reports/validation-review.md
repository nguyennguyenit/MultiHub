---
title: "Validation Review"
date: "2026-04-10 22:36"
status: "completed"
---

# Validation Review

## Critical Questions

1. Does the plan keep backend and store scope under control?
Pass.
Answer: yes. Every phase stays inside frontend shell, CSS, tests, and existing callbacks. Backend/Wails/PTTY/Git behavior is explicitly out of scope.

2. Is the CSS ownership problem isolated early enough?
Pass.
Answer: yes. Phase 02 exists only to stabilize token ownership before visible density work starts.

3. Does the plan preserve the state-retention tricks the current UI depends on?
Pass.
Answer: yes. Phase 01 locks hidden-panel and hidden-grid semantics before any layout rewrite.

4. Is the drawer decision concrete enough to implement?
Pass.
Answer: yes. The plan fixes the first-pass choice: drawers stay overlayed but become visually docked. No terminal-width-resizing sidebar in this release.

5. Is the palette scope constrained enough to avoid turning into a second product?
Pass.
Answer: yes. Phase 06 limits palette actions to projects, terminals, drawers, and a few common shell actions using in-memory frontend state only.

6. Does the plan address the biggest hotspot files directly?
Pass.
Answer: yes. `App.tsx`, `globals.css`, `panels.css`, and `terminal-pane.tsx` are called out repeatedly as single-owner hotspots.

7. Is cleanup deferred late enough to avoid destabilizing the refactor?
Pass with note.
Answer: yes. Cleanup is phase 07. Alias removal is no longer assumed; default is retain unless a repo-wide audit proves zero consumers.

8. Are regression gates realistic?
Pass with note.
Answer: frontend unit/build gates are solid. E2E gate assumes the `e2e/` workspace dependencies are installed and runnable; treat that as an execution preflight, not a planning blocker.

## Recommendations

- Execute strictly sequentially.
- Keep palette in its own phase.
- Do not expand the command catalog during implementation.
- If the `activeProjectId === null` terminal behavior is ambiguous in tests, decide it once in phase 04 and document the chosen behavior.

## Verdict

Plan is valid for `/ck:cook` execution.

## Unresolved Questions

- None
