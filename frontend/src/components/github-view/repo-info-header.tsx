import { BranchSelector } from '../git-panel/branch-selector'
import { api } from '../../api'
import type { GitBranch } from '@shared/types'

interface RepoInfoHeaderProps {
  repoName: string
  repoHint: string
  currentBranch: string | undefined
  repoUrl?: string
  changesCount: number
  stagedCount: number
  unstagedCount: number
  hasRemote: boolean
  aheadBy: number
  behindBy: number
  branches: GitBranch[]
  onCheckoutBranch: (name: string) => Promise<void>
  onCreateBranch: (name: string) => Promise<void>
  isLoading: boolean
}

export function RepoInfoHeader({
  repoName,
  repoHint,
  currentBranch,
  repoUrl,
  changesCount,
  stagedCount,
  unstagedCount,
  hasRemote,
  aheadBy,
  behindBy,
  branches,
  onCheckoutBranch,
  onCreateBranch,
  isLoading,
}: RepoInfoHeaderProps) {
  return (
    <div className="github-panel-summary-card github-panel-summary-card--header">
      <div className="github-panel-summary-meta">
        <div className="github-panel-summary-copy">
          <div className="github-panel-summary-heading">
            <span className="github-panel-summary-eyebrow">Repository</span>
            {repoUrl && (
              <button
                type="button"
                className="github-panel-summary-link"
                onClick={() => void api.app.openExternal(repoUrl)}
              >
                Open on GitHub
              </button>
            )}
          </div>
          <h2 className="github-panel-summary-title">{repoName}</h2>
          <p className="github-panel-summary-subtitle">{repoHint}</p>
        </div>

        <div className="github-panel-summary-branch">
          <BranchSelector
            currentBranch={currentBranch}
            branches={branches}
            onCheckout={onCheckoutBranch}
            onCreate={onCreateBranch}
            isLoading={isLoading}
          />
        </div>
      </div>

      <div className="github-panel-pill-row">
        <SummaryPill label={`${changesCount} change${changesCount === 1 ? '' : 's'}`} tone={changesCount > 0 ? 'warm' : 'neutral'} />
        <SummaryPill label={`${stagedCount} staged`} tone={stagedCount > 0 ? 'positive' : 'neutral'} />
        <SummaryPill label={`${unstagedCount} unstaged`} tone={unstagedCount > 0 ? 'warm' : 'neutral'} />
        {hasRemote && <SummaryPill label={`Ahead ${aheadBy}`} tone={aheadBy > 0 ? 'accent' : 'neutral'} />}
        {hasRemote && <SummaryPill label={`Behind ${behindBy}`} tone={behindBy > 0 ? 'warm' : 'neutral'} />}
        <SummaryPill label={hasRemote ? 'Remote linked' : 'Local only'} tone={hasRemote ? 'positive' : 'neutral'} />
      </div>
    </div>
  )
}

function SummaryPill({
  label,
  tone,
}: {
  label: string
  tone: 'neutral' | 'positive' | 'warm' | 'accent'
}) {
  return <span className={`github-panel-pill github-panel-pill--${tone}`}>{label}</span>
}
