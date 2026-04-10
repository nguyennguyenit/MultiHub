import logoImg from '../assets/logo.png'
import { TEST_IDS } from '@shared/constants'

interface WelcomeScreenProps {
  onAddProject: () => void
}

export function WelcomeScreen({ onAddProject }: WelcomeScreenProps) {
  return (
    <div className="welcome-screen" data-testid={TEST_IDS.emptyState.project} style={{ flex: 1 }}>
      {/* Subtle radial glow behind logo */}
      <div className="welcome-glow" />

      <img src={logoImg} alt="MultiHub" className="welcome-logo" />
      <span className="welcome-eyebrow">Desktop Workbench</span>
      <h1 className="welcome-title">MultiHub</h1>
      <p className="welcome-subtitle">
        Run parallel terminals, Git workflows, and GitHub context from one native workspace.
      </p>
      <p className="welcome-hint">
        Open a project folder to create a focused workbench for the repo you are actively shipping.
      </p>
      <button type="button" onClick={onAddProject} className="welcome-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
        Open Project Folder
      </button>
      <div className="welcome-shortcuts">
        <span className="welcome-shortcut"><kbd>Ctrl+T</kbd> new terminal</span>
        <span className="welcome-shortcut-dot">·</span>
        <span className="welcome-shortcut"><kbd>Ctrl+G</kbd> GitHub panel</span>
        <span className="welcome-shortcut-dot">·</span>
        <span className="welcome-shortcut"><kbd>Alt+1–9</kbd> switch project</span>
      </div>
    </div>
  )
}
