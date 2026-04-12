import { render, screen } from '@testing-library/react'
import { TerminalGrid } from './terminal-grid'
import { TEST_IDS } from '@shared/constants'
import type { Terminal } from '@shared/types'

const useTerminalResizeMock = vi.fn(() => ({
  getRowFlex: () => 1,
  getColFlex: () => 1,
  startRowResize: vi.fn(),
  startColResize: vi.fn(),
}))

vi.mock('./terminal-pane', () => ({
  TerminalPane: ({
    title,
    terminalId,
    hidden,
  }: {
    title: string
    terminalId: string
    hidden: boolean
  }) => (
    <div data-testid={`terminal-pane-${terminalId}`} data-hidden={String(hidden)}>
      {title}
    </div>
  ),
}))

vi.mock('../../hooks/use-terminal-resize', () => ({
  useTerminalResize: (...args: unknown[]) => useTerminalResizeMock(...args),
}))

function createTerminal(overrides: Partial<Terminal> = {}): Terminal {
  return {
    id: 'terminal-1',
    title: 'Repo Terminal',
    cwd: '/tmp/repo',
    isClaudeMode: false,
    createdAt: '2026-04-10T00:00:00.000Z',
    ...overrides,
  }
}

describe('TerminalGrid', () => {
  beforeEach(() => {
    useTerminalResizeMock.mockClear()
  })

  test('keeps inactive project grids mounted but hidden to preserve terminal state', () => {
    render(
      <TerminalGrid
        terminals={[
          createTerminal({ id: 'terminal-1', title: 'Alpha Terminal', projectId: 'project-a' }),
          createTerminal({ id: 'terminal-2', title: 'Beta Terminal', projectId: 'project-b' }),
        ]}
        activeProjectId="project-a"
        activeTerminalId="terminal-1"
        onTerminalClick={() => {}}
      />
    )

    expect(screen.getByRole('region', {
      name: 'Terminal grid for project project-a',
    })).toHaveStyle({ visibility: 'visible' })

    const inactiveRegion = screen.getAllByRole('region', { hidden: true }).find(
      (region) => region.getAttribute('aria-label') === 'Terminal grid for project project-b'
    )

    expect(inactiveRegion).toBeDefined()

    if (!inactiveRegion) {
      throw new Error('Expected inactive project region to stay mounted')
    }

    expect(inactiveRegion).toHaveStyle({ visibility: 'hidden' })

    expect(screen.getByTestId('terminal-pane-terminal-2')).toHaveAttribute('data-hidden', 'true')
  })

  test('falls back to the active terminal project when no project is selected', () => {
    render(
      <TerminalGrid
        terminals={[
          createTerminal({ id: 'terminal-1', title: 'Alpha Terminal', projectId: 'project-a' }),
          createTerminal({ id: 'terminal-2', title: 'Beta Terminal', projectId: 'project-b' }),
        ]}
        activeProjectId={null}
        activeTerminalId="terminal-2"
        onTerminalClick={() => {}}
      />
    )

    const projectARegion = screen.getAllByRole('region', { hidden: true }).find(
      (region) => region.getAttribute('aria-label') === 'Terminal grid for project project-a'
    )
    const projectBRegion = screen.getByRole('region', {
      name: 'Terminal grid for project project-b',
    })

    expect(projectBRegion).toHaveStyle({ visibility: 'visible' })
    expect(projectARegion).toHaveStyle({ visibility: 'hidden' })
    expect(screen.getByTestId('terminal-pane-terminal-2')).toHaveAttribute('data-hidden', 'false')
    expect(useTerminalResizeMock).toHaveBeenCalledWith(
      'project-b',
      expect.any(Number),
      expect.any(Array),
      expect.any(Object)
    )
  })

  test('keeps unscoped terminals visible when no project is active', () => {
    render(
      <TerminalGrid
        terminals={[createTerminal()]}
        activeProjectId={null}
        activeTerminalId="terminal-1"
        onTerminalClick={() => {}}
      />
    )

    expect(screen.getByText('Repo Terminal')).toBeVisible()
    expect(screen.queryByTestId(TEST_IDS.emptyState.terminal)).not.toBeInTheDocument()
  })
})
