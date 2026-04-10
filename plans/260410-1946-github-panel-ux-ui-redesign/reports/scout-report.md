# GitHub Panel Scout Report

## Relevant Files

- `frontend/src/App.tsx`
  - mounts `SlidePanel` for GitHub and Settings
  - owns panel open/close state
  - injects GitHub panel title, description, and header extra
- `frontend/src/components/slide-panel/slide-panel.tsx`
  - shared side-panel shell
  - current header/body layout is generic enough to extend
- `frontend/src/styles/globals.css`
  - owns panel width token and slide panel styling
  - already carries shared panel/settings utility styles
- `frontend/src/components/github-view/github-view.tsx`
  - current overloaded panel body
  - prime candidate for decomposition
- `frontend/src/components/github-view/compact-header.tsx`
  - current branch selector + icon-only remote actions
- `frontend/src/components/github-view/github-account-section.tsx`
  - current auth + git identity footer
  - too large; should be split
- `frontend/src/components/github-view/repo-info-header.tsx`
  - currently unused
  - useful summary/header building block
- `frontend/src/components/github-view/github-action-bar.tsx`
  - currently unused
  - useful labeled action row building block
- `frontend/src/components/github-view/issues-tab.tsx`
  - current issues surface
- `frontend/src/components/github-view/prs-tab.tsx`
  - current PR surface
- `frontend/src/components/git-panel/commit-form.tsx`
  - current commit composer
  - too large for a leaf UI element
- `frontend/src/components/git-panel/collapsible-section.tsx`
  - reusable only inside tab sections, not as primary IA
- `frontend/src/components/git-panel/changes-list.tsx`
  - reusable changes rendering
- `frontend/src/components/git-panel/history-tab.tsx`
  - reusable commit history rendering
- `frontend/src/components/git-panel/stash-tab.tsx`
  - reusable stash rendering
- `frontend/src/components/github-view/branch-diff-file-list.tsx`
  - reusable history/diff tab content
- `frontend/src/hooks/use-git-panel.ts`
  - current local repo state source
- `frontend/src/hooks/use-git-panel.test.tsx`
  - existing state-layer regression coverage
- `frontend/src/shared/constants/test-ids.ts`
  - current stable selectors for shell and panels
- `e2e/tests/terminal.spec.ts`
  - current GitHub panel smoke coverage
- `e2e/tests/settings.spec.ts`
  - good reference for side-panel smoke behavior

## File Size Signals

| File | Lines | Signal |
|------|------:|--------|
| `frontend/src/components/github-view/github-account-section.tsx` | 631 | split required |
| `frontend/src/components/github-view/github-view.tsx` | 360 | split required |
| `frontend/src/components/git-panel/commit-form.tsx` | 256 | split likely |
| `frontend/src/App.tsx` | 411 | keep edits thin |
| `frontend/src/styles/globals.css` | 2057 | prefer isolated additions, not scattered drift |

## Current Test Surface

| File | Coverage |
|------|----------|
| `e2e/tests/terminal.spec.ts` | open GitHub panel, empty state smoke |
| `e2e/tests/settings.spec.ts` | side-panel open/close reference |
| `frontend/src/components/toolbar/toolbar.test.tsx` | shell anchors stable |
| `frontend/src/hooks/use-git-panel.test.tsx` | hook stability under async failures/stale responses |

## Missing Test Surface

- tab navigation rendering
- summary header rendering
- panel width class/variant contract
- account/auth location changes
- changes/history/GitHub tab visibility and default tab

## Dependency Notes

- Settings panel provides the best in-repo model for a clean side-panel information architecture.
- `useGitPanel` should stay the only repo-state source for local Git surfaces.
- GitHub API calls stay inside `issues-tab.tsx`, `prs-tab.tsx`, and account/auth subcomponents.

## Unresolved Questions

- None blocking.
- Width exact value still product-tunable during implementation.
