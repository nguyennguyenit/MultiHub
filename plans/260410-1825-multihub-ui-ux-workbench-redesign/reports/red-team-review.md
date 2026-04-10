# Red Team Review

## Summary

Plan viable.
Main risk is not feasibility.
Main risk is shell churn without selector discipline and platform verification.

## Findings

1. Header overload risk.
If project switcher, path, brand, primary actions, and window controls all stay high-contrast, the new header will become another crowded strip.
Mitigation: one clear CTA, path as muted context, destructive actions visually secondary.

2. Panel convergence can fail on width.
`SlidePanel` at fixed `340px` is too narrow for a serious settings surface.
Mitigation: Phase 04 must include responsive width tokens, not just visual restyling.

3. CSS churn risk high.
`globals.css` is already massive.
Mitigation: define shell style boundaries in Phase 01 before redesign churn.

4. Test plan would be fake without selector cleanup.
Current e2e specs already drift from implementation.
Mitigation: Phase 01 must stabilize selectors first, before visual changes.

5. macOS drag-region regression risk.
Header refactor can break drag/no-drag and traffic-light spacing.
Mitigation: Phase 02 success criteria must explicitly verify platform chrome behavior.

## Recommended Adjustments

- Keep header-integrated project navigation, not a new left rail.
- Keep panel unification on `SlidePanel`, not a second modal redesign.
- Treat brand sweep as its own final pass, not incidental cleanup.

## Verdict

Proceed.
Do not skip Phase 01.
