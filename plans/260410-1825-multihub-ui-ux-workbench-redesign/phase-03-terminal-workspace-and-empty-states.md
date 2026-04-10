# Phase 03 - Terminal Workspace And Empty States

## Context Links

- [plan.md](./plan.md)
- [frontend/src/components/terminal/terminal-action-bar.tsx](../../frontend/src/components/terminal/terminal-action-bar.tsx)
- [frontend/src/components/terminal/terminal-grid.tsx](../../frontend/src/components/terminal/terminal-grid.tsx)
- [frontend/src/components/terminal/terminal-empty-state.tsx](../../frontend/src/components/terminal/terminal-empty-state.tsx)
- [frontend/src/components/welcome-screen.tsx](../../frontend/src/components/welcome-screen.tsx)
- [frontend/src/styles/globals.css](../../frontend/src/styles/globals.css)

## Overview

- Priority: P1
- Current status: completed
- Brief: make the terminal workspace the visual primary surface

## Key Insights

- Terminal action bar is utility-like, not hierarchy-aware.
- Empty states still feel like placeholders and still carry old branding.
- `YOLO` control should not dominate if the feature is not truly usable.

## Requirements

- Make `New Terminal` the obvious primary action.
- Reduce prominence of destructive or incomplete actions.
- Improve active-pane clarity and empty-state messaging for both no-project and no-terminal cases.

## Architecture

- Keep `TerminalGrid` behavior intact.
- Refactor shell copy, action emphasis, and supporting styles only.
- Hide or de-emphasize `YOLO` if it is not backed by meaningful behavior.

## Related Code Files

- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/terminal/terminal-action-bar.tsx`
- Modify: `frontend/src/components/terminal/terminal-grid.tsx`
- Create: `frontend/src/components/terminal/terminal-empty-state.tsx`
- Modify: `frontend/src/components/welcome-screen.tsx`
- Modify: `frontend/src/styles/globals.css`

## Implementation Steps

1. Write failing tests for primary-action emphasis and empty-state copy.
2. Redesign the terminal action bar around one primary action and quieter secondary controls.
3. Rewrite welcome and no-terminal empty states for MultiHub identity and clearer next actions.
4. Tighten active-pane visual states without altering terminal rendering logic.
5. Re-run component and smoke tests after visual changes.

## Todo List

- [x] Promote `New Terminal` as the workspace CTA
- [x] Reduce `Kill All` and `YOLO` visual weight
- [x] Rewrite empty-state copy and hierarchy
- [x] Verify no changes to terminal lifecycle behavior

## Success Criteria

- Terminal workspace reads as the main surface
- Empty states guide the next action fast
- Terminal controls are clearer and less noisy

## Risk Assessment

- Stronger visual states can accidentally reduce density too much
- Empty-state edits can break existing e2e selectors if not stabilized first

## Security Considerations

- No direct security impact
- Keep kill/destroy actions explicit and confirm destructive flows

## Next Steps

- Move to Phase 04 after workspace hierarchy is stable
