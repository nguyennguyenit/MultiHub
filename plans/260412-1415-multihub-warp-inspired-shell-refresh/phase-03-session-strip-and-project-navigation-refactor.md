# Phase 03 - Real Project Tabs And Active Project Persistence

## Context Links

- [Plan Overview](./plan.md)
- [Phase 02](./phase-02-titlebar-ownership-and-top-shell-architecture.md)
- [Warp Project Tabs Brainstorm](../reports/260412-1459-multihub-warp-project-tabs-brainstorm.md)
- [frontend/src/App.tsx](../../frontend/src/App.tsx)
- [frontend/src/stores/app-store.ts](../../frontend/src/stores/app-store.ts)
- [app-project-bindings.go](../../app-project-bindings.go)
- [internal/project/store.go](../../internal/project/store.go)
- [frontend/src/components/toolbar/toolbar.tsx](../../frontend/src/components/toolbar/toolbar.tsx)
- [frontend/src/components/toolbar/project-dropdown.tsx](../../frontend/src/components/toolbar/project-dropdown.tsx)
- [frontend/src/components/github-view/github-panel-tabs.tsx](../../frontend/src/components/github-view/github-panel-tabs.tsx)
- [frontend/src/components/toolbar/window-controls.tsx](../../frontend/src/components/toolbar/window-controls.tsx)
- [frontend/src/styles/shell.css](../../frontend/src/styles/shell.css)
- [frontend/src/components/terminal/terminal-grid.tsx](../../frontend/src/components/terminal/terminal-grid.tsx)

## Overview

- Priority: P1
- Current status: completed
- Brief: real project tabs, persisted active-project hydration/readback, and overflow fallback are implemented

## Key Insights

- MultiHub already has the right project-level model. The current slice now wires the top shell to it instead of inventing a second navigator.
- Project tabs are honest because the model is already project-scoped; the dropdown now serves as overflow/quick-jump fallback, not the primary navigator.
- Backend persistence already exists for `activeProjectId`, and the renderer now hydrates and writes it back through the shared helper.
- Top-level terminal tabs are still the wrong move because pane chrome already owns terminal-level navigation.

## Requirements

- Make the active project tab the dominant top-shell cue.
- `1 top tab = 1 project`.
- Replace the large `Open Project` CTA with a compact `+` affordance near the tabs.
- Horizontal scroll is the first overflow strategy; the dropdown is fallback for overflow/quick jump only.
- Persist the active project on tab click, add-project completion, and palette project selection.
- Hydrate persisted `activeProjectId` on startup after project-path validation.
- Clear the active project on unscoped-terminal selection or invalid persisted project state.
- Define and test project-tab selection semantics:
  - startup hydration from persisted active project
  - reliable select/switch behavior
  - predictable fallback when the active project is deleted
- Keep GitHub toggle, settings toggle, keyboard shortcuts, and non-macOS controls intact.
- Do not merge project tabs with pane tabs.
- Avoid fake Warp session or command semantics.

## Architecture

- Keep `switchToProject` as the single project-transition path; do not add a parallel shell state model.
- Keep store mutations pure in `app-store`; persistence stays in `App`/API layer.
- Prefer a minimal `ProjectGetActive()` binding over changing the `ProjectList()` response shape.
- Data flow: `projects.json.activeProjectId -> ProjectGetActive -> App init validates projects -> switchToProject/setActiveProject -> tab strip render`.
- Selection flow: `tab click or palette project action -> shared App helper -> api.project.setActive(id or '') -> store update -> UI refresh`.
- Swap the dropdown-first trigger for a true tab strip in `Toolbar`; keep `ProjectDropdown` only if a narrow-width fallback is still justified after the first pass.
- Mirror the existing accessible tab semantics from `github-panel-tabs.tsx` instead of inventing a custom ad-hoc tab contract.
- Extract a focused `top-shell-project-tab-strip` seam if that prevents `App.tsx` and `toolbar.tsx` from bloating further.

## Related Code Files

### Modify

- `frontend/src/App.tsx`
- `frontend/src/stores/app-store.ts`
- `frontend/src/api/index.ts`
- `frontend/src/shared/types/index.ts`
- `app-project-bindings.go`
- `internal/project/store.go`
- `internal/project/store_test.go`
- `frontend/src/components/toolbar/toolbar.tsx`
- `frontend/src/components/toolbar/project-dropdown.tsx`
- `frontend/src/components/toolbar/window-controls.tsx`
- `frontend/src/styles/shell.css`
- `frontend/src/App.test.tsx`
- `frontend/src/test-setup.ts`
- `frontend/src/components/toolbar/toolbar.test.tsx`
- `frontend/src/components/toolbar/project-dropdown.test.tsx`
- `frontend/src/components/terminal/terminal-grid.test.tsx`
- `e2e/tests/projects.spec.ts`

### Create

- `frontend/src/components/toolbar/top-shell-project-tab-strip.tsx` if `toolbar.tsx` would exceed 200 LOC

### Delete

- None

## File Inventory

