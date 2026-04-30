# Warp-Inspired Shell Refresh Scout Report

## Relevant Files

- `main.go` - Wails app options; likely entry for titlebar/window chrome changes
- `app-misc-bindings.go` - current window state stub; touch only if shell layout needs better state data
- `frontend/src/App.tsx` - root shell orchestration; already oversized
- `frontend/src/components/toolbar/toolbar.tsx` - current shell header
- `frontend/src/components/toolbar/project-dropdown.tsx` - active project/session trigger
- `frontend/src/components/toolbar/window-controls.tsx` - non-macOS utility controls
- `frontend/src/components/quick-switcher/quick-switcher-dialog.tsx` - current palette base
- `frontend/src/components/slide-panel/slide-panel.tsx` - attached right drawer container
- `frontend/src/components/terminal/terminal-pane.tsx` - pane header density and local actions
- `frontend/src/components/terminal/terminal-action-bar.tsx` - standalone action bar that may need demotion
- `frontend/src/components/welcome-screen.tsx` - low-activity surface that affects shell first impression
- `frontend/src/styles/shell.css` - owns top shell chrome and density tokens
- `frontend/src/styles/workspace.css` - owns workspace framing and pane chrome
- `frontend/src/styles/panels.css` - owns drawer and palette shell styling

## Existing Tests To Extend

- `frontend/src/App.test.tsx`
- `frontend/src/components/toolbar/toolbar.test.tsx`
- `frontend/src/components/toolbar/project-dropdown.test.tsx`
- `frontend/src/components/quick-switcher/quick-switcher-dialog.test.tsx`
- `frontend/src/components/slide-panel/slide-panel.test.tsx`
- `frontend/src/components/terminal/terminal-action-bar.test.tsx`
- `frontend/src/components/github-view/github-panel-layout.test.tsx`
- `frontend/src/components/welcome-screen.test.tsx`
- `frontend/src/styles/toolbar-density-contract.test.ts`
- `frontend/src/styles/shell-frame-token-ownership.test.ts`

## Gaps

- No current test explicitly guards titlebar ownership or drag-region assumptions
- No current contract test explains the boundary between omnibox navigation and command-editor semantics
- Root shell files are already large; refactor risk is organizational as much as visual

## Unresolved Questions

- None blocking
