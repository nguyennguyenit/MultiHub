# Phase 05 - Palette Alignment Docs And Final Regression

## Context Links

- [Plan Overview](./plan.md)
- [Phase 03](./phase-03-session-strip-and-project-navigation-refactor.md)
- [Phase 04](./phase-04-workspace-density-and-attached-drawer-polish.md)
- [frontend/src/App.tsx](../../frontend/src/App.tsx)
- [frontend/src/components/quick-switcher/quick-switcher-dialog.tsx](../../frontend/src/components/quick-switcher/quick-switcher-dialog.tsx)
- [frontend/src/hooks/use-keyboard-shortcuts.ts](../../frontend/src/hooks/use-keyboard-shortcuts.ts)
- [frontend/src/utils/shortcut-utils.ts](../../frontend/src/utils/shortcut-utils.ts)
- [frontend/src/styles/panels.css](../../frontend/src/styles/panels.css)
- [docs/development-roadmap.md](../../docs/development-roadmap.md)
- [docs/project-changelog.md](../../docs/project-changelog.md)
- [docs/codebase-summary.md](../../docs/codebase-summary.md)

## Overview

- Priority: P1
- Current status: in-progress
- Brief: promote the existing quick switcher into a clearer omnibox/palette; project selection now shares the active-project path, while docs and final regression remain open

## Key Insights

- MultiHub already has a usable quick switcher. The next move is promotion and polish, not a greenfield palette feature.
- The biggest trap here is false affordance: if the palette looks too much like Warp's input editor, users will expect semantic command behavior that does not exist.
- Once real project tabs exist, the palette becomes secondary to visible project tabs and must reuse the same persistence helper.
- Final docs updates matter because prior shell work is already recorded in roadmap/changelog; this plan must describe the incremental step, not rewrite history.

## Requirements

- Keep `Cmd/Ctrl+K` entry intact.
- Upgrade palette copy, grouping, and hierarchy so it feels more central to shell use.
- Keep palette and project tabs aligned:
  - tabs = always-visible project navigation
  - omnibox = keyboard-first jump and action surface
- Palette project actions must call the same active-project persistence path used by tab clicks.
- Keep palette scope limited to project, terminal, drawer, and common shell actions.
- Explicitly avoid command-block or input-editor semantics.
- Final regression must include Go tests because project bindings/store are now in scope.
- Update roadmap, changelog, codebase summary, system architecture, and PDR docs to match shipped scope.

## Architecture

- Keep one palette mounted in `App.tsx`.
- Extend item modeling and visual treatment rather than adding a second overlapping command UI.
- Reuse the same project-selection semantics defined in Phase 03; do not fork routing rules inside omnibox handlers.
- Final regression runs should cover unit tests, build, and the targeted smoke suite.

## Related Code Files

### Modify

- `frontend/src/App.tsx`
- `frontend/src/components/quick-switcher/quick-switcher-dialog.tsx`
- `frontend/src/components/quick-switcher/quick-switcher-dialog.test.tsx`
- `frontend/src/hooks/use-keyboard-shortcuts.ts`
- `frontend/src/utils/shortcut-utils.ts`
- `frontend/src/styles/panels.css`
- `frontend/src/App.test.tsx`
- `docs/development-roadmap.md`
- `docs/project-changelog.md`
- `docs/codebase-summary.md`
- `docs/system-architecture.md`
- `docs/project-overview-pdr.md`
- `e2e/tests/palette.spec.ts`
- `e2e/tests/projects.spec.ts`
- `e2e/tests/terminal.spec.ts`
- `e2e/tests/settings.spec.ts`

### Create

- `frontend/src/components/quick-switcher/quick-switcher-item-groups.ts` if `App.tsx` needs item-building extraction

### Delete

- None

## File Inventory

