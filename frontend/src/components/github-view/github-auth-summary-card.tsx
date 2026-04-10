import { useState } from 'react'
import type { GitHubAuth } from '@shared/types'
import { GitHubPanelCard } from './github-panel-card'

interface GitHubAuthSummaryCardProps {
  auth: GitHubAuth | null
  currentBranch: string | undefined
  deviceCode: string | null
  hasRemote: boolean
  isLoading: boolean
  isLoggingIn: boolean
  isRefreshing: boolean
  loginError: string | null
  onLogin: () => Promise<void>
  onLogout: () => Promise<void>
  onRefresh: () => Promise<void>
}

export function GitHubAuthSummaryCard({
  auth,
  currentBranch,
  deviceCode,
  hasRemote,
  isLoading,
  isLoggingIn,
  isRefreshing,
  loginError,
  onLogin,
  onLogout,
  onRefresh,
}: GitHubAuthSummaryCardProps) {
  const [avatarError, setAvatarError] = useState(false)
  const isAuthenticated = auth?.isAuthenticated ?? false
  const username = auth?.username ?? 'Not signed in'
  const showAvatar = isAuthenticated && auth?.username && !avatarError

  return (
    <GitHubPanelCard title="GitHub Account" subtitle="Authenticate once, then keep repo collaboration within the panel.">
      {isLoading ? (
        <div className="github-panel-skeleton">Loading account status…</div>
      ) : (
        <div className="github-panel-account-card">
          <div className="github-panel-account-header">
            <div className="github-panel-account-identity">
              <div className="github-panel-avatar">
                {showAvatar ? (
                  <img
                    src={`https://github.com/${auth?.username}.png?size=72`}
                    alt={auth?.username}
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span>{isAuthenticated ? username.slice(0, 1).toUpperCase() : 'GH'}</span>
                )}
              </div>
              <div>
                <div className="github-panel-account-name">{username}</div>
                <div className={`github-panel-account-status ${isAuthenticated ? 'is-authenticated' : ''}`}>
                  {isAuthenticated ? 'Authenticated' : 'Authentication required'}
                </div>
              </div>
            </div>

            <div className="github-panel-account-actions">
              <button type="button" className="github-panel-card-action" onClick={() => void onRefresh()} disabled={isRefreshing}>
                {isRefreshing ? 'Refreshing…' : 'Refresh'}
              </button>
              {isAuthenticated ? (
                <button type="button" className="github-panel-action-button" onClick={() => void onLogout()}>
                  Logout
                </button>
              ) : (
                <button type="button" className="github-panel-action-button is-primary" onClick={() => void onLogin()} disabled={isLoggingIn}>
                  {isLoggingIn ? 'Opening…' : 'Login'}
                </button>
              )}
            </div>
          </div>

          <div className="github-panel-pill-row">
            {currentBranch && <span className="github-panel-pill github-panel-pill--accent">{currentBranch}</span>}
            <span className={`github-panel-pill ${hasRemote ? 'github-panel-pill--positive' : 'github-panel-pill--neutral'}`}>
              {hasRemote ? 'Remote linked' : 'No remote'}
            </span>
          </div>

          {deviceCode && (
            <div className="github-panel-device-code">
              <span className="github-panel-device-code-label">Enter this device code in your browser</span>
              <strong>{deviceCode}</strong>
            </div>
          )}

          {loginError && <div className="github-panel-inline-error">{loginError}</div>}
        </div>
      )}
    </GitHubPanelCard>
  )
}
