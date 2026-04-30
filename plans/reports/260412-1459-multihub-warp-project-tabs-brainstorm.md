---
title: "MultiHub Warp Project Tabs Brainstorm"
date: "2026-04-12 14:59"
status: "approved"
scope: "ui-ux"
decision: "approach-2-real-project-tabs"
---

# MultiHub Warp Project Tabs Brainstorm

## Summary

User wants MultiHub shell arranged more like Warp, especially top tab feel from screenshot.
Chosen direction: `Approach 2`.
Concrete meaning: keep MultiHub PTY + pane model, but make top shell read like Warp by turning it into a real `project tab strip`.

## Findings

- Current top shell is still a control cluster, not a tab strip:
  - `frontend/src/components/toolbar/toolbar.tsx`
  - `frontend/src/components/toolbar/project-dropdown.tsx`
- Current model already supports project-level grouping:
  - `frontend/src/components/terminal/terminal-grid.tsx`
- That means `project tabs` are honest UI.
- `terminal tabs at top shell` are not honest UI because terminal panes already own lower-level tab chrome.
- Best leverage is presentation and hierarchy, not backend rewrite.

## Evaluated Approaches

### 1. Keep dropdown, style it like tabs

Pros:
- fastest
- low regression risk

Cons:
- still fake
- screenshot improves, behavior does not

### 2. Real project tabs in top shell

Pros:
- matches current project model
- feels closer to Warp in screenshot and use flow
- avoids double meaning with terminal pane tabs

Cons:
- needs toolbar layout refactor
- needs overflow handling for many projects

### 3. Top shell tabs map to terminals

Pros:
- visually most Warp-like at first glance

Cons:
- conflicts with existing pane-level terminal chrome
- creates two tab systems for same concept
- likely worse UX in multi-pane project workflows

## Final Recommendation

Use `Approach 2`.

Rule:
- `1 top tab = 1 project`
- `terminal panes stay inside workspace`
- `do not fake Warp command/session semantics`

This keeps the UI honest and gives the strongest Warp feel per unit of effort.

## Recommended Design

### Top Strip

- Replace center cluster with a horizontal project tab strip.
- Active tab shows:
  - project name
  - optional compact path segment or cwd hint
  - small terminal count badge if useful
- Inactive tabs show name only or name + very light metadata.

### Add Project Affordance

- Replace large `Open Project` CTA with a compact `+` button beside tabs.
- Keep same action: open folder and create project entry.

### Overflow

- If tabs exceed width:
  - use horizontal scroll first
  - keep dropdown fallback for overflow or quick jump
- Do not collapse back to a single main dropdown by default.

### Metadata Hierarchy

- Path should stop competing with the main tab label.
- Show full path in:
  - tooltip
  - optional slim secondary line for active tab only
  - quick switcher results

### Right Utilities

- Keep GitHub and Settings on right.
- Lower their visual weight so they read like utility icons, not peer tabs.

### Workspace Relationship

- Top strip owns project navigation.
- Workspace keeps terminal pane headers and actions.
- Do not merge project tabs with pane tabs.

## Implementation Considerations

- Main files likely:
  - `frontend/src/components/toolbar/toolbar.tsx`
  - `frontend/src/components/toolbar/project-dropdown.tsx`
  - `frontend/src/App.tsx`
  - `frontend/src/styles/shell.css`
  - `frontend/src/components/toolbar/toolbar.test.tsx`
  - `frontend/src/components/toolbar/project-dropdown.test.tsx`
  - `e2e/tests/projects.spec.ts`
- Optional extraction if toolbar grows:
  - `frontend/src/components/toolbar/top-shell-project-tab-strip.tsx`
- Keep existing project CRUD and selection handlers if possible.
- Quick switcher should remain the power path for keyboard project switching.

## Risks

- Faux-Warp drift:
  - tabs that look like terminal sessions but actually switch projects
- Overflow clutter:
  - too many tabs can become noisy if truncation is weak
- Hierarchy confusion:
  - if pane headers stay too loud, top tabs lose impact

## Success Metrics

- One screenshot reads closer to Warp immediately
- User can identify active project faster than with current dropdown shell
- Top shell feels like navigation, not a utility toolbar
- No confusion between project tabs and terminal panes
- Existing project switching behavior stays stable

## Next

- If implementation starts, phase order should be:
  1. replace current center cluster with real project tab strip
  2. add compact `+` affordance
  3. solve overflow and truncation
  4. rebalance right-side utilities
  5. regression lock with toolbar/project tests

## Unresolved Questions

- None blocking
