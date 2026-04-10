# Current GitHub Panel UI Audit

## Summary

Current panel works. UX hierarchy does not.
Root problem is structure, not colors.

## Findings

### 1. Panel width is desktop-hostile

- `--panel-width: 340px` in `frontend/src/styles/globals.css`
- `SlidePanel` uses that fixed width for right-side panels
- Result: desktop panel behaves like a narrow mobile sheet

### 2. Top-level IA is overloaded

`frontend/src/components/github-view/github-view.tsx` currently stacks:

- branch controls
- commit composer
- quick Git actions
- staged changes
- unstaged changes
- diff vs base branch
- commits
- issues
- pull requests
- stash
- GitHub account / auth / git identity footer

Too many separate concerns in one vertical strip.

### 3. Local Git and GitHub collaboration are mixed badly

Panel name is `GitHub`.
Most above-the-fold UI is actually local Git.
This is acceptable only if the panel clearly separates local repo workflow from GitHub collaboration workflow.
Current panel does not.

### 4. Header action language is inconsistent

- `CompactHeader` uses icon-only actions
- quick toolbar below adds more icon-only actions
- `GitHubActionBar` exists but is not used
- `RepoInfoHeader` exists but is not used

There is enough code to build a better shell without inventing new semantics.

### 5. Footer account pattern hides important state

`github-account-section.tsx` is 631 lines.
It hides auth state in a collapsed footer row.
That makes account/auth feel secondary even when auth state determines what GitHub surfaces are usable.

### 6. Large files already justify modularization

High-risk files:

- `frontend/src/components/github-view/github-account-section.tsx` — 631 lines
- `frontend/src/components/github-view/github-view.tsx` — 360 lines
- `frontend/src/components/git-panel/commit-form.tsx` — 256 lines
- `frontend/src/App.tsx` — 411 lines
- `frontend/src/styles/globals.css` — 2057 lines

## Reusable Assets

- `frontend/src/components/slide-panel/slide-panel.tsx`
- `frontend/src/components/github-view/repo-info-header.tsx`
- `frontend/src/components/github-view/github-action-bar.tsx`
- `frontend/src/components/settings/settings-panel-content.tsx`
- `frontend/src/hooks/use-git-panel.ts`

## Test Surface Today

Existing useful tests:

- `e2e/tests/terminal.spec.ts`
- `e2e/tests/settings.spec.ts`
- `frontend/src/components/toolbar/toolbar.test.tsx`
- `frontend/src/hooks/use-git-panel.test.tsx`

Missing:

- panel layout contract tests
- tab switching tests
- summary/header rendering tests
- commit composer state tests in new layout

## Constraints

- No `docs/development-rules.md` file exists in repo
- Keep `GitHub` panel entry point in toolbar
- Keep Wails bindings stable

## Recommendation

Implement a tabbed repo cockpit in one panel:

- summary header
- primary action row
- tabs: `Changes`, `History`, `GitHub`

Do not split into two panels in this pass.
