import { TEST_IDS } from '@shared/constants'

export type GitHubPanelTabId = 'changes' | 'history' | 'github'

interface GitHubPanelTabsProps {
  activeTab: GitHubPanelTabId
  onTabChange: (tab: GitHubPanelTabId) => void
}

const TAB_ITEMS: Array<{
  id: GitHubPanelTabId
  label: string
  description: string
  testId: string
  panelId: string
}> = [
  {
    id: 'changes',
    label: 'Changes',
    description: 'Stage, diff, and commit local edits',
    testId: TEST_IDS.panel.githubTabChanges,
    panelId: TEST_IDS.panel.githubTabPanelChanges,
  },
  {
    id: 'history',
    label: 'History',
    description: 'Review commits, stash, and base-branch drift',
    testId: TEST_IDS.panel.githubTabHistory,
    panelId: TEST_IDS.panel.githubTabPanelHistory,
  },
  {
    id: 'github',
    label: 'GitHub',
    description: 'Auth, identity, issues, and pull requests',
    testId: TEST_IDS.panel.githubTabGitHub,
    panelId: TEST_IDS.panel.githubTabPanelGitHub,
  },
]

export function GitHubPanelTabs({ activeTab, onTabChange }: GitHubPanelTabsProps) {
  return (
    <div className="github-panel-tabs" data-testid={TEST_IDS.panel.githubTabs} role="tablist" aria-label="GitHub panel sections">
      {TAB_ITEMS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          id={tab.testId}
          data-testid={tab.testId}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={tab.panelId}
          className={`github-panel-tab ${activeTab === tab.id ? 'is-active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="github-panel-tab-label">{tab.label}</span>
          <span className="github-panel-tab-description">{tab.description}</span>
        </button>
      ))}
    </div>
  )
}
