import { TEST_IDS } from '@shared/constants'
import type { GitBranchDiffFile, GitFileStatus } from '@shared/types'
import { BranchDiffFileList } from './branch-diff-file-list'
import { GitHubPanelCard } from './github-panel-card'
import { CommitForm } from '../git-panel/commit-form'
import { ChangesList } from '../git-panel/changes-list'

interface GitHubChangesTabProps {
  stagedFiles: GitFileStatus[]
  unstagedFiles: GitFileStatus[]
  branchDiffFiles: GitBranchDiffFile[]
  baseBranch: string
  onFileClick: (file: GitFileStatus) => void
  onBranchFileClick: (file: GitBranchDiffFile) => void
  onStageFile: (path: string) => Promise<void>
  onUnstageFile: (path: string) => Promise<void>
  onStageAll: () => Promise<void>
  onUnstageAll: () => Promise<void>
  onDiscardFile: (path: string) => Promise<void>
  onCommit: (message: string) => Promise<boolean>
  onCommitAndPush: (message: string) => Promise<boolean>
}

export function GitHubChangesTab({
  stagedFiles,
  unstagedFiles,
  branchDiffFiles,
  baseBranch,
  onFileClick,
  onBranchFileClick,
  onStageFile,
  onUnstageFile,
  onStageAll,
  onUnstageAll,
  onDiscardFile,
  onCommit,
  onCommitAndPush,
}: GitHubChangesTabProps) {
  return (
    <section
      className="github-panel-tabpanel"
      data-testid={TEST_IDS.panel.githubTabPanelChanges}
      id={TEST_IDS.panel.githubTabPanelChanges}
      role="tabpanel"
      aria-labelledby={TEST_IDS.panel.githubTabChanges}
    >
      <div className="github-panel-tab-layout">
        <div className="github-panel-stack">
          <GitHubPanelCard
            title="Staged Changes"
            subtitle="Files queued for the next commit"
            count={stagedFiles.length}
            action={<HeaderButton label="Unstage All" onClick={() => void onUnstageAll()} disabled={stagedFiles.length === 0} />}
          >
            <ChangesList files={stagedFiles} mode="staged" onFileClick={onFileClick} onUnstageFile={onUnstageFile} />
          </GitHubPanelCard>

          <GitHubPanelCard
            title="Working Tree"
            subtitle="Unstaged edits still being shaped"
            count={unstagedFiles.length}
            action={<HeaderButton label="Stage All" onClick={() => void onStageAll()} disabled={unstagedFiles.length === 0} />}
          >
            <ChangesList
              files={unstagedFiles}
              mode="unstaged"
              onFileClick={onFileClick}
              onStageFile={onStageFile}
              onDiscardFile={onDiscardFile}
            />
          </GitHubPanelCard>
        </div>

        <div className="github-panel-stack github-panel-stack--aside">
          <GitHubPanelCard title="Commit Composer" subtitle="Contextual, compact, and focused on staged work">
            <CommitForm stagedCount={stagedFiles.length} onCommit={onCommit} onCommitAndPush={onCommitAndPush} />
          </GitHubPanelCard>

          <GitHubPanelCard title={`Against ${baseBranch}`} subtitle="Diff between your branch and the base branch" count={branchDiffFiles.length}>
            <BranchDiffFileList files={branchDiffFiles} onFileClick={onBranchFileClick} />
          </GitHubPanelCard>
        </div>
      </div>
    </section>
  )
}

function HeaderButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button type="button" className="github-panel-card-action" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}