| File | Action | Rough Size | Test Impact |
|------|--------|-----------:|-------------|
| `frontend/src/App.tsx` | modify | 501 lines | may need palette-item extraction to reduce root complexity |
| `frontend/src/components/quick-switcher/quick-switcher-dialog.tsx` | modify | 217 lines | omnibox hierarchy, copy, and grouping |
| `frontend/src/hooks/use-keyboard-shortcuts.ts` | modify | 118 lines | preserve global palette route |
| `frontend/src/utils/shortcut-utils.ts` | modify | 89 lines | shortcut contract stays explicit |
| `frontend/src/styles/panels.css` | modify | 824 lines | palette shell visual promotion |
| `docs/project-changelog.md` | modify | existing | record shipped scope accurately |

## Test Scenario Matrix

| Priority | Scenario | Expected |
|----------|----------|----------|
| Critical | `Cmd/Ctrl+K` open/close | still reliable |
| Critical | Selecting project/terminal/drawer action | correct handler runs and focus returns cleanly |
| Critical | Project tabs + omnibox agree on active project | no split-brain shell state |
| High | Selecting a project from the palette persists the active tab state | next init/unit hydration path keeps tab highlight consistent |
| High | Palette copy and grouping | reads as shell omnibox, not command editor |
| High | Full regression run | no shell/project/panel regressions |
| Medium | Docs sync | roadmap/changelog/summary match real implementation |

## Function / Interface Checklist

- `App`
- `QuickSwitcherDialog`
- `useKeyboardShortcuts`
- `getGlobalShortcut`
- roadmap/changelog/codebase summary docs

## Dependency Map

- Depends on: Phase 03, Phase 04
- Unlocks:
  - implementation handoff via `/ck:cook`

## Tests Before

1. Add failing palette tests for the promoted omnibox hierarchy and grouping.
2. Keep shortcut parser coverage and App-level routing tests intact.
3. Add or update a regression proving omnibox project selection and top tabs land on the same active project.
4. Ensure the smoke suite still uses stable palette/test ids only.

## Refactor

1. Promote the existing quick switcher rather than inventing a second command UI.
2. Keep one project-selection contract shared by tab strip, overflow menu, shortcuts, and palette.
3. Do not let the palette become a second authoritative project-navigation state machine.
4. Extract palette item building from `App.tsx` if it meaningfully reduces root complexity.
5. Keep scope boundary explicit in copy and visuals so the palette does not masquerade as a command editor.

## Tests After

1. `go test ./...` passes if project bindings/store changed.
2. Palette unit tests pass.
3. Full frontend unit suite passes.
4. Build passes.
5. Targeted shell smoke passes.

## Regression Gate

- `cd /Users/plateau/Project/MultiHub && go test ./...`
- `cd /Users/plateau/Project/MultiHub/frontend && npm test -- --run`
- `cd /Users/plateau/Project/MultiHub/frontend && npm run build`
- `cd /Users/plateau/Project/MultiHub/e2e && npm test -- tests/palette.spec.ts tests/projects.spec.ts tests/terminal.spec.ts tests/settings.spec.ts`

## Implementation Steps

1. Tighten palette semantics, copy, and grouping.
2. Make tab-strip and omnibox selection routes converge on the same project state.
3. Promote it visually as a shell omnibox.
4. Run the full regression stack.
5. Update docs only after the shipped scope is proven.

## Todo List

- [x] Promote quick switcher into a clearer omnibox/palette
- [x] Align omnibox routing with the real project-tab strip
- [x] Keep scope boundary away from command-editor semantics
- [ ] Run full regression set
- [ ] Sync roadmap, changelog, codebase summary, system architecture, and PDR docs

## Success Criteria

- Palette feels central to shell navigation
- Project tabs and omnibox reinforce the same project model
- Users are not misled into expecting semantic command editing
- Docs reflect the real shipped increment and the updated project persistence contract

## Risk Assessment

- False Warp affordance is the main product risk
- Divergent tab-vs-omnibox routing is the main technical regression risk
- Docs drift is the main post-implementation risk

## Security Considerations

- Keep palette actions limited to explicit shell navigation and existing actions
- Avoid hidden destructive shortcuts or surprising side effects

## Next Steps

- After this phase passes, hand off with `/ck:cook ... --tdd`
