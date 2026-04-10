# Phase 04: History And GitHub Collaboration Tabs

## Context Links

- [Plan Overview](./plan.md)
- [Changes Tab And Commit Composer Refactor](./phase-03-changes-tab-and-commit-composer-refactor.md)
- [Scout Report](./reports/scout-report.md)

## Overview

- Priority: P1
- Status: Completed
- Goal: isolate historical repo surfaces and GitHub collaboration surfaces into separate tabs

## Key Insights

- `github-account-section.tsx` is too large to keep as one footer component.
- History, stash, and diff-vs-base are local repo history concerns, not GitHub collaboration.
- Issues/PRs and auth belong together inside one GitHub-specific tab.

## Requirements

- Add `History` tab for commits, branch diff, and stash.
- Add `GitHub` tab for auth, git identity, issues, and PRs.
- Remove footer-collapse account treatment.
- Keep current data loading paths intact.

## Architecture

- Create dedicated tab containers:
  - `github-history-tab.tsx`
  - `github-collaboration-tab.tsx`
- Split `github-account-section.tsx` into smaller focused components:
  - auth summary / controls
  - git identity editor
  - optional account badges
- Keep `issues-tab.tsx` and `prs-tab.tsx` as leaf data surfaces.

## Related Code Files

### Modify

- `frontend/src/components/github-view/github-view.tsx`
- `frontend/src/components/github-view/github-account-section.tsx`
- `frontend/src/components/github-view/issues-tab.tsx`
- `frontend/src/components/github-view/prs-tab.tsx`
- `frontend/src/components/git-panel/history-tab.tsx`
- `frontend/src/components/git-panel/stash-tab.tsx`
- `frontend/src/components/github-view/branch-diff-file-list.tsx`
- `frontend/src/styles/globals.css`

### Create

- `frontend/src/components/github-view/github-history-tab.tsx`
- `frontend/src/components/github-view/github-collaboration-tab.tsx`
- `frontend/src/components/github-view/github-auth-summary-card.tsx`
- `frontend/src/components/github-view/git-identity-card.tsx`

### Delete

- None initially

## File Inventory

| File | Action | Rough Size | Test Impact |
|------|--------|-----------:|-------------|
| `frontend/src/components/github-view/github-view.tsx` | modify | 360 lines | tab routing simplified |
| `frontend/src/components/github-view/github-account-section.tsx` | modify | 631 lines | split and shrink |
| `frontend/src/components/github-view/issues-tab.tsx` | modify | 156 lines | tab-local empty/loading states |
| `frontend/src/components/github-view/prs-tab.tsx` | modify | 165 lines | tab-local empty/loading states |
| `frontend/src/components/git-panel/history-tab.tsx` | modify | 69 lines | history tab integration |
| `frontend/src/components/git-panel/stash-tab.tsx` | modify | 187 lines | history tab integration |
| `frontend/src/components/github-view/branch-diff-file-list.tsx` | modify | 60 lines | history tab integration |
| `frontend/src/styles/globals.css` | modify | 2057 lines | tab content layout + card styles |
| `frontend/src/components/github-view/github-history-tab.tsx` | create | new | history shell tests |
| `frontend/src/components/github-view/github-collaboration-tab.tsx` | create | new | GitHub shell tests |
| `frontend/src/components/github-view/github-auth-summary-card.tsx` | create | new | auth visibility tests |
| `frontend/src/components/github-view/git-identity-card.tsx` | create | new | identity editor tests |

## Test Scenario Matrix

| Priority | Scenario | Expected |
|----------|----------|----------|
| Critical | History tab | commits, stash, and branch diff are visible under one tab |
| Critical | GitHub tab | auth plus issues/PRs are visible under one tab |
| High | Auth unauthenticated | login affordance visible without footer expand step |
| High | Auth authenticated | username/status visible in GitHub tab summary |
| Medium | Issues/PR empty state | remains understandable |
| Medium | PR empty state | remains understandable |

## Function / Interface Checklist

- `GitHubPanelContent`
- `GitHubAccountSection`
- `IssuesTab`
- `PRsTab`
- `HistoryTab`
- `StashTab`
- `BranchDiffFileList`

## Dependency Map

- Depends on: Phase 01, Phase 02, Phase 03
- Unlocks:
  - Phase 05 integration polish and full regression

## Tests Before

1. Add failing tests for `History` and `GitHub` tab routing.
2. Add failing tests for auth summary location in the GitHub tab.
3. Add empty/loading state assertions for issues and PRs if missing.

## Refactor

1. Create dedicated tab containers for history and GitHub collaboration.
2. Decompose the oversized account section into smaller cards.
3. Remove footer-collapse semantics.

## Tests After

1. `History` tab groups all local history surfaces cleanly.
2. `GitHub` tab groups auth, identity, issues, and PRs cleanly.
3. Issues and PR states remain stable.

## Regression Gate

- `cd /Users/plateau/Project/MultiHub/frontend && npm test -- --run`
- `cd /Users/plateau/Project/MultiHub/frontend && npm run build`

## Implementation Steps

1. Add new history and collaboration tab containers.
2. Move commits, stash, and branch-diff content into `History`.
3. Split auth and identity UI into smaller components and mount them in `GitHub`.
4. Keep issues/PR leaf components but align their shell styling with the new tab layout.

## Todo List

- [x] Add history tab container
- [x] Add GitHub collaboration tab container
- [x] Split account section
- [x] Align issues and PR shells

## Success Criteria

- Footer account collapse is gone.
- Local history and GitHub collaboration no longer compete in one scroll stack.
- Auth status becomes easier to discover.

## Risk Assessment

- Risk: tab content refactor introduces duplicated loading/error UI
- Mitigation: extract shared wrappers only if repetition is real, not speculative

## Security Considerations

- Auth UI must not expose hidden tokens or raw CLI output
- Keep login/logout and identity edit flows explicit and confirmable

## Next Steps

- Final polish, selector cleanup, and full regression in Phase 05
