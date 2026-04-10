# Phase 01: Regression Harness And Panel Contract

## Context Links

- [Plan Overview](./plan.md)
- [Research Audit](./research/current-github-panel-ui-audit.md)
- [Scout Report](./reports/scout-report.md)
- [GitHub Panel UX/UI Brainstorm](../reports/260410-1940-github-panel-ux-ui-brainstorm.md)

## Overview

- Priority: P1
- Status: Completed
- Goal: lock the new panel contract before layout refactor starts

## Key Insights

- Current smoke tests only prove panel open/close.
- There is no test contract for panel summary, tab shell, or tab visibility.
- Without selector work first, the later visual refactor will be hard to land safely.

## Requirements

- Add stable selectors for GitHub panel summary and tabs.
- Define the default active tab contract.
- Preserve current shell entry point: toolbar button opens the GitHub panel.
- Preserve no-project empty state.

## Architecture

- Keep panel mounted via `App.tsx` + `SlidePanel`.
- Add lightweight test ids to new structural anchors, not every small control.
- Introduce a stable presentational shell for the GitHub panel before moving inner content.

## Related Code Files

### Modify

- `frontend/src/shared/constants/test-ids.ts`
- `frontend/src/App.tsx`
- `frontend/src/components/github-view/github-view.tsx`
- `e2e/tests/terminal.spec.ts`
- `frontend/src/components/toolbar/toolbar.test.tsx`

### Create

- `frontend/src/components/github-view/github-panel-layout.test.tsx`

### Delete

- None

## File Inventory

| File | Action | Rough Size | Test Impact |
|------|--------|-----------:|-------------|
| `frontend/src/shared/constants/test-ids.ts` | modify | 32 lines | exposes new stable selectors |
| `frontend/src/App.tsx` | modify | 411 lines | may need new panel shell anchor wiring |
| `frontend/src/components/github-view/github-view.tsx` | modify | 360 lines | temporary shell contract before split |
| `e2e/tests/terminal.spec.ts` | modify | 29 lines | update smoke assertions |
| `frontend/src/components/toolbar/toolbar.test.tsx` | modify | 36 lines | ensure entry point unchanged |
| `frontend/src/components/github-view/github-panel-layout.test.tsx` | create | new | core structure regression |

## Test Scenario Matrix

| Priority | Scenario | Expected |
|----------|----------|----------|
| Critical | Toolbar button opens panel | GitHub panel visible |
| Critical | No project selected | empty state still visible |
| High | Default tab | `Changes` tab active by default |
| High | Summary shell renders | summary container visible when project exists |
| Medium | Settings panel unaffected | existing settings smoke still valid |

## Function / Interface Checklist

- `GitHubPanelContent`
- `SlidePanel` props contract
- `TEST_IDS.panel.github`
- new GitHub panel tab ids / summary ids

## Dependency Map

- Depends on: none
- Unlocks:
  - Phase 02 panel shell refactor
  - Phase 03 changes tab refactor
  - Phase 04 history/GitHub tabs

## Tests Before

1. Add failing component test for new panel shell anchors and default tab.
2. Extend Playwright smoke to assert the panel exposes stable tab shell markers.
3. Keep existing toolbar anchor test green.

## Refactor

1. Add test ids and temporary tab state shell.
2. Keep internals mostly unchanged in this phase.
3. Do not mix layout polish with contract definition yet.

## Tests After

1. Confirm component test passes for panel shell and default tab.
2. Confirm terminal smoke still opens the panel and shows empty state.

## Regression Gate

- `cd /Users/plateau/Project/MultiHub/frontend && npm test -- --run`
- `cd /Users/plateau/Project/MultiHub/frontend && npm run build`
- `cd /Users/plateau/Project/MultiHub && npx playwright test e2e/tests/terminal.spec.ts`

## Implementation Steps

1. Add new GitHub panel test ids for summary shell, tab list, and each tab trigger.
2. Add a focused layout test for default tab and structural anchors.
3. Update `GitHubPanelContent` to expose the new shell markers without fully changing layout yet.
4. Update Playwright smoke to assert the new anchors while preserving open/close coverage.

## Todo List

- [x] Add GitHub panel shell and tab selectors
- [x] Add layout unit test
- [x] Update terminal smoke test
- [x] Keep toolbar test stable

## Success Criteria

- New panel shell contract is test-protected.
- Existing GitHub panel entry point still works.
- No-project state still works.

## Risk Assessment

- Risk: selectors become too implementation-specific
- Mitigation: only add ids for semantic anchors

## Security Considerations

- None material
- Do not expose secrets or auth tokens in selectors or visible test text

## Next Steps

- Move to Phase 02 once panel shell contract is stable
