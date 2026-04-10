import { TEST_IDS } from '@shared/constants'
import type { GitBranch, GitStatus } from '@shared/types'
import { GitHubActionBar } from './github-action-bar'
import { RepoInfoHeader } from './repo-info-header'

interface GitHubPanelSummaryProps {
  projectPath: string
  gitStatus: GitStatus | null
  branches: GitBranch[]
  currentBranch: string | undefined
  stagedCount: number
  unstagedCount: number
  isLoading: boolean
  syncing: boolean
  aheadBy: number
  behindBy: number
  onCheckoutBranch: (name: string) => Promise<void>
  onCreateBranch: (name: string) => Promise<void>
  onFetch: () => Promise<void>
  onPull: () => Promise<void>
  onPush: () => Promise<void>
}

export function GitHubPanelSummary({
  projectPath,
  gitStatus,
  branches,
  currentBranch,
  stagedCount,
  unstagedCount,
  isLoading,
  syncing,
  aheadBy,
  behindBy,
  onCheckoutBranch,
  onCreateBranch,
  onFetch,
  onPull,
  onPush,
}: GitHubPanelSummaryProps) {
  const repoName = deriveRepoName(projectPath, gitStatus?.remoteUrl)
  const repoHint = deriveRepoHint(projectPath, gitStatus?.remoteUrl)
  const repoUrl = deriveRepoUrl(gitStatus?.remoteUrl)
  const changesCount = stagedCount + unstagedCount + (gitStatus?.untracked ?? 0)

  return (
    <div className="github-panel-summary" data-testid={TEST_IDS.panel.githubSummary}>
      <RepoInfoHeader
        repoName={repoName}
        repoHint={repoHint}
        currentBranch={currentBranch}
        repoUrl={repoUrl}
        changesCount={changesCount}
        stagedCount={stagedCount}
        unstagedCount={unstagedCount}
        hasRemote={gitStatus?.hasRemote ?? false}
        aheadBy={aheadBy}
        behindBy={behindBy}
        branches={branches}
        onCheckoutBranch={onCheckoutBranch}
        onCreateBranch={onCreateBranch}
        isLoading={isLoading}
      />
      <GitHubActionBar hasRemote={gitStatus?.hasRemote ?? false} syncing={syncing} onFetch={onFetch} onPull={onPull} onPush={onPush} />
    </div>
  )
}

function deriveRepoName(projectPath: string, remoteUrl?: string) {
  const remoteLabel = remoteUrl?.match(/github\.com[:/](.+?)(?:\.git)?$/)?.[1]
  if (remoteLabel) return remoteLabel
  return projectPath.split(/[/\\]/).pop() || 'Repository'
}

function deriveRepoHint(projectPath: string, remoteUrl?: string) {
  if (remoteUrl) {
    return remoteUrl.replace(/\.git$/, '')
  }
  return projectPath
}

function deriveRepoUrl(remoteUrl?: string) {
  if (!remoteUrl) return undefined
  const ssh = remoteUrl.match(/git@github\.com[:/](.+?)(?:\.git)?$/)
  if (ssh) return `https://github.com/${ssh[1]}`
  const https = remoteUrl.match(/(https?:\/\/github\.com\/.+?)(?:\.git)?$/)
  if (https) return https[1]
  return undefined
}
