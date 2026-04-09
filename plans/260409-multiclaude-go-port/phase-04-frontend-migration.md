---
phase: "04"
title: "Frontend Migration"
status: pending
effort: 20h
risk: Medium
depends_on: ["03"]
---

# Phase 04: Frontend Migration

**Priority:** P1 -- Largest phase by volume
**Status:** Pending

## Context Links
- Source: `src/renderer/` (all components, hooks, stores, utils)
- Source: `src/preload/index.ts` (ElectronAPI interface -- 86 IPC channels)
- Wails runtime: `frontend/wailsjs/runtime/runtime.js`

## Overview

Port all React components from Electron's `window.electron.*` API to Wails' auto-generated bindings (`window.go.main.App.*`) and Wails runtime events. ~60% of frontend code reuses directly; the remaining 40% requires IPC call replacement.

## Key Insights

- Electron pattern: `window.electron.terminal.create(opts)` -> `ipcRenderer.invoke("terminal:create", opts)`
- Wails pattern: `import { TerminalCreate } from '../wailsjs/go/main/App'` -> direct Go method call
- Electron events: `window.electron.terminal.onOutput(cb)` -> `ipcRenderer.on("terminal:output", cb)`
- Wails events: `import { EventsOn } from '../wailsjs/runtime/runtime'` -> `EventsOn("pty:output:id", cb)`
- All Zustand stores remain; only their IPC calls change
- CSS/Tailwind/theme system ports 100% unchanged
- xterm.js integration changes minimally (already proven in Phase 02)

## Requirements

### Functional
- All UI components render and function identically to source
- All IPC calls replaced with Wails bindings
- All event listeners replaced with Wails runtime events
- Zustand stores updated to use Wails backend calls
- Keyboard shortcuts work (Cmd/Ctrl+T, Cmd/Ctrl+W, etc.)
- File drag-and-drop works via Wails native dialog

### Non-Functional
- No `window.electron` references remain in codebase
- Hot reload works during development
- Bundle size stays under 5MB (excluding wailsjs bindings)

## IPC Migration Map

### Request-Response Calls (window.electron.X.Y() -> Wails binding)

Every `ipcRenderer.invoke()` call maps to a Go method on the App struct. Wails auto-generates TypeScript wrappers.

#### Terminal (6 invoke + 6 events)

| Source Call | Wails Replacement |
|-----------|-------------------|
| `window.electron.terminal.create(opts)` | `TerminalCreate(opts)` |
| `window.electron.terminal.destroy(id)` | `TerminalDestroy(id)` |
| `window.electron.terminal.list()` | `TerminalList()` |
| `window.electron.terminal.invokeClaude(id, sid)` | `TerminalInvokeClaude(id, sid)` |
| `window.electron.terminal.detectWsl()` | `TerminalDetectWsl()` |
| `window.electron.terminal.write(id, data)` | `TerminalWrite(id, data)` |
| `window.electron.terminal.resize(id, c, r)` | `TerminalResize(id, c, r)` |
| `window.electron.terminal.onOutput(cb)` | `EventsOn("pty:output:"+id, cb)` |
| `window.electron.terminal.onExit(cb)` | `EventsOn("terminal:exit", cb)` |
| `window.electron.terminal.onTitleChange(cb)` | `EventsOn("terminal:title-change", cb)` |
| `window.electron.terminal.onStateChange(cb)` | `EventsOn("terminal:state-change", cb)` |
| `window.electron.terminal.onCreated(cb)` | `EventsOn("terminal:created", cb)` |
| `window.electron.terminal.onAgentDetected(cb)` | `EventsOn("terminal:agent-detected", cb)` |

#### Project (7 invoke)

| Source Call | Wails Replacement |
|-----------|-------------------|
| `window.electron.project.list()` | `ProjectList()` |
| `window.electron.project.create(p)` | `ProjectCreate(p)` |
| `window.electron.project.update(id, u)` | `ProjectUpdate(id, u)` |
| `window.electron.project.delete(id)` | `ProjectDelete(id)` |
| `window.electron.project.setActive(id)` | `ProjectSetActive(id)` |
| `window.electron.project.openFolder()` | Wails `runtime.OpenDirectoryDialog()` |
| `window.electron.project.checkFolder(cwd)` | `ProjectCheckFolder(cwd)` |

#### Git (26 invoke + 2 events)

