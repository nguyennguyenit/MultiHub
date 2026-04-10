# Phase 02: Panel Shell Width And Repo Summary

## Context Links

- [Plan Overview](./plan.md)
- [Research Audit](./research/current-github-panel-ui-audit.md)
- [Scout Report](./reports/scout-report.md)
- [Regression Harness And Panel Contract](./phase-01-regression-harness-and-panel-contract.md)

## Overview

- Priority: P1
- Status: Completed
- Goal: fix the panel’s top-level hierarchy and desktop width behavior

## Key Insights

- `SlidePanel` currently hard-codes shared right-panel width through a single token.
- GitHub panel needs a wider desktop rail than settings.
- `RepoInfoHeader` and `GitHubActionBar` already contain reusable pieces for the new summary/action shell.

## Requirements

- Make GitHub panel width adaptive on desktop without breaking Settings panel.
- Introduce a clear summary header:
  - repo identity
  - branch
  - remote/sync state
  - auth visibility
- Replace icon-only top actions with labeled high-frequency actions.

## Architecture

- Extend `SlidePanel` with a size or variant prop instead of cloning the component.
- Build a new summary shell in GitHub panel using current data from `useGitPanel`.
- Reuse patterns from `repo-info-header.tsx`, `github-action-bar.tsx`, and `settings-panel-content.tsx`.

## Related Code Files

### Modify

- `frontend/src/App.tsx`
- `frontend/src/components/slide-panel/slide-panel.tsx`
- `frontend/src/styles/globals.css`
- `frontend/src/components/github-view/github-view.tsx`
- `frontend/src/components/github-view/compact-header.tsx`
- `frontend/src/components/github-view/repo-info-header.tsx`
- `frontend/src/components/github-view/github-action-bar.tsx`

### Create

- `frontend/src/components/github-view/github-panel-summary.tsx`
- `frontend/src/components/github-view/github-panel-tabs.tsx`

### Delete

- None

## File Inventory

| File | Action | Rough Size | Test Impact |
|------|--------|-----------:|-------------|
| `frontend/src/App.tsx` | modify | 411 lines | passes size/variant to GitHub panel |
| `frontend/src/components/slide-panel/slide-panel.tsx` | modify | 83 lines | new reusable width/variant contract |
| `frontend/src/styles/globals.css` | modify | 2057 lines | new panel width tokens/classes |
| `frontend/src/components/github-view/github-view.tsx` | modify | 360 lines | mounts new summary and tabs |
| `frontend/src/components/github-view/compact-header.tsx` | modify | 115 lines | likely absorbed or slimmed |
| `frontend/src/components/github-view/repo-info-header.tsx` | modify | 62 lines | salvage/merge useful pieces |
| `frontend/src/components/github-view/github-action-bar.tsx` | modify | 146 lines | salvage/merge useful pieces |
| `frontend/src/components/github-view/github-panel-summary.tsx` | create | new | summary shell unit coverage |
| `frontend/src/components/github-view/github-panel-tabs.tsx` | create | new | tab trigger logic coverage |

## Test Scenario Matrix

| Priority | Scenario | Expected |
|----------|----------|----------|
| Critical | GitHub panel width variant | GitHub panel wider than generic settings panel on desktop |
| Critical | Summary header | repo and branch context visible above details |
| High | Labeled action row | fetch/pull/push read without hover |
| High | Settings panel unaffected | settings still opens at prior width/layout |
| Medium | Header extra link | repo link still reachable when remote exists |

## Function / Interface Checklist

- `SlidePanel` props
- `GitHubHeaderExtra`
- `GitHubPanelContent`
- `GitHubPanelSummary` component
- `GitHubPanelTabs` component

## Dependency Map

- Depends on: Phase 01
- Unlocks:
  - Phase 03 changes workflow migration
  - Phase 04 tab content split

## Tests Before

1. Add failing tests for GitHub panel summary rendering.
2. Add failing tests for GitHub panel tab trigger shell.
3. Add smoke check for widened panel marker/class rather than fragile pixel assertions.

## Refactor

1. Add GitHub-specific panel size support to `SlidePanel`.
2. Introduce summary shell and labeled action row.
3. Keep current content below while preparing for tab migration.

## Tests After

1. Summary shell renders with repo-aware context.
2. Settings panel still opens and closes unchanged.
3. GitHub panel smoke still passes.

## Regression Gate

- `cd /Users/plateau/Project/MultiHub/frontend && npm test -- --run`
- `cd /Users/plateau/Project/MultiHub/frontend && npm run build`
- `cd /Users/plateau/Project/MultiHub && npx playwright test e2e/tests/terminal.spec.ts e2e/tests/settings.spec.ts`

## Implementation Steps

1. Add a GitHub-specific size prop or variant to `SlidePanel`.
2. Add matching CSS tokens/classes for a wider desktop rail.
3. Create a summary/header component that combines repo status and branch context cleanly.
4. Replace top icon-only controls with labeled high-frequency actions.
5. Keep repo external link available in a predictable place.

## Todo List

- [x] Add panel size variant
- [x] Add GitHub summary shell
- [x] Wire labeled action row
- [x] Keep settings panel stable

## Success Criteria

- Panel reads clearly above the fold.
- GitHub panel gains desktop breathing room.
- Settings panel does not regress.

## Risk Assessment

- Risk: widening the panel hurts terminal space too much
- Mitigation: cap width and keep settings on default width

## Security Considerations

- Do not leak remote URLs where hidden state should remain private
- Only surface repo link already available via remote URL

## Next Steps

- Move Changes workflow into the new tab structure in Phase 03
