import { useState } from 'react'
import { TEST_IDS } from '@shared/constants'
import type { GitBranchDiffFile, GitLogEntry, GitStashEntry } from '@shared/types'
import { BranchDiffFileList } from './branch-diff-file-list'
import { GitHubPanelCard } from './github-panel-card'
import { HistoryTab } from '../git-panel/history-tab'
import { StashTab } from '../git-panel/stash-tab'

interface GitHubHistoryTabProps {
  baseBranch: string
  branchDiffFiles: GitBranchDiffFile[]
  entries: GitLogEntry[]
  stashEntries: GitStashEntry[]
  isLoading: boolean
  onBranchFileClick: (file: GitBranchDiffFile) => void
  onStashSave: (message?: string) => Promise<void>
  onStashApply: (index: number) => Promise<void>
  onStashPop: (index: number) => Promise<void>
  onStashDrop: (index: number) => Promise<void>
}

export function GitHubHistoryTab({
  baseBranch,
  branchDiffFiles,
  entries,
  stashEntries,
  isLoading,
  onBranchFileClick,
  onStashSave,
  onStashApply,
  onStashPop,
  onStashDrop,
}: GitHubHistoryTabProps) {
  const [showSaveInput, setShowSaveInput] = useState(false)

  return (
    <section
      className="github-panel-tabpanel"
      data-testid={TEST_IDS.panel.githubTabPanelHistory}
      id={TEST_IDS.panel.githubTabPanelHistory}
      role="tabpanel"
      aria-labelledby={TEST_IDS.panel.githubTabHistory}
    >
      <div className="github-panel-tab-layout">
        <div className="github-panel-stack">
          <GitHubPanelCard title="Recent Commits" subtitle="The latest local commit history" count={entries.length}>
            <HistoryTab entries={entries} isLoading={isLoading} />
          </GitHubPanelCard>

          <GitHubPanelCard title={`Against ${baseBranch}`} subtitle="Files drifting from the base branch" count={branchDiffFiles.length}>
            <BranchDiffFileList files={branchDiffFiles} onFileClick={onBranchFileClick} />
          </GitHubPanelCard>
        </div>

        <div className="github-panel-stack github-panel-stack--aside">
          <GitHubPanelCard
            title="Stash"
            subtitle="Park partial work without leaving the panel"
            count={stashEntries.length}
            action={
              <button
                type="button"
                className="github-panel-card-action"
                onClick={() => setShowSaveInput((current) => !current)}
              >
                {showSaveInput ? 'Hide Save' : 'Save Stash'}
              </button>
            }
          >
            <StashTab
              entries={stashEntries}
              isLoading={isLoading}
              showSaveInput={showSaveInput}
              onSaveInputClose={() => setShowSaveInput(false)}
              onSave={onStashSave}
              onApply={onStashApply}
              onPop={onStashPop}
              onDrop={onStashDrop}
            />
          </GitHubPanelCard>
        </div>
      </div>
    </section>
  )
}
