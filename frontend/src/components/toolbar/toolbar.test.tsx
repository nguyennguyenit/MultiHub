import { render, screen } from '@testing-library/react'
import { Toolbar } from './toolbar'

vi.mock('../../api', () => ({
  api: {
    window: {
      getState: vi.fn().mockResolvedValue({
        isMaximized: false,
        isFullScreen: false,
        isExpanded: false,
      }),
      onStateChanged: vi.fn(() => () => {}),
    },
  },
}))

describe('Toolbar', () => {
  test('renders the compact shell anchors without losing the primary actions', async () => {
    render(
      <Toolbar
        onAddTerminal={() => {}}
        terminalCount={2}
        terminalLimit={9}
        projects={[{
          id: 'project-1',
          name: 'Alpha',
          path: '/tmp/alpha',
          createdAt: '2026-04-10T00:00:00.000Z',
          updatedAt: '2026-04-10T00:00:00.000Z',
        }]}
        activeProjectId="project-1"
        activeProjectPath="/tmp/alpha"
        onToggleGitHub={() => {}}
        onToggleSettings={() => {}}
        activePanel="github"
      />
    )

    expect(screen.getByText('MultiHub')).toBeTruthy()
    expect(screen.getByTestId('project-switcher-button')).toBeTruthy()
    expect(screen.getByTestId('add-project-button')).toHaveTextContent('Open Project')
    expect(screen.getByText('Terminals')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByText('Active Project')).toBeTruthy()
    expect(screen.getByTitle('/tmp/alpha')).toHaveTextContent('/tmp/alpha')

    const githubButton = screen.getByTitle('GitHub Panel (Ctrl+G)')
    expect(githubButton.getAttribute('data-testid')).toBe('github-panel-button')
    expect(githubButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('settings-button')).toHaveAttribute('aria-pressed', 'false')
  })
})
