# Phase 01 - Regression Harness And Style Boundaries

## Context Links

- [plan.md](./plan.md)
- [research/current-ui-ux-state-audit.md](./research/current-ui-ux-state-audit.md)
- [frontend/src/App.tsx](../../frontend/src/App.tsx)
- [frontend/src/styles/globals.css](../../frontend/src/styles/globals.css)
- [frontend/src/test-setup.ts](../../frontend/src/test-setup.ts)
- [frontend/src/shared/constants/test-ids.ts](../../frontend/src/shared/constants/test-ids.ts)
- [e2e/tests/settings.spec.ts](../../e2e/tests/settings.spec.ts)
- [e2e/tests/projects.spec.ts](../../e2e/tests/projects.spec.ts)
- [e2e/tests/terminal.spec.ts](../../e2e/tests/terminal.spec.ts)

## Overview

- Priority: P1
- Current status: completed
- Brief: create regression safety before changing shell layout

## Key Insights

- UI redesign without tests will be fragile.
- Current e2e selectors already drift from reality.
- `globals.css` is too large for blunt edits.

## Requirements

- Add minimal component-test capability for shell components.
- Stabilize `data-testid` strategy for header, project switcher, empty states, settings panel, and terminal actions.
- Define style boundaries so shell/panel/workspace styles do not remain one giant diff in `globals.css`.

## Architecture

- Keep Vitest + jsdom.
- Add React component test tooling only if needed for shell tests.
- Keep `globals.css` for reset, variables, and shared utilities.
- Extract shell-specific CSS modules only if the implementation diff becomes unreadable in one file.

## Related Code Files

- Modify: `frontend/package.json`
- Modify: `frontend/src/test-setup.ts`
- Modify: `frontend/src/styles/globals.css`
- Modify: `e2e/tests/settings.spec.ts`
- Modify: `e2e/tests/projects.spec.ts`
- Modify: `e2e/tests/terminal.spec.ts`
- Create: `frontend/src/components/toolbar/toolbar.test.tsx`
- Create: `frontend/src/components/welcome-screen.test.tsx`
- Create: `frontend/src/components/terminal/terminal-action-bar.test.tsx`

## Implementation Steps

1. Write failing tests for current and target shell selectors.
2. Normalize `data-testid` names in the plan before touching layout.
3. Add component tests for shell visibility, primary actions, and settings open/close affordances.
4. Decide whether shell styles stay in `globals.css` or get split into focused files.
5. Re-run tests to lock the baseline.

## Todo List

- [x] Add shell-level component tests
- [x] Normalize selectors shared by unit and e2e tests
- [x] Define CSS boundary strategy before large visual edits
- [x] Document selector contract in test comments or helper utilities

## Success Criteria

- Failing-first tests exist for the shell changes ahead
- E2E smoke selectors point at real UI anchors
- CSS refactor path chosen before large shell churn

## Risk Assessment

- New test dependencies can slow setup if overdone
- Blind CSS extraction can create churn with little value

## Security Considerations

- No direct security impact
- Avoid changing external-link behaviors during selector cleanup

## Next Steps

- Move to Phase 02 after tests can catch shell regressions
