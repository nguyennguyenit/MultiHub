# Phase 07 - Cleanup Docs And Final Regression Lock

## Context Links

- [Plan Overview](./plan.md)
- [Phase 06](./phase-06-quick-switcher-palette-and-keyboard-routing.md)
- [docs/development-roadmap.md](../../docs/development-roadmap.md)
- [docs/project-changelog.md](../../docs/project-changelog.md)
- [frontend/src/components/toolbar/project-bar.tsx](../../frontend/src/components/toolbar/project-bar.tsx)
- [frontend/src/components/settings/settings-modal.tsx](../../frontend/src/components/settings/settings-modal.tsx)

## Overview

- Priority: P1
- Current status: completed
- Brief: remove proven-dead shell leftovers, sync docs, and re-run the full regression set

## Key Insights

- Several legacy surfaces still appear dormant, but they should not be removed until the new shell is stable.
- The biggest remaining risk after implementation will be undocumented shell assumptions and stale dead code.
- E2E execution depends on the `e2e` workspace being installed and runnable.

## Requirements

- Remove only dead shell code that is proven unused.
- Update roadmap/changelog with the shipped shell refactor.
- Run the full frontend verification set and record any residual gaps.

## Architecture

- Keep cleanup late to avoid masking regressions.
- Treat docs updates as a release artifact of the completed refactor.
- If a legacy file is still uncertain, leave it and record the debt instead of guessing.
- Keep the `--mc-*` alias bridge unless a full proof shows zero consumers; default is retain, not remove.

## Related Code Files

### Modify

- `frontend/src/components/toolbar/index.ts`
- `docs/development-roadmap.md`
- `docs/project-changelog.md`

### Delete

- `frontend/src/components/toolbar/project-bar.tsx`
- `frontend/src/components/settings/settings-modal.tsx`

### Possibly Modify

- neighboring imports/tests if dead code removal requires it

## File Inventory

| File | Action | Rough Size | Test Impact |
|------|--------|-----------:|-------------|
| `frontend/src/components/toolbar/project-bar.tsx` | delete | existing | removed after repo-wide audit |
| `frontend/src/components/settings/settings-modal.tsx` | delete | existing | removed after repo-wide audit |
| `frontend/src/components/toolbar/index.ts` | modify | existing | clean barrel exports |
| `docs/development-roadmap.md` | modify | existing | milestone/progress update |
| `docs/project-changelog.md` | modify | existing | record shipped shell refactor |

## Test Scenario Matrix

| Priority | Scenario | Expected |
|----------|----------|----------|
| Critical | Full frontend unit suite | passes |
| Critical | Production build | passes |
| High | Shell smoke incl. palette | passes |
| High | Dead code removal | no broken imports |
| Medium | Docs sync | roadmap/changelog reflect shipped work |

## Function / Interface Checklist

- shell exports/barrels
- dead legacy shell files
- roadmap/changelog entries

## Dependency Map

- Depends on: Phase 06
- Unlocks:
  - implementation handoff via `/ck:cook`

## Tests Before

1. Run the full current suite before cleanup deletions.
2. Confirm any candidate dead file truly has no runtime path.

## Refactor

1. Remove or retain legacy files based on evidence only.
2. Retain the alias bridge unless a repo-wide audit proves it is unused.
3. Sync docs to the actual delivered scope.
4. Record any residual risks that remain out of scope.

## Tests After

1. Full unit suite passes.
2. Build passes.
3. Targeted smoke passes from `e2e/`.

## Regression Gate

- `cd /Users/plateau/Project/MultiHub/frontend && npm test -- --run`
- `cd /Users/plateau/Project/MultiHub/frontend && npm run build`
- `cd /Users/plateau/Project/MultiHub/e2e && npm test -- tests/terminal.spec.ts tests/projects.spec.ts tests/settings.spec.ts tests/palette.spec.ts`

## Implementation Steps

1. Audit remaining dead shell files and remove only proven-unused ones.
2. Run the full verification set.
3. Update roadmap and changelog to match the delivered refactor.
4. Record residual risks instead of stretching scope further.

## Todo List

- [x] Audit dead shell files
- [x] Run full frontend verification
- [x] Update roadmap/changelog
- [x] Record residual risks if any

## Success Criteria

- New shell is verified and documented
- No dead shell leftovers remain without an explicit reason
- Plan is ready for cook execution

## Risk Assessment

- Risk: cleanup phase hides a still-needed legacy path
- Mitigation: delete only with proof, otherwise document and defer

## Security Considerations

- No direct security impact
- Keep docs free of secrets and local machine details

## Next Steps

- Completed; implementation handoff and cleanup landed.
