import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { SlidePanel } from './slide-panel'

describe('SlidePanel', () => {
  test('stays mounted with visibility hidden when closed', () => {
    render(
      <SlidePanel isOpen={false} onClose={() => {}} title="Settings" testId="settings-panel-test">
        <div>panel body</div>
      </SlidePanel>
    )

    const panel = screen.getByTestId('settings-panel-test')
    expect(panel).toHaveStyle({ visibility: 'hidden' })
    expect(panel).toHaveAttribute('data-panel-state', 'closed')
    expect(panel).toHaveAttribute('data-panel-side', 'right')
    expect(panel).toHaveAttribute('data-panel-attached', 'true')
    expect(screen.getByText('panel body')).toBeInTheDocument()
  })

  test('supports a GitHub-specific variant without affecting the dialog contract', () => {
    render(
      <SlidePanel isOpen onClose={() => {}} title="GitHub" variant="github" testId="github-panel-test">
        <div>panel body</div>
      </SlidePanel>
    )

    const panel = screen.getByTestId('github-panel-test')
    expect(panel).toHaveAttribute('data-panel-variant', 'github')
    expect(panel).toHaveAttribute('data-panel-state', 'open')
    expect(panel).toHaveAttribute('data-panel-side', 'right')
    expect(panel).toHaveAttribute('data-panel-attached', 'true')
    expect(panel.className).toContain('slide-panel-github')
    expect(panel).toHaveAttribute('role', 'dialog')
    expect(panel).toHaveAttribute('aria-label', 'GitHub')
    expect(screen.getByRole('button', { name: 'Close GitHub panel' })).toBeInTheDocument()
  })

  test('closes on escape only while open', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <SlidePanel isOpen onClose={onClose} title="GitHub" testId="github-panel-test">
        <div>panel body</div>
      </SlidePanel>
    )

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('ignores escape while closed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <SlidePanel isOpen={false} onClose={onClose} title="GitHub" testId="github-panel-test">
        <div>panel body</div>
      </SlidePanel>
    )

    await user.keyboard('{Escape}')

    expect(onClose).not.toHaveBeenCalled()
  })
})
