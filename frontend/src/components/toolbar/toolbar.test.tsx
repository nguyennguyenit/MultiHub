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
  test('renders the workbench brand and stable shell anchors', async () => {
    render(
      <Toolbar
        onAddTerminal={() => {}}
        terminalCount={2}
        terminalLimit={9}
        onToggleGitHub={() => {}}
        onToggleSettings={() => {}}
        activePanel={null}
      />
    )

    expect(screen.getByText('MultiHub')).toBeTruthy()
    expect(screen.getByTestId('project-switcher-button')).toBeTruthy()

    const githubButton = screen.getByTitle('GitHub Panel (Ctrl+G)')
    expect(githubButton.getAttribute('data-testid')).toBe('github-panel-button')
  })
})
