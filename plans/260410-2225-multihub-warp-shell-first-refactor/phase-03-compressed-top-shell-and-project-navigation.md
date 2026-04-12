# Phase 03 - Compressed Top Shell And Project Navigation

## Context Links

- [Plan Overview](./plan.md)
- [Phase 02](./phase-02-token-ownership-and-shell-frame-stabilization.md)
- [frontend/src/App.tsx](../../frontend/src/App.tsx)
- [frontend/src/components/toolbar/toolbar.tsx](../../frontend/src/components/toolbar/toolbar.tsx)
- [frontend/src/components/toolbar/project-dropdown.tsx](../../frontend/src/components/toolbar/project-dropdown.tsx)
- [frontend/src/components/toolbar/toolbar-button.tsx](../../frontend/src/components/toolbar/toolbar-button.tsx)
- [frontend/src/components/update-banner.tsx](../../frontend/src/components/update-banner.tsx)
- [frontend/src/styles/shell.css](../../frontend/src/styles/shell.css)

## Overview

- Priority: P1
- Current status: completed
- Brief: compress the top chrome into a denser shell spine without breaking project workflows

## Key Insights

- `Toolbar` currently carries more card chrome than Warp-like density wants.
- `ProjectDropdown` already holds the real project-switching logic; the rest is presentation weight.
- Compressing only the toolbar row is insufficient if terminal summary and update/action stack still feel tall.

## Requirements

- Reduce shell height and visual noise.
- Keep project selection, add-project, GitHub toggle, settings toggle, and platform window-control behavior intact.
- Fold terminal summary and contextual info into a tighter hierarchy.

## Architecture

- Keep `Toolbar` as the shell anchor.
- Rework header layout, not project CRUD behavior.
- Preserve macOS padding and drag/no-drag seams.

## Related Code Files

### Modify

- `frontend/src/App.tsx`
- `frontend/src/components/toolbar/toolbar.tsx`
- `frontend/src/components/toolbar/project-dropdown.tsx`
- `frontend/src/components/toolbar/toolbar-button.tsx`
- `frontend/src/components/toolbar/window-controls.tsx`
- `frontend/src/components/update-banner.tsx`
- `frontend/src/styles/shell.css`
- `frontend/src/styles/globals.css`
- `frontend/src/components/toolbar/toolbar.test.tsx`
- `e2e/tests/projects.spec.ts`

### Delete

- None in this phase; leave dead shell exports for cleanup phase

## File Inventory

| File | Action | Rough Size | Test Impact |
|------|--------|-----------:|-------------|
| `frontend/src/App.tsx` | modify | 378 lines | updates header props and top-stack composition |
| `frontend/src/components/toolbar/toolbar.tsx` | modify | 168 lines | core shell chrome refactor |
| `frontend/src/components/toolbar/project-dropdown.tsx` | modify | 153 lines | denser trigger/menu presentation |
| `frontend/src/components/toolbar/toolbar-button.tsx` | modify | existing | button density and active-state polish |
| `frontend/src/components/toolbar/window-controls.tsx` | modify | existing | spacing safety on non-macOS |
| `frontend/src/components/update-banner.tsx` | modify | existing | keep banner from re-inflating the top stack |
| `frontend/src/styles/shell.css` | modify | 319 lines | live toolbar/dropdown styling |
| `frontend/src/styles/globals.css` | modify | 2057 lines | shared drag-layer and window-control support |
| `frontend/src/components/toolbar/toolbar.test.tsx` | modify | existing | shell anchor assertions updated |

## Test Scenario Matrix

| Priority | Scenario | Expected |
|----------|----------|----------|
| Critical | Project switcher remains visible and operable | users can still select projects |
| Critical | GitHub/settings toggles | remain reachable with active-state feedback |
| High | macOS traffic-light padding | controls remain clickable and drag layer intact |
| High | Update banner present | top stack still feels compact when updates show |
| High | terminal summary | reads as supporting info, not primary chrome |
| Medium | no-project state | header still guides opening a project |

## Function / Interface Checklist

- `Toolbar`
- `ProjectDropdown`
- `ToolbarButton`
- `WindowControls`
- `TEST_IDS.shell.*`

## Dependency Map

- Depends on: Phase 02
- Unlocks:
  - Phase 03 workspace density rebalance
  - Phase 05 palette entry point

## Tests Before

1. Add failing toolbar assertions for compact shell anchors and project dropdown behavior.
2. Add or update assertions for the update banner so a visible banner does not re-inflate the top stack.
3. Update smoke expectations in `projects.spec.ts` for the compressed top shell.
4. Keep App-level orchestration tests untouched except where shell anchors materially change.

## Refactor

1. Simplify toolbar hierarchy and reduce card-in-card styling.
2. Compress the banner path enough that toolbar + banner still read as one shell stack.
3. Keep project logic in `App.tsx` unchanged.
4. Do not add palette UI yet; only reserve space and keyboard affordance assumptions.

## Tests After

1. Toolbar tests pass with the new compact shell.
2. Project smoke still proves switcher/open-project entry points.
3. Build confirms no broken shell imports or CSS collisions.

## Regression Gate

- `cd /Users/plateau/Project/MultiHub/frontend && npm test -- --run`
- `cd /Users/plateau/Project/MultiHub/frontend && npm run build`
- `cd /Users/plateau/Project/MultiHub/e2e && npm test -- tests/projects.spec.ts`

## Implementation Steps

1. Tighten header information hierarchy and remove non-essential card chrome.
2. Compress spacing, button sizing, brand treatment, and update-banner density while keeping accessible hit targets.
3. Verify drag regions and platform-specific control spacing.
4. Keep dead props/legacy exports for cleanup later rather than mixing behavior removal into this phase.

## Todo List

- [x] Compress top shell hierarchy
- [x] Preserve project navigation behavior
- [x] Verify platform spacing and drag regions
- [x] Keep smoke tests green

## Success Criteria

- Header reads as one dense shell spine
- Project actions stay obvious
- Overall top stack is materially slimmer

## Risk Assessment

- Risk: toolbar becomes too dense and harms discoverability
- Mitigation: keep only the highest-frequency actions visible, defer everything else

## Security Considerations

- No direct security impact
- Do not change project-open or delete permissions/confirmations

## Next Steps

- Completed; compressed shell landed.
