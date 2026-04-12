import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'
import { useAppStore, useSettingsStore, useToastStore } from './stores'
import { TEST_IDS } from '@shared/constants'

const {
  useKeyboardShortcutsMock,
  checkFolderMock,
  deleteProjectMock,
  projectListMock,
} = vi.hoisted(() => ({
  useKeyboardShortcutsMock: vi.fn(),
  checkFolderMock: vi.fn().mockResolvedValue(true),
  deleteProjectMock: vi.fn().mockResolvedValue(true),
  projectListMock: vi.fn().mockResolvedValue([]),
}))

vi.mock('./components/toolbar', () => ({
  Toolbar: () => <div data-testid="toolbar-stub" />,
}))

vi.mock('./components/update-banner', () => ({
  UpdateBanner: () => null,
}))

vi.mock('./components/terminal', () => ({
  TerminalGrid: () => <div data-testid="terminal-grid-stub" />,
  TerminalActionBar: () => <div data-testid="terminal-action-bar-stub" />,
}))

vi.mock('./components/welcome-screen', () => ({
  WelcomeScreen: () => <div data-testid="welcome-screen-stub" />,
}))

vi.mock('./components/toast-container', () => ({
  ToastContainer: () => null,
}))

vi.mock('./components/quick-switcher', () => ({
  QuickSwitcherDialog: ({
    isOpen,
    onSelect,
  }: {
    isOpen: boolean
    onSelect: (item: { id: string; title: string; subtitle: string; group: string }) => void
  }) => (
    isOpen ? (
      <button
        type="button"
        data-testid="quick-switcher-terminal-select"
        onClick={() => onSelect({
          id: 'terminal-terminal-1',
          title: 'Repo Terminal',
          subtitle: 'Terminal in Missing Repo',
          group: 'Terminals',
        })}
      >
        select terminal
      </button>
    ) : null
  ),
}))

vi.mock('./components/settings', () => ({
  SettingsPanelContent: () => null,
}))

vi.mock('./components/slide-panel', () => ({
  SlidePanel: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('./components/github-view/github-view', () => ({
  GitHubPanelContent: () => null,
}))

vi.mock('./components/github-setup', () => ({
  GitInitDialog: () => null,
  GitHubConnectDialog: () => null,
}))

vi.mock('./hooks', () => ({
  useKeyboardShortcuts: useKeyboardShortcutsMock,
  TERMINAL_DISPOSE_DELAY: 100,
}))

vi.mock('./utils', () => ({
  joinPathsForTerminal: (paths: string[]) => paths.join(' '),
}))

vi.mock('./stores', async () => {
  const actual = await vi.importActual<typeof import('./stores')>('./stores')
  return {
    ...actual,
    setupNotificationListener: vi.fn(() => () => {}),
    setupUpdateListener: vi.fn(() => () => {}),
  }
})

vi.mock('./api', () => ({
  api: {
    terminal: {
      create: vi.fn(),
      destroy: vi.fn(),
      write: vi.fn(),
      onExit: vi.fn(() => () => {}),
      onTitleChange: vi.fn(() => () => {}),
      detectWsl: vi.fn().mockResolvedValue({ available: false, distros: [] }),
    },
    project: {
      list: projectListMock,
      checkFolder: checkFolderMock,
      delete: deleteProjectMock,
      openFolder: vi.fn().mockResolvedValue(''),
      create: vi.fn(),
      update: vi.fn(),
    },
    git: {
      status: vi.fn().mockResolvedValue({ isRepo: true, hasRemote: true }),
      init: vi.fn(),
    },
    settings: {
      get: vi.fn().mockResolvedValue({
        colorTheme: 'tokyo-night',
        terminalLimit: { preset: 9 },
        terminalRenderMode: 'balanced',
        glassmorphismEnabled: false,
        terminalFontFamily: 'jetbrains-mono',
        windowsShell: { type: 'cmd' },
        themeMode: 'dark',
        modernFontFamily: 'system',
        uiStyle: 'modern',
        terminalStyleOptions: {
          colorPreset: 'green',
          fontFamily: 'jetbrains-mono',
          useBorderChars: false,
        },
        activityBarState: 'collapsed',
        vietnameseImeFix: false,
      }),
      set: vi.fn(),
    },
    notification: {
      setActiveTerminal: vi.fn(),
    },
    session: {
      save: vi.fn(),
    },
  },
}))

describe('App', () => {
  beforeEach(() => {
    useKeyboardShortcutsMock.mockClear()
    checkFolderMock.mockResolvedValue(true)
    deleteProjectMock.mockResolvedValue(true)
    projectListMock.mockResolvedValue([])
    useAppStore.setState({
      terminals: [],
      terminalOutputs: {},
      terminalKeyboardEnhancements: {},
      activeTerminalId: null,
      lastActiveTerminalByProjectId: {},
      projects: [],
      activeProjectId: null,
      activityBarState: 'collapsed',
      activeView: 'terminals',
      projectTerminals: {},
    })

    const settings = useSettingsStore.getState().savedSettings
    useSettingsStore.setState({
      savedSettings: settings,
      pendingSettings: settings,
      hasUnsavedChanges: false,
      wslInfo: null,
      gitPanelOpen: false,
    })

    useToastStore.setState({ toasts: [] })
  })

  test('shows the terminal workspace when an unscoped terminal already exists', async () => {
    useAppStore.setState({
      terminals: [{
        id: 'terminal-1',
        title: 'Repo Terminal',
        cwd: '/tmp/repo',
        isClaudeMode: false,
        createdAt: '2026-04-10T00:00:00.000Z',
      }],
      activeTerminalId: 'terminal-1',
      activeProjectId: null,
    })

    render(<App />)

    expect(await screen.findByTestId(TEST_IDS.shell.terminalArea)).toBeInTheDocument()
    expect(screen.getByTestId('terminal-grid-stub')).toBeInTheDocument()
    expect(screen.queryByTestId('welcome-screen-stub')).not.toBeInTheDocument()
  })

  test('removes a missing project when its terminal is selected from the quick switcher', async () => {
    checkFolderMock.mockResolvedValue(false)
    projectListMock.mockImplementation(() => new Promise(() => {}))

    useAppStore.setState({
      terminals: [{
        id: 'terminal-1',
        title: 'Repo Terminal',
        cwd: '/tmp/missing',
        projectId: 'project-missing',
        isClaudeMode: false,
        createdAt: '2026-04-10T00:00:00.000Z',
      }],
      activeTerminalId: 'terminal-1',
      projects: [{
        id: 'project-missing',
        name: 'Missing Repo',
        path: '/tmp/missing',
        createdAt: '2026-04-10T00:00:00.000Z',
        updatedAt: '2026-04-10T00:00:00.000Z',
      }],
      activeProjectId: 'project-missing',
    })

    render(<App />)

    const keyboardOptions = useKeyboardShortcutsMock.mock.calls.at(-1)?.[0]
    await act(async () => {
      keyboardOptions?.onToggleQuickSwitcher?.()
    })

    fireEvent.click(await screen.findByTestId('quick-switcher-terminal-select'))

    await waitFor(() => {
      expect(checkFolderMock).toHaveBeenCalledWith('/tmp/missing')
      expect(deleteProjectMock).toHaveBeenCalledWith('project-missing')
      expect(useAppStore.getState().projects).toEqual([])
      expect(useToastStore.getState().toasts.at(-1)?.message).toContain('Missing Repo')
    })
  })
})
