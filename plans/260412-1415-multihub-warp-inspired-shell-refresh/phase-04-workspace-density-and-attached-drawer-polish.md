# Phase 04 - Workspace Density And Attached Drawer Polish

## Context Links

- [Plan Overview](./plan.md)
- [Phase 02](./phase-02-titlebar-ownership-and-top-shell-architecture.md)
- [Phase 03](./phase-03-session-strip-and-project-navigation-refactor.md)
- [frontend/src/App.tsx](../../frontend/src/App.tsx)
- [frontend/src/components/terminal/terminal-pane.tsx](../../frontend/src/components/terminal/terminal-pane.tsx)
- [frontend/src/components/terminal/terminal-action-bar.tsx](../../frontend/src/components/terminal/terminal-action-bar.tsx)
- [frontend/src/components/slide-panel/slide-panel.tsx](../../frontend/src/components/slide-panel/slide-panel.tsx)
- [frontend/src/components/welcome-screen.tsx](../../frontend/src/components/welcome-screen.tsx)
- [frontend/src/styles/workspace.css](../../frontend/src/styles/workspace.css)
- [frontend/src/styles/panels.css](../../frontend/src/styles/panels.css)

## Overview

- Priority: P1
- Current status: in-progress
- Brief: flatten the work area so the terminal becomes dominant and drawers feel more like attached utilities than floating cards

## Key Insights

- Current workspace still feels a bit card-heavy for the Warp direction, especially around pane shells, outer radius, and shadows.
- `TerminalPane` and `TerminalActionBar` already own the actions that matter; this phase should reduce noise, not add new control layers.
- `panels.css` is already 800+ lines. Any substantial drawer refinement should either clearly stay within ownership boundaries or split into smaller focused files.

## Requirements

- Reduce outer card feel, radius, and shadow weight around the terminal workspace.
- Make active pane emphasis clearer with less decorative chrome.
- Keep `New Terminal`, `Kill All`, refresh, rename, scroll, and file-insert actions available.
- Make right drawers read attached and subordinate to terminal work, not modal.
- Preserve hidden-while-mounted terminal and drawer lifecycles.

## Architecture

- Keep `TerminalGrid` and `SlidePanel` behavior intact; change styling and presentational composition first.
- De-emphasize the standalone action bar if that improves hierarchy, but do not bury important actions.
- If drawer styling work keeps `panels.css` unwieldy, split by ownership rather than growing one mega-file.

## Related Code Files

### Modify

- `frontend/src/App.tsx`
- `frontend/src/components/terminal/terminal-pane.tsx`
- `frontend/src/components/terminal/terminal-action-bar.tsx`
- `frontend/src/components/slide-panel/slide-panel.tsx`
- `frontend/src/components/welcome-screen.tsx`
- `frontend/src/styles/workspace.css`
- `frontend/src/styles/panels.css`
- `frontend/src/components/terminal/terminal-action-bar.test.tsx`
- `frontend/src/components/slide-panel/slide-panel.test.tsx`
- `frontend/src/components/github-view/github-panel-layout.test.tsx`
- `frontend/src/components/welcome-screen.test.tsx`
- `e2e/tests/terminal.spec.ts`
- `e2e/tests/settings.spec.ts`

### Create

- `frontend/src/styles/drawer-shell.css` if panel ownership split becomes necessary
- `frontend/src/components/terminal/terminal-pane-header.tsx` if header extraction reduces `terminal-pane.tsx` complexity

### Delete

- None

## File Inventory

| File | Action | Rough Size | Test Impact |
|------|--------|-----------:|-------------|
| `frontend/src/components/terminal/terminal-pane.tsx` | modify | 313 lines | pane-header density and action locality |
| `frontend/src/components/terminal/terminal-action-bar.tsx` | modify | 122 lines | action-bar de-emphasis without behavior loss |
| `frontend/src/components/slide-panel/slide-panel.tsx` | modify | 93 lines | tighter attached-drawer shell |
| `frontend/src/styles/workspace.css` | modify | 537 lines | outer frame, pane chrome, workspace spacing |
| `frontend/src/styles/panels.css` | modify | 824 lines | drawer shell, palette shell, attached treatment |
| `frontend/src/components/welcome-screen.tsx` | modify | 35 lines | calmer no-project landing surface |

## Test Scenario Matrix

| Priority | Scenario | Expected |
|----------|----------|----------|
| Critical | Hidden project groups | remain mounted and stateful |
| Critical | Attached right drawer | Escape and toolbar toggles still work |
| High | Active pane emphasis | obvious without excessive decoration |
| High | Terminal actions | new terminal and destructive actions remain explicit |
| High | Welcome/no-project state | simpler but still directional |
| Medium | CSS ownership split | no accidental style leakage between workspace and drawers |

## Function / Interface Checklist

- `TerminalPane`
- `TerminalActionBar`
- `SlidePanel`
- `WelcomeScreen`
- workspace and panel CSS ownership boundaries

## Dependency Map

- Depends on: Phase 02, Phase 03
- Unlocks:
  - Phase 05 palette promotion and final polish

## Tests Before

1. Expand terminal-action, drawer, and welcome-state tests for current behavior.
2. Keep GitHub/settings drawer tests guarding their current mount/lifecycle assumptions.
3. Add any missing assertions around attached drawer semantics before tightening styling further.

## Refactor

1. Flatten the workspace shell and reduce card-heavy treatment.
2. Tighten pane chrome and drawer chrome without changing terminal mechanics.
3. Split oversized style ownership only if the diff gets materially cleaner and easier to reason about.

## Tests After

1. Terminal, drawer, and welcome-state tests pass.
2. Terminal and settings smoke still pass.
3. Build passes with no CSS ownership regressions.

## Regression Gate

- `cd /Users/plateau/Project/MultiHub/frontend && npm test -- --run`
- `cd /Users/plateau/Project/MultiHub/frontend && npm run build`
- `cd /Users/plateau/Project/MultiHub/e2e && npm test -- tests/terminal.spec.ts tests/settings.spec.ts`

## Implementation Steps

1. Reduce outer frame and pane noise first.
2. Rework attached drawer styling second.
3. Simplify the welcome surface last so shell hierarchy stays coherent.

## Todo List

- [x] Flatten workspace chrome
- [ ] Tighten pane header/action treatment
- [x] Polish attached right drawers
- [ ] Keep style ownership readable

## Success Criteria

- Terminal area dominates visually
- Drawers feel attached and subordinate
- Shell no longer reads like nested cards

## Risk Assessment

- Too much flattening can hurt affordance and click targets
- CSS churn in already-large files can create unintended regressions

## Security Considerations

- Preserve clear destructive-action semantics for terminal kill flows
- Do not hide critical controls behind ambiguous icon-only affordances

## Next Steps

- Phase 05 can promote the palette/omnibox and finish docs/regression lock
