interface GitHubActionBarProps {
  hasRemote: boolean
  syncing: boolean
  onFetch: () => Promise<void> | void
  onPull: () => Promise<void> | void
  onPush: () => Promise<void> | void
}

export function GitHubActionBar({
  hasRemote,
  syncing,
  onFetch,
  onPull,
  onPush,
}: GitHubActionBarProps) {
  return (
    <div className="github-panel-summary-card github-panel-summary-card--actions">
      <div className="github-panel-inline-copy">
        <span className="github-panel-card-title">Sync Actions</span>
        <span className="github-panel-card-subtitle">
          {hasRemote ? 'Keep local state aligned with the remote without leaving the panel.' : 'This repository has no remote configured yet.'}
        </span>
      </div>

      {hasRemote ? (
        <div className="github-panel-action-row">
          <ActionButton label="Fetch" onClick={onFetch} disabled={syncing} />
          <ActionButton label="Pull" onClick={onPull} disabled={syncing} />
          <ActionButton label={syncing ? 'Syncing…' : 'Push'} onClick={onPush} disabled={syncing} primary />
        </div>
      ) : (
        <div className="github-panel-inline-note">Add a remote to enable fetch, pull, and push from this workspace.</div>
      )}
    </div>
  )
}

function ActionButton({
  label,
  onClick,
  disabled,
  primary = false,
}: {
  label: string
  onClick: () => Promise<void> | void
  disabled?: boolean
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={disabled}
      className={`github-panel-action-button ${primary ? 'is-primary' : ''}`}
    >
      {label}
    </button>
  )
}
