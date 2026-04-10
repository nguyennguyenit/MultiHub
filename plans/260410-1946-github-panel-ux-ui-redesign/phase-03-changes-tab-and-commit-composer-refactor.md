# Phase 03: Changes Tab And Commit Composer Refactor

## Context Links

- [Plan Overview](./plan.md)
- [Panel Shell Width And Repo Summary](./phase-02-panel-shell-width-and-repo-summary.md)
- [Scout Report](./reports/scout-report.md)

## Overview

- Priority: P1
- Status: Completed
- Goal: move the current local Git workflow into a focused `Changes` tab and stop the composer from owning the whole panel

## Key Insights

- Current commit composer sits too high and too tall for a state-inspection panel.
- `ChangesList` and `CollapsibleSection` are reusable, but should live under `Changes`, not at the panel root.
- `commit-form.tsx` already exceeds the repo’s modularity threshold.

## Requirements

- Create `Changes` as the default tab.
- Keep staged and unstaged workflows fully functional.
- Make commit composer contextual and visually lighter.
- Keep diff access easy.

## Architecture

- Build a `github-changes-tab` container around staged/unstaged sections and composer.
- Split `commit-form.tsx` if needed into smaller leaf pieces.
- Keep `useGitPanel` as the action source; do not fork state.

## Related Code Files

### Modify

- `frontend/src/components/github-view/github-view.tsx`
- `frontend/src/components/git-panel/commit-form.tsx`
- `frontend/src/components/git-panel/changes-list.tsx`
- `frontend/src/components/git-panel/collapsible-section.tsx`
- `frontend/src/styles/globals.css`

### Create

- `frontend/src/components/github-view/github-changes-tab.tsx`
- `frontend/src/components/git-panel/commit-composer-actions.tsx`

### Delete

- None

## File Inventory

| File | Action | Rough Size | Test Impact |
|------|--------|-----------:|-------------|
| `frontend/src/components/github-view/github-view.tsx` | modify | 360 lines | moves content under tab routing |
| `frontend/src/components/git-panel/commit-form.tsx` | modify | 256 lines | behavior and visual weight change |
| `frontend/src/components/git-panel/changes-list.tsx` | modify | 226 lines | may need tab-context affordances |
| `frontend/src/components/git-panel/collapsible-section.tsx` | modify | 132 lines | now tab-local only |
| `frontend/src/styles/globals.css` | modify | 2057 lines | changes-tab layout + composer states |
| `frontend/src/components/github-view/github-changes-tab.tsx` | create | new | main changes tab container |
| `frontend/src/components/git-panel/commit-composer-actions.tsx` | create | new | keeps composer file smaller |

## Test Scenario Matrix

| Priority | Scenario | Expected |
|----------|----------|----------|
| Critical | Default active tab | `Changes` content visible first |
| Critical | No staged files | commit action disabled and visually secondary |
| High | Staged files present | composer becomes active and clear |
| High | Stage/unstage actions | still reachable and functional |
| Medium | Diff modal path | diff modal still opens from file rows |

## Function / Interface Checklist

- `GitHubPanelContent`
- `CommitForm`
- `ChangesList`
- `CollapsibleSection`
- `DiffModal`

## Dependency Map

- Depends on: Phase 01, Phase 02
- Unlocks:
  - Phase 04 tab split for history/GitHub
  - Phase 05 regression on final IA

## Tests Before

1. Add failing tests for default `Changes` tab rendering.
2. Add failing tests for composer enabled/disabled states in tab context.
3. Extend hook/component tests only where UI state needs explicit coverage.

## Refactor

1. Move staged/unstaged content into a dedicated `Changes` tab container.
2. Compress commit composer default footprint.
3. Split commit composer leaf actions if file growth keeps it over threshold.

## Tests After

1. `Changes` renders by default.
2. Composer responds correctly to staged count.
3. Diff modal path remains intact.

## Regression Gate

- `cd /Users/plateau/Project/MultiHub/frontend && npm test -- --run`
- `cd /Users/plateau/Project/MultiHub/frontend && npm run build`

## Implementation Steps

1. Create `github-changes-tab.tsx` to host staged/unstaged sections and composer.
2. Rewire `github-view.tsx` to render `Changes` through the tab system.
3. Trim the composer’s visual weight and split low-level action UI if needed.
4. Keep diff modal owned by the parent until later refactor is justified.

## Todo List

- [x] Create changes tab container
- [x] Refactor commit composer hierarchy
- [x] Preserve stage/unstage flows
- [x] Keep diff modal stable

## Success Criteria

- Changes workflow feels local and focused.
- Commit composer no longer dominates the whole panel.
- No regression in stage/unstage/commit/diff actions.

## Risk Assessment

- Risk: moving sections under tabs can break state persistence or focus flow
- Mitigation: keep parent ownership for shared diff modal and action callbacks

## Security Considerations

- Discard actions must keep existing confirmation behavior
- Do not loosen destructive-action safeguards during visual cleanup

## Next Steps

- Move history and GitHub collaboration flows into their own tabs in Phase 04
