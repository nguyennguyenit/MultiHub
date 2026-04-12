# Phase 01 - Regression Harness And Shell Contract

## Context Links

- [Plan Overview](./plan.md)
- [Research Audit](./research/current-shell-first-refactor-audit.md)
- [Brainstorm](../reports/260410-2217-multihub-warp-shell-first-brainstorm.md)
- [frontend/src/App.tsx](../../frontend/src/App.tsx)
- [frontend/src/shared/constants/test-ids.ts](../../frontend/src/shared/constants/test-ids.ts)
- [frontend/src/styles/globals.css](../../frontend/src/styles/globals.css)
- [frontend/src/styles/shell.css](../../frontend/src/styles/shell.css)
- [frontend/src/styles/workspace.css](../../frontend/src/styles/workspace.css)
- [frontend/src/styles/panels.css](../../frontend/src/styles/panels.css)

## Overview

- Priority: P1
- Current status: completed
- Brief: lock selectors, shell anchors, and hidden-while-mounted behavior before visuals move

## Key Insights

- App-level tests stub too much shell DOM to protect this refactor.
- Current App-level tests stub too much shell DOM to catch layout regressions.
- `TerminalGrid` and `SlidePanel` rely on hidden-via-`visibility:hidden` behavior that must stay protected.

## Requirements

- Add stable selectors for project dropdown items, settings interior anchors, and future palette roots.
- Protect panel visibility semantics, inactive project grid mounting, and existing keyboard shortcut behavior.
- Freeze the interaction contract before any visual or token ownership work begins.

## Architecture

- Use focused component tests plus targeted smoke tests as the primary contract.
- Keep shell CSS untouched except for any anchor additions required by the tests.
- Defer token ownership changes to Phase 02.

## Related Code Files

### Modify

- `frontend/src/shared/constants/test-ids.ts`
- `frontend/src/components/toolbar/project-dropdown.tsx`
- `frontend/src/components/slide-panel/slide-panel.test.tsx`
- `frontend/src/utils/shortcut-utils.ts`
- `frontend/src/hooks/use-keyboard-shortcuts.ts`
- `frontend/src/components/terminal/terminal-grid.test.tsx`
- `frontend/src/App.test.tsx`
- `frontend/src/App-settings-toggle.test.tsx`
- `e2e/tests/projects.spec.ts`
- `e2e/tests/terminal.spec.ts`
- `e2e/tests/settings.spec.ts`

### Create

- `frontend/src/components/toolbar/project-dropdown.test.tsx`
- `frontend/src/components/settings/settings-panel-content.test.tsx`

### Delete

- None

## File Inventory

| File | Action | Rough Size | Test Impact |
|------|--------|-----------:|-------------|
| `frontend/src/shared/constants/test-ids.ts` | modify | 39 lines | exposes stable shell and palette anchors |
| `frontend/src/components/toolbar/project-dropdown.tsx` | modify | 153 lines | stabilizes menu-item selectors and dismissal behavior |
| `frontend/src/components/slide-panel/slide-panel.test.tsx` | modify | existing | covers escape/visibility semantics before drawer changes |
| `frontend/src/utils/shortcut-utils.ts` | modify | 65 lines | protects baseline keyboard routing before palette work |
| `frontend/src/hooks/use-keyboard-shortcuts.ts` | modify | 60 lines | protects legacy shortcut contract |
| `frontend/src/components/toolbar/project-dropdown.test.tsx` | create | new | protects project navigation shell |
| `frontend/src/components/settings/settings-panel-content.test.tsx` | create | new | protects settings sidebar/tab shell |
| `frontend/src/components/terminal/terminal-grid.test.tsx` | modify | existing | locks inactive project mounting behavior |
| `frontend/src/App.test.tsx` | modify | existing | protects shell-level orchestration paths |

## Test Scenario Matrix

| Priority | Scenario | Expected |
|----------|----------|----------|
| Critical | Project dropdown open/close | outside click and Escape still dismiss |
| Critical | Settings panel shell | close/cancel anchors remain stable |
| Critical | Hidden panel contract | closed panel remains hidden without unmounting shell |
| Critical | Inactive grid contract | inactive project regions remain mounted |
| High | Baseline shortcut map | legacy shortcuts stay intact |
| High | Slide panel visibility | closed panel keeps state via `visibility:hidden` |
| Medium | Future palette ids | reserved anchors exist without changing behavior |

## Function / Interface Checklist

- `TEST_IDS`
- `ProjectDropdown`
- `SlidePanel`
- `SettingsPanelContent`
- `getGlobalShortcut`
- `useKeyboardShortcuts`
- `TerminalGrid`
- shell/workspace/panel CSS token contract

## Dependency Map

- Depends on: none
- Unlocks:
  - Phase 02 token ownership cleanup
  - Phase 03 shell compression
  - Phase 04 workspace refactor
  - Phase 05 drawer refactor
  - Phase 06 palette shell

## Tests Before

1. Add failing tests for project dropdown dismissal, project item anchors, and settings interior anchors.
2. Expand `slide-panel.test.tsx` and `terminal-grid.test.tsx` to assert hidden-while-mounted behavior.
3. Add failing shortcut-parser coverage for the current global shortcut set.
4. Update smoke tests to use only stable semantic anchors.

## Refactor

1. Add selectors and tests only.
2. Keep shell visuals and token ownership unchanged in this phase.
3. Do not mix CSS cleanup into contract work.

## Tests After

1. New dropdown, panel, and shortcut tests pass.
2. Existing shell smoke still passes.
3. Build still resolves the same runtime shell.

## Regression Gate

- `cd /Users/plateau/Project/MultiHub/frontend && npm test -- --run`
- `cd /Users/plateau/Project/MultiHub/frontend && npm run build`
- `cd /Users/plateau/Project/MultiHub/e2e && npm test -- tests/terminal.spec.ts tests/projects.spec.ts tests/settings.spec.ts`

## Implementation Steps

1. Add missing semantic test ids and new focused component tests.
2. Lock the hidden-panel and hidden-grid contracts with explicit tests.
3. Protect the current global shortcut map before adding palette work later.
4. Re-run unit tests, build, and smoke checks before any visual refactor starts.

## Todo List

- [ ] Add dropdown/settings shell tests
- [ ] Stabilize project item and settings anchors
- [ ] Lock hidden-while-mounted behavior
- [ ] Lock baseline shortcuts

## Success Criteria

- Selector and interaction contract is stable enough for the refactor ahead
- Hidden shell behavior is protected by tests
- No visible behavior regressions introduced by the contract work

## Risk Assessment

- Risk: this phase accidentally snapshots an existing UX bug as contract
- Mitigation: keep tests focused on intended shell behavior, not incidental visuals

## Security Considerations

- No direct security impact
- Do not expose local paths or repo data in new test ids

## Next Steps

- Start Phase 02 only after shell contract tests are green
