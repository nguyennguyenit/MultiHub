# Phase 04 - Terminal Workspace Density And Pane Chrome

## Context Links

- [Plan Overview](./plan.md)
- [Phase 03](./phase-03-compressed-top-shell-and-project-navigation.md)
- [frontend/src/App.tsx](../../frontend/src/App.tsx)
- [frontend/src/components/terminal/terminal-grid.tsx](../../frontend/src/components/terminal/terminal-grid.tsx)
- [frontend/src/components/terminal/terminal-pane.tsx](../../frontend/src/components/terminal/terminal-pane.tsx)
- [frontend/src/components/terminal/terminal-action-bar.tsx](../../frontend/src/components/terminal/terminal-action-bar.tsx)
- [frontend/src/components/terminal/terminal-empty-state.tsx](../../frontend/src/components/terminal/terminal-empty-state.tsx)
- [frontend/src/components/welcome-screen.tsx](../../frontend/src/components/welcome-screen.tsx)
- [frontend/src/styles/workspace.css](../../frontend/src/styles/workspace.css)

## Overview

- Priority: P1
- Current status: pending
- Brief: make terminal space dominant and turn the current pane “tab bar” into tighter pane chrome

## Key Insights

- Workspace mechanics and styling are fragmented across `globals.css`, `workspace.css`, and `panels.css`.
- `TerminalPane` already owns many local actions; shell density work should reduce duplication before moving actions upward.
- `TerminalGrid` uses a state-preserving hidden-project strategy that must survive the refactor.

## Requirements

- Reduce workspace framing, padding, and chrome weight.
- Improve active-pane emphasis and inactive-pane recession.
- Simplify terminal action surfaces without breaking `New Terminal`, `Kill All`, refresh, rename, scroll, or file insert behaviors.

## Architecture

- Keep `TerminalGrid` grouping and `visibility:hidden` strategy.
- Rename/support pane chrome semantics without altering terminal rendering internals.
- Treat action consolidation as presentation work first; do not rewrite terminal hooks yet.

## Related Code Files

### Modify

- `frontend/src/App.tsx`
- `frontend/src/components/terminal/terminal-grid.tsx`
- `frontend/src/components/terminal/terminal-pane.tsx`
- `frontend/src/components/terminal/terminal-action-bar.tsx`
- `frontend/src/components/terminal/terminal-empty-state.tsx`
- `frontend/src/components/welcome-screen.tsx`
- `frontend/src/styles/globals.css`
- `frontend/src/styles/workspace.css`
- `frontend/src/styles/panels.css`
- `frontend/src/components/terminal/terminal-grid.test.tsx`
- `frontend/src/components/terminal/terminal-action-bar.test.tsx`
- `frontend/src/components/terminal/terminal-empty-state.test.tsx`
- `frontend/src/components/welcome-screen.test.tsx`
- `e2e/tests/terminal.spec.ts`

## File Inventory

| File | Action | Rough Size | Test Impact |
|------|--------|-----------:|-------------|
| `frontend/src/App.tsx` | modify | 378 lines | updates workspace stack and visible terminal semantics |
| `frontend/src/components/terminal/terminal-grid.tsx` | modify | 206 lines | pane layout and active-state behavior |
| `frontend/src/components/terminal/terminal-pane.tsx` | modify | 313 lines | pane header density and local actions |
| `frontend/src/components/terminal/terminal-action-bar.tsx` | modify | 122 lines | de-emphasize standalone action bar |
| `frontend/src/components/terminal/terminal-empty-state.tsx` | modify | existing | denser empty-state messaging |
| `frontend/src/components/welcome-screen.tsx` | modify | 38 lines | calmer no-project landing surface |
| `frontend/src/styles/workspace.css` | modify | 115 lines | workspace framing and empty-state sizing |
| `frontend/src/styles/panels.css` | modify | 674 lines | remove accidental action-bar overrides |

## Test Scenario Matrix

| Priority | Scenario | Expected |
|----------|----------|----------|
| Critical | Inactive project groups stay mounted | terminal state is preserved |
| Critical | New Terminal and Kill All | remain explicit and correct |
| High | No active project + scoped terminals | current intended behavior is explicitly locked before refactor |
| High | Active pane emphasis | current pane is obvious without breaking click activation |
| High | No-project vs no-terminal states | correct empty state appears in each case |
| Medium | Workspace density with drawers closed | shell feels materially lighter |

## Function / Interface Checklist

- `TerminalGrid`
- `TerminalPane`
- `TerminalActionBar`
- `TerminalEmptyState`
- `WelcomeScreen`
- `useTerminalResize`
- `TerminalView` refresh/scroll handles

## Dependency Map

- Depends on: Phase 03
- Unlocks:
  - Phase 04 visually docked drawers
  - Phase 05 palette terminal actions

## Tests Before

1. Expand `terminal-grid.test.tsx` for project grouping, active-pane, and empty-state behavior.
2. Add a regression test that documents current intended behavior when `activeProjectId` is `null` but project-scoped terminals still exist.
3. Expand `terminal-action-bar.test.tsx` for explicit destructive-action semantics.
4. Expand welcome/terminal-empty-state tests before copy or layout changes.

## Refactor

1. Flatten workspace framing and reduce card-heavy styling.
2. Tighten pane chrome while preserving local action affordances.
3. Remove style leakage where `panels.css` overrides workspace action styles.

## Tests After

1. Terminal unit tests pass with the denser workspace.
2. Terminal smoke still proves shell load, GitHub open, and empty-state CTA.
3. Build passes with no terminal rendering regressions.

## Regression Gate

- `cd /Users/plateau/Project/MultiHub/frontend && npm test -- --run`
- `cd /Users/plateau/Project/MultiHub/frontend && npm run build`
- `cd /Users/plateau/Project/MultiHub/e2e && npm test -- tests/terminal.spec.ts`

## Implementation Steps

1. Protect current workspace behavior with focused tests.
2. Resolve or explicitly preserve the `activeProjectId === null` workspace behavior before visual churn deepens it.
3. Rework workspace padding, background treatment, and pane header density.
4. Reduce action-bar dominance and keep destructive actions confirmed.
5. Verify the grid still preserves state and click activation.

## Todo List

- [ ] Protect terminal grouping and empty states with tests
- [ ] Tighten pane chrome
- [ ] Reduce action-bar prominence
- [ ] Preserve terminal state retention

## Success Criteria

- Terminal area clearly dominates the viewport
- Pane chrome reads modern and lighter
- No state loss when switching project or panel visibility

## Risk Assessment

- Risk: density changes accidentally alter layout-key persistence or active-pane semantics
- Risk: undefined current behavior around `activeProjectId === null` becomes a user-visible regression
- Mitigation: keep the grid/state model intact and treat layout math changes carefully

## Security Considerations

- No direct security impact
- Keep destructive actions explicit and confirmed

## Next Steps

- Move to Phase 05 after workspace density and state retention are stable
