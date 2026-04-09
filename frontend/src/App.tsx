import { useEffect, useState } from 'react'
import { PtyCreate, PtyDestroy } from '../wailsjs/go/main/App'
import { PtyTerminal } from './components/terminal/pty-terminal'
import { LatencyHarness } from './components/terminal/latency-harness'

type Tab = 'terminal' | 'latency'

const DEMO_ID = 'demo-pty-1'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('terminal')
  const [termReady, setTermReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    PtyCreate(DEMO_ID, '', '')
      .then(() => setTermReady(true))
      .catch((e) => setError(String(e)))

    return () => {
      PtyDestroy(DEMO_ID).catch(console.error)
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--color-bg-primary)' }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        gap: 1,
        background: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border-default)',
        padding: '4px 8px 0',
        flexShrink: 0,
      }}>
        {(['terminal', 'latency'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '4px 12px',
              background: activeTab === tab ? 'var(--color-bg-primary)' : 'transparent',
              color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 12,
              textTransform: 'capitalize',
            }}
          >
            {tab === 'latency' ? 'Latency Test' : 'Terminal'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'terminal' && (
          <div style={{ height: '100%' }}>
            {error && (
              <div style={{ color: 'var(--color-danger)', padding: 16, fontFamily: 'monospace' }}>
                Error: {error}
              </div>
            )}
            {termReady && (
              <PtyTerminal
                terminalId={DEMO_ID}
                onExit={(code) => console.log('PTY exited:', code)}
              />
            )}
            {!termReady && !error && (
              <div style={{ color: 'var(--color-text-secondary)', padding: 16 }}>
                Starting shell…
              </div>
            )}
          </div>
        )}
        {activeTab === 'latency' && <LatencyHarness />}
      </div>
    </div>
  )
}
