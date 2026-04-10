---
date: 2026-04-10 19:40
status: approved
scope: github-panel-ui-ux
project: MultiHub
---

# GitHub Panel UX/UI Brainstorm

## Summary

User asked to fix UX/UI của tính năng GitHub.
Approved direction: keep one `GitHub` panel, but restructure it as a clearer repo cockpit.
Do not split into separate GitHub and Source Control panels in this pass.

## Problem Statement

Current panel feels cramped, noisy, and semantically blurry.

- Panel width fixed at `340px`, too narrow for desktop workflow
- One column tries to hold local Git, GitHub, account, commit, history, stash, issues, PRs
- Visual hierarchy weak: commit area steals focus, but navigation and status are unclear
- Header actions rely too much on icon-only controls
- Footer account section hides useful status instead of surfacing it
- Panel named `GitHub`, but most content is actually repo/Git workflow

## Requirements

- Keep current single-panel interaction from toolbar
- Keep panel name `GitHub`
- Improve information hierarchy before adding visual polish
- Minimize backend risk
- Reuse current data flows and hooks where possible

## Approaches Evaluated

### 1. Polish only

Keep structure. Increase width, spacing, typography, contrast.

Pros:
- Fast
- Lowest code risk

Cons:
- Core overload remains
- Better looking mess still a mess

### 2. Repo cockpit inside same GitHub panel

Keep one panel. Reorganize into summary + tabs + contextual composer.

Pros:
- Best improvement/effort ratio
- Fixes hierarchy and scanning
- No product-level navigation change

Cons:
- Medium frontend scope
- Requires component reshuffle

### 3. Split Source Control and GitHub

Separate local Git from GitHub collaboration.

Pros:
- Cleanest mental model

Cons:
- More scope
- More navigation friction
- Not aligned with approved request

## Approved Solution

Approve option 2. Keep one `GitHub` panel, but change internal structure.

### New Information Architecture

Top to bottom:

1. Summary header
2. Primary action row
3. Section tabs
4. Active tab content

### Summary Header

Show critical context first:

- repo identity
- current branch
- remote/sync state
- GitHub auth state

Rules:

- actions use labels where meaning matters
- sync state visible, not buried
- branch remains accessible but not dominant

### Primary Action Row

Keep only high-frequency actions:

- Fetch
- Pull
- Push
- Stage all / Unstage all when relevant

Rules:

- no icon-only row as default for critical actions
- disable or hide irrelevant actions by state

### Tabs

Use 3 tabs:

- `Changes`
- `History`
- `GitHub`

Tab responsibilities:

- `Changes`: staged, unstaged, diff entry, commit composer
- `History`: commits, branch diff, stash
- `GitHub`: auth, remote setup, issues, pull requests

### Commit Composer

Composer should become contextual, not dominate whole panel.

Rules:

- show stronger when staged files exist or composer focused
- reduce default vertical weight
- keep commit and commit-and-push flow
- shortcuts remain, but not primary communication channel

### GitHub Account/Auth

Move auth state out of footer pattern.

Rules:

- surface auth in summary or `GitHub` tab header
- remove collapsed footer account control
- keep login/logout and git identity edit, but place them in clearer ownership area

## Rationale

This keeps scope sane.

- No backend redesign
- No hook rewrite first
- No second panel or navigation debt
- Big UX gain from better grouping alone

Main fix is not color or spacing.
Main fix is reducing cognitive switching inside one narrow surface.

## Implementation Considerations

- `SlidePanel` width should be adaptive on desktop, likely `440px` to `480px` target band
- `GitHubPanelContent` should stop rendering all major sections as one long accordion stack
- Existing `CollapsibleSection` can stay, but likely only inside tabs, not as top-level IA
- `CommitForm` should be visually compressed and state-aware
- `CompactHeader` likely needs richer summary and text labels
- Panel title can stay `GitHub`, but body copy should clarify local Git vs GitHub collaboration

## Likely Files

- `frontend/src/App.tsx`
- `frontend/src/components/slide-panel/slide-panel.tsx`
- `frontend/src/components/github-view/github-view.tsx`
- `frontend/src/components/github-view/compact-header.tsx`
- `frontend/src/components/github-view/github-account-section.tsx`
- `frontend/src/components/git-panel/commit-form.tsx`
- `frontend/src/styles/globals.css`

## Risks

- Scope creep into full shell redesign
- Existing tests may assume current panel text/layout
- Wider panel can affect terminal usable width
- Semantic confusion may remain because panel name stays `GitHub`

## Success Metrics

- User can scan repo state in under 3 seconds
- Main actions read clearly without hovering icons
- Commit flow no longer visually overwhelms status/navigation
- Issues and PRs feel secondary but easy to access
- Panel feels desktop-sized, not cramped-mobile

## Validation Criteria

- Open panel from toolbar still works
- Empty project state still renders correctly
- Keyboard close behavior unchanged
- No regression in commit, push, pull, fetch, stash, issues, PR listing
- Layout remains usable at current app minimum size

## Next Steps

- Convert approved design into implementation plan
- Execute in frontend slices: panel shell, IA, composer, tabs, responsive polish
- Re-run frontend tests and basic e2e smoke after implementation

## Dependencies

- Current Wails/React frontend structure
- Existing `useGitPanel` hook and GitHub API adapter
- Existing slide panel behavior

## Unresolved Questions

- None blocking
- Minor open question: exact desktop panel width within `440px` to `480px`
