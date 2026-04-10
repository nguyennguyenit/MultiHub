# Phase 02 - App Shell Header And Project Navigation

## Context Links

- [plan.md](./plan.md)
- [phase-01-regression-harness-and-style-boundaries.md](./phase-01-regression-harness-and-style-boundaries.md)
- [frontend/src/App.tsx](../../frontend/src/App.tsx)
- [frontend/src/components/toolbar/toolbar.tsx](../../frontend/src/components/toolbar/toolbar.tsx)
- [frontend/src/components/toolbar/project-dropdown.tsx](../../frontend/src/components/toolbar/project-dropdown.tsx)
- [frontend/src/styles/globals.css](../../frontend/src/styles/globals.css)

## Overview

- Priority: P1
- Current status: completed
- Brief: replace the split-shell feel with one coherent workspace header

## Key Insights

- Current bottom project bar fragments attention.
- Brand and actions belong in one header, not in separate strips.
- macOS traffic-light spacing and drag regions are a hard constraint.

## Requirements

- Build one clear header with brand, project switcher, active context, and primary actions.
- Reduce or remove the bottom-heavy project-navigation pattern.
- Make active project state obvious without making delete/remove actions too eager.

## Architecture

- Reuse `Toolbar` as the main shell anchor.
- Absorb project-switching affordances into the top shell instead of adding a new major nav surface.
- Keep `ProjectDropdown` as the main selector; retire the old project bar if it still exists only as legacy shell chrome.

## Related Code Files

- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/toolbar/toolbar.tsx`
- Modify: `frontend/src/components/toolbar/project-dropdown.tsx`
- Modify: `frontend/src/components/toolbar/toolbar-button.tsx`
- Modify: `frontend/src/styles/globals.css`

## Implementation Steps

1. Write failing tests for header structure, project switcher visibility, and action placement.
2. Refactor toolbar layout into a true workspace header.
3. Integrate project navigation into the header with clear active state and subdued destructive actions.
4. Verify drag/no-drag zones, window controls, and macOS padding behavior.
5. Remove redundant shell chrome only after behavior is covered by tests.

## Todo List

- [x] Define final top-shell information hierarchy
- [x] Move project switching into the header
- [x] Reduce bottom-bar prominence or retire it
- [x] Verify Wails drag regions on macOS and non-macOS paths

## Success Criteria

- Header reads as the single shell anchor
- Project switching remains fast and obvious
- Window controls and drag regions still behave correctly

## Risk Assessment

- Header can become overloaded if too many controls survive
- Removing bottom navigation may break user muscle memory if active-state cues are weak

## Security Considerations

- No direct security impact
- Do not change any permission or file-dialog flows during shell restructuring

## Next Steps

- Move to Phase 03 once shell chrome is coherent and covered
