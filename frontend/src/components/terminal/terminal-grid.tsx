import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { TEST_IDS } from '@shared/constants'
import { TerminalPane } from './terminal-pane'
import { TerminalEmptyState } from './terminal-empty-state'
import { ResizeHandle } from './terminal-resize-handle'
import { useTerminalResize } from '../../hooks/use-terminal-resize'
import type { Terminal } from '@shared/types'

interface TerminalGridProps {
  terminals: Terminal[]
  activeProjectId: string | null
  activeProjectName?: string
  activeProjectPath?: string
  activeTerminalId: string | null
  onTerminalClick: (id: string) => void
  onAddTerminal?: () => void
  onCloseTerminal?: (id: string) => void
  onInsertFilePath?: (terminalId: string, paths: string[]) => void
  onTitleChange?: (terminalId: string, title: string) => void
}

/** Default project ID for terminals without explicit projectId */
const DEFAULT_PROJECT_ID = 'default'

/** Get project ID from terminal, using default fallback */
function getProjectId(terminal: Pick<Terminal, 'projectId'>): string {
  return terminal.projectId || DEFAULT_PROJECT_ID
}

/** Calculate grid dimensions based on terminal count and screen orientation */
function calculateGrid(count: number, isPortrait: boolean): { rows: number; cols: number } {
  if (count <= 1) return { rows: 1, cols: 1 }
  if (count <= 2) {
    // Portrait: stack vertically | Landscape: side-by-side
    return isPortrait ? { rows: 2, cols: 1 } : { rows: 1, cols: 2 }
  }
  if (count <= 4) return { rows: 2, cols: 2 }
  if (count <= 6) return { rows: 2, cols: 3 }
  if (count <= 9) return { rows: 3, cols: 3 }
  return { rows: 3, cols: 4 } // max 12
}

/** Split terminals into rows based on grid config */
function splitIntoRows<T>(items: T[], cols: number): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols))
  }
  return rows
}

export const TerminalGrid = memo(function TerminalGrid({
  terminals,
  activeProjectId,
  activeProjectName,
  activeProjectPath,
  activeTerminalId,
  onTerminalClick,
  onAddTerminal,
  onCloseTerminal,
  onInsertFilePath,
  onTitleChange
}: TerminalGridProps) {
  // Detect portrait orientation for responsive grid layout
  const [isPortrait, setIsPortrait] = useState(
    () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth
  )

  useEffect(() => {
    const handleResize = () => setIsPortrait(window.innerHeight > window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const resolvedActiveProjectId = useMemo(() => {
    if (activeProjectId) {
      return activeProjectId
    }

    const activeTerminal = activeTerminalId
      ? terminals.find((terminal) => terminal.id === activeTerminalId)
      : null

    if (activeTerminal) {
      return getProjectId(activeTerminal)
    }

    return terminals[0] ? getProjectId(terminals[0]) : null
  }, [activeProjectId, activeTerminalId, terminals])

  /**
   * Groups terminals by project for stable rendering (single-parent pattern).
   * All project grids are rendered simultaneously with inactive projects hidden via CSS.
   * This prevents React from unmounting terminals when switching projects,
   * preserving cursor position, buffer content, and WebGL state.
  */
  const projectGroups = useMemo(() => {
    const groups = new Map<string, Terminal[]>()
    if (activeProjectId) groups.set(activeProjectId, [])
    for (const t of terminals) {
      const pid = getProjectId(t)
      if (!groups.has(pid)) groups.set(pid, [])
      const group = groups.get(pid)
      if (group) group.push(t)
    }
    return Array.from(groups.entries()).map(([projectId, terms]) => ({
      projectId,
      isActive: projectId === resolvedActiveProjectId,
      terminals: terms
    }))
  }, [terminals, activeProjectId, resolvedActiveProjectId])

  // Get active project's terminals for grid layout calculation
  const activeGroup = projectGroups.find(g => g.isActive)
  const visibleTerminalCount = activeGroup?.terminals.length ?? 0

  // Compute resize grid shape based on active project
  const activeGrid = activeGroup
    ? calculateGrid(activeGroup.terminals.length, isPortrait)
    : { rows: 1, cols: 1 }

  const activeRows = activeGroup ? splitIntoRows(activeGroup.terminals, activeGrid.cols) : []
  const numColsPerRow = activeRows.map(row => row.length)

  // Resize state: flex values for rows and per-row columns
  const gridContainerRef = useRef<HTMLDivElement>(null)
  const { getRowFlex, getColFlex, startRowResize, startColResize } = useTerminalResize(
    resolvedActiveProjectId,
    activeRows.length,
    numColsPerRow,
    gridContainerRef
  )

  return (
    <div style={{ height: '100%', position: 'relative' }} data-testid={TEST_IDS.shell.terminalGrid}>
      {/* All project grids rendered in single parent - inactive hidden with visibility:hidden.
          visibility:hidden preserves xterm.js scroll/cursor state unlike display:none */}
      {projectGroups.map(group => {
        const { cols } = calculateGrid(group.terminals.length, isPortrait)
        const rows = splitIntoRows(group.terminals, cols)

        return (
          <div
            key={group.projectId}
            ref={group.isActive ? gridContainerRef : undefined}
            role="region"
            aria-label={`Terminal grid for project ${group.projectId}`}
            aria-hidden={!group.isActive}
            style={{
              visibility: group.isActive ? 'visible' : 'hidden',
              position: group.isActive ? 'relative' : 'absolute',
              pointerEvents: group.isActive ? 'auto' : 'none',
              width: '100%',
              height: '100%',
              top: 0,
              left: 0
            }}
          >
            <div className="terminal-grid">
              {rows.map((rowTerminals, rowIndex) => (
                <div key={`row-${rowIndex}`} style={{ display: 'contents' }}>
                  {/* Horizontal resize handle between rows */}
                  {rowIndex > 0 && group.isActive && (
                    <ResizeHandle
                      direction="horizontal"
                      onResizeStart={(y) => startRowResize(rowIndex - 1, y)}
                    />
                  )}

                  <div
                    className="terminal-row"
                    style={{ flex: group.isActive ? getRowFlex(rowIndex) : 1 }}
                  >
                    {rowTerminals.map((terminal, colIndex) => (
                      <div key={terminal.id} style={{ display: 'contents' }}>
                        {/* Vertical resize handle between columns */}
                        {colIndex > 0 && group.isActive && (
                          <ResizeHandle
                            direction="vertical"
                            onResizeStart={(x) => startColResize(rowIndex, colIndex - 1, x)}
                          />
                        )}

                        <div
                          className={`terminal-cell${terminal.id === activeTerminalId ? ' active' : ''}`}
                          style={{ flex: group.isActive ? getColFlex(rowIndex, colIndex) : 1 }}
                        >
                          <TerminalPane
                            terminalId={terminal.id}
                            title={terminal.title}
                            isActive={terminal.id === activeTerminalId}
                            hidden={!group.isActive || terminal.id !== activeTerminalId}
                            isClaudeMode={terminal.isClaudeMode}
                            onActivate={() => onTerminalClick(terminal.id)}
                            onClose={() => onCloseTerminal?.(terminal.id)}
                            onInsertFilePath={(paths) => onInsertFilePath?.(terminal.id, paths)}
                            onTitleChange={(title) => onTitleChange?.(terminal.id, title)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {visibleTerminalCount === 0 && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <TerminalEmptyState
            projectName={activeProjectName}
            projectPath={activeProjectPath}
            onAddTerminal={onAddTerminal}
          />
        </div>
      )}
    </div>
  )
})
