# Current UI/UX State Audit

## Summary

App is functional, but shell hierarchy weak.
Main issue is not color. Main issue is layout priority, product identity, and inconsistent shell patterns.

## Findings

- Product config says `MultiHub`, but visible UI still says `MultiClaude` in toolbar, welcome screen, settings copy, and update flows.
- App chrome split across top toolbar, terminal status bar, and bottom project bar. Attention fragmented.
- `SlidePanel` and `SettingsModal` use different interaction models and density.
- `globals.css` is a monolith. Shell changes there will be high-risk without boundaries.
- Existing test coverage is mostly utility-only. No serious component regression guard for shell/UI changes.
- Playwright smoke specs exist, but selectors already drift from implementation in places.

## Hot Files

- `frontend/src/App.tsx`
- `frontend/src/styles/globals.css`
- `frontend/src/components/toolbar/toolbar.tsx`
- `frontend/src/components/toolbar/project-bar.tsx`
- `frontend/src/components/terminal/terminal-action-bar.tsx`
- `frontend/src/components/welcome-screen.tsx`
- `frontend/src/components/slide-panel/slide-panel.tsx`
- `frontend/src/components/settings/settings-modal.tsx`
- `frontend/src/components/update-banner.tsx`
- `frontend/src/components/settings/update-settings.tsx`

## Test Readiness

- Vitest present.
- Global Wails stubs present in `frontend/src/test-setup.ts`.
- Current frontend tests: utility-only.
- Existing e2e smoke files cover terminal, projects, settings, but rely on unstable selectors.

## Constraints

- Wails drag/no-drag zones must survive shell changes.
- Terminal rendering performance must not regress from cosmetic work.
- UI redesign should stay presentation-layer first; store/API churn should be avoided.

## Implications For Plan

- Start with selector stabilization and component test harness.
- Reduce CSS blast radius before heavy visual edits.
- Prefer one shell language across header, panels, and empty states.
- Treat brand cleanup as a first-class task, not an afterthought.