| Source Call | Wails Replacement |
|-----------|-------------------|
| `window.electron.git.status(cwd)` | `GitStatus(cwd)` |
| `window.electron.git.init(cwd)` | `GitInit(cwd)` |
| `window.electron.git.addRemote(cwd, url, name)` | `GitAddRemote(cwd, url, name)` |
| `window.electron.git.push(cwd, branch, su)` | `GitPush(cwd, branch, su)` |
| `window.electron.git.fileStatus(cwd)` | `GitFileStatus(cwd)` |
| `window.electron.git.stageFile(cwd, f)` | `GitStageFile(cwd, f)` |
| `window.electron.git.unstageFile(cwd, f)` | `GitUnstageFile(cwd, f)` |
| `window.electron.git.stageAll(cwd)` | `GitStageAll(cwd)` |
| `window.electron.git.commit(cwd, msg)` | `GitCommit(cwd, msg)` |
| `window.electron.git.diff(cwd, f, s, o)` | `GitDiff(cwd, f, s, o)` |
| `window.electron.git.discard(cwd, f)` | `GitDiscard(cwd, f)` |
| `window.electron.git.pull(cwd)` | `GitPull(cwd)` |
| `window.electron.git.fetch(cwd)` | `GitFetch(cwd)` |
| `window.electron.git.branches(cwd)` | `GitBranches(cwd)` |
| `window.electron.git.createBranch(cwd, n, c)` | `GitCreateBranch(cwd, n, c)` |
| `window.electron.git.checkoutBranch(cwd, n)` | `GitCheckoutBranch(cwd, n)` |
| `window.electron.git.deleteBranch(cwd, n, f)` | `GitDeleteBranch(cwd, n, f)` |
| `window.electron.git.merge(cwd, b)` | `GitMerge(cwd, b)` |
| `window.electron.git.log(cwd, max)` | `GitLog(cwd, max)` |
| `window.electron.git.stashList(cwd)` | `GitStashList(cwd)` |
| `window.electron.git.stashSave(cwd, msg)` | `GitStashSave(cwd, msg)` |
| `window.electron.git.stashApply(cwd, i)` | `GitStashApply(cwd, i)` |
| `window.electron.git.stashPop(cwd, i)` | `GitStashPop(cwd, i)` |
| `window.electron.git.stashDrop(cwd, i)` | `GitStashDrop(cwd, i)` |
| `window.electron.git.configGet()` | `GitConfigGet()` |
| `window.electron.git.configSet(cfg)` | `GitConfigSet(cfg)` |
| `window.electron.git.diffBranch(cwd, b)` | `GitDiffBranch(cwd, b)` |
| `window.electron.git.diffAgainstBranch(...)` | `GitDiffAgainstBranch(...)` |
| `window.electron.git.onBranchChanged(cb)` | `EventsOn("git:branch-changed", cb)` |
| `window.electron.git.watchProject(p)` | `GitWatchProject(p)` |
| `window.electron.git.unwatchProject(p)` | `GitUnwatchProject(p)` |

#### GitHub (6 invoke)

| Source Call | Wails Replacement |
|-----------|-------------------|
| `window.electron.github.authStatus()` | `GitHubAuthStatus()` |
| `window.electron.github.login()` | `GitHubLogin()` |
| `window.electron.github.logout()` | `GitHubLogout()` |
| `window.electron.github.createRepo(...)` | `GitHubCreateRepo(...)` |
| `window.electron.github.listIssues(...)` | `GitHubListIssues(...)` |
| `window.electron.github.listPRs(...)` | `GitHubListPRs(...)` |

#### Session (2 invoke)

| Source Call | Wails Replacement |
|-----------|-------------------|
| `window.electron.session.save(bounds)` | `SessionSave(bounds)` |
| `window.electron.session.restore()` | `SessionRestore()` |

#### Settings (3 invoke)

| Source Call | Wails Replacement |
|-----------|-------------------|
| `window.electron.settings.get()` | `SettingsGet()` |
| `window.electron.settings.set(s)` | `SettingsSet(s)` |
| `window.electron.settings.reset()` | `SettingsReset()` |

#### Notification (14 invoke + 2 events)

