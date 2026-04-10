import { TEST_IDS } from '@shared/constants'
import { GitHubAccountSection } from './github-account-section'
import { GitHubPanelCard } from './github-panel-card'
import { IssuesTab } from './issues-tab'
import { PRsTab } from './prs-tab'

interface GitHubCollaborationTabProps {
  projectPath: string
  currentBranch: string | undefined
  hasRemote: boolean
}

export function GitHubCollaborationTab({
  projectPath,
  currentBranch,
  hasRemote,
}: GitHubCollaborationTabProps) {
  return (
    <section
      className="github-panel-tabpanel"
      data-testid={TEST_IDS.panel.githubTabPanelGitHub}
      id={TEST_IDS.panel.githubTabPanelGitHub}
      role="tabpanel"
      aria-labelledby={TEST_IDS.panel.githubTabGitHub}
    >
      <div className="github-panel-stack">
        <GitHubAccountSection currentBranch={currentBranch} hasRemote={hasRemote} />

        <div className="github-panel-tab-layout">
          <GitHubPanelCard title="Issues" subtitle="Current issue queue for this repository" className="github-panel-card--stretch">
            <IssuesTab projectPath={projectPath} />
          </GitHubPanelCard>

          <GitHubPanelCard title="Pull Requests" subtitle="Incoming and outgoing review work" className="github-panel-card--stretch">
            <PRsTab projectPath={projectPath} />
          </GitHubPanelCard>
        </div>
      </div>
    </section>
  )
}
