import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { CommitForm } from './commit-form'

describe('CommitForm', () => {
  test('keeps commit actions disabled until files are staged and a message exists', async () => {
    const user = userEvent.setup()

    render(<CommitForm stagedCount={0} onCommit={vi.fn()} />)

    const textarea = screen.getByPlaceholderText('Stage one or more files to start composing a commit.')
    await user.type(textarea, 'ship it')

    expect(screen.getByRole('button', { name: 'Commit' })).toBeDisabled()
  })

  test('supports commit and push from the secondary action menu', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn().mockResolvedValue(true)
    const onCommitAndPush = vi.fn().mockResolvedValue(true)

    render(<CommitForm stagedCount={2} onCommit={onCommit} onCommitAndPush={onCommitAndPush} />)

    await user.type(screen.getByPlaceholderText('Describe what changed…'), 'Redesign GitHub cockpit')
    await user.click(screen.getByRole('button', { name: 'More commit actions' }))
    await user.click(screen.getByRole('button', { name: 'Commit & Push' }))

    expect(onCommit).not.toHaveBeenCalled()
    expect(onCommitAndPush).toHaveBeenCalledWith('Redesign GitHub cockpit')
  })

  test('submits with the keyboard shortcut when staged files exist', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn().mockResolvedValue(true)

    render(<CommitForm stagedCount={1} onCommit={onCommit} />)

    const textarea = screen.getByPlaceholderText('Describe what changed…')
    await user.type(textarea, 'Keyboard shortcut commit')
    await user.keyboard('{Meta>}{Enter}{/Meta}')

    expect(onCommit).toHaveBeenCalledWith('Keyboard shortcut commit')
  })
})
