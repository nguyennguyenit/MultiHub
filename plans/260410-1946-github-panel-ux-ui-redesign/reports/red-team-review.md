# Red Team Review

## Summary

Local red-team pass. No subagents used in this session.
Goal: break the plan before implementation starts.

## Findings

### 1. Width creep can hurt terminal usability

- Severity: High
- Risk: a blunt width increase can solve panel pain by creating terminal pain
- Decision: Accept
- Plan update:
  - keep width as a capped GitHub-only variant
  - avoid changing shared default panel width for settings

### 2. Large-file refactor could devolve into random extraction

- Severity: High
- Risk: splitting `github-account-section.tsx` and `github-view.tsx` without file-boundary intent can produce worse readability
- Decision: Accept
- Plan update:
  - decompose by responsibility: summary, tabs, auth, identity, changes/history/collaboration containers
  - do not create “v2” or “enhanced” duplicates

### 3. Tab switch could hide stale async assumptions

- Severity: Medium
- Risk: moving surfaces under tabs may create stale-loading or focus issues
- Decision: Accept
- Plan update:
  - keep `useGitPanel` as the only local repo state source
  - add tests around default tab and tab-level visibility

### 4. Settings panel regression risk was underplayed

- Severity: Medium
- Risk: shared `SlidePanel` changes can regress settings layout or width
- Decision: Accept
- Plan update:
  - phase 02 and phase 05 explicitly carry settings regression checks

## Result

- Accepted findings: 4
- Rejected findings: 0

## Files Reviewed

- `plan.md`
- `phase-01-regression-harness-and-panel-contract.md`
- `phase-02-panel-shell-width-and-repo-summary.md`
- `phase-03-changes-tab-and-commit-composer-refactor.md`
- `phase-04-history-and-github-collaboration-tabs.md`
- `phase-05-integration-polish-and-final-regression.md`

## Unresolved Questions

- None blocking
