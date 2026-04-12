# Phase 05 - Attached Right Drawers And Panel Lifecycle

## Context Links

- [Plan Overview](./plan.md)
- [Phase 04](./phase-04-terminal-workspace-density-and-pane-chrome.md)
- [frontend/src/App.tsx](../../frontend/src/App.tsx)
- [frontend/src/components/slide-panel/slide-panel.tsx](../../frontend/src/components/slide-panel/slide-panel.tsx)
- [frontend/src/components/github-view/github-view.tsx](../../frontend/src/components/github-view/github-view.tsx)
- [frontend/src/components/settings/settings-panel-content.tsx](../../frontend/src/components/settings/settings-panel-content.tsx)
- [frontend/src/components/settings/settings-sidebar.tsx](../../frontend/src/components/settings/settings-sidebar.tsx)
- [frontend/src/styles/panels.css](../../frontend/src/styles/panels.css)

## Overview

- Priority: P1
- Current status: completed
- Brief: turn GitHub and Settings into visually docked utility drawers without changing their core behavior

## Key Insights

- Current panel feel is driven by absolute floating-card positioning, not only color and radius.
- GitHub and Settings already share one `activePanel` state machine but have different mount lifecycles.
- The safest first pass is a docked overlay look, not a terminal-resizing sidebar.

## Requirements

- Make drawers look attached to the shell edge.
- Keep Escape close, toolbar toggle state, settings cancel semantics, and GitHub tab behavior intact.
- Preserve current lifecycle asymmetry: settings content stays mounted, GitHub content mounts only while open.

## Architecture

- Extend `SlidePanel` styling and shell contract; do not fork drawer containers.
- Keep drawers overlayed in the same shell layer for this pass.
- Leave `settings-modal.tsx` untouched until cleanup validates it is dead.

## Related Code Files

### Modify

- `frontend/src/App.tsx`
- `frontend/src/components/slide-panel/slide-panel.tsx`
- `frontend/src/components/github-view/github-view.tsx`
- `frontend/src/components/settings/settings-panel-content.tsx`
- `frontend/src/components/settings/settings-sidebar.tsx`
- `frontend/src/styles/globals.css`
- `frontend/src/styles/panels.css`
- `frontend/src/components/slide-panel/slide-panel.test.tsx`
- `frontend/src/components/github-view/github-panel-layout.test.tsx`
- `e2e/tests/settings.spec.ts`
- `e2e/tests/terminal.spec.ts`

### Create

- `frontend/src/components/settings/settings-panel-content.test.tsx` if Phase 01 did not already add it

### Delete

- None

## File Inventory

| File | Action | Rough Size | Test Impact |
|------|--------|-----------:|-------------|
| `frontend/src/App.tsx` | modify | 378 lines | drawer mounting and toggle behavior |
| `frontend/src/components/slide-panel/slide-panel.tsx` | modify | 86 lines | docked overlay contract |
| `frontend/src/components/github-view/github-view.tsx` | modify | 208 lines | tab content adapts to attached drawer shell |
| `frontend/src/components/settings/settings-panel-content.tsx` | modify | existing | settings interior spacing and footer fit |
| `frontend/src/components/settings/settings-sidebar.tsx` | modify | existing | stable tab/test anchors |
| `frontend/src/styles/panels.css` | modify | 674 lines | major drawer look-and-feel rewrite |
| `frontend/src/styles/globals.css` | modify | 2057 lines | shared open/close/transform mechanics |
| `frontend/src/components/github-view/github-panel-layout.test.tsx` | modify | existing | drawer contract stays protected |

## Test Scenario Matrix

| Priority | Scenario | Expected |
|----------|----------|----------|
| Critical | Drawer open/close | toolbar toggles and Escape still work |
| Critical | Settings cancel behavior | leaving settings still resets pending edits |
| High | GitHub summary and tabs | remain visible and usable in docked drawer shell |
| High | Settings tab persistence | preserved across closes |
| Medium | Drawer docked visual | reads attached without shrinking terminal area |

## Function / Interface Checklist

- `SlidePanel`
- `GitHubPanelContent`
- `SettingsPanelContent`
- `SettingsSidebar`
- `TEST_IDS.panel.*`

## Dependency Map

- Depends on: Phase 04
- Unlocks:
  - Phase 05 palette drawer actions
  - Phase 06 cleanup of legacy modal/dead panel code

## Tests Before

1. Expand `slide-panel.test.tsx` for docked overlay contract and Escape behavior.
2. Expand GitHub layout tests to protect summary/tabs inside the new shell.
3. Add or expand settings content tests for sidebar switching and footer actions.

## Refactor

1. Rework panel shell styling to look docked rather than floating.
2. Preserve overlay layout participation and current panel lifecycles.
3. Do not re-architect drawer state, focus model, or content IA beyond what attached styling demands.

## Tests After

1. Unit tests pass for panel shell, GitHub tabs, and settings sidebar.
2. Settings and terminal smoke tests still pass.
3. Build passes without CSS/import-order regressions.

## Regression Gate

- `cd /Users/plateau/Project/MultiHub/frontend && npm test -- --run`
- `cd /Users/plateau/Project/MultiHub/frontend && npm run build`
- `cd /Users/plateau/Project/MultiHub/e2e && npm test -- tests/terminal.spec.ts tests/settings.spec.ts`

## Implementation Steps

1. Lock current panel behavior with focused tests.
2. Shift panel shell from floating card to docked overlay styling.
3. Adjust GitHub and settings interior spacing for the new shell.
4. Re-check toolbar toggle, Escape close, and settings cancel semantics.

## Todo List

- [x] Protect drawer lifecycle behavior
- [x] Make drawers visually docked
- [x] Keep settings/GitHub semantics stable
- [x] Verify smoke coverage

## Success Criteria

- Right drawers feel attached to the shell edge
- GitHub and Settings remain behaviorally stable
- No unexpected terminal-resize side effects are introduced

## Risk Assessment

- Risk: panel refactor subtly changes focus, Escape, or settings reset behavior
- Mitigation: protect those paths with direct unit tests before restyling

## Security Considerations

- No direct security impact
- Keep repo/account info exposure unchanged; no new data surfaces

## Next Steps

- Completed; drawer attachment and lifecycle checks landed.
