import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TEST_IDS, getQuickSwitcherItemTestId } from '@shared/constants'
import { QuickSwitcherDialog, type QuickSwitcherItem } from './quick-switcher-dialog'

const ITEMS: QuickSwitcherItem[] = [
  {
    id: 'project-alpha',
    title: 'Alpha',
    subtitle: 'Project',
    group: 'Projects',
    keywords: ['repo', 'alpha'],
  },
  {
    id: 'terminal-build',
    title: 'Build Terminal',
    subtitle: 'Terminal',
    group: 'Terminals',
    keywords: ['build', 'logs'],
  },
  {
    id: 'toggle-settings',
    title: 'Toggle Settings',
    subtitle: 'Action',
    group: 'Actions',
    keywords: ['preferences', 'settings'],
  },
]

describe('QuickSwitcherDialog', () => {
  test('focuses the palette input when opened and restores prior focus when dismissed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const trigger = document.createElement('button')
    trigger.textContent = 'previous focus'
    document.body.appendChild(trigger)
    trigger.focus()

    const { rerender } = render(
      <QuickSwitcherDialog
        isOpen={false}
        items={ITEMS}
        onClose={onClose}
        onSelect={() => {}}
      />
    )

    rerender(
      <QuickSwitcherDialog
        isOpen
        items={ITEMS}
        onClose={onClose}
        onSelect={() => {}}
      />
    )

    expect(screen.getByTestId(TEST_IDS.palette.root)).toBeInTheDocument()
    expect(screen.getByTestId(TEST_IDS.palette.input)).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)

    rerender(
      <QuickSwitcherDialog
        isOpen={false}
        items={ITEMS}
        onClose={onClose}
        onSelect={() => {}}
      />
    )

    await waitFor(() => expect(trigger).toHaveFocus())
    trigger.remove()
  })

  test('filters items and executes the highlighted result with keyboard selection', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSelect = vi.fn()

    render(
      <QuickSwitcherDialog
        isOpen
        items={ITEMS}
        onClose={onClose}
        onSelect={onSelect}
      />
    )

    const input = screen.getByTestId(TEST_IDS.palette.input)
    await user.type(input, 'settings')

    expect(screen.getByTestId(getQuickSwitcherItemTestId('toggle-settings'))).toBeInTheDocument()
    expect(screen.queryByTestId(getQuickSwitcherItemTestId('project-alpha'))).not.toBeInTheDocument()

    await user.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'toggle-settings' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('shows the empty state when no results match the query', async () => {
    const user = userEvent.setup()

    render(
      <QuickSwitcherDialog
        isOpen
        items={ITEMS}
        onClose={() => {}}
        onSelect={() => {}}
      />
    )

    await user.type(screen.getByTestId(TEST_IDS.palette.input), 'zzz')

    expect(screen.getByTestId(TEST_IDS.palette.emptyState)).toBeInTheDocument()
  })

  test('only dismisses from an actual backdrop click, not pointer down', () => {
    const onClose = vi.fn()

    render(
      <QuickSwitcherDialog
        isOpen
        items={ITEMS}
        onClose={onClose}
        onSelect={() => {}}
      />
    )

    const backdrop = screen.getByTestId(TEST_IDS.palette.root).parentElement
    expect(backdrop).not.toBeNull()

    if (!backdrop) {
      throw new Error('Expected palette backdrop')
    }

    fireEvent.mouseDown(backdrop)
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
