import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'
import { useAppStore, useSettingsStore, useToastStore } from './stores'
import { TEST_IDS } from '@shared/constants'

const {
  useKeyboardShortcutsMock,
  checkFolderMock,
  deleteProjectMock,
  projectListMock,
  projectGetActiveMock,
  projectSetActiveMock,
} = vi.hoisted(() => ({
  useKeyboardShortcutsMock: vi.fn(),
  checkFolderMock: vi.fn().mockResolvedValue(true),
  deleteProjectMock: vi.fn().mockResolvedValue(true),
  projectListMock: vi.fn().mockResolvedValue([]),
  projectGetActiveMock: vi.fn().mockResolvedValue(''),
  projectSetActiveMock: vi.fn().mockResolvedValue(true),
}))

vi.mock('./components/toolbar', () => ({
  Toolbar: ({
    onDeleteProject,
  }: {
    onDeleteProject?: (id: string) => void
  }) => (
    <div>
      <div data-testid="toolbar-stub" />
      {onDeleteProject ? (
        <button
          type="button"
          data-testid="toolbar-delete-project"
          onClick={() => onDeleteProject('project-1')}
        >
          delete project
        </button>
      ) : null}
    </div>
  ),
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
    items,
    onSelect,
  }: {
    isOpen: boolean
    items: Array<{ id: string; title: string; subtitle: string; group: string }>
    onSelect: (item: { id: string; title: string; subtitle: string; group: string }) => void
  }) => (
    isOpen ? (
      <div>
        <button
          type="button"
          data-testid="quick-switcher-project-select"
          onClick={() => {
            const projectItem = items.find((item) => item.id.startsWith('project-'))
            if (projectItem) {
              onSelect(projectItem)
            }
          }}
        >
          select project
        </button>
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
      </div>
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
      getActive: projectGetActiveMock,
      checkFolder: checkFolderMock,
      delete: deleteProjectMock,
      setActive: projectSetActiveMock,
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
    projectGetActiveMock.mockResolvedValue('')
    projectSetActiveMock.mockResolvedValue(true)
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

  test('hydrates the persisted active project after validating saved folders', async () => {
    projectListMock.mockResolvedValue([{
      id: 'project-1',
      name: 'Alpha',
      path: '/tmp/alpha',
      createdAt: '2026-04-10T00:00:00.000Z',
      updatedAt: '2026-04-10T00:00:00.000Z',
    }])
    projectGetActiveMock.mockResolvedValue('project-1')

    render(<App />)

    await waitFor(() => {
      expect(projectGetActiveMock).toHaveBeenCalled()
      expect(checkFolderMock).toHaveBeenCalledWith('/tmp/alpha')
      expect(useAppStore.getState().projects).toHaveLength(1)
      expect(useAppStore.getState().activeProjectId).toBe('project-1')
    })
  })

  test('clears a stale persisted active project when it is missing from the validated project list', async () => {
    projectListMock.mockResolvedValue([{
      id: 'project-1',
      name: 'Alpha',
      path: '/tmp/alpha',
      createdAt: '2026-04-10T00:00:00.000Z',
      updatedAt: '2026-04-10T00:00:00.000Z',
    }])
    projectGetActiveMock.mockResolvedValue('project-missing')

    render(<App />)

    await waitFor(() => {
      expect(checkFolderMock).toHaveBeenCalledWith('/tmp/alpha')
      expect(projectSetActiveMock).toHaveBeenCalledWith('')
      expect(useAppStore.getState().activeProjectId).toBeNull()
    })
  })

  test('persists the active project when the omnibox selects a project', async () => {
    projectListMock.mockImplementation(() => new Promise(() => {}))

    useAppStore.setState({
      projects: [{
        id: 'project-1',
        name: 'Alpha',
        path: '/tmp/alpha',
        createdAt: '2026-04-10T00:00:00.000Z',
        updatedAt: '2026-04-10T00:00:00.000Z',
      }],
      activeProjectId: null,
    })

    render(<App />)

    const keyboardOptions = useKeyboardShortcutsMock.mock.calls.at(-1)?.[0]
    await act(async () => {
      keyboardOptions?.onToggleQuickSwitcher?.()
    })

    fireEvent.click(await screen.findByTestId('quick-switcher-project-select'))

    await waitFor(() => {
      expect(projectSetActiveMock).toHaveBeenCalledWith('project-1')
      expect(useAppStore.getState().activeProjectId).toBe('project-1')
    })
  })

  test('repairs stale persisted writes when a clear is overtaken by a newer project selection', async () => {
    projectListMock.mockImplementation(() => new Promise(() => {}))

    let persistedActiveProjectId = ''
    let resolveClearSelection: (() => void) | null = null

    projectSetActiveMock.mockReset()
    projectSetActiveMock
      .mockImplementationOnce((id: string) => new Promise<boolean>((resolve) => {
        resolveClearSelection = () => {
          persistedActiveProjectId = id
          resolve(true)
        }
      }))
      .mockImplementation(async (id: string) => {
        persistedActiveProjectId = id
        return true
      })

    useAppStore.setState({
      terminals: [{
        id: 'terminal-1',
        title: 'Scratch Terminal',
        cwd: '/tmp/scratch',
        isClaudeMode: false,
        createdAt: '2026-04-10T00:00:00.000Z',
      }],
      activeTerminalId: 'terminal-1',
      projects: [{
        id: 'project-1',
        name: 'Alpha',
        path: '/tmp/alpha',
        createdAt: '2026-04-10T00:00:00.000Z',
        updatedAt: '2026-04-10T00:00:00.000Z',
      }],
      activeProjectId: null,
    })

    render(<App />)

    const keyboardOptions = useKeyboardShortcutsMock.mock.calls.at(-1)?.[0]
    await act(async () => {
      keyboardOptions?.onToggleQuickSwitcher?.()
    })
    fireEvent.click(await screen.findByTestId('quick-switcher-terminal-select'))

    await act(async () => {
      keyboardOptions?.onSelectProject?.('project-1')
    })

    await waitFor(() => {
      expect(useAppStore.getState().activeProjectId).toBe('project-1')
      expect(persistedActiveProjectId).toBe('project-1')
    })

    await act(async () => {
      resolveClearSelection?.()
    })

    await waitFor(() => {
      expect(useAppStore.getState().activeProjectId).toBe('project-1')
      expect(persistedActiveProjectId).toBe('project-1')
    })
  })

  test('invalidates an in-flight project selection when that project is deleted', async () => {
    projectListMock.mockImplementation(() => new Promise(() => {}))

    let persistedActiveProjectId = ''
    let resolveProjectSelection: (() => void) | null = null

    deleteProjectMock.mockImplementation(async () => {
      persistedActiveProjectId = ''
      return true
    })
    projectSetActiveMock.mockReset()
    projectSetActiveMock
      .mockImplementationOnce((id: string) => new Promise<boolean>((resolve) => {
        resolveProjectSelection = () => {
          persistedActiveProjectId = id
          resolve(true)
        }
      }))
      .mockImplementation(async (id: string) => {
        persistedActiveProjectId = id
        return true
      })

    useAppStore.setState({
      projects: [{
        id: 'project-1',
        name: 'Alpha',
        path: '/tmp/alpha',
        createdAt: '2026-04-10T00:00:00.000Z',
        updatedAt: '2026-04-10T00:00:00.000Z',
      }],
      activeProjectId: null,
    })

    render(<App />)

    const keyboardOptions = useKeyboardShortcutsMock.mock.calls.at(-1)?.[0]
    await act(async () => {
      keyboardOptions?.onSelectProject?.('project-1')
    })

    fireEvent.click(screen.getByTestId('toolbar-delete-project'))

    await act(async () => {
      resolveProjectSelection?.()
    })

    await waitFor(() => {
      expect(deleteProjectMock).toHaveBeenCalledWith('project-1')
      expect(useAppStore.getState().projects).toEqual([])
      expect(useAppStore.getState().activeProjectId).toBeNull()
      expect(persistedActiveProjectId).toBe('')
    })
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
