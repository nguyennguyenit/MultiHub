# Phase 02 - Titlebar Ownership And Top-Shell Architecture

## Context Links

- [Plan Overview](./plan.md)
- [Phase 01](./phase-01-regression-harness-and-window-chrome-contract.md)
- [Research Audit](./research/current-warp-inspired-shell-refresh-audit.md)
- [main.go](../../main.go)
- [app-misc-bindings.go](../../app-misc-bindings.go)
- [frontend/src/App.tsx](../../frontend/src/App.tsx)
- [frontend/src/components/toolbar/toolbar.tsx](../../frontend/src/components/toolbar/toolbar.tsx)
- [frontend/src/components/toolbar/window-controls.tsx](../../frontend/src/components/toolbar/window-controls.tsx)
- [frontend/src/styles/shell.css](../../frontend/src/styles/shell.css)

## Overview

- Priority: P1
- Current status: in-progress
- Brief: make the app shell own the top edge without breaking supported Wails behavior

## Key Insights

- The screenshot gap versus Warp starts at the top edge: native title area still reads separate from the app.
- Wails supports window-level configuration, but the safest path is to stay inside official options and existing drag-region patterns.
- `App.tsx` is already 500+ lines; if shell orchestration grows again, this phase should extract a focused top-shell seam instead of packing more logic into `App.tsx`.

## Requirements

- Evaluate the supported Wails titlebar/window strategy and choose the least risky option that moves the UI closer to Warp.
- Keep macOS traffic-light safety and non-macOS window controls intact.
- Reduce the visual separation between native window chrome and the custom shell.
- Preserve drag/no-drag regions and existing window action behavior.

## Architecture

- Use a fallback ladder:
  1. official titlebar/inset/frameless option that keeps native stability
  2. shell-only visual absorption if full ownership is too risky
- Keep top-shell composition in React, but keep native window behavior in Wails config.
- If `App.tsx` expands again, extract top-shell orchestration into a focused seam rather than layering more local state into root.

## Related Code Files

### Modify

- `main.go`
- `app-misc-bindings.go`
- `window-config.go`
- `window-config_test.go`
- `frontend/src/App.tsx`
- `frontend/src/components/toolbar/toolbar.tsx`
- `frontend/src/components/toolbar/window-controls.tsx`
- `frontend/src/styles/shell.css`
- `frontend/src/components/toolbar/toolbar.test.tsx`
- `frontend/src/styles/window-chrome-contract.test.ts`

### Create

- `frontend/src/hooks/use-top-shell-window-state.ts` if `App.tsx` needs a dedicated seam for window/titlebar state

### Delete

- None

## File Inventory

| File | Action | Rough Size | Test Impact |
|------|--------|-----------:|-------------|
| `main.go` | modify | 51 lines | window chrome configuration changes need manual verification |
| `app-misc-bindings.go` | modify | 167 lines | only if window state shape needs cleanup for shell layout |
| `frontend/src/App.tsx` | modify | 501 lines | shell orchestration may need extraction to avoid more root sprawl |
| `frontend/src/components/toolbar/toolbar.tsx` | modify | 168 lines | top-shell composition and drag-region placement |
| `frontend/src/components/toolbar/window-controls.tsx` | modify | 54 lines | compact utility placement and parity on non-macOS |
| `frontend/src/styles/shell.css` | modify | 418 lines | owns titlebar, toolbar, drag-region, and traffic-light spacing |

## Test Scenario Matrix

| Priority | Scenario | Expected |
|----------|----------|----------|
| Critical | macOS top edge | shell visually owns top edge without breaking drag/click behavior |
| Critical | non-macOS window controls | minimize/maximize/close remain usable |
| High | top-shell resize/maximize path | layout does not collapse or clip |
| High | fallback strategy | if full titlebar ownership is not viable, shell-only absorption still works cleanly |
| Medium | `App.tsx` modularization seam | root orchestration complexity decreases, not increases |

## Function / Interface Checklist

- Wails app/window options in `main.go`
- `WindowGetState`
- `Toolbar`
- `WindowControls`
- shell drag-region classes in `shell.css`

## Dependency Map

- Depends on: Phase 01
- Unlocks:
  - Phase 03 session-strip refactor
  - Phase 04 workspace flattening aligned to the new top edge

## Tests Before

1. Ensure shell/titlebar contract tests are already failing for the intended top-edge ownership changes.
2. Add any missing toolbar assertions for drag-region and control placement.
3. Document manual verification steps for macOS and non-macOS window behavior.

## Refactor

1. Choose the supported Wails titlebar strategy and code to that, not to a native hack.
2. Rework top-shell composition so the app chrome, not the window title, carries the hierarchy.
3. Extract a dedicated React/window-state seam only if it reduces `App.tsx` complexity.

## Tests After

1. Shell contract tests pass.
2. Toolbar tests still prove reachable project and utility controls.
3. Frontend build passes.
4. Manual titlebar verification checklist passes on the target platform.

## Regression Gate

- `cd /Users/plateau/Project/MultiHub/frontend && npm test -- --run`
- `cd /Users/plateau/Project/MultiHub/frontend && npm run build`
- Manual: verify drag, traffic lights, maximize, minimize, and close behavior in `wails dev`

## Implementation Steps

1. Prototype the chosen Wails window/titlebar setting with the existing shell.
2. Update top-shell structure and drag-region ownership.
3. Keep fallback path ready if full titlebar ownership degrades native behavior.

## Todo List

- [x] Choose supported titlebar strategy
- [x] Rework top-shell ownership around that strategy
- [ ] Keep `App.tsx` from growing further without a seam
- [ ] Run native manual verification

## Success Criteria

- Top edge looks materially closer to Warp
- Window title no longer dominates shell hierarchy
- Native controls and drag behavior remain safe

## Risk Assessment

- Highest risk: full titlebar ownership may not be worth the native behavior cost
- Secondary risk: shell logic accretion inside `App.tsx`

## Security Considerations

- Do not bind hidden or unintended window actions
- Keep drag regions passive and non-interactive

## Next Steps

- Phase 03 can rebuild the visible session strip on top of the new shell ownership
