/**
 * Wails API adapter — provides same interface shape as the old window.electron API.
 * Components import from here instead of referencing window.electron directly.
 */
import * as App from '../../wailsjs/go/main/App'
import {
  EventsOn,
  EventsOff,
  WindowMinimise,
  WindowToggleMaximise,
  Quit,
  BrowserOpenURL,
} from '../../wailsjs/runtime/runtime'
import type {
  AppSettings,
  Project,
  Terminal,
  GitStatus,
  GitFileStatus,
  GitBranch,
  GitLogEntry,
  GitStashEntry,
  GitOperationResult,
  GitCommitResult,
  GitDiffResult,
  GitBranchDiff,
  GitConfig,
  GitHubAuth,
  GitHubIssue,
  GitHubPR,
  NotificationSettings,
  NotificationTestResult,
  RemoteControlStatus,
  WslInfo,
  WindowState,
  AppSession,
} from '@shared/types'
import type { UpdateState } from '@shared/types'

// ── Terminal ──────────────────────────────────────────────────────────────────

export const api = {
  terminal: {
    create: (opts?: Partial<{ cwd: string; projectId: string; title: string; shell: string }>): Promise<Terminal> =>
      App.TerminalCreate(opts ?? {}) as Promise<Terminal>,

    destroy: (id: string): Promise<boolean> =>
      App.TerminalDestroy(id),

    list: (): Promise<Terminal[]> =>
      App.TerminalList() as Promise<Terminal[]>,

    get: (id: string): Promise<Terminal | null> =>
      App.TerminalGet(id) as Promise<Terminal | null>,

    write: (id: string, data: string): Promise<boolean> =>
      App.TerminalWrite(id, data),

    resize: (id: string, cols: number, rows: number): Promise<boolean> =>
      App.TerminalResize(id, cols, rows),

    invokeClaude: (id: string, sessionId?: string): Promise<boolean> =>
      App.TerminalInvokeClaude(id, sessionId ?? ''),

    detectWsl: (): Promise<WslInfo> =>
      App.TerminalDetectWsl() as Promise<WslInfo>,

    getSessions: () => App.TerminalGetSessions(),
    getExitedSession: (id: string) => App.TerminalGetExitedSession(id),
    findByClaudeSession: (sessionId: string) => App.TerminalFindByClaudeSession(sessionId),

    // Events — return cleanup function
    onOutput: (id: string, cb: (data: string) => void): (() => void) => {
      const name = `pty:output:${id}`
      EventsOn(name, cb)
      return () => EventsOff(name)
    },
    onExit: (cb: (data: { id: string; code: number }) => void): (() => void) => {
      EventsOn('terminal:exit', cb)
      return () => EventsOff('terminal:exit')
    },
    onTitleChange: (cb: (data: { id: string; title: string }) => void): (() => void) => {
      EventsOn('terminal:title-change', cb)
      return () => EventsOff('terminal:title-change')
    },
    onStateChange: (cb: (data: { id: string; state: string }) => void): (() => void) => {
      EventsOn('terminal:state-change', cb)
      return () => EventsOff('terminal:state-change')
    },
    onCreated: (cb: (terminal: Terminal) => void): (() => void) => {
      EventsOn('terminal:created', cb)
      return () => EventsOff('terminal:created')
    },
    onAgentDetected: (cb: (data: { id: string; agentType: string }) => void): (() => void) => {
      EventsOn('terminal:agent-detected', cb)
      return () => EventsOff('terminal:agent-detected')
    },
  },

  // ── Project ────────────────────────────────────────────────────────────────

  project: {
    list: (): Promise<Project[]> =>
      App.ProjectList() as Promise<Project[]>,

    create: (p: Partial<Project>): Promise<Project> =>
      App.ProjectCreate(p as Record<string, unknown>) as Promise<Project>,

    update: (id: string, updates: Partial<Project>): Promise<Project> =>
      App.ProjectUpdate(id, updates as Record<string, unknown>) as Promise<Project>,

    delete: (id: string): Promise<boolean> =>
      App.ProjectDelete(id),

    setActive: (id: string): Promise<boolean> =>
      App.ProjectSetActive(id),

    openFolder: (): Promise<string> =>
      App.ProjectOpenFolder(),

    checkFolder: (cwd: string): Promise<boolean> =>
      App.ProjectCheckFolder(cwd),
  },

  // ── Git ────────────────────────────────────────────────────────────────────

  git: {
    status: (cwd: string): Promise<GitStatus> =>
      App.GitStatus(cwd) as Promise<GitStatus>,

    init: (cwd: string) => App.GitInit(cwd),
    addRemote: (cwd: string, url: string, name: string) => App.GitAddRemote(cwd, url, name),
    push: (cwd: string, branch: string, setUpstream: boolean) => App.GitPush(cwd, branch, setUpstream),

    fileStatus: (cwd: string): Promise<GitFileStatus[]> =>
      App.GitFileStatus(cwd) as Promise<GitFileStatus[]>,

    stageFile: (cwd: string, file: string) => App.GitStageFile(cwd, file),
    unstageFile: (cwd: string, file: string) => App.GitUnstageFile(cwd, file),
    stageAll: (cwd: string) => App.GitStageAll(cwd),

    commit: (cwd: string, msg: string): Promise<GitCommitResult> =>
      App.GitCommit(cwd, msg) as Promise<GitCommitResult>,

    diff: (cwd: string, file: string, staged: boolean, oldPath: string): Promise<GitDiffResult> =>
      App.GitDiff(cwd, file, staged, oldPath) as Promise<GitDiffResult>,

    discard: (cwd: string, file: string) => App.GitDiscard(cwd, file),
    pull: (cwd: string) => App.GitPull(cwd),
    fetch: (cwd: string) => App.GitFetch(cwd),

    branches: (cwd: string): Promise<GitBranch[]> =>
      App.GitBranches(cwd) as Promise<GitBranch[]>,

    createBranch: (cwd: string, name: string, checkout: boolean) =>
      App.GitCreateBranch(cwd, name, checkout),
    checkoutBranch: (cwd: string, name: string) => App.GitCheckoutBranch(cwd, name),
    deleteBranch: (cwd: string, name: string, force: boolean) =>
      App.GitDeleteBranch(cwd, name, force),
    merge: (cwd: string, branch: string) => App.GitMerge(cwd, branch),

    log: (cwd: string, max: number): Promise<GitLogEntry[]> =>
      App.GitLog(cwd, max) as Promise<GitLogEntry[]>,

    stashList: (cwd: string): Promise<GitStashEntry[]> =>
      App.GitStashList(cwd) as Promise<GitStashEntry[]>,

    stashSave: (cwd: string, msg: string) => App.GitStashSave(cwd, msg),
    stashApply: (cwd: string, index: number) => App.GitStashApply(cwd, index),
    stashPop: (cwd: string, index: number) => App.GitStashPop(cwd, index),
    stashDrop: (cwd: string, index: number) => App.GitStashDrop(cwd, index),

    configGet: (): Promise<GitConfig> =>
      App.GitConfigGet() as Promise<GitConfig>,

    configSet: (cfg: GitConfig) =>
      App.GitConfigSet(cfg as Record<string, unknown>),

    diffBranch: (cwd: string, branch: string): Promise<GitBranchDiff> =>
      App.GitDiffBranch(cwd, branch) as Promise<GitBranchDiff>,

    diffAgainstBranch: (cwd: string, file: string, branch: string, _oldPath?: string): Promise<GitDiffResult> =>
      App.GitDiffAgainstBranch(cwd, branch, file) as Promise<GitDiffResult>,

    watchProject: (path: string) => App.GitWatchProject(path),
    unwatchProject: (path: string) => App.GitUnwatchProject(path),

    onBranchChanged: (cb: (data: { projectId: string; branch: string }) => void): (() => void) => {
      EventsOn('git:branch-changed', cb)
      return () => EventsOff('git:branch-changed')
    },
  },

  // ── GitHub ─────────────────────────────────────────────────────────────────

  github: {
    authStatus: (): Promise<GitHubAuth> =>
      App.GitHubAuthStatus() as Promise<GitHubAuth>,

    login: () => App.GitHubLogin(),
    logout: () => App.GitHubLogout(),

    createRepo: (data: Record<string, unknown>) =>
      App.GitHubCreateRepo(data),

    listIssues: (data: Record<string, unknown>): Promise<GitHubIssue[]> =>
      App.GitHubListIssues(data) as Promise<GitHubIssue[]>,

    listPRs: (data: Record<string, unknown>): Promise<GitHubPR[]> =>
      App.GitHubListPRs(data) as Promise<GitHubPR[]>,
  },

  // ── Settings ───────────────────────────────────────────────────────────────

  settings: {
    get: (): Promise<AppSettings> =>
      App.SettingsGet() as Promise<AppSettings>,

    set: (s: AppSettings): Promise<AppSettings> =>
      App.SettingsSet(s as unknown as Record<string, unknown>) as Promise<AppSettings>,

    reset: (): Promise<AppSettings> =>
      App.SettingsReset() as Promise<AppSettings>,
  },

  // ── Notification ───────────────────────────────────────────────────────────

  notification: {
    getSettings: (): Promise<NotificationSettings> =>
      App.NotificationGetSettings() as Promise<NotificationSettings>,

    setSettings: (partial: Partial<NotificationSettings>) =>
      App.NotificationSetSettings(partial as Record<string, unknown>),

    getTelegram: () => App.NotificationGetTelegram(),
    setTelegram: (token: string, chatId: string) =>
      App.NotificationSetTelegram(token, chatId),
    setDiscord: (url: string) => App.NotificationSetDiscord(url),
    getTelegramStatus: () => App.NotificationGetTelegramStatus(),
    getDiscordStatus: () => App.NotificationGetDiscordStatus(),

    testTelegram: (token: string, chatId: string): Promise<NotificationTestResult> =>
      App.NotificationTestTelegram(token, chatId) as Promise<NotificationTestResult>,

    testDiscord: (url: string): Promise<NotificationTestResult> =>
      App.NotificationTestDiscord(url) as Promise<NotificationTestResult>,

    clearTelegram: () => App.NotificationClearTelegram(),
    clearDiscord: () => App.NotificationClearDiscord(),

    setActiveTerminal: (id: string) => App.NotificationSetActiveTerminal(id),

    getRemoteControlStatus: (): Promise<RemoteControlStatus> =>
      App.NotificationGetRemoteControlStatus() as Promise<RemoteControlStatus>,

    onEvent: (cb: (event: unknown) => void): (() => void) => {
      EventsOn('notification:event', cb)
      return () => EventsOff('notification:event')
    },
    onRemoteControlStatus: (cb: (status: RemoteControlStatus) => void): (() => void) => {
      EventsOn('notification:remote-control-status', cb)
      return () => EventsOff('notification:remote-control-status')
    },
  },

  // ── Update ─────────────────────────────────────────────────────────────────

  update: {
    getState: (): Promise<UpdateState> =>
      App.UpdateGetState() as Promise<UpdateState>,

    check: (): Promise<UpdateState> =>
      App.UpdateCheck() as Promise<UpdateState>,

    download: () => App.UpdateDownload(),
    install: () => App.UpdateInstall(),

    onStatusChanged: (cb: (state: UpdateState) => void): (() => void) => {
      EventsOn('update:status-changed', cb)
      return () => EventsOff('update:status-changed')
    },
  },

  // ── Session ────────────────────────────────────────────────────────────────

  session: {
    save: (): Promise<void> => App.SessionSave(),
    restore: (): Promise<AppSession | null> =>
      App.SessionRestore() as Promise<AppSession | null>,
  },

  // ── Window ─────────────────────────────────────────────────────────────────

  window: {
    minimize: () => WindowMinimise(),
    maximize: () => WindowToggleMaximise(),
    close: () => Quit(),

    getState: (): Promise<WindowState> =>
      App.WindowGetState() as Promise<WindowState>,

    onStateChanged: (cb: (state: WindowState) => void): (() => void) => {
      EventsOn('window:state-changed', cb)
      return () => EventsOff('window:state-changed')
    },
  },

  // ── App ────────────────────────────────────────────────────────────────────

  app: {
    getPath: (name: string): Promise<string> => App.AppGetPath(name),
    openExternal: (url: string) => BrowserOpenURL(url),
  },

  // ── Clipboard ──────────────────────────────────────────────────────────────

  clipboard: {
    saveImage: (base64Data: string): Promise<string> =>
      App.ClipboardSaveImage(base64Data),
  },

  // ── Image ──────────────────────────────────────────────────────────────────

  image: {
    readBase64: (filePath: string): Promise<string> =>
      App.ImageReadBase64(filePath),

    listScreenshots: (): Promise<string[]> =>
      App.ImageListScreenshots() as Promise<string[]>,

    open: (filePath: string) => App.ImageOpen(filePath),
  },

  // ── File picker ────────────────────────────────────────────────────────────

  filePicker: {
    open: (): Promise<string> => App.FilePicker(),
  },
}