| Source Call | Wails Replacement |
|-----------|-------------------|
| `window.electron.notification.getSettings()` | `NotificationGetSettings()` |
| `window.electron.notification.setSettings(s)` | `NotificationSetSettings(s)` |
| `window.electron.notification.getTelegram()` | `NotificationGetTelegram()` |
| `window.electron.notification.setTelegram(t, c)` | `NotificationSetTelegram(t, c)` |
| `window.electron.notification.setDiscord(url)` | `NotificationSetDiscord(url)` |
| `window.electron.notification.getTelegramStatus()` | `NotificationGetTelegramStatus()` |
| `window.electron.notification.getDiscordStatus()` | `NotificationGetDiscordStatus()` |
| `window.electron.notification.testTelegram(t, c)` | `NotificationTestTelegram(t, c)` |
| `window.electron.notification.testDiscord(url)` | `NotificationTestDiscord(url)` |
| `window.electron.notification.clearTelegram()` | `NotificationClearTelegram()` |
| `window.electron.notification.clearDiscord()` | `NotificationClearDiscord()` |
| `window.electron.notification.onEvent(cb)` | `EventsOn("notification:event", cb)` |
| `window.electron.notification.setActiveTerminal(id)` | `NotificationSetActiveTerminal(id)` |
| `window.electron.notification.onRemoteControlStatus(cb)` | `EventsOn("notification:remote-control-status", cb)` |
| `window.electron.notification.getRemoteControlStatus()` | `NotificationGetRemoteControlStatus()` |

#### Update (4 invoke + 1 event)

| Source Call | Wails Replacement |
|-----------|-------------------|
| `window.electron.update.getState()` | `UpdateGetState()` |
| `window.electron.update.check()` | `UpdateCheck()` |
| `window.electron.update.download()` | `UpdateDownload()` |
| `window.electron.update.install()` | `UpdateInstall()` |
| `window.electron.update.onStatusChanged(cb)` | `EventsOn("update:status-changed", cb)` |

#### App / Window / Misc (10 invoke)

| Source Call | Wails Replacement |
|-----------|-------------------|
| `window.electron.app.getPath(name)` | `AppGetPath(name)` |
| `window.electron.app.openExternal(url)` | Wails `runtime.BrowserOpenURL()` |
| `window.electron.window.minimize()` | Wails `runtime.WindowMinimise()` |
| `window.electron.window.maximize()` | Wails `runtime.WindowToggleMaximise()` |
| `window.electron.window.close()` | Wails `runtime.Quit()` |
| `window.electron.window.getState()` | `WindowGetState()` |
| `window.electron.window.onStateChanged(cb)` | `EventsOn("window:state-changed", cb)` |
| `window.electron.clipboard.saveImage(b64)` | `ClipboardSaveImage(b64)` |
| `window.electron.image.*` | `Image*()` methods |
| `window.electron.filePicker.open()` | Wails `runtime.OpenFileDialog()` |

### Features Dropped (no Wails equivalent needed)

| Source Call | Reason |
|-----------|--------|
| `window.electron.vietnameseIme.*` | Electron-specific; not applicable |
| `window.electron.utils.getFilePath(file)` | Use Wails native file dialog |
| `window.electron.yolo.*` | Port as simple Go method |
| `window.electron.window.updateTitleBarOverlay()` | Use Wails window options |

## Component Migration Checklist

Every component file that references `window.electron` must be updated.

### Stores (highest impact -- all stores call IPC)

| File | IPC Calls | Migration Complexity |
|------|-----------|---------------------|
| `stores/app-store.ts` | terminal.*, project.*, session.* | High |
| `stores/settings-store.ts` | settings.get/set/reset | Medium |
| `stores/notification-store.ts` | notification.* (12 calls) | High |
| `stores/update-store.ts` | update.* (4 calls + 1 event) | Medium |
| `stores/image-store.ts` | image.* (4 calls) | Low |
| `stores/toast-store.ts` | None (frontend-only) | None |

### Hooks

| File | IPC Calls | Migration Complexity |
|------|-----------|---------------------|
| `hooks/use-terminal.ts` | terminal.write/resize/onOutput/onExit/onTitleChange/onStateChange/onCreated/onAgentDetected | High |
| `hooks/use-git-panel.ts` | git.* (15+ calls) | High |
| `hooks/use-keyboard-shortcuts.ts` | None (frontend-only) | None |
| `hooks/use-file-drop.ts` | utils.getFilePath | Low (use Wails dialog) |
| `hooks/use-terminal-resize.ts` | terminal.resize | Low |

### Components

