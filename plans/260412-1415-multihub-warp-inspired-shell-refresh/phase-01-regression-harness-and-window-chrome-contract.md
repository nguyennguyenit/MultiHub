# Phase 01 - Regression Harness And Window-Chrome Contract

## Context Links

- [Plan Overview](./plan.md)
- [Research Audit](./research/current-warp-inspired-shell-refresh-audit.md)
- [Scout Report](./reports/scout-report.md)
- [Prior Warp Plan](../260410-2225-multihub-warp-shell-first-refactor/plan.md)
- [frontend/src/App.tsx](../../frontend/src/App.tsx)
- [frontend/src/components/toolbar/toolbar.tsx](../../frontend/src/components/toolbar/toolbar.tsx)
- [frontend/src/components/toolbar/project-dropdown.tsx](../../frontend/src/components/toolbar/project-dropdown.tsx)
- [frontend/src/components/slide-panel/slide-panel.tsx](../../frontend/src/components/slide-panel/slide-panel.tsx)
- [frontend/src/styles/shell.css](../../frontend/src/styles/shell.css)
- [main.go](../../main.go)

## Overview

- Priority: P1
- Current status: in-progress
- Brief: freeze shell, titlebar, drawer, and palette contracts before visuals move again

## Key Insights

- Current shell already has decent test coverage, but not around titlebar ownership or Warp-like top-edge hierarchy.
- Wails titlebar changes can break drag regions and macOS traffic-light spacing if moved before tests.
- `App.tsx`, `shell.css`, `workspace.css`, and `panels.css` already exceed the repo's preferred file size threshold; this refactor must guard behavior before any modularization.

## Requirements

- Add regression coverage for top-shell anchors, project/session affordances, drawer attachment, and palette role.
- Lock the expected behavior for custom drag regions and non-drag controls before changing window chrome.
- Protect existing project switching, terminal visibility, and drawer lifecycle behavior.

## Architecture

- Use focused component tests plus lightweight shell contract tests as the safety net.
- Treat titlebar ownership as a contract problem first, not a styling problem.
- Keep implementation changes minimal in this phase; prefer test additions and explicit style-contract assertions only.

## Related Code Files

### Modify

- `frontend/src/App.test.tsx`
- `frontend/src/components/toolbar/toolbar.test.tsx`
- `frontend/src/components/toolbar/project-dropdown.test.tsx`
- `frontend/src/components/quick-switcher/quick-switcher-dialog.test.tsx`
- `frontend/src/components/slide-panel/slide-panel.test.tsx`
- `frontend/src/styles/toolbar-density-contract.test.ts`
- `frontend/src/styles/shell-frame-token-ownership.test.ts`
- `e2e/tests/projects.spec.ts`
- `e2e/tests/terminal.spec.ts`
- `e2e/tests/settings.spec.ts`

### Create

- `frontend/src/styles/window-chrome-contract.test.ts`

### Delete

- None

## File Inventory

| File | Action | Rough Size | Test Impact |
|------|--------|-----------:|-------------|
| `frontend/src/App.test.tsx` | modify | 279 lines | protects shell orchestration and palette mounting assumptions |
| `frontend/src/components/toolbar/toolbar.test.tsx` | modify | 44 lines | locks top-shell hierarchy and titlebar affordances |
| `frontend/src/components/toolbar/project-dropdown.test.tsx` | modify | 75 lines | preserves project-switch and dismissal behavior |
| `frontend/src/components/quick-switcher/quick-switcher-dialog.test.tsx` | modify | 127 lines | protects omnibox role and focus return |
| `frontend/src/components/slide-panel/slide-panel.test.tsx` | modify | 71 lines | preserves attached-drawer lifecycle |
| `frontend/src/styles/window-chrome-contract.test.ts` | create | new | freezes titlebar token ownership and drag-region assumptions |

## Test Scenario Matrix

| Priority | Scenario | Expected |
|----------|----------|----------|
| Critical | Top shell anchors | project switcher, utility actions, and drag region stay reachable |
| Critical | Attached right drawer | closed drawer stays mounted and attached semantics remain explicit |
| Critical | Palette role | palette remains navigation/action UI, not command-editor UI |
| High | Window chrome CSS contract | shell owns toolbar/titlebar density tokens |
| High | Project dropdown dismissal | outside click and Escape keep working |
| Medium | Existing smoke paths | terminal, projects, settings still use stable selectors |

## Function / Interface Checklist

- `App`
- `Toolbar`
- `ProjectDropdown`
- `QuickSwitcherDialog`
- `SlidePanel`
- `TEST_IDS.shell.*`
- `TEST_IDS.palette.*`

## Dependency Map

- Depends on: none
- Unlocks:
  - Phase 02 titlebar experimentation
  - Phase 03 session-strip refactor
  - Phase 04 drawer polish
  - Phase 05 palette promotion

## Tests Before

1. Add failing toolbar assertions for a stronger top-shell contract and titlebar ownership markers.
2. Add a CSS contract test that freezes toolbar/titlebar token ownership in `shell.css`.
3. Expand drawer and palette tests so future Warp-inspired visual changes cannot quietly change behavior.
4. Update smoke selectors only where needed for stable shell anchors.

## Refactor

1. Add selectors, contracts, and tests first.
2. Keep production shell code changes limited to test anchors and non-visual metadata.
3. Document any titlebar behavior that cannot be reliably asserted in unit tests and push it to manual verification notes.

## Tests After

1. Unit tests pass with the new shell contract coverage.
2. Frontend build still passes with no new selector/type drift.
3. Smoke tests still prove project, terminal, and settings lifecycles.

## Regression Gate

- `cd /Users/plateau/Project/MultiHub/frontend && npm test -- --run`
- `cd /Users/plateau/Project/MultiHub/frontend && npm run build`
- `cd /Users/plateau/Project/MultiHub/e2e && npm test -- tests/projects.spec.ts tests/terminal.spec.ts tests/settings.spec.ts`

## Implementation Steps

1. Inventory current shell selectors, window chrome assumptions, and palette role expectations.
2. Add targeted test coverage before any visual work.
3. Record manual checks for titlebar/traffic-light behavior that unit tests cannot safely prove.

## Todo List

- [x] Add shell/titlebar contract tests
- [ ] Lock attached-drawer and palette behavior
- [ ] Update smoke selectors only where stability improves

## Success Criteria

- Shell behavior is frozen enough to allow aggressive visual refactor work
- No titlebar or drawer contract is implicit anymore
- Manual verification checklist exists for native window behavior

## Risk Assessment

- Native titlebar changes remain the highest-risk part
- Over-testing CSS snapshots would create brittle noise; keep tests semantic

## Security Considerations

- No auth/data risk in this phase
- Keep window actions bound only to explicit user controls

## Next Steps

- Phase 02 can change titlebar ownership only after this regression harness is green
