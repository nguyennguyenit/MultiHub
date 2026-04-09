import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { EventsOn, EventsOff } from '../../../wailsjs/runtime/runtime'
import { PtyWrite, PtyResize } from '../../../wailsjs/go/main/App'
import '@xterm/xterm/css/xterm.css'

interface PtyTerminalProps {
  terminalId: string
  onExit?: (code: number) => void
}

export function PtyTerminal({ terminalId, onExit }: PtyTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      allowProposedApi: true,
      fontFamily: 'JetBrains Mono, Fira Code, Cascadia Code, ui-monospace, monospace',
      fontSize: 13,
      lineHeight: 1.2,
      letterSpacing: 0,
      scrollback: 10000,
      theme: {
        background:    '#0d1117',
        foreground:    '#e6edf3',
        cursor:        '#58a6ff',
        cursorAccent:  '#0d1117',
        selectionBackground: 'rgba(88, 166, 255, 0.2)',
        black:   '#484f58', brightBlack:   '#6e7681',
        red:     '#ff7b72', brightRed:     '#ffa198',
        green:   '#3fb950', brightGreen:   '#56d364',
        yellow:  '#d29922', brightYellow:  '#e3b341',
        blue:    '#58a6ff', brightBlue:    '#79c0ff',
        magenta: '#bc8cff', brightMagenta: '#d2a8ff',
        cyan:    '#39c5cf', brightCyan:    '#56d4dd',
        white:   '#b1bac4', brightWhite:   '#f0f6fc',
      },
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.loadAddon(new WebLinksAddon())
    term.open(containerRef.current)
    fitAddon.fit()

    termRef.current = term
    fitAddonRef.current = fitAddon

    // Forward keyboard input to Go backend
    term.onData((data) => {
      PtyWrite(terminalId, data).catch(console.error)
    })

    // Receive PTY output from Go backend
    const outputEvent = `pty:output:${terminalId}`
    EventsOn(outputEvent, (data: string) => {
      term.write(data)
    })

    // Handle process exit
    const exitEvent = `pty:exit:${terminalId}`
    EventsOn(exitEvent, (code: number) => {
      term.write(`\r\n\x1b[90m[Process exited with code ${code}]\x1b[0m\r\n`)
      onExit?.(code)
    })

    // Sync resize to PTY
    const ro = new ResizeObserver(() => {
      fitAddon.fit()
      PtyResize(terminalId, term.cols, term.rows).catch(console.error)
    })
    ro.observe(containerRef.current)

    return () => {
      EventsOff(outputEvent)
      EventsOff(exitEvent)
      ro.disconnect()
      term.dispose()
    }
  }, [terminalId])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    />
  )
}
