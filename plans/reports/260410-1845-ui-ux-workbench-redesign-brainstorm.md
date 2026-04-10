# UI/UX Workbench Redesign Brainstorm

---
date: 2026-04-10
status: approved
scope: frontend-ui-ux
project: MultiHub
---

## Summary

User asked to "fix lại UI/UX".
Current UI works, but hierarchy weak, branding inconsistent, product identity incomplete.
Approved direction: workbench redesign, not just visual polish.

## Findings

- Product branding inconsistent.
- UI shell still shows `MultiClaude` in multiple places while app product is `MultiHub`.
- Header, terminal action bar, and bottom project bar compete for attention.
- Terminal workspace not dominant enough.
- GitHub panel and Settings use different interaction models and different visual language.
- Empty states functional but not product-grade.
- Visual system too flat: thin bars, similar weights, weak hierarchy.

## Options Evaluated

### 1. Surgical cleanup

Keep current layout. Fix colors, spacing, buttons, brand copy.

Pros:
- Fast
- Low risk

Cons:
- Core UX issues remain
- Still feels like a port, not a finished product

### 2. Workbench redesign

Keep logic/state architecture. Redesign app chrome, navigation, panel consistency, and empty states.

Pros:
- Best improvement/effort ratio
- Fixes hierarchy and identity
- No backend risk

Cons:
- Medium frontend scope
- Touches several shared UI files

### 3. Productized redesign

Add dashboard, richer onboarding, command palette, deeper product surfaces.

Pros:
- Strongest visual/product leap

Cons:
- Over-scoped for current ask

## Approved Direction

Option 2: Workbench redesign.

## Proposed Design

### Information Architecture

- Make top bar a real workspace header.
- Reduce split between top navigation and bottom project navigation.
- Make terminal workspace the visual primary surface.
- Make GitHub and Settings secondary, consistent side experiences.

### Layout

- Header top:
  - brand `MultiHub`
  - project switcher
  - active project context/path
  - primary actions: new terminal, GitHub, settings
- Main workspace:
  - terminal grid dominates
  - clearer active pane focus
- Project navigation:
  - move from bottom-heavy pattern to compact header-integrated pattern or slim left rail
- Secondary panels:
  - unify panel shell for GitHub and Settings

### Visual Direction

- Tone: pro terminal desktop
- Dark, restrained, clearer depth
- UI font: Geist or Plus Jakarta Sans
- Terminal font unchanged
- Accent usage more disciplined

### UX Adjustments

- Replace all `MultiClaude` UI copy with `MultiHub`
- Rewrite welcome/empty states
- Make `New Terminal` the clear primary action
- Reduce prominence of destructive actions like `Kill All`
- Hide or de-emphasize incomplete affordances like `YOLO` if not truly functional
- Improve active project indication
- Make project delete less visually eager

## Likely Files

- `frontend/src/App.tsx`
- `frontend/src/components/toolbar/toolbar.tsx`
- `frontend/src/components/toolbar/project-bar.tsx`
- `frontend/src/components/terminal/terminal-action-bar.tsx`
- `frontend/src/components/welcome-screen.tsx`
- `frontend/src/components/slide-panel/slide-panel.tsx`
- `frontend/src/components/settings/settings-modal.tsx`
- `frontend/src/styles/globals.css`

## Risks

- Scope can drift if layout redesign expands into new features.
- Existing tests may assume current structure.
- Settings/GitHub convergence may need careful responsive handling.

## Success Criteria

- App chrome feels coherent
- MultiHub branding consistent
- Active workspace more obvious
- Project switching more natural
- GitHub + Settings feel like same product
- Empty states feel intentional, not placeholder

## Next

- If user wants execution: convert this into implementation plan
- Then implement in controlled frontend slices

## Unresolved Questions

- None blocking
- Optional later: choose exact visual tone between more conservative vs more bold terminal aesthetic
