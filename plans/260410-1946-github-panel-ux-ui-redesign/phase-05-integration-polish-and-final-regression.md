# Phase 05: Integration Polish And Final Regression

## Context Links

- [Plan Overview](./plan.md)
- [History And GitHub Collaboration Tabs](./phase-04-history-and-github-collaboration-tabs.md)
- [Red Team Review](./reports/red-team-review.md)
- [Validation Review](./reports/validation-review.md)

## Overview

- Priority: P1
- Status: Completed
- Goal: tighten panel language, remove drift, and prove the full workflow still holds

## Key Insights

- The hardest part is done once IA is stable.
- Final risk lives in selector drift, CSS leakage, and inconsistent spacing/typography between tabs.
- Settings panel must remain visually separate enough that GitHub-specific width/layout changes do not bleed into it.

## Requirements

- Align typography, spacing, and empty states across all GitHub panel tabs.
- Verify close behavior, panel open behavior, and no-project behavior.
- Run full frontend verification.
- Evaluate docs impact after implementation.

## Architecture

- Keep final polish inside the GitHub panel boundary where possible.
- Only touch `App.tsx`, `SlidePanel`, or shared CSS when necessary for shared shell consistency.
- Prefer local CSS/component tokens over spreading one-off inline styles further.

## Related Code Files

### Modify

- `frontend/src/App.tsx`
- `frontend/src/components/slide-panel/slide-panel.tsx`
- `frontend/src/components/github-view/github-view.tsx`
- `frontend/src/styles/globals.css`
- `e2e/tests/terminal.spec.ts`
- `e2e/tests/settings.spec.ts`

### Create

- none required by default

### Delete

- any dead helper/component only if proven unused after the refactor

## File Inventory

| File | Action | Rough Size | Test Impact |
|------|--------|-----------:|-------------|
| `frontend/src/App.tsx` | modify | 411 lines | final shell wiring |
| `frontend/src/components/slide-panel/slide-panel.tsx` | modify | 83 lines | confirm shared panel behavior |
| `frontend/src/components/github-view/github-view.tsx` | modify | 360 lines | final cleanup after split |
| `frontend/src/styles/globals.css` | modify | 2057 lines | final spacing/typography cleanup |
| `e2e/tests/terminal.spec.ts` | modify | 29 lines | final GitHub smoke contract |
| `e2e/tests/settings.spec.ts` | modify | 25 lines | prove settings unaffected |

## Test Scenario Matrix

| Priority | Scenario | Expected |
|----------|----------|----------|
| Critical | Toolbar -> GitHub panel | still opens and closes correctly |
| Critical | No project empty state | still readable and centered |
| High | GitHub tab switching | stable across all tabs |
| High | Settings panel regression | unchanged open/close behavior |
| Medium | Responsive desktop/panel interplay | terminal area still usable |
| Medium | External repo link | still opens through app external handler |

## Function / Interface Checklist

- `App`
- `SlidePanel`
- `GitHubPanelContent`
- tab shell selectors
- `GitHubHeaderExtra`

## Dependency Map

- Depends on: Phase 01, Phase 02, Phase 03, Phase 04
- Unlocks: implementation complete

## Tests Before

1. Finalize expected selector contract for all three tabs.
2. Add any missing smoke assertions before cleanup deletes dead code.

## Refactor

1. Remove dead branches or obsolete helpers left behind by the tab refactor.
2. Normalize spacing and typography.
3. Confirm panel width only affects GitHub variant.

## Tests After

1. Run frontend unit tests.
2. Run frontend build.
3. Run Playwright GitHub/settings smoke coverage.

## Regression Gate

- `cd /Users/plateau/Project/MultiHub/frontend && npm test -- --run`
- `cd /Users/plateau/Project/MultiHub/frontend && npm run build`
- `cd /Users/plateau/Project/MultiHub && npx playwright test e2e/tests/terminal.spec.ts e2e/tests/settings.spec.ts`

## Implementation Steps

1. Remove dead UI paths left by the old accordion-first structure.
2. Align panel copy, spacing, and empty states.
3. Confirm settings panel is untouched by GitHub width/layout changes.
4. Run verification commands and fix regressions before closing the work.
5. Evaluate docs impact and update roadmap/changelog only if warranted.

## Todo List

- [x] Clean obsolete UI paths
- [x] Normalize final spacing and copy
- [x] Run unit/build/e2e regression
- [x] Evaluate docs impact

## Success Criteria

- Panel feels coherent end to end.
- No smoke regressions.
- Settings panel remains stable.
- Docs impact is explicitly recorded.

## Risk Assessment

- Risk: CSS cleanup bleeds into unrelated panel or shell styles
- Mitigation: scope new classes to GitHub panel shell and variant selectors

## Security Considerations

- No new security surface expected
- Preserve external link handling through existing app wrapper, not raw window APIs

## Next Steps

- If all regression gates pass, implementation can close and docs impact can be recorded
