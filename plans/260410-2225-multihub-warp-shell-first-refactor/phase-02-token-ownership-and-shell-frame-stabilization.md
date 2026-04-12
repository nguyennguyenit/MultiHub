# Phase 02 - Token Ownership And Shell Frame Stabilization

## Context Links

- [Plan Overview](./plan.md)
- [Phase 01](./phase-01-regression-harness-and-shell-contract.md)
- [frontend/src/App.tsx](../../frontend/src/App.tsx)
- [frontend/src/styles/globals.css](../../frontend/src/styles/globals.css)
- [frontend/src/styles/shell.css](../../frontend/src/styles/shell.css)
- [frontend/src/styles/workspace.css](../../frontend/src/styles/workspace.css)
- [frontend/src/styles/panels.css](../../frontend/src/styles/panels.css)

## Overview

- Priority: P1
- Current status: completed
- Brief: isolate shell layout ownership before the visual sweep starts

## Key Insights

- Live layout values still depend on cascade accidents and duplicated token definitions.
- `App.tsx` writes runtime theme values to short vars while the rest of the app still consumes `--mc-*` aliases.
- Fixing density without stabilizing token ownership first will create hard-to-debug regressions.

## Requirements

- Choose one owner for shell/workspace/panel layout tokens.
- Preserve alias compatibility and runtime theme writes.
- Keep shell geometry stable while making ownership explicit.

## Architecture

- Keep `globals.css` for reset, utilities, and alias bridge.
- Move live shell frame ownership to explicit style files rather than duplicate definitions.
- Treat this phase as infrastructure, not visible redesign.

## Related Code Files

### Modify

- `frontend/src/App.tsx`
- `frontend/src/styles/globals.css`
- `frontend/src/styles/shell.css`
- `frontend/src/styles/workspace.css`
- `frontend/src/styles/panels.css`
- `frontend/src/App.test.tsx`
- `e2e/tests/terminal.spec.ts`
- `e2e/tests/projects.spec.ts`
- `e2e/tests/settings.spec.ts`

## File Inventory

| File | Action | Rough Size | Test Impact |
|------|--------|-----------:|-------------|
| `frontend/src/App.tsx` | modify | 378 lines | preserves runtime theme writes while ownership shifts |
| `frontend/src/styles/globals.css` | modify | 2057 lines | base owner/alias separation |
| `frontend/src/styles/shell.css` | modify | 319 lines | live shell token ownership |
| `frontend/src/styles/workspace.css` | modify | 115 lines | workspace-only token use |
| `frontend/src/styles/panels.css` | modify | 674 lines | panel-only token use |
| `frontend/src/App.test.tsx` | modify | existing | protects shell-orchestration assumptions after token cleanup |

## Test Scenario Matrix

| Priority | Scenario | Expected |
|----------|----------|----------|
| Critical | Toolbar sizing | one canonical live source remains |
| Critical | Panel sizing | GitHub/settings drawers still open at expected bands |
| High | Runtime theme writes | color/theme variables still flow from `App.tsx` |
| High | Cross-file CSS ownership | no duplicated live layout token remains |
| Medium | Responsive shell width | no desktop/mobile regression from token consolidation |

## Function / Interface Checklist

- runtime `root.style.setProperty(...)` calls in `App.tsx`
- shell/workspace/panel token owners
- `--mc-*` alias bridge

## Dependency Map

- Depends on: Phase 01
- Unlocks:
  - Phase 03 shell compression
  - Phase 04 workspace density changes
  - Phase 05 drawer geometry changes

## Tests Before

1. Add failing assertions around canonical toolbar/panel sizing ownership.
2. Keep smoke tests ready to catch broken frame dimensions.

## Refactor

1. Remove duplicated live layout tokens from non-owner files.
2. Preserve `--mc-*` compatibility.
3. Keep visible design changes minimal in this phase.

## Tests After

1. Unit tests and smoke stay green.
2. Build confirms no broken variable references.

## Regression Gate

- `cd /Users/plateau/Project/MultiHub/frontend && npm test -- --run`
- `cd /Users/plateau/Project/MultiHub/frontend && npm run build`
- `cd /Users/plateau/Project/MultiHub/e2e && npm test -- tests/terminal.spec.ts tests/projects.spec.ts tests/settings.spec.ts`

## Implementation Steps

1. Map current token duplication and choose explicit owners.
2. Remove duplicate live definitions while preserving alias bridges.
3. Verify toolbar/panel geometry stays stable across widths.

## Todo List

- [x] Choose canonical shell token owners
- [x] Preserve alias bridge
- [x] Remove duplicate live definitions
- [x] Verify stable shell geometry

## Success Criteria

- Shell frame ownership is explicit
- No visible layout regressions from token cleanup
- Later visual phases can change one surface without collateral cascade bugs

## Risk Assessment

- Risk: token cleanup accidentally changes dimensions across multiple surfaces
- Mitigation: keep the phase narrow and use smoke tests as geometry guards

## Security Considerations

- No direct security impact
- Do not log or surface local environment details while debugging CSS ownership

## Next Steps

- Completed; shell frame ownership landed.
