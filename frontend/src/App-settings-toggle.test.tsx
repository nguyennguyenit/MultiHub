import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'
import { useAppStore, useSettingsStore, useToastStore } from './stores'
import { TEST_IDS } from '@shared/constants'

vi.mock('./components/toolbar', () => ({
  Toolbar: ({ onToggleSettings }: { onToggleSettings: () => void }) => (
    <button
      type="button"
      data-testid={TEST_IDS.shell.settingsButton}
      onClick={onToggleSettings}
    >
      Settings
    </button>
  ),
}))

vi.mock('./components/update-banner', () => ({
  UpdateBanner: () => null,
}))

vi.mock('./components/terminal', () => ({
  TerminalGrid: () => null,
  TerminalActionBar: () => null,
}))

vi.mock('./components/welcome-screen', () => ({
  WelcomeScreen: () => <div data-testid="welcome-screen-stub" />,
}))

vi.mock('./components/toast-container', () => ({
  ToastContainer: () => null,
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
  useKeyboardShortcuts: vi.fn(),
  TERMINAL_DISPOSE_DELAY: 100,
}))

vi.mock('./utils', async () => {
  const actual = await vi.importActual<typeof import('./utils')>('./utils')
  return {
    ...actual,
    joinPathsForTerminal: (paths: string[]) => paths.join(' '),
  }
})

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
      list: vi.fn().mockResolvedValue([]),
      checkFolder: vi.fn().mockResolvedValue(true),
      delete: vi.fn().mockResolvedValue(true),
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

describe('App settings toggle', () => {
  beforeEach(() => {
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

  test('does not trigger a React setState-in-render warning when opening settings', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<App />)
    fireEvent.click(screen.getByTestId(TEST_IDS.shell.settingsButton))

    const hasRenderWarning = consoleErrorSpy.mock.calls.some((call) =>
      call.some((arg) => typeof arg === 'string' && arg.includes('Cannot update a component'))
    )

    expect(hasRenderWarning).toBe(false)

    consoleErrorSpy.mockRestore()
  })
})
