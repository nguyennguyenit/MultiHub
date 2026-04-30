# MultiHub Warp-Inspired Shell Brainstorm

## Context

User asked to make project shell in screenshot feel like Warp.
Brainstorm only. No implementation.
Repo already contains one prior shell-first Warp refactor, so this session was about the next move, not a blank-sheet redesign.

## What Happened

- Read repo context, README, architecture docs, codebase summary, and shell-related frontend files.
- Checked current shell, toolbar, quick switcher, workspace density, and Wails window config.
- Compared current app shape against Warp-like expectations.
- Rejected full Warp cloning as wrong scope.
- User selected `Approach 2`: Warp-inspired MultiHub.

## Decisions

- Keep current PTY architecture.
- Do not fake full Warp command blocks on raw PTY output.
- Focus on shell chrome, hierarchy, density, and palette flow.
- Treat titlebar ownership as a likely design lever, especially on macOS.

## Next

- If user wants execution, write a dedicated plan for Warp-inspired shell refresh.
- Plan should stay frontend-first, with Wails window config review only where needed.

## Unresolved Questions

- None blocking
