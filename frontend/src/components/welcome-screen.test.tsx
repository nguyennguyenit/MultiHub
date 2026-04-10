import { fireEvent, render, screen } from '@testing-library/react'
import { WelcomeScreen } from './welcome-screen'

describe('WelcomeScreen', () => {
  test('uses MultiHub branding and opens the project picker from the primary CTA', () => {
    const onAddProject = vi.fn()

    render(<WelcomeScreen onAddProject={onAddProject} />)

    expect(screen.getByRole('heading', { name: 'MultiHub' })).toBeTruthy()

    const openProjectButton = screen.getByRole('button', { name: 'Open Project Folder' })
    fireEvent.click(openProjectButton)

    expect(onAddProject).toHaveBeenCalledTimes(1)
  })
})
