import { useEffect, useState } from 'react'
import type { GitConfig } from '@shared/types'
import { GitHubPanelCard } from './github-panel-card'

interface GitIdentityCardProps {
  config: GitConfig | null
  isLoading: boolean
  onSave: (userName: string, userEmail: string) => Promise<void>
}

export function GitIdentityCard({ config, isLoading, onSave }: GitIdentityCardProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(config?.userName ?? '')
    setEmail(config?.userEmail ?? '')
  }, [config])

  const handleCancel = () => {
    setName(config?.userName ?? '')
    setEmail(config?.userEmail ?? '')
    setError(null)
    setEditing(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave(name, email)
      setEditing(false)
    } catch {
      setError('Failed to save Git identity')
    } finally {
      setSaving(false)
    }
  }

  return (
    <GitHubPanelCard
      title="Git Identity"
      subtitle="Name and email used for local commits."
      action={
        !editing && !isLoading ? (
            <button type="button" className="github-panel-card-action" onClick={() => setEditing(true)}>
              Edit
            </button>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="github-panel-skeleton">Loading Git identity…</div>
      ) : editing ? (
        <div className="github-panel-form">
          <label className="github-panel-field">
            <span>Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
          </label>

          <label className="github-panel-field">
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </label>

          {error && <div className="github-panel-inline-error">{error}</div>}

          <div className="github-panel-form-actions">
            <button type="button" className="github-panel-card-action" onClick={handleCancel} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="github-panel-action-button is-primary" onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="github-panel-identity-list">
          <IdentityRow label="Author" value={config?.userName || 'No Git username configured'} />
          <IdentityRow label="Email" value={config?.userEmail || 'No Git email configured'} />
        </div>
      )}
    </GitHubPanelCard>
  )
}

function IdentityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="github-panel-identity-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
