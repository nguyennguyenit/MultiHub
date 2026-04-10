import { fireEvent, render, screen } from '@testing-library/react'
import { TerminalEmptyState } from './terminal-empty-state'

describe('TerminalEmptyState', () => {
  test('calls the new terminal handler without forwarding the click event', () => {
    const onAddTerminal = vi.fn()

    render(<TerminalEmptyState onAddTerminal={onAddTerminal} />)

    fireEvent.click(screen.getByRole('button', { name: 'New Terminal' }))

    expect(onAddTerminal).toHaveBeenCalledTimes(1)
    expect(onAddTerminal).toHaveBeenCalledWith()
  })
})
