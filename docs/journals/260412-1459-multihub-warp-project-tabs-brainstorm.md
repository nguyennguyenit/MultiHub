---
title: "MultiHub Warp Project Tabs Brainstorm"
date: "2026-04-12 14:59"
status: "done"
---

# MultiHub Warp Project Tabs Brainstorm

## Context

User wants MultiHub shell arranged more like Warp from screenshot.
Current repo already has a Warp-inspired shell pass, so this session focused on the top strip decision, not a full redesign.

## What Happened

- Read current toolbar, project switcher, shell CSS, terminal grid, and prior brainstorm/plan docs.
- Verified current shell still uses a dropdown-centered project selector.
- Verified terminal workspace already groups by project.
- Compared three top-strip mappings:
  - fake tab styling
  - real project tabs
  - top-level terminal tabs

## Reflection

- The key decision was not visual style. It was semantic honesty.
- `1 top tab = project` fits the current data model.
- `1 top tab = terminal` would look tempting but would create double tab systems and UX drift.

## Decisions

- Approve `Approach 2`.
- Make top shell a real project tab strip.
- Keep terminal panes as second-level workspace chrome.
- Keep Warp inspiration at shell hierarchy level only.

## Next

- If user wants implementation, convert current toolbar center cluster into project tabs and compact `+` affordance.
- Keep overflow, quick switching, and tests in scope from the start.

## Unresolved Questions

- None blocking
