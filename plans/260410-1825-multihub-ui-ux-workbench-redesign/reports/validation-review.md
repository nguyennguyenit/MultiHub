# Validation Review

## Summary

Plan passes validation.
Scope is meaningful but still bounded.

## Questions And Answers

### Why not do a full left rail redesign?

Because it adds navigation churn with little gain.
Header-integrated project switching is simpler, lower risk, and matches the approved direction.

### Why insist on TDD for visual work?

Because this is not pure decoration.
We are changing shell hierarchy, selectors, copy, and panel behavior.
Without tests, regressions will hide inside "UI polish".

### Why keep backend and stores out of scope?

Because the problem statement is UI/UX.
Dragging state logic into the redesign would create fake scope and slow delivery.

### How do we avoid breaking terminal behavior?

By treating terminal lifecycle and rendering as untouchable.
Only shell composition, copy, states, and styling change.

### When should CSS be modularized?

When shell changes in `globals.css` become unreadable or violate maintainability.
Reset/theme tokens can stay global; shell/panel/workspace sections can move if churn grows.

## Go / No-Go

- Go for implementation.
- No blocking dependency detected.
- Old port plan is completed, so no cross-plan link needed.
