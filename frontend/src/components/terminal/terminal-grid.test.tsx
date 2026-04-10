import { render, screen } from '@testing-library/react'
import { TerminalGrid } from './terminal-grid'
import { TEST_IDS } from '@shared/constants'
import type { Terminal } from '@shared/types'

vi.mock('./terminal-pane', () => ({
  TerminalPane: ({ title }: { title: string }) => <div>{title}</div>,
}))

vi.mock('../../hooks/use-terminal-resize', () => ({
  useTerminalResize: () => ({
    getRowFlex: () => 1,
    getColFlex: () => 1,
    startRowResize: vi.fn(),
    startColResize: vi.fn(),
  }),
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
