---
title: "Warp-Inspired Shell-First UI Patterns for MultiHub"
date: "2026-04-10 22:22"
status: "research"
scope: "ui-ux"
---

# Warp-Inspired Shell-First UI Patterns for MultiHub

## Summary

Use Warp as a behavior reference, not a visual clone. Highest leverage for MultiHub is: compress the shell spine, keep utility surfaces attached, make the active pane unmistakable, and add a small universal palette.

Source quality is strong: Warp docs are primary; the local brainstorm is project-specific direction; current MultiHub files show the refactor fit already exists in the codebase. Everything below is an inference from those sources, not a claim of parity with Warp.

Architectural fit is high for shell/drawer/pane work because MultiHub already has a compact toolbar, attached slide panels, and terminal grids that preserve inactive project state. Adoption risk is medium only for the palette, because it needs a clean action-routing model.

## Sources

- Warp docs, primary behavior signals: [Command Palette](https://docs.warp.dev/terminal/command-palette), [Terminal split panes](https://docs.warp.dev/terminal/windows/split-panes), [Built-in code editor](https://docs.warp.dev/code/code-editor), [Code Review panel](https://docs.warp.dev/code/code-review), [Modern text editing](https://docs.warp.dev/terminal/editor)
- Local direction: [260410-2217-multihub-warp-shell-first-brainstorm.md](/Users/plateau/Project/MultiHub/plans/reports/260410-2217-multihub-warp-shell-first-brainstorm.md)
- Current MultiHub fit surfaces: [toolbar.tsx](/Users/plateau/Project/MultiHub/frontend/src/components/toolbar/toolbar.tsx#L52), [shell.css](/Users/plateau/Project/MultiHub/frontend/src/styles/shell.css#L1), [panels.css](/Users/plateau/Project/MultiHub/frontend/src/styles/panels.css#L44), [terminal-grid.tsx](/Users/plateau/Project/MultiHub/frontend/src/components/terminal/terminal-grid.tsx#L91)

## Concrete UI Principles

1. Keep one shell spine. The top bar should carry identity, project context, and a small state summary; do not introduce a second command strip or activity bar.
2. Make drawers attached, not modal. GitHub and Settings should stay docked to the shell edge, reuse the same width/radius/tone system, and reopen in-place.
3. Give the active pane one clear focus treatment. Use stronger border/contrast/header emphasis for the active terminal and visibly recede inactive panes without unmounting them.
4. Make the palette a router, not a command center. `Cmd/Ctrl+K` should search projects, terminals, drawers, and common actions first; keep the scope small enough to stay fast.
5. Keep all context in-flow. Opening files, diffs, or utility views should happen from the current workspace and return there without forcing a separate mode switch.
6. Reduce chrome density before adding new behavior. Smaller radii, tighter spacing, fewer nested cards, and less glow will make the app read terminal-first faster than another visual treatment layer.
7. Preserve state across view changes. Hidden terminals, project groups, and drawer content should stay mounted where possible so focus, scroll, and buffer state survive switches.
8. Stay cross-platform neutral. Same information architecture on macOS, Windows, and Linux; only shortcuts and native window affordances should vary.

## Top Risks of Over-Copying Warp

- High: scope creep into Warp’s agent/editor ecosystem. MultiHub is a terminal refactor, not a terminal-plus-code-platform rewrite.
- High: palette bloat. If everything moves into search, the shell gets invisible and frequent actions get slower.
- Medium: shortcut transplant. Warp’s keymap is rich; copying it wholesale will clash with platform norms and current user muscle memory.
- Medium: cosmetic cloning without behavior. Matching blur, radius, and card style but not the interaction model will look borrowed and still feel wrong.
- Medium: state regressions. If drawers or panes remount on every toggle, MultiHub loses the state-preserving advantage already present in `terminal-grid.tsx`.

## Ranked Phase Order

1. Normalize shell tokens and hierarchy. Highest value, lowest risk. Rework toolbar spacing, borders, radii, and emphasis first; keep data/state unchanged.
2. Reframe attached drawers. Convert GitHub and Settings into clearly docked utility surfaces with a single shared drawer model.
3. Tighten pane emphasis. Make active/inactive pane contrast, headers, and keyboard focus rules match the shell-first hierarchy.
4. Ship the lightweight palette. Add `Cmd/Ctrl+K` for project, terminal, drawer, and common-action search only; reuse existing stores and actions.
5. Add regression checks after the structural pass. Verify project switching, drawer open/close, focus retention, and terminal state persistence.

## Limitations

- Did not measure runtime performance or run UI tests.
- Did not inspect every terminal subcomponent.
- Did not propose a new implementation plan; this is guidance for phase ordering only.