| File | IPC Calls | Notes |
|------|-----------|-------|
| `terminal/terminal-pane.tsx` | terminal.write/resize + events | Core terminal -- uses hook |
| `terminal/terminal-grid.tsx` | terminal.create/destroy | Layout manager |
| `terminal/terminal-view.tsx` | terminal events | Container |
| `terminal/terminal-action-bar.tsx` | terminal.invokeClaude | Action buttons |
| `terminal/shell-selector-dropdown.tsx` | terminal.detectWsl | Windows only |
| `terminal/image-preview-popup.tsx` | image.readBase64/delete | Image handling |
| `git-panel/*.tsx` (10 files) | git.* via useGitPanel hook | All via hook |
| `github-setup/*.tsx` (3 files) | github.login/authStatus/createRepo | OAuth flow |
| `github-view/*.tsx` (8 files) | github.listIssues/listPRs/authStatus | Data fetching |
| `settings/settings-panel.tsx` | settings.get/set | Via store |
| `settings/notification-settings.tsx` | notification.* | Via store |
| `settings/terminal-settings.tsx` | settings.set | Via store |
| `settings/update-settings.tsx` | update.* | Via store |
| `settings/telegram-config-modal.tsx` | notification.testTelegram/setTelegram | Direct calls |
| `settings/discord-config-modal.tsx` | notification.testDiscord/setDiscord | Direct calls |
| `toolbar/project-dropdown.tsx` | project.openFolder | Folder picker |
| `toolbar/window-controls.tsx` | window.minimize/maximize/close | Wails runtime |
| `update-banner.tsx` | update.* via store | Via store |
| `welcome-screen.tsx` | None | Pure UI |

## Implementation Strategy

### Step 1: Create API Adapter Layer

Instead of replacing `window.electron.*` calls one-by-one across 50+ files, create a compatibility adapter:

```typescript
// frontend/src/api/index.ts
// Thin adapter: same interface as ElectronAPI but calls Wails bindings
import * as App from '../wailsjs/go/main/App'
import { EventsOn, EventsOff } from '../wailsjs/runtime/runtime'
import * as WailsRuntime from '../wailsjs/runtime/runtime'

export const api = {
  terminal: {
    create: (opts?: any) => App.TerminalCreate(opts || {}),
    destroy: (id: string) => App.TerminalDestroy(id),
    write: (id: string, data: string) => App.TerminalWrite(id, data),
    resize: (id: string, cols: number, rows: number) => App.TerminalResize(id, cols, rows),
    list: () => App.TerminalList(),
    invokeClaude: (id: string, sid?: string) => App.TerminalInvokeClaude(id, sid || ''),
    // Events return unsubscribe functions
    onOutput: (id: string, cb: (data: string) => void) => {
      const name = `pty:output:${id}`
      EventsOn(name, cb)
      return () => EventsOff(name)
    },
    onExit: (cb: (data: any) => void) => {
      EventsOn('terminal:exit', cb)
      return () => EventsOff('terminal:exit')
    },
    // ... remaining event subscriptions
  },
  project: { /* ... */ },
  git: { /* ... */ },
  // etc.
}
```

### Step 2: Global Find-Replace

```
window.electron.terminal.  ->  api.terminal.
window.electron.project.   ->  api.project.
window.electron.git.       ->  api.git.
window.electron.github.    ->  api.github.
window.electron.settings.  ->  api.settings.
window.electron.notification. -> api.notification.
window.electron.update.    ->  api.update.
window.electron.app.       ->  api.app.
window.electron.window.    ->  api.window.
window.electron.clipboard. ->  api.clipboard.
window.electron.image.     ->  api.image.
```

### Step 3: Fix Type Mismatches

Wails auto-generates TypeScript types from Go structs. Any field name differences (camelCase in TS vs json tags in Go) are handled by Wails. Verify:
- `time.Time` -> ISO string in JSON (matches source behavior)
- `map[string]interface{}` -> `Record<string, any>` in TS
- Go `error` returns -> Wails rejects the Promise

### Step 4: Remove Electron-Specific Code

- Delete `src/preload/` (replaced by Wails runtime)
- Delete `window.electron` type declarations
- Remove `contextBridge.exposeInMainWorld` pattern
- Replace `shell.openExternal` with `WailsRuntime.BrowserOpenURL`

## Related Code Files

**Create:**
- `frontend/src/api/index.ts` -- Wails API adapter
- `frontend/src/api/events.ts` -- Event subscription helpers

