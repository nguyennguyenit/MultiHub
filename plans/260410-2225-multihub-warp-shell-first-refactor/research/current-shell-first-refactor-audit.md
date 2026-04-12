# Current Shell-First Refactor Audit

## Summary

MultiHub already has the main structural seams needed for a Warp-inspired shell refactor.
The main problem is not missing terminal capability.
The real debt is split ownership of shell tokens, duplicated layout rules, and weak shell-level regression coverage.

## Current Reuse Seams

- `frontend/src/components/toolbar/toolbar.tsx`
- `frontend/src/components/toolbar/project-dropdown.tsx`
- `frontend/src/components/terminal/terminal-grid.tsx`
- `frontend/src/components/terminal/terminal-pane.tsx`
- `frontend/src/components/slide-panel/slide-panel.tsx`
- `frontend/src/components/github-view/github-view.tsx`
- `frontend/src/components/settings/settings-panel-content.tsx`

## Current Risks

- `frontend/src/App.tsx` is still the shell blast-radius file.
- `frontend/src/styles/globals.css`, `frontend/src/styles/shell.css`, `frontend/src/styles/workspace.css`, and `frontend/src/styles/panels.css` split ownership of the same surfaces.
- `--toolbar-height` and `--panel-width` are duplicated across style layers.
- `TerminalGrid` and `SlidePanel` rely on `visibility:hidden` to preserve child state; replacing that with `display:none` is a regression.
- App-level tests stub shell components too aggressively and cannot be trusted as the main UI regression gate.

## Current Testing Reality

- Strongest unit seams: toolbar, terminal action/empty states, GitHub panel layout.
- Weak seams: project dropdown behavior, settings interior, keyboard shortcut map, palette path.
- Existing smoke tests prove only shell entry points and basic drawer transitions.

## Chosen Scope

- Keep current backend and state model.
- Keep drawers overlayed but make them look docked.
- Keep settings lifecycle semantics as-is.
- Add a lightweight `Cmd/Ctrl+K` switcher for project, terminal, drawer, and high-frequency actions.
- Do not clone Warp blocks, editors, or agent affordances.

## References

- Brainstorm: [../../reports/260410-2217-multihub-warp-shell-first-brainstorm.md](../../reports/260410-2217-multihub-warp-shell-first-brainstorm.md)
- Warp pattern note: [../../reports/researcher-260410-2222-multihub-warp-shell-first-ui-patterns.md](../../reports/researcher-260410-2222-multihub-warp-shell-first-ui-patterns.md)
- Prior shell plan: [../../260410-1825-multihub-ui-ux-workbench-redesign/plan.md](../../260410-1825-multihub-ui-ux-workbench-redesign/plan.md)
- Prior GitHub plan: [../../260410-1946-github-panel-ux-ui-redesign/plan.md](../../260410-1946-github-panel-ux-ui-redesign/plan.md)

## Unresolved Questions

- None. Planning assumptions are fixed for this pass.
