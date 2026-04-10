# Validation Review

## Summary

Validation was done as a local planning pass, not an interactive interview.
Recommended defaults recorded so implementation can proceed without stalling.

## Questions And Recommended Defaults

### 1. Default desktop width target?

- Recommended: start at `460px`, cap growth, keep settings on shared default width
- Reason: `440px` may still feel cramped after tabs; `480px` risks stealing too much terminal width

### 2. Should `Changes` be the default tab?

- Recommended: yes
- Reason: most current above-the-fold usage is local repo work, not issues/PRs

### 3. Should auth state live in header summary or inside `GitHub` tab body?

- Recommended: summary hint + fuller controls in `GitHub` tab body
- Reason: discoverability high, clutter controlled

### 4. Should old accordion sections survive inside tabs?

- Recommended: only where content density still benefits from collapse
- Reason: top-level accordion is the current problem; inner collapse is sometimes still useful

## Propagation Notes

- Phase 02 carries the `460px` starting recommendation
- Phase 03 sets `Changes` as default tab
- Phase 04 moves full auth controls into the GitHub tab while keeping auth visibility in summary

## Recommendation

- Proceed
- Revisit only if implementation reveals terminal-width pain at minimum window size

## Unresolved Questions

- None blocking
