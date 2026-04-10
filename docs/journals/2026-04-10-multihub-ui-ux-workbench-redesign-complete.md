# MultiHub UI/UX Workbench Redesign Complete

**Date**: 2026-04-10 18:59  
**Severity**: Low  
**Component**: Frontend shell / workbench UI  
**Status**: Resolved

## What Happened

Finished the MultiHub workbench redesign in the frontend shell without changing backend behavior. The app now centers on a compact toolbar with project switching, open-project CTA, workbench context, terminal count, and GitHub/settings toggles. Terminal workspace, welcome state, update surfaces, and side panels were brought into one visual system.

## The Brutal Truth

The old shell was a patchwork. It felt like separate screens glued together, and the app paid for that with weak hierarchy and awkward context switches. The annoying part was that this was not a single big fix; it was a lot of small UI surgery just to make the workbench feel like one product instead of a pile of features.

## Technical Details

- `App.tsx` now coordinates `Toolbar`, `UpdateBanner`, `TerminalActionBar`, `TerminalGrid`, `WelcomeScreen`, and two `SlidePanel` instances from one `activePanel` state.
- `toolbar.tsx` replaces the old split-shell feel with a header-first layout and `ProjectDropdown` instead of horizontal project tabs.
- `terminal-grid.tsx` keeps inactive project groups mounted and hides them with `visibility: hidden` so xterm state does not get blown away on project switches.
- `slide-panel.tsx` uses the same panel pattern for GitHub and Settings, switching direction by orientation.
- `update-banner.tsx` and `update-settings.tsx` now share the same release/install flow and GitHub release links.
- Verification passed: frontend unit tests, frontend build, and Playwright smoke suite `7/7` against `http://localhost:34115`.

## What We Tried

- Considered a left-rail navigation rewrite, but rejected it because it would have expanded scope and made drag-region / macOS traffic-light handling worse.
- Kept stores, bindings, and backend behavior untouched.
- Preserved mounted terminal state instead of unmounting on project changes.

## Root Cause Analysis

The root problem was shell drift by accretion. Toolbar, project navigation, panels, and empty states each evolved their own language, so the app never had one clear hierarchy: project -> workbench -> terminal/panels. Once that hierarchy was centralized, the rest of the UI stopped fighting itself.

## Lessons Learned

- Shell work needs one source of truth for navigation and panel state.
- Preserving terminal mounts is worth the complexity when cursor and buffer state matter.
- UI changes like this need smoke coverage, not just unit tests.

## Next Steps

- Watch memory and state cost if many inactive project grids stay mounted.
- Validate the update/install path on a real signed release build before release.
- Revisit whether hidden mounted grids stay the right tradeoff if project counts grow.

## Unresolved Questions

- Keep the current "mount everything, hide inactive" strategy long term?
- Add a stronger active-project cue in the toolbar?
