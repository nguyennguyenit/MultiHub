import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { GitIdentityCard } from './git-identity-card'

describe('GitIdentityCard', () => {
  test('restores persisted values when edit mode is canceled', async () => {
    const user = userEvent.setup()

    render(
      <GitIdentityCard
        config={{ userName: 'Plateau', userEmail: 'plateau@example.com' }}
        isLoading={false}
        onSave={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByPlaceholderText('Your name'))
    await user.type(screen.getByPlaceholderText('Your name'), 'Unsaved Name')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByPlaceholderText('Your name')).toHaveValue('Plateau')
    expect(screen.getByPlaceholderText('you@example.com')).toHaveValue('plateau@example.com')
  })

  test('saves updated identity values', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <GitIdentityCard
        config={{ userName: 'Plateau', userEmail: 'plateau@example.com' }}
        isLoading={false}
        onSave={onSave}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByPlaceholderText('Your name'))
    await user.type(screen.getByPlaceholderText('Your name'), 'MultiHub')
    await user.clear(screen.getByPlaceholderText('you@example.com'))
    await user.type(screen.getByPlaceholderText('you@example.com'), 'multihub@example.com')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith('MultiHub', 'multihub@example.com')
  })
})
