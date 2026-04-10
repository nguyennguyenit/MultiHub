import { render, screen } from '@testing-library/react'
import { SlidePanel } from './slide-panel'

describe('SlidePanel', () => {
  test('supports a GitHub-specific variant without affecting the dialog contract', () => {
    render(
      <SlidePanel isOpen onClose={() => {}} title="GitHub" variant="github" testId="github-panel-test">
        <div>panel body</div>
      </SlidePanel>
    )

    const panel = screen.getByTestId('github-panel-test')
    expect(panel).toHaveAttribute('data-panel-variant', 'github')
    expect(panel.className).toContain('slide-panel-github')
    expect(panel).toHaveAttribute('role', 'dialog')
    expect(panel).toHaveAttribute('aria-label', 'GitHub')
  })
})
