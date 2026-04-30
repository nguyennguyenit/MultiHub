# Current Warp-Inspired Shell Refresh Audit

## Summary

This is not a blank-sheet Warp clone.
MultiHub already has a shell-first base.
Gap is mostly top-edge ownership, session hierarchy, workspace density, and palette centrality.

## Repo Findings

- Current shell stack already exists:
  - `frontend/src/components/toolbar/toolbar.tsx`
  - `frontend/src/components/toolbar/project-dropdown.tsx`
  - `frontend/src/components/quick-switcher/quick-switcher-dialog.tsx`
  - `frontend/src/components/slide-panel/slide-panel.tsx`
  - `frontend/src/styles/shell.css`
  - `frontend/src/styles/workspace.css`
  - `frontend/src/styles/panels.css`
- Prior completed plan `260410-2225-multihub-warp-shell-first-refactor` already shipped:
  - denser shell
  - attached right drawers
  - lightweight quick switcher
- Current visible mismatch in screenshot:
  - native title area still feels separate from shell
  - centered title feeling remains too generic
  - workspace still reads slightly card-heavy

## Technical Constraints

- Backend terminal model is still raw PTY output plus OSC title parsing.
- There is no command lifecycle model for:
  - command start/end
  - block boundaries
  - sticky command headers
  - semantic editor UX
- Conclusion:
  - Warp-inspired shell = feasible
  - Warp blocks clone = wrong scope

## Relevant File Pressure

- `frontend/src/App.tsx` = 501 lines
- `frontend/src/components/terminal/terminal-pane.tsx` = 313 lines
- `frontend/src/styles/shell.css` = 418 lines
- `frontend/src/styles/workspace.css` = 537 lines
- `frontend/src/styles/panels.css` = 824 lines

Modularization checkpoint is mandatory if changes make these files harder to reason about.

## External Source Notes

- Wails official docs: window/titlebar changes should stay within supported options and runtime APIs.
- Warp docs confirm command palette and blocks are product-level features, not just CSS.

References:
- https://wails.io/docs/reference/options/
- https://docs.warp.dev/features/command-palette
- https://docs.warp.dev/terminal/blocks

## Recommended Scope

- Own the top edge better
- Rebuild top shell into clearer session hierarchy
- Flatten workspace and tighten pane chrome
- Promote palette into a clearer omnibox
- Keep attached drawers
- Do not touch PTY semantics

## Risks

- Native titlebar changes can break drag/control behavior
- Faux Warp tabs can imply missing semantics
- Palette can drift into false command-editor affordance
- CSS churn can get messy fast because shell files are already large

## Unresolved Questions

- None blocking
