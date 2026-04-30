import type { Project } from '@shared/types'
import { ProjectDropdown } from './project-dropdown'

interface TopShellProjectTabStripProps {
  projects: Project[]
  activeProjectId: string | null
  onSelectProject: (id: string | null) => void
  onAddProject: () => void
  onDeleteProject: (id: string) => void
}

export function TopShellProjectTabStrip({
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  onDeleteProject,
}: TopShellProjectTabStripProps) {
  return (
    <div className="top-shell-project-strip">
      <div
        className="top-shell-project-strip-scroll"
        role="tablist"
        aria-label="Project sessions"
      >
        {projects.length === 0 ? (
          <div className="top-shell-project-strip-empty">No project sessions</div>
        ) : (
          projects.map((project) => {
            const isActive = project.id === activeProjectId

            return (
              <button
                key={project.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`top-shell-project-tab${isActive ? ' is-active' : ''}`}
                data-session-anchor={isActive ? 'active-project' : undefined}
                title={project.path}
                onClick={() => onSelectProject(project.id)}
              >
                <span className="top-shell-project-tab-name">{project.name}</span>
              </button>
            )
          })
        )}
      </div>

      <button
        type="button"
        className="toolbar-add-project toolbar-add-project-compact"
        data-testid="add-project-button"
        aria-label="Open project folder"
        title="Open project folder"
        onClick={onAddProject}
      >
        +
      </button>

      <ProjectDropdown
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={onSelectProject}
        onAddProject={onAddProject}
        onDeleteProject={onDeleteProject}
        variant="compact"
      />
    </div>
  )
}
