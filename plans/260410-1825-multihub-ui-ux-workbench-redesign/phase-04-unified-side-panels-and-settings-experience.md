# Phase 04 - Unified Side Panels And Settings Experience

## Context Links

- [plan.md](./plan.md)
- [frontend/src/App.tsx](../../frontend/src/App.tsx)
- [frontend/src/components/slide-panel/slide-panel.tsx](../../frontend/src/components/slide-panel/slide-panel.tsx)
- [frontend/src/components/settings/settings-modal.tsx](../../frontend/src/components/settings/settings-modal.tsx)
- [frontend/src/components/settings/settings-panel-content.tsx](../../frontend/src/components/settings/settings-panel-content.tsx)
- [frontend/src/components/github-view/github-view.tsx](../../frontend/src/components/github-view/github-view.tsx)
- [frontend/src/styles/globals.css](../../frontend/src/styles/globals.css)

## Overview

- Priority: P1
- Current status: completed
- Brief: make GitHub and Settings feel like one product shell

## Key Insights

- GitHub uses a slide panel, Settings uses a large centered modal.
- `SettingsPanelContent` already exists, so reuse is possible.
- Current fixed panel width is likely too narrow for a stronger settings experience.

## Requirements

- Converge GitHub and Settings onto one panel language.
- Keep responsive behavior sane for portrait/smaller windows.
- Preserve tab switching, save/cancel, and panel close behaviors.

## Architecture

- Prefer `SlidePanel` as the shared shell container.
- Reuse `SettingsPanelContent` inside the shared panel instead of keeping a separate modal style.
- Make panel width responsive enough for both GitHub and Settings content.

## Related Code Files

- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/slide-panel/slide-panel.tsx`
- Modify: `frontend/src/components/settings/settings-modal.tsx`
- Modify: `frontend/src/components/settings/settings-panel-content.tsx`
- Modify: `frontend/src/components/settings/index.ts`
- Modify: `frontend/src/components/github-view/github-view.tsx`
- Modify: `frontend/src/styles/globals.css`

## Implementation Steps

1. Write failing tests for settings open/close, cancel/save affordances, and panel visibility semantics.
2. Route settings through the shared side-panel system.
3. Standardize panel header, body spacing, close affordance, and responsive widths.
4. Verify GitHub panel still functions with the updated shell language.
5. Update smoke tests to reflect the unified panel contract.

## Todo List

- [x] Choose and implement one panel shell
- [x] Unify settings and GitHub panel affordances
- [x] Adjust responsive panel width/height rules
- [x] Preserve close-on-escape and cancel/save flows

## Success Criteria

- GitHub and Settings feel visually related
- Settings no longer feels like a different app surface
- Responsive panel behavior stays usable

## Risk Assessment

- Shared shell changes can ripple into GitHub content density
- Narrow widths can make settings awkward if not tuned

## Security Considerations

- No direct security impact
- Keep external-link and update actions visible and explicit

## Next Steps

- Move to Phase 05 once panel behavior and selectors are stable
