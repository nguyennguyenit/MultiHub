import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { EventsOn, EventsOff } from '../../../wailsjs/runtime/runtime'
import { PtyCreate, PtyWrite, PtyResize, PtyLatencyTest, PtyDestroy } from '../../../wailsjs/go/main/App'
import '@xterm/xterm/css/xterm.css'

interface LatencyResult {
  samples: number[]
  p50: number
  p99: number
  min: number
  max: number
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

function computeStats(samples: number[]): LatencyResult | null {
  if (samples.length === 0) return null
  const sorted = [...samples].sort((a, b) => a - b)
  return {
    samples: sorted,
    p50: percentile(sorted, 50),
    p99: percentile(sorted, 99),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  }
}

const HARNESS_ID = 'latency-test-pty'

export function LatencyHarness() {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const [results, setResults] = useState<LatencyResult | null>(null)
  const [running, setRunning] = useState(false)
  const samplesRef = useRef<number[]>([])
  // Maps marker key -> client-side send timestamp (ms)
  const pendingRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    const term = new Terminal({
      fontFamily: 'monospace',
      fontSize: 12,
      theme: { background: '#0d1117', foreground: '#e6edf3' },
      scrollback: 5000,
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()
    termRef.current = term

    term.onData((data) => PtyWrite(HARNESS_ID, data).catch(console.error))

    const outputEvent = `pty:output:${HARNESS_ID}`
    const exitEvent = `pty:exit:${HARNESS_ID}`

    EventsOn(outputEvent, (data: string) => {
      term.write(data)
      // Match latency markers: __latency_<key>__
      const match = data.match(/__latency_(\d+)__/)
      if (match) {
        const key = match[1]
        const sentAt = pendingRef.current.get(key)
        if (sentAt !== undefined) {
          const rtt = Date.now() - sentAt
          samplesRef.current.push(rtt)
          pendingRef.current.delete(key)
        }
      }
    })

    EventsOn(exitEvent, (code: number) => {
      term.write(`\r\n\x1b[90m[Process exited: ${code}]\x1b[0m\r\n`)
    })

    const ro = new ResizeObserver(() => {
      fit.fit()
      PtyResize(HARNESS_ID, term.cols, term.rows).catch(console.error)
    })
    ro.observe(containerRef.current)

    PtyCreate(HARNESS_ID, '', '').then(() => {
      if (!cancelled) {
        term.write('\x1b[90m[Latency harness ready. Click "Run Test" to measure.]\x1b[0m\r\n')
      } else {
        // Component unmounted before PTY was ready — clean up the orphan
        PtyDestroy(HARNESS_ID).catch(console.error)
      }
    }).catch((e) => {
      if (!cancelled) term.write(`\x1b[31mError: ${e}\x1b[0m\r\n`)
    })

    return () => {
      cancelled = true
      EventsOff(outputEvent)
      EventsOff(exitEvent)
      ro.disconnect()
      term.dispose()
      PtyDestroy(HARNESS_ID).catch(console.error)
    }
  }, [])

  async function runLatencyTest(sampleCount = 50) {
    if (running) return
    setRunning(true)
    samplesRef.current = []
    pendingRef.current.clear()
    termRef.current?.write('\x1b[90m[Running latency test…]\x1b[0m\r\n')

    for (let i = 0; i < sampleCount; i++) {
      const sentAt = Date.now()
      // PtyLatencyTest returns the key embedded in the echo command
      const key = await PtyLatencyTest(HARNESS_ID).catch(() => '')
      if (key) pendingRef.current.set(key, sentAt)
      // 100ms gap between samples so echo can complete before next fire
      await new Promise((r) => setTimeout(r, 100))
    }

    // Allow last echoes to arrive
    await new Promise((r) => setTimeout(r, 500))

    const stats = computeStats(samplesRef.current)
    setResults(stats)
    setRunning(false)

    if (!stats) {
      termRef.current?.write('\x1b[31m[No samples recorded — check shell echo support]\x1b[0m\r\n')
      return
    }

    const pass = stats.p99 < 50
    termRef.current?.write(
      `\r\n\x1b[${pass ? '32' : '31'}m` +
      `[Latency: p50=${stats.p50}ms p99=${stats.p99}ms ` +
      `min=${stats.min}ms max=${stats.max}ms — ${pass ? 'PASS ✓' : 'FAIL ✗'}]` +
      `\x1b[0m\r\n`
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center',
        padding: '4px 8px', flexShrink: 0,
        background: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border-default)',
      }}>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
          PTY Latency Harness
        </span>
        <button
          onClick={() => runLatencyTest(50)}
          disabled={running}
          style={{
            padding: '2px 10px',
            background: running ? 'var(--color-bg-hover)' : 'var(--color-accent-primary)',
            color: 'var(--color-text-primary)',
            border: 'none', borderRadius: 4,
            cursor: running ? 'not-allowed' : 'pointer',
            fontSize: 12,
          }}
        >
          {running ? 'Running…' : 'Run Test (50 samples)'}
        </button>
        {results && (
          <span style={{
            fontSize: 11, fontFamily: 'monospace',
            color: results.p99 < 50 ? 'var(--color-success)' : 'var(--color-danger)',
          }}>
            p50={results.p50}ms · p99={results.p99}ms · min={results.min}ms · max={results.max}ms
            {' '}{results.p99 < 50 ? '✓ PASS' : '✗ FAIL'}
          </span>
        )}
      </div>
      <div ref={containerRef} style={{ flex: 1, overflow: 'hidden' }} />
    </div>
  )
}
