# Phase 05 - Brand Sweep Docs And Final Regression

## Context Links

- [plan.md](./plan.md)
- [frontend/src/components/update-banner.tsx](../../frontend/src/components/update-banner.tsx)
- [frontend/src/components/settings/update-settings.tsx](../../frontend/src/components/settings/update-settings.tsx)
- [docs/development-roadmap.md](../../docs/development-roadmap.md)
- [docs/project-changelog.md](../../docs/project-changelog.md)

## Overview

- Priority: P1
- Current status: completed
- Brief: brand sweep, docs sync, and final verification all landed

## Key Insights

- Brand drift is visible and damages trust.
- Update flows now point to `MultiHub`; roadmap/changelog sync is complete.
- Docs should acknowledge the UI/UX redesign once code lands.

## Requirements

- Replace visible `MultiClaude` remnants with `MultiHub` where correct.
- Align update links, settings copy, welcome copy, and labels.
- Run final unit/e2e/build verification and record docs impact.

## Architecture

- Keep this phase mostly cleanup and verification.
- Avoid new UI features here.
- Use docs updates only after implementation proves stable.

## Related Code Files

- Modify: `frontend/src/components/update-banner.tsx`
- Modify: `frontend/src/components/settings/update-settings.tsx`
- Modify: `frontend/src/components/settings/settings-sidebar.tsx`
- Modify: `frontend/src/components/welcome-screen.tsx`
- Modify: `frontend/src/components/toolbar/toolbar.tsx`
- Modify: `docs/development-roadmap.md`
- Modify: `docs/project-changelog.md`

## Implementation Steps

1. Write failing tests for visible brand strings and update-link targets.
2. Sweep remaining UI copy and product links.
3. Run frontend unit tests, e2e smoke tests, and production build checks.
4. Update roadmap/changelog with the redesign outcome.
5. Capture any deferred issues explicitly.

## Todo List

- [x] Replace visible legacy product naming
- [x] Align release/update links with MultiHub
- [x] Run full frontend verification
- [x] Update roadmap and changelog after implementation

## Success Criteria

- No visible `MultiClaude` remnants remain unless intentionally preserved
- Update flows point at the correct repository/product
- Docs reflect the redesign accurately

## Risk Assessment

- Brand cleanup can miss strings in rarely opened panels
- Docs can drift if updated before verification finishes

## Security Considerations

- Verify external links still target the intended project
- Avoid introducing broken or unexpected release URLs

## Next Steps

- Implementation complete. Optional follow-up: commit/release handling.
