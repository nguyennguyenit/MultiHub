import userEvent from '@testing-library/user-event'
import { render, screen, within } from '@testing-library/react'
import { TEST_IDS, getProjectDropdownItemTestId } from '@shared/constants'
import type { Project } from '@shared/types'
import { ProjectDropdown } from './project-dropdown'

function createProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'project-1',
    name: 'Alpha',
    path: '/tmp/alpha',
    createdAt: '2026-04-10T00:00:00.000Z',
    updatedAt: '2026-04-10T00:00:00.000Z',
    ...overrides,
  }
}

describe('ProjectDropdown', () => {
  test('opens with stable project item anchors and closes after selecting a project', async () => {
    const user = userEvent.setup()
    const onSelectProject = vi.fn()
    const projects = [
      createProject(),
      createProject({ id: 'project-2', name: 'Beta', path: '/tmp/beta' }),
    ]

    render(
      <ProjectDropdown
        projects={projects}
        activeProjectId="project-1"
        onSelectProject={onSelectProject}
        onAddProject={() => {}}
        onDeleteProject={() => {}}
      />
    )

    expect(screen.getByText('Current Session')).toBeInTheDocument()
    expect(screen.getByTestId(TEST_IDS.shell.projectSwitcherButton)).toHaveAttribute(
      'title',
      'Switch project session (Alt+1-9)',
    )

    await user.click(screen.getByTestId(TEST_IDS.shell.projectSwitcherButton))

    const projectItem = screen.getByTestId(getProjectDropdownItemTestId('project-2'))
    expect(within(projectItem).getByRole('button', { name: 'Switch to project Beta' })).toBeInTheDocument()
    expect(screen.getByTestId(TEST_IDS.shell.projectDropdownAddButton)).toBeInTheDocument()

    await user.click(within(projectItem).getByRole('button', { name: 'Switch to project Beta' }))

    expect(onSelectProject).toHaveBeenCalledWith('project-2')
    expect(screen.queryByTestId(TEST_IDS.shell.projectSwitcherMenu)).not.toBeInTheDocument()
  })

  test('closes on outside click and escape without firing selection handlers', async () => {
    const user = userEvent.setup()
    const onSelectProject = vi.fn()

    render(
      <ProjectDropdown
        projects={[createProject()]}
        activeProjectId="project-1"
        onSelectProject={onSelectProject}
        onAddProject={() => {}}
        onDeleteProject={() => {}}
      />
    )

    await user.click(screen.getByTestId(TEST_IDS.shell.projectSwitcherButton))
    expect(screen.getByTestId(TEST_IDS.shell.projectSwitcherMenu)).toBeInTheDocument()

    await user.click(document.body)
    expect(screen.queryByTestId(TEST_IDS.shell.projectSwitcherMenu)).not.toBeInTheDocument()

    await user.click(screen.getByTestId(TEST_IDS.shell.projectSwitcherButton))
    await user.keyboard('{Escape}')

    expect(screen.queryByTestId(TEST_IDS.shell.projectSwitcherMenu)).not.toBeInTheDocument()
    expect(onSelectProject).not.toHaveBeenCalled()
  })
})
