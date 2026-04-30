import { useState, useRef, useEffect } from 'react'
import { TEST_IDS, getProjectDropdownItemTestId } from '@shared/constants'
import type { Project } from '@shared/types'

interface ProjectDropdownProps {
  projects: Project[]
  activeProjectId: string | null
  activeProjectPath?: string
  onSelectProject: (id: string | null) => void
  onAddProject: () => void
  onDeleteProject: (id: string) => void
  variant?: 'default' | 'compact'
}

const MAX_SHORTCUT_PROJECTS = 9

/** Project selector dropdown replacing the horizontal project-tabs component */
export function ProjectDropdown({
  projects,
  activeProjectId,
  activeProjectPath,
  onSelectProject,
  onAddProject,
  onDeleteProject,
  variant = 'default',
}: ProjectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeProject = projects.find(p => p.id === activeProjectId)
  const isCompact = variant === 'compact'

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div
      ref={dropdownRef}
      className={`project-dropdown${isCompact ? ' compact' : ''}`}
    >
      <button
        type="button"
        data-testid={TEST_IDS.shell.projectSwitcherButton}
        data-session-anchor={isCompact ? undefined : 'active-project'}
        className={`project-dropdown-trigger${isCompact ? ' compact' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        title={isCompact ? 'Project overflow and quick jump' : 'Switch project session (Alt+1-9)'}
        aria-label={isCompact ? 'Project overflow and quick jump' : undefined}
        aria-expanded={isOpen}
        aria-controls={isOpen ? TEST_IDS.shell.projectSwitcherMenu : undefined}
      >
        {isCompact ? (
          <span className="project-dropdown-compact-copy">All</span>
        ) : (
          <span className="project-dropdown-copy">
            <span className="project-dropdown-label">Current Session</span>
            <span className="project-dropdown-name">
              {activeProject ? activeProject.name : 'Open Project Folder'}
            </span>
            <span className="project-dropdown-meta">
              {activeProject
                ? activeProjectPath ?? activeProject.path
                : `${projects.length} saved ${projects.length === 1 ? 'project' : 'projects'}`}
            </span>
          </span>
        )}
        {/* Chevron icon */}
        <svg
          className="project-dropdown-chevron"
          viewBox="0 0 16 16"
          width="10"
          height="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="project-dropdown-menu"
          aria-label={isCompact ? 'Project overflow and quick jump' : 'Project sessions'}
          data-testid={TEST_IDS.shell.projectSwitcherMenu}
        >
          {projects.length === 0 && (
            <div className="project-dropdown-empty">
              No projects saved yet. Open a project folder to start the workbench.
            </div>
          )}

          {projects.map((project, index) => (
            <div
              key={project.id}
              className={`project-dropdown-item${activeProjectId === project.id ? ' active' : ''}`}
              data-testid={getProjectDropdownItemTestId(project.id)}
            >
              <button
                type="button"
                className="project-dropdown-item-btn"
                aria-label={`Switch to project ${project.name}`}
                onClick={() => {
                  onSelectProject(project.id)
                  setIsOpen(false)
                }}
              >
                <span className="project-dropdown-shortcut">
                  {index < MAX_SHORTCUT_PROJECTS ? index + 1 : '•'}
                </span>
                <span className="project-dropdown-item-copy">
                  <span className="project-dropdown-item-name">{project.name}</span>
                  <span className="project-dropdown-item-path" title={project.path}>
                    {project.path}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="project-dropdown-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteProject(project.id)
                  if (activeProjectId === project.id) setIsOpen(false)
                }}
                title="Remove project"
                aria-label={`Remove project ${project.name}`}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            className="project-dropdown-add"
            data-testid={TEST_IDS.shell.projectDropdownAddButton}
            onClick={() => {
              onAddProject()
              setIsOpen(false)
            }}
          >
            + Open Project Folder
          </button>
        </div>
      )}
    </div>
  )
}
