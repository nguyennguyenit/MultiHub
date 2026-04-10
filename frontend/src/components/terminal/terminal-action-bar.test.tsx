import { fireEvent, render, screen } from '@testing-library/react'
import { TerminalActionBar } from './terminal-action-bar'

describe('TerminalActionBar', () => {
  test('stays hidden when there are no terminals', () => {
    const { container } = render(
      <TerminalActionBar
        terminalCount={0}
        terminalLimit={4}
        yoloEnabled={false}
        onAddTerminal={() => {}}
        onToggleYolo={() => {}}
        onKillAll={() => {}}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  test('uses stable actions and explicit kill confirmation', () => {
    const onKillAll = vi.fn()

    render(
      <TerminalActionBar
        terminalCount={2}
        terminalLimit={4}
        yoloEnabled={false}
        onAddTerminal={() => {}}
        onToggleYolo={() => {}}
        onKillAll={onKillAll}
      />
    )

    const newTerminalButton = screen.getByRole('button', { name: 'New Terminal' })
    expect(newTerminalButton.getAttribute('data-testid')).toBe('new-terminal-button')

    fireEvent.click(screen.getByRole('button', { name: 'Kill All' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Kill All' }))

    expect(onKillAll).toHaveBeenCalledTimes(1)
  })
})