| File | Action | Rough Size | Test Impact |
|------|--------|-----------:|-------------|
| `frontend/src/App.tsx` | modify | 501 lines | hydration, delete fallback, and top-shell orchestration converge here |
| `frontend/src/stores/app-store.ts` | modify | 224 lines | active-project and active-terminal coordination |
| `app-project-bindings.go` + `internal/project/store.go` | modify | existing | explicit get/set active-project plumbing without a new store shape |
| `frontend/src/components/toolbar/toolbar.tsx` | modify | 168 lines | primary project-tab-strip refactor |
| `frontend/src/components/toolbar/project-dropdown.tsx` | modify | 153 lines | retained only if overflow fallback is still needed |
| `frontend/src/components/toolbar/window-controls.tsx` | modify | 54 lines | spacing and visual integration on non-macOS |
| `frontend/src/styles/shell.css` | modify | 418 lines | project tab strip, overflow, utility density, responsive clamps |

## Test Scenario Matrix

| Priority | Scenario | Expected |
|----------|----------|----------|
| Critical | Startup hydration | saved active project tab restores cleanly |
| Critical | Project switching | remains reliable through mouse and keyboard paths |
| Critical | Delete active project | focus falls to the next sensible tab or clears predictably |
| High | Active project cue | reads clearly at one glance |
| High | Add-project action | remains obvious and reachable as a compact `+` affordance |
| High | Utility actions | GitHub/settings toggles remain discoverable but secondary |
| Medium | Narrow width shell | tabs do not overlap traffic-light spacing or utility controls |
| Medium | Hidden project terminal groups | existing mounted-hidden behavior remains intact |

## Function / Interface Checklist

- `Toolbar`
- `ProjectDropdown`
- `switchToProject`
- `ProjectSetActive`
- `Store.GetActive`
- `WindowControls`
- `TEST_IDS.shell.projectSwitcherButton`
- `TEST_IDS.shell.addProjectButton`

## Dependency Map

- Depends on: Phase 02
- Unlocks:
  - Phase 04 workspace flattening under the new hierarchy
  - Phase 05 omnibox promotion

## Tests Before

1. Add failing `Toolbar` tests for one-tab-per-project rendering, active-tab highlight, and the compact `+` affordance.
2. Add failing `ProjectDropdown` tests for overflow/fallback behavior instead of primary-navigation behavior.
3. Add failing `App` tests for persisted active-project hydration, stale-active cleanup, and clearing active project when an unscoped terminal is selected.
4. Add failing Go tests only if a new binding/helper is added beyond existing store persistence coverage.

## Refactor

1. Demote `ProjectDropdown` to overflow/quick-jump menu.
2. Extract the tab strip from `Toolbar` to avoid pushing `toolbar.tsx` past the repo size rule.
3. Centralize active-project sync in one `App` helper so add/select/palette/unscoped-terminal paths cannot drift.
4. Demote generic metadata and compress utility chrome after the tab contract is stable.

## Tests After

1. `go test ./...` passes if the project binding/store surface changed.
2. App, toolbar, dropdown, and terminal-grid tests pass with the new project-tab behavior.
3. Project smoke passes with the updated shell anchors.
4. Build passes with no shell import drift.

## Regression Gate

- `cd /Users/plateau/Project/MultiHub && go test ./...`
- `cd /Users/plateau/Project/MultiHub/frontend && npm test -- --run`
- `cd /Users/plateau/Project/MultiHub/frontend && npm run build`
- `cd /Users/plateau/Project/MultiHub/e2e && npm test -- tests/projects.spec.ts`

## Implementation Steps

1. Decide and test the persistence contract: `activeProjectId` restores on startup and clears or falls back deterministically on delete.
2. Wire renderer <-> backend active-project sync through the existing project store surface, preferably with a minimal `ProjectGetActive()` binding.
3. Replace the dropdown trigger with a real project tab strip and compact `+` action.
4. Tighten metadata, utility density, overflow behavior, and responsive shell behavior.

## Todo List

- [x] Add failing tests for project tabs and active-project hydration
- [x] Lock active-project persistence and delete fallback semantics
- [x] Replace the dropdown-first shell with real project tabs
- [x] Demote `ProjectDropdown` to overflow/quick-jump fallback
- [x] Keep project switching behavior intact through existing handlers
- [x] Prevent `Toolbar`/`App` complexity growth

## Success Criteria

- Top shell reads closer to Warp in one screenshot
- Active project tab becomes the obvious primary cue
- Active project survives reloads without UI/backend drift
- Overflow, drag region, and window controls stay stable
- Pane-level tabs remain visually subordinate to project tabs
- Utility actions no longer compete visually with the main session context

## Risk Assessment

- UI/backend drift if `activeProjectId` is persisted in one layer but not hydrated in the other
- Overdoing faux-tab styling can imply unsupported behavior
- Removing too much context can make multi-project use worse, not better

## Security Considerations

- No new auth/data exposure
- Keep destructive project actions clearly separate from selection actions

## Next Steps

- Phase 04 can flatten the workspace and drawers under the new shell hierarchy