**Modify (all files referencing window.electron):**
- `frontend/src/stores/app-store.ts`
- `frontend/src/stores/settings-store.ts`
- `frontend/src/stores/notification-store.ts`
- `frontend/src/stores/update-store.ts`
- `frontend/src/stores/image-store.ts`
- `frontend/src/hooks/use-terminal.ts`
- `frontend/src/hooks/use-git-panel.ts`
- `frontend/src/hooks/use-file-drop.ts`
- `frontend/src/hooks/use-terminal-resize.ts`
- `frontend/src/components/terminal/terminal-pane.tsx`
- `frontend/src/components/terminal/terminal-grid.tsx`
- `frontend/src/components/terminal/terminal-view.tsx`
- `frontend/src/components/terminal/terminal-action-bar.tsx`
- `frontend/src/components/terminal/shell-selector-dropdown.tsx`
- `frontend/src/components/terminal/image-preview-popup.tsx`
- `frontend/src/components/git-panel/*.tsx` (10 files)
- `frontend/src/components/github-setup/*.tsx` (3 files)
- `frontend/src/components/github-view/*.tsx` (8 files)
- `frontend/src/components/settings/*.tsx` (8 files)
- `frontend/src/components/toolbar/*.tsx` (5 files)
- `frontend/src/components/update-banner.tsx`

**Copy unchanged:**
- `frontend/src/styles/globals.css`
- `frontend/src/utils/shortcut-utils.ts`
- `frontend/src/utils/keyboard-enhancement-utils.ts`
- `frontend/src/utils/font-utils.ts`
- `frontend/src/components/toast-container.tsx`
- `frontend/src/components/welcome-screen.tsx`
- `frontend/src/components/slide-panel/slide-panel.tsx`
- `frontend/src/components/settings/toggle-switch.tsx`
- `frontend/src/components/settings/settings-typography.tsx`
- `frontend/src/components/settings/theme-selector.tsx`
- `frontend/src/components/git-panel/diff-renderer.tsx`
- `frontend/src/components/git-panel/collapsible-section.tsx`

**Delete:**
- Any reference to Electron preload/contextBridge
- `window.electron` global type declaration

## Todo List

- [ ] Create `frontend/src/api/index.ts` adapter layer
- [ ] Create `frontend/src/api/events.ts` event helpers
- [ ] Copy all source renderer components to frontend/src/
- [ ] Copy styles/globals.css with theme variables
- [ ] Update stores: app-store.ts (terminal + project + session calls)
- [ ] Update stores: settings-store.ts
- [ ] Update stores: notification-store.ts
- [ ] Update stores: update-store.ts
- [ ] Update stores: image-store.ts
- [ ] Update hooks: use-terminal.ts (critical -- xterm.js integration)
- [ ] Update hooks: use-git-panel.ts
- [ ] Update hooks: use-file-drop.ts
- [ ] Update hooks: use-terminal-resize.ts
- [ ] Update components: terminal/* (6 files)
- [ ] Update components: git-panel/* (10 files)
- [ ] Update components: github-setup/* (3 files)
- [ ] Update components: github-view/* (8 files)
- [ ] Update components: settings/* (8 files)
- [ ] Update components: toolbar/* (5 files)
- [ ] Update components: update-banner.tsx
- [ ] Replace window.electron.app.openExternal with BrowserOpenURL
- [ ] Replace folder picker with Wails dialog
- [ ] Replace window controls with Wails runtime calls
- [ ] Remove all window.electron type declarations
- [ ] Verify: `grep -r "window.electron" frontend/src/` returns 0 matches
- [ ] Verify: `wails dev` renders full UI without console errors

## Success Criteria

1. Zero references to `window.electron` in frontend source
2. All 86 IPC channels mapped to Wails bindings or events
3. UI renders identically to source Electron app
4. All keyboard shortcuts functional
5. Terminal create/destroy/write/resize works end-to-end
6. Hot reload works in dev mode

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Wails TS types don't match source types | Medium | Med | API adapter normalizes types; add explicit casts |
| Event ordering differs from Electron IPC | Low | Med | Events are inherently unordered; same as source |
| Large component volume = many small bugs | High | Med | Systematic file-by-file migration; test each component |
| xterm.js addons not bundled correctly | Low | Med | Pin addon versions; test WebGL/Canvas/fit addons |

## Rollback

Frontend changes are isolated. Revert `frontend/src/` to source copies and restore `window.electron` calls.
