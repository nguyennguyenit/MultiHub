import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Toolbar } from './toolbar'

const { getStateMock } = vi.hoisted(() => ({
  getStateMock: vi.fn().mockResolvedValue({
    isMaximized: false,
    isFullScreen: false,
    isExpanded: false,
  }),
}))

vi.mock('../../api', () => ({
  api: {
    window: {
      getState: getStateMock,
    },
  },
}))

describe('Toolbar', () => {
  beforeEach(() => {
    getStateMock.mockResolvedValue({
      isMaximized: false,
      isFullScreen: false,
      isExpanded: false,
    })
  })

  test('renders real project tabs as the primary shell navigation with a compact add affordance', async () => {
    const user = userEvent.setup()
    const onSelectProject = vi.fn()
    const onAddProject = vi.fn()

    render(
      <Toolbar
        onAddTerminal={() => {}}
        terminalCount={2}
        terminalLimit={9}
        projects={[
          {
            id: 'project-1',
            name: 'Alpha',
            path: '/tmp/alpha',
            createdAt: '2026-04-10T00:00:00.000Z',
            updatedAt: '2026-04-10T00:00:00.000Z',
          },
          {
            id: 'project-2',
            name: 'Beta',
            path: '/tmp/beta',
            createdAt: '2026-04-10T00:00:00.000Z',
            updatedAt: '2026-04-10T00:00:00.000Z',
          },
        ]}
        activeProjectId="project-1"
        activeProjectPath="/tmp/alpha"
        onSelectProject={onSelectProject}
        onAddProject={onAddProject}
        onToggleGitHub={() => {}}
        onToggleSettings={() => {}}
        activePanel="github"
      />
    )

    const toolbar = screen.getByTestId('app-toolbar')
    await waitFor(() => expect(getStateMock.mock.calls.length).toBeGreaterThan(0))
    expect(toolbar).toHaveAttribute('data-window-chrome', 'immersive')
    expect(toolbar).toHaveAttribute('data-shell-hierarchy', 'session-strip')
    expect(screen.getByText('MultiHub')).toBeTruthy()
    expect(screen.getByText('Workspace Shell')).toBeTruthy()

    const tablist = screen.getByRole('tablist', { name: 'Project sessions' })
    expect(tablist).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'false')

    await user.click(screen.getByRole('tab', { name: 'Beta' }))
    expect(onSelectProject).toHaveBeenCalledWith('project-2')

    const addButton = screen.getByTestId('add-project-button')
    expect(addButton).toHaveTextContent('+')
    expect(addButton).toHaveAttribute('aria-label', 'Open project folder')
    await user.click(addButton)
    expect(onAddProject).toHaveBeenCalledTimes(1)

    expect(screen.getByText('Terminals')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByText('Session')).toBeTruthy()
    expect(screen.getByText('/tmp/alpha')).toBeInTheDocument()

    const githubButton = screen.getByTitle('GitHub Panel (Ctrl+G)')
    expect(githubButton.getAttribute('data-testid')).toBe('github-panel-button')
    expect(githubButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('settings-button')).toHaveAttribute('aria-pressed', 'false')
  })

  test('refreshes window chrome state when the window resizes on macOS', async () => {
    getStateMock
      .mockResolvedValueOnce({
        isMaximized: false,
        isFullScreen: false,
        isExpanded: false,
      })
      .mockResolvedValueOnce({
        isMaximized: true,
        isFullScreen: false,
        isExpanded: true,
      })

    render(
      <Toolbar
        onAddTerminal={() => {}}
        terminalCount={1}
        terminalLimit={9}
        projects={[]}
        onToggleGitHub={() => {}}
        onToggleSettings={() => {}}
        activePanel={null}
      />
    )

    await waitFor(() => expect(getStateMock.mock.calls.length).toBeGreaterThan(0))
    const callCountBeforeResize = getStateMock.mock.calls.length

    fireEvent(window, new Event('resize'))

    await waitFor(() => expect(getStateMock.mock.calls.length).toBeGreaterThan(callCountBeforeResize))
  })
})
