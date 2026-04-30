# Red Team Review

## Summary

Internal adversarial review on the draft plan.
Result: 5 findings.
Disposition: accept all 5.

## Findings

| Severity | Finding | Disposition | Plan Change |
|----------|---------|-------------|-------------|
| High | Full titlebar ownership could break drag regions and traffic-light behavior on macOS | Accept | Phase 02 now uses a fallback ladder and requires manual native verification |
| High | `App.tsx` and shell CSS files are already too large; this refactor could become unreadable fast | Accept | Modularization checkpoints added to Phases 02-05 |
| High | Real project tabs can drift from persisted project state if the renderer never hydrates or syncs `activeProjectId` | Accept | Phase 03 now treats persistence/hydration as tests-first work before UI refactor |
| Medium | Faux Warp tabs or palette copy could imply unsupported command semantics | Accept | Scope boundary repeated in plan overview, Phase 03, and Phase 05 |
| Medium | Drawer polish plus workspace flattening can cause CSS ownership bleed across already-huge files | Accept | Phase 04 now calls out ownership split as an explicit decision point |

## Files Modified

- `plan.md`
- `phase-03-session-strip-and-project-navigation-refactor.md`
- `phase-05-omnibox-palette-promotion-docs-and-final-regression.md`

## Recommendation

Proceed.
The plan is sound if implementation keeps one source of truth for active project state and stays inside supported Wails window behavior.

## Unresolved Questions

- None blocking
