# Validation Review

## Summary

No blocking unknowns remain from the brainstorm.
Used recommended defaults for the remaining design choices so planning can proceed without stalling.

## Validation Defaults

| Topic | Decision | Rationale |
|------|----------|-----------|
| Platform priority | macOS-first visual target, keep Windows/Linux safe | screenshot target is macOS, but shell behavior must remain cross-platform |
| Active project scope | persist and hydrate `activeProjectId` through the existing project store | backend and store already model it; avoids a second session-only state path |
| Delete-active fallback | select the next sensible remaining project tab, else clear | avoids stale focus and welcome-screen drift after destructive actions |
| Tab overflow | start with scrollable tabs, not a hybrid rewrite | keeps the first cut simpler and honest |
| Drawer model | keep attached overlay drawers | matches current architecture; avoids terminal-resizing sidebar scope blow-up |
| Palette role | navigation/action omnibox, not command editor | preserves honest product affordance |

## Propagated Plan Updates

- Phase 02 explicitly uses a supported-titlebar fallback ladder
- Phase 03 explicitly locks persistence, hydration, and delete fallback before tab UI work
- Phase 04 explicitly keeps drawers overlayed and attached
- Phase 05 explicitly forbids command-editor semantics and keeps omnibox routing aligned with project tabs

## Recommendation

Proceed.
If user later wants command blocks or a true input editor, write a separate architecture plan.

## Unresolved Questions

- None blocking
