---
title: "MultiHub Warp Shell-First Brainstorm"
date: "2026-04-10 22:17"
status: "approved"
scope: "ui-ux"
---

# MultiHub Warp Shell-First Brainstorm

## Summary

User wants MultiHub UI refactor to feel like Warp.
Decision: do not clone Warp product model 1:1.
Approved direction: shell-first, cross-platform, right drawer, include switcher/palette in phase 1.

## Findings

- MultiHub already has strong split-pane groundwork in `frontend/src/components/terminal/terminal-grid.tsx`.
- Current gap vs Warp is mostly shell hierarchy, density, and panel attachment, not terminal capability.
- Current shell is more card-heavy than Warp:
  - `frontend/src/components/toolbar/toolbar.tsx`
  - `frontend/src/styles/shell.css`
  - `frontend/src/styles/workspace.css`
  - `frontend/src/styles/panels.css`
- Layout tokens are partly duplicated. Example: `--toolbar-height` is defined in both `frontend/src/styles/globals.css` and `frontend/src/styles/shell.css`.

## Evaluated Approaches

### 1. Skin-only

Pros:
- Fast
- Low risk

Cons:
- Superficial
- Looks closer to Warp, still feels unlike Warp

### 2. Shell-first

Pros:
- Best cost/value
- Strong Warp-like feel without product-model rewrite
- Preserves current architecture

Cons:
- Touches many layout surfaces
- Needs regression coverage on shell/panels

### 3. Model-clone

Pros:
- Closest to Warp

Cons:
- Scope blow-up
- Wrong first move for current MultiHub maturity

## Final Recommendation

Use shell-first refactor.

Key decisions:
- keep current multi-terminal engine
- keep right-side drawer model
- reduce chrome density
- remove card-in-card feeling
- move toward attached utility panels
- ship lightweight switcher/palette in phase 1
- stay cross-platform, not macOS-biased

## Proposed Design

- Slim top shell bar, content-first
- Compact project switcher
- Terminal-first workspace with lower visual noise
- Pane headers thinner, active pane clearer, inactive panes recede
- Remove standalone action-bar feeling; absorb actions into shell/pane controls
- GitHub and Settings become attached right drawers, less floating, less blur, less radius
- Welcome state becomes simpler, less promotional
- Add `Cmd/Ctrl+K` switcher/palette for projects, terminals, panels, and common actions

## Implementation Considerations

- Normalize shell/workspace/panel tokens before visual sweep
- Avoid changing store/data model unless needed for shell state
- Keep split-pane behavior intact
- Add/update regression tests around:
  - toolbar/project switching
  - panel open/close
  - terminal workspace visibility
  - palette open/filter/execute if included in phase 1

## Success Metrics

- App reads as terminal-first at first glance
- Right drawer feels attached, not modal
- Fewer competing emphasis layers
- Keyboard flow faster with switcher/palette
- No regressions in terminal/project/panel behavior

## Next

- If user wants execution: create detailed implementation plan in `plans/{timestamp}-multihub-warp-shell-first-refactor/`

## Unresolved Questions

- None for design direction
