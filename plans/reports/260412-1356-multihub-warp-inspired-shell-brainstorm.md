---
title: "MultiHub Warp-Inspired Shell Brainstorm"
date: "2026-04-12 13:56"
status: "approved"
scope: "ui-ux"
decision: "approach-2"
---

# MultiHub Warp-Inspired Shell Brainstorm

## Summary

User wants project shell in screenshot to feel like Warp.
Approved direction: `Approach 2`.
Meaning: make MultiHub feel Warp-like in chrome, hierarchy, and keyboard flow without cloning Warp's full command-block product model.

## Findings

- MultiHub already has a strong shell-first base:
  - `frontend/src/components/toolbar/toolbar.tsx`
  - `frontend/src/components/quick-switcher/quick-switcher-dialog.tsx`
  - `frontend/src/styles/shell.css`
  - `frontend/src/styles/workspace.css`
- Current app already moved toward Warp once. Changelog explicitly records a shell-first Warp refactor.
- Main gap now is not PTY capability. Main gap is visual hierarchy and workflow cues.
- Biggest mismatch in screenshot:
  - native macOS title area still reads separate from app shell
  - centered app title makes the window feel like a generic desktop shell, not a terminal-native product
  - workspace still reads a bit card-heavy versus Warp's flatter, tighter structure
- Backend terminal model is still raw PTY stream + OSC title parsing.
- That means true Warp-style command blocks, sticky command headers, and semantic command cards are not cheap. They require shell integration or command lifecycle markers.

## Evaluated Approaches

### 1. Chrome-only reskin

Pros:
- Fast
- Low risk
- Mostly frontend CSS and shell layout work

Cons:
- Can look like Warp while still feeling unlike Warp in use
- Leaves keyboard and session hierarchy underpowered

### 2. Warp-inspired MultiHub

Pros:
- Best cost/value
- Keeps current PTY engine and project model
- Moves product feel much closer to Warp
- Feasible without backend rewrite

Cons:
- Still touches many visible surfaces
- Needs discipline to avoid half-Warp half-MultiHub drift

### 3. Full Warp product clone

Pros:
- Closest feature parity

Cons:
- Wrong scope now
- Requires terminal model rewrite, not visual work
- High regression and maintenance cost

## Final Recommendation

Use `Approach 2`.

Design principle:
- clone Warp's feel
- keep MultiHub's product shape
- do not fake full Warp blocks on top of raw PTY output

This is the honest boundary:
- `Warp-inspired shell` is good scope
- `Warp clone` is bad scope

## Proposed Design

### A. Top Shell Chrome

- Hide or visually absorb native title area so app shell owns the top edge.
- Remove centered title feel. Brand should live inside custom shell, not as window title emphasis.
- Keep traffic-light compatibility on macOS, but reduce visual separation around it.
- Introduce a real top session strip:
  - active project/session left-aligned
  - compact `+` affordance near tabs
  - utility actions compressed to the right

### B. Session and Project Hierarchy

- Make project/session selection read more like Warp tabs, less like a dashboard control cluster.
- `ProjectDropdown` stays, but visually behaves like a tab anchor with path context.
- Terminal count becomes low-emphasis metadata, not a badge-like focal point.
- Active project should be obvious at one glance, inactive context should recede hard.

### C. Workspace Density

- Flatten the shell. Less card-in-card.
- Reduce radius and heavy shadow on terminal area and panes.
- Pane headers thinner, calmer, more tab-like.
- Make separators and active pane states more surgical, less decorative.
- Welcome state simpler and more utilitarian.

### D. Command Entry Flow

- Upgrade quick switcher into a more central omnibox/palette pattern.
- Use it for:
  - switch project
  - switch terminal
  - open drawer
  - create terminal
  - run common shell-level actions
- Keep it lightweight. Do not pretend it is Warp's full command input editor.

### E. Right Utility Drawer

- Keep GitHub and Settings as right drawers.
- Make them read as attached utility surfaces, not floating side cards.
- Reduce blur/radius/noise so they feel subordinate to terminal work.

## Scope Boundary

In scope:
- top chrome
- toolbar hierarchy
- tab/session language
- workspace density
- palette/omnibox promotion
- attached drawer treatment

Out of scope:
- command blocks
- semantic command history cards
- sticky command header
- shell-integrated command start/end tracking
- AI UX tied to per-command structure

## Implementation Considerations

- Frontend-first task. Main files likely:
  - `frontend/src/components/toolbar/toolbar.tsx`
  - `frontend/src/components/toolbar/project-dropdown.tsx`
  - `frontend/src/components/terminal/terminal-pane.tsx`
  - `frontend/src/components/terminal/terminal-action-bar.tsx`
  - `frontend/src/components/quick-switcher/quick-switcher-dialog.tsx`
  - `frontend/src/styles/shell.css`
  - `frontend/src/styles/workspace.css`
  - `frontend/src/styles/panels.css`
  - `frontend/src/App.tsx`
- Wails window config may need review in `main.go` if titlebar treatment changes.
- Need regression coverage around:
  - toolbar shell contract
  - project switching
  - quick switcher open/filter/select
  - terminal workspace visibility
  - drawer open/close lifecycle

## Risks

- Visual drift:
  - too much Warp mimicry can fight MultiHub's project/GitHub model
- Platform drift:
  - macOS-first polish can break Windows/Linux shell balance
- False affordances:
  - if omnibox looks too much like Warp's input editor, users will expect semantic command behavior that does not exist

## Success Metrics

- First impression reads terminal-native, not dashboard-native
- Screenshot comparison feels closer to Warp within one glance
- Top shell hierarchy becomes obvious: session -> terminal -> utilities
- Keyboard-first flow gets faster with palette promotion
- No regression in project/terminal/panel behaviors

## Next

- If user wants execution, create a new implementation plan focused on:
  - phase 1: titlebar + shell contract
  - phase 2: tab/session hierarchy
  - phase 3: workspace density
  - phase 4: palette/omnibox promotion
  - phase 5: polish + regression lock

## Unresolved Questions

- None blocking for design direction
