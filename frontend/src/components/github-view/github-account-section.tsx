import { api } from '../../api'
import { useEffect, useRef, useState } from 'react'
import type { GitConfig, GitHubAuth } from '@shared/types'
import { GitHubAuthSummaryCard } from './github-auth-summary-card'
import { GitIdentityCard } from './git-identity-card'

interface GitHubAccountSectionProps {
  currentBranch: string | undefined
  hasRemote: boolean
}

interface LoginResult {
  success: boolean
  deviceCode?: string
  verificationUri?: string
  error?: string
}

export function GitHubAccountSection({ currentBranch, hasRemote }: GitHubAccountSectionProps) {
  const [auth, setAuth] = useState<GitHubAuth | null>(null)
  const [config, setConfig] = useState<GitConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [deviceCode, setDeviceCode] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const pollRef = useRef<number | null>(null)

  const clearPoll = () => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const fetchAll = async () => {
    const [authRes, configRes] = await Promise.all([
      api.github.authStatus(),
      api.git.configGet(),
    ])
    setAuth(authRes)
    setConfig(configRes)
  }

  useEffect(() => {
    setLoading(true)
    fetchAll()
      .catch(() => {})
      .finally(() => setLoading(false))

    return () => {
      clearPoll()
    }
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchAll()
    } finally {
      setRefreshing(false)
    }
  }

  const handleLogin = async () => {
    let startedPolling = false
    setLoggingIn(true)
    setDeviceCode(null)
    setLoginError(null)

    try {
      const result = await api.github.login() as unknown as LoginResult
      if (!result.success) {
        setLoginError(result.error || 'Login failed')
        return
      }

      if (result.verificationUri) {
        await api.app.openExternal(result.verificationUri)
      }

      if (result.deviceCode) {
        setDeviceCode(result.deviceCode)
        startedPolling = true
        clearPoll()
        pollRef.current = window.setInterval(async () => {
          const authRes = await api.github.authStatus()
          if (authRes.isAuthenticated) {
            clearPoll()
            setDeviceCode(null)
            setLoggingIn(false)
            await fetchAll().catch(() => {})
          }
        }, 3_000)
        return
      }

      await fetchAll()
    } catch {
      setLoginError('Login failed')
    } finally {
      if (!startedPolling) {
        setLoggingIn(false)
      }
    }
  }

  const handleLogout = async () => {
    clearPoll()
    await api.github.logout()
    setDeviceCode(null)
    setLoggingIn(false)
    await fetchAll().catch(() => {})
  }

  const handleSaveIdentity = async (userName: string, userEmail: string) => {
    await api.git.configSet({ userName, userEmail })
    const nextConfig = await api.git.configGet()
    setConfig(nextConfig)
  }

  return (
    <div className="github-panel-account-grid">
      <GitHubAuthSummaryCard
        auth={auth}
        currentBranch={currentBranch}
        deviceCode={deviceCode}
        hasRemote={hasRemote}
        isLoading={loading}
        isLoggingIn={loggingIn}
        isRefreshing={refreshing}
        loginError={loginError}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onRefresh={handleRefresh}
      />
      <GitIdentityCard config={config} isLoading={loading} onSave={handleSaveIdentity} />
    </div>
  )
}
