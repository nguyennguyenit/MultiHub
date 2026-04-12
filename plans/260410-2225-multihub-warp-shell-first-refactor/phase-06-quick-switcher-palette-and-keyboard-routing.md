# Phase 06 - Quick Switcher Palette And Keyboard Routing

## Context Links

- [Plan Overview](./plan.md)
- [Phase 05](./phase-05-attached-right-drawers-and-panel-lifecycle.md)
- [frontend/src/App.tsx](../../frontend/src/App.tsx)
- [frontend/src/hooks/use-keyboard-shortcuts.ts](../../frontend/src/hooks/use-keyboard-shortcuts.ts)
- [frontend/src/utils/shortcut-utils.ts](../../frontend/src/utils/shortcut-utils.ts)
- [frontend/src/stores/app-store.ts](../../frontend/src/stores/app-store.ts)
- [frontend/src/shared/constants/test-ids.ts](../../frontend/src/shared/constants/test-ids.ts)

## Overview

- Priority: P1
- Current status: completed
- Brief: add a lightweight `Cmd/Ctrl+K` switcher for projects, terminals, drawers, and common actions

## Key Insights

- Palette is new scope; it does not exist in the tree today.
- Existing keyboard routing already centralizes global shortcuts and can absorb a new palette command.
- No backend change is needed; all candidate actions already exist in frontend state/handlers.

## Requirements

- Open and close with `Cmd/Ctrl+K`.
- Filter and execute project switches, terminal focus, drawer toggles, and a small set of common actions.
- Return focus cleanly to the prior surface after close.

## Architecture

- Mount one palette shell in `App.tsx`.
- Extend `getGlobalShortcut` and `useKeyboardShortcuts` rather than creating a separate ad hoc event path.
- Build palette items from existing project and terminal store state plus current drawer actions.

## Related Code Files

### Modify

- `frontend/src/App.tsx`
- `frontend/src/hooks/use-keyboard-shortcuts.ts`
- `frontend/src/utils/shortcut-utils.ts`
- `frontend/src/shared/constants/test-ids.ts`
- `frontend/src/components/toolbar/toolbar.tsx`
- `frontend/src/components/toolbar/toolbar.test.tsx`

### Create

- `frontend/src/components/quick-switcher/quick-switcher-dialog.tsx`
- `frontend/src/components/quick-switcher/quick-switcher-dialog.test.tsx`
- `frontend/src/components/quick-switcher/index.ts`
- `e2e/tests/palette.spec.ts`

## File Inventory

| File | Action | Rough Size | Test Impact |
|------|--------|-----------:|-------------|
| `frontend/src/App.tsx` | modify | 378 lines | mounts palette and wires action handlers |
| `frontend/src/hooks/use-keyboard-shortcuts.ts` | modify | 60 lines | adds palette open shortcut |
| `frontend/src/utils/shortcut-utils.ts` | modify | 65 lines | adds palette shortcut parsing |
| `frontend/src/shared/constants/test-ids.ts` | modify | 39 lines | palette root/input/item anchors |
| `frontend/src/components/quick-switcher/quick-switcher-dialog.tsx` | create | new | main palette behavior |
| `frontend/src/components/quick-switcher/quick-switcher-dialog.test.tsx` | create | new | interaction contract |
| `e2e/tests/palette.spec.ts` | create | new | keyboard-first smoke path |

## Test Scenario Matrix

| Priority | Scenario | Expected |
|----------|----------|----------|
| Critical | `Cmd/Ctrl+K` opens palette | input receives focus |
| Critical | Selecting project/terminal/action | correct handler runs and palette closes |
| High | Filtering | list narrows by user input |
| High | Focus return | previous active surface regains focus after close |
| Medium | Drawer actions | settings/GitHub toggles work through palette |

## Function / Interface Checklist

- `getGlobalShortcut`
- `useKeyboardShortcuts`
- `App` shell action handlers
- `useAppStore` project and terminal state
- `TEST_IDS` palette anchors

## Dependency Map

- Depends on: Phase 05
- Unlocks:
  - Phase 06 regression lock and docs updates

## Tests Before

1. Add shortcut parser tests for `Cmd/Ctrl+K`.
2. Add failing palette component tests for open, filter, execute, and focus return.
3. Add failing E2E smoke for the keyboard entry path.

## Refactor

1. Extend shortcut parsing and hook routing.
2. Mount a lightweight palette shell in `App.tsx`.
3. Keep palette scope small: no command history, no block model, no editor features.

## Tests After

1. Shortcut tests and palette component tests pass.
2. Existing shell tests remain green.
3. Palette smoke passes once Playwright dependencies are installed in `e2e`.

## Regression Gate

- `cd /Users/plateau/Project/MultiHub/frontend && npm test -- --run`
- `cd /Users/plateau/Project/MultiHub/frontend && npm run build`
- `cd /Users/plateau/Project/MultiHub/e2e && npm test -- tests/palette.spec.ts tests/terminal.spec.ts tests/projects.spec.ts tests/settings.spec.ts`

## Implementation Steps

1. Add the new shortcut type and tests-first parser coverage.
2. Create the palette dialog and item model from existing frontend state/actions.
3. Wire the dialog into `App.tsx` with clean open/close/focus handling.
4. Keep the action catalog intentionally small for this phase.

## Todo List

- [x] Add palette shortcut parsing
- [x] Build palette UI and tests
- [x] Wire project/terminal/drawer/common actions
- [x] Verify focus return and smoke path

## Success Criteria

- Palette opens instantly with keyboard
- Users can switch project/terminal/drawer without touching the mouse
- No backend or terminal-engine changes were needed

## Risk Assessment

- Risk: palette grows into a second navigation system and balloons scope
- Mitigation: keep the command catalog small and action-based

## Security Considerations

- Do not expose secrets, raw tokens, or destructive actions without explicit confirmation
- Keep palette items to already-visible local actions

## Next Steps

- Completed; palette and keyboard routing landed.
