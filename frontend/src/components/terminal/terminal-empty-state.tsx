import { TEST_IDS } from '@shared/constants'

interface TerminalEmptyStateProps {
  projectName?: string
  projectPath?: string
  onAddTerminal?: () => void
}

export function TerminalEmptyState({
  projectName,
  projectPath,
  onAddTerminal,
}: TerminalEmptyStateProps) {
  return (
    <div className="terminal-empty-state" data-testid={TEST_IDS.emptyState.terminal}>
      <div className="terminal-empty-state-copy">
        <span className="terminal-empty-state-eyebrow">Workspace Ready</span>
        <h2 className="terminal-empty-state-title">
          {projectName ? `No terminals open for ${projectName}` : 'No terminals open yet'}
        </h2>
        <p className="terminal-empty-state-description">
          Start a fresh terminal session to run commands, agents, and Git tasks without leaving the workbench.
        </p>
        {projectPath && (
          <p className="terminal-empty-state-path" title={projectPath}>
            {projectPath}
          </p>
        )}
      </div>

      {onAddTerminal && (
        <button type="button" className="welcome-btn" onClick={onAddTerminal}>
          New Terminal
        </button>
      )}
    </div>
  )
}
