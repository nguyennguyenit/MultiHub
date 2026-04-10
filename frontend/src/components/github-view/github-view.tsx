import { api } from '../../api'
import { useCallback, useRef, useState } from 'react'
import { TEST_IDS } from '@shared/constants'
import type { GitBranchDiffFile, GitFileStatus } from '@shared/types'
import { useGitPanel } from '../../hooks/use-git-panel'
import { DiffModal } from '../git-panel/diff-modal'
import { GitHubChangesTab } from './github-changes-tab'
import { GitHubCollaborationTab } from './github-collaboration-tab'
import { GitHubHistoryTab } from './github-history-tab'
import { GitHubPanelSummary } from './github-panel-summary'
import { GitHubPanelTabs, type GitHubPanelTabId } from './github-panel-tabs'

interface DiffModalState {
  fileName: string
  oldFileName?: string
  fileStatus?: string
  additions?: number
  deletions?: number
  diff: string
  isLoading: boolean
  error?: string
  sourceLabel?: string
  staged?: boolean
}

interface GitHubPanelContentProps {
  projectPath: string | undefined
}

export function GitHubPanelContent({ projectPath }: GitHubPanelContentProps) {
  const [activeTab, setActiveTab] = useState<GitHubPanelTabId>('changes')
  const [syncing, setSyncing] = useState(false)
  const [diffModal, setDiffModal] = useState<DiffModalState | null>(null)
  const diffRequestIdRef = useRef(0)
  const gitPanel = useGitPanel({ projectPath, enabled: true })

  const stagedFiles = gitPanel.files.filter((file) => file.staged)
  const unstagedFiles = gitPanel.files.filter((file) => !file.staged)
  const aheadBy = gitPanel.branchDiff?.aheadBy ?? 0
  const behindBy = gitPanel.branchDiff?.behindBy ?? 0

  const closeDiffModal = useCallback(() => {
    diffRequestIdRef.current += 1
    setDiffModal(null)
  }, [])

  const openFileDiff = useCallback(async (file: GitFileStatus) => {
    if (!projectPath) return
    const requestId = ++diffRequestIdRef.current
    const modalBase: DiffModalState = {
      fileName: file.path,
      oldFileName: file.oldPath,
      fileStatus: file.status,
      additions: file.additions,
      deletions: file.deletions,
      diff: '',
      isLoading: true,
      sourceLabel: file.staged ? 'Staged changes' : 'Working tree',
      staged: file.staged,
    }
    setDiffModal(modalBase)

    const result = await api.git.diff(projectPath, file.path, file.staged ?? false, file.oldPath ?? '')
    if (diffRequestIdRef.current !== requestId) return

    setDiffModal({
      ...modalBase,
      diff: result.success ? result.diff || '' : '',
      isLoading: false,
      error: result.success ? undefined : result.error || 'Failed to load diff',
    })
  }, [projectPath])

  const openBranchFileDiff = useCallback(async (file: GitBranchDiffFile) => {
    if (!projectPath) return
    const requestId = ++diffRequestIdRef.current
    const modalBase: DiffModalState = {
      fileName: file.path,
      oldFileName: file.oldPath,
      fileStatus: file.status,
      additions: file.additions,
      deletions: file.deletions,
      diff: '',
      isLoading: true,
      sourceLabel: `Against ${gitPanel.baseBranch}`,
    }
    setDiffModal(modalBase)

    const result = await api.git.diffAgainstBranch(projectPath, file.path, gitPanel.baseBranch, file.oldPath)
    if (diffRequestIdRef.current !== requestId) return

    setDiffModal({
      ...modalBase,
      diff: result.success ? result.diff || '' : '',
      isLoading: false,
      error: result.success ? undefined : result.error || 'Failed to load diff',
    })
  }, [gitPanel.baseBranch, projectPath])

  const withSync = async (action: () => Promise<unknown>) => {
    setSyncing(true)
    try {
      await action()
    } finally {
      setSyncing(false)
    }
  }

  if (!projectPath) {
    return (
      <div
        className="github-panel-empty-state"
        data-testid={TEST_IDS.panel.githubEmptyState}
      >
        <div className="text-lg font-medium">No Project Selected</div>
        <div className="text-sm opacity-60">Select a project from the toolbar to view Git status</div>
      </div>
    )
  }

  return (
    <div className="github-panel-shell">
      <GitHubPanelSummary
        projectPath={projectPath}
        gitStatus={gitPanel.gitStatus}
        branches={gitPanel.branches}
        currentBranch={gitPanel.currentBranch}
        stagedCount={stagedFiles.length}
        unstagedCount={unstagedFiles.length}
        isLoading={gitPanel.isLoading}
        syncing={syncing}
        aheadBy={aheadBy}
        behindBy={behindBy}
        onCheckoutBranch={gitPanel.checkoutBranch}
        onCreateBranch={gitPanel.createBranch}
        onFetch={() => withSync(() => gitPanel.fetch())}
        onPull={() => withSync(() => gitPanel.pull())}
        onPush={() => withSync(() => gitPanel.push())}
      />

      <GitHubPanelTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="github-panel-tabpanes">
        {activeTab === 'changes' && (
          <GitHubChangesTab
            stagedFiles={stagedFiles}
            unstagedFiles={unstagedFiles}
            branchDiffFiles={gitPanel.branchDiff?.files ?? []}
            baseBranch={gitPanel.baseBranch}
            onFileClick={openFileDiff}
            onBranchFileClick={openBranchFileDiff}
            onStageFile={gitPanel.stageFile}
            onUnstageFile={gitPanel.unstageFile}
            onStageAll={gitPanel.stageAll}
            onUnstageAll={async () => Promise.all(stagedFiles.map((file) => gitPanel.unstageFile(file.path))).then(() => undefined)}
            onDiscardFile={gitPanel.discardFile}
            onCommit={gitPanel.commit}
            onCommitAndPush={async (message) => {
              const committed = await gitPanel.commit(message)
              if (committed) {
                await gitPanel.push()
              }
              return committed
            }}
          />
        )}

        {activeTab === 'history' && (
          <GitHubHistoryTab
            baseBranch={gitPanel.baseBranch}
            branchDiffFiles={gitPanel.branchDiff?.files ?? []}
            entries={gitPanel.logEntries}
            stashEntries={gitPanel.stashEntries}
            isLoading={gitPanel.isLoading}
            onBranchFileClick={openBranchFileDiff}
            onStashSave={gitPanel.stashSave}
            onStashApply={gitPanel.stashApply}
            onStashPop={gitPanel.stashPop}
            onStashDrop={gitPanel.stashDrop}
          />
        )}

        {activeTab === 'github' && (
          <GitHubCollaborationTab
            projectPath={projectPath}
            currentBranch={gitPanel.currentBranch}
            hasRemote={gitPanel.gitStatus?.hasRemote ?? false}
          />
        )}
      </div>

      <DiffModal
        isOpen={!!diffModal}
        onClose={closeDiffModal}
        fileName={diffModal?.fileName ?? null}
        oldFileName={diffModal?.oldFileName}
        fileStatus={diffModal?.fileStatus}
        additions={diffModal?.additions}
        deletions={diffModal?.deletions}
        diff={diffModal?.diff ?? null}
        isLoading={diffModal?.isLoading ?? false}
        error={diffModal?.error}
        sourceLabel={diffModal?.sourceLabel}
        staged={diffModal?.staged}
      />
    </div>
  )
}
