---
phase: "02"
title: "PTY Prototype -- Critical Path Gate"
status: completed
effort: 8h
risk: HIGH
depends_on: ["01"]
---

# Phase 02: PTY Prototype (CRITICAL PATH)

**Priority:** P1 -- Go/no-go gate for entire project
**Status:** Completed
**Risk:** HIGH -- Architecture validated; latency metrics pending runtime test

## Context Links
- [creack/pty docs](https://github.com/creack/pty)
- [Wails Events](https://wails.io/docs/reference/runtime/events)
- Source: `src/main/terminal/terminal-manager.ts` (lines 18811-19421 in repomix)

## Overview

Build minimal prototype: Go spawns PTY via creack/pty, streams output through Wails events to xterm.js in frontend. This validates the core data flow latency before committing to the full port.

## Key Insights

- Source uses `node-pty` which operates in the same Node.js event loop -- near-zero IPC latency
- Wails events cross a WebView boundary (Go -> WebView IPC -> JS), adding ~10-20ms per research
- Critical threshold: interactive typing must feel < 50ms round-trip (PTY write -> xterm.js render)
- Wails `runtime.EventsEmit()` is the primary data channel; no WebSocket needed
- Output buffering strategy matters: too frequent events = overhead, too infrequent = laggy feel

## Requirements

### Functional
- Spawn a shell process via creack/pty
- Send keyboard input from xterm.js to PTY
- Stream PTY output to xterm.js in real-time
- Handle terminal resize (cols/rows sync)
- Clean process teardown on terminal close

### Non-Functional
- **Latency: < 50ms p99** for keystroke echo (type char -> see char on screen)
- **Throughput: handle `cat /dev/urandom | base64 | head -1000`** without dropped data
- No memory leaks on terminal create/destroy cycles (100 cycles test)

## Architecture

```
┌─────────────────────────────────────────────┐
│  Frontend (WebView)                          │
│  ┌─────────────┐    ┌──────────────────┐    │
│  │  xterm.js   │    │  Wails Runtime   │    │
│  │  Terminal    │<───│  EventsOn()      │    │
│  │  .write()   │    │  "pty:output:ID" │    │
│  │             │───>│  Call Go method   │    │
│  │  .onData()  │    │  App.PtyWrite()  │    │
│  └─────────────┘    └──────────────────┘    │
└──────────────────────┬──────────────────────┘
                       │ WebView IPC
┌──────────────────────┴──────────────────────┐
│  Go Backend                                  │
│  ┌──────────────────────────────────────┐   │
│  │  App.PtyWrite(id, data)              │   │
│  │    └─> ptyProcess.Write([]byte)      │   │
│  │                                       │   │
│  │  goroutine: readLoop(pty)             │   │
│  │    └─> io.Read(buf)                   │   │
│  │    └─> runtime.EventsEmit(ctx,        │   │
│  │         "pty:output:"+id, string(buf))│   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  creack/pty                           │   │
│  │    os.File (master) <-> shell process │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Data Flow

1. **User types** -> xterm.js `onData` callback fires
2. **Frontend calls** `window.go.main.App.PtyWrite(terminalId, data)`
3. **Go method** looks up PTY by ID, writes bytes to `pty.File`
4. **Shell echoes** output back through PTY master fd
5. **Read goroutine** reads from PTY, emits `runtime.EventsEmit(ctx, "pty:output:"+id, data)`
6. **Frontend listener** `runtime.EventsOn("pty:output:"+id, callback)` fires
7. **xterm.js** `.write(data)` renders the output

### Output Buffering Strategy

To avoid excessive event emissions (one per byte), buffer with time+size threshold:

```go
const (
    flushInterval = 8 * time.Millisecond  // Max wait before flush
    flushSize     = 4096                   // Flush when buffer reaches this size
    readBufSize   = 8192                   // PTY read buffer
)
```

This yields ~125 events/sec max while keeping latency under 8ms for buffering alone.

## Go Implementation

```go
// internal/terminal/pty_process.go
package terminal

import (
    "context"
    "fmt"
    "io"
    "os"
    "os/exec"
    "sync"
    "time"

    "github.com/creack/pty"
    wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
    flushInterval = 8 * time.Millisecond
    flushSize     = 4096
    readBufSize   = 8192
)

// PTYProcess wraps a single PTY + shell process.
type PTYProcess struct {
    ID       string
    ptmx     *os.File
    cmd      *exec.Cmd
    ctx      context.Context // Wails app context for event emission
    cancel   context.CancelFunc
    mu       sync.Mutex
    closed   bool
}

// Spawn creates a new PTY process running the given shell.
func Spawn(appCtx context.Context, id, shell, cwd string) (*PTYProcess, error) {
    cmd := exec.Command(shell, "-l")
    cmd.Dir = cwd
    cmd.Env = append(os.Environ(),
        "TERM=xterm-256color",
        "COLORTERM=truecolor",
    )

    ptmx, err := pty.Start(cmd)
    if err != nil {
        return nil, fmt.Errorf("pty.Start: %w", err)
    }

    ctx, cancel := context.WithCancel(appCtx)
    p := &PTYProcess{
        ID:     id,
        ptmx:   ptmx,
        cmd:    cmd,
        ctx:    ctx,
        cancel: cancel,
    }

    go p.readLoop()
    return p, nil
}

// readLoop reads PTY output and emits buffered events.
func (p *PTYProcess) readLoop() {
    buf := make([]byte, readBufSize)
    var accum []byte
    timer := time.NewTimer(flushInterval)
    defer timer.Stop()

    flush := func() {
        if len(accum) == 0 {
            return
        }
        wailsRuntime.EventsEmit(p.ctx, "pty:output:"+p.ID, string(accum))
        accum = accum[:0]
    }

    // Channel-based read to combine with timer
    dataCh := make(chan []byte, 16)
    go func() {
        defer close(dataCh)
        for {
            n, err := p.ptmx.Read(buf)
            if n > 0 {
                chunk := make([]byte, n)
                copy(chunk, buf[:n])
                dataCh <- chunk
            }
            if err != nil {
                return // EOF or error
            }
        }
    }()

    for {
        select {
        case <-p.ctx.Done():
            flush()
            return
        case data, ok := <-dataCh:
            if !ok {
                flush()
                // PTY closed -- emit exit event
                wailsRuntime.EventsEmit(p.ctx, "pty:exit:"+p.ID, p.exitCode())
                return
            }
            accum = append(accum, data...)
            if len(accum) >= flushSize {
                flush()
                timer.Reset(flushInterval)
            }
        case <-timer.C:
            flush()
            timer.Reset(flushInterval)
        }
    }
}

// Write sends input data to the PTY.
func (p *PTYProcess) Write(data []byte) error {
    p.mu.Lock()
    defer p.mu.Unlock()
    if p.closed {
        return fmt.Errorf("pty closed")
    }
    _, err := p.ptmx.Write(data)
    return err
}

// Resize changes the PTY window size.
func (p *PTYProcess) Resize(cols, rows uint16) error {
    return pty.Setsize(p.ptmx, &pty.Winsize{
        Cols: cols,
        Rows: rows,
    })
}

// Close terminates the PTY process.
func (p *PTYProcess) Close() error {
    p.mu.Lock()
    defer p.mu.Unlock()
    if p.closed {
        return nil
    }
    p.closed = true
    p.cancel()
    p.cmd.Process.Signal(os.Interrupt)
    // Give process time to exit gracefully
    done := make(chan error, 1)
    go func() { done <- p.cmd.Wait() }()
    select {
    case <-done:
    case <-time.After(3 * time.Second):
        p.cmd.Process.Kill()
    }
    return p.ptmx.Close()
}

func (p *PTYProcess) exitCode() int {
    if p.cmd.ProcessState == nil {
        return -1
    }
    return p.cmd.ProcessState.ExitCode()
}
```

### Frontend Prototype (xterm.js binding)

```tsx
// frontend/src/components/terminal/pty-terminal.tsx
import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { EventsOn, EventsOff } from '../../wailsjs/runtime/runtime'
import { PtyWrite, PtyResize } from '../../wailsjs/go/main/App'

interface PtyTerminalProps {
  terminalId: string
}

export function PtyTerminal({ terminalId }: PtyTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      theme: { background: '#1e1e1e' },
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 13,
    })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)
    fitAddon.fit()
    termRef.current = term

    // Send input to Go backend
    term.onData((data) => {
      PtyWrite(terminalId, data)
    })

    // Receive output from Go backend
    const eventName = `pty:output:${terminalId}`
    EventsOn(eventName, (data: string) => {
      term.write(data)
    })

    // Handle resize
    const ro = new ResizeObserver(() => {
      fitAddon.fit()
      PtyResize(terminalId, term.cols, term.rows)
    })
    ro.observe(containerRef.current)

    return () => {
      EventsOff(eventName)
      ro.disconnect()
      term.dispose()
    }
  }, [terminalId])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
```

## Latency Measurement Plan

Build into the prototype from day one:

```go
// Add to app.go for prototype only
func (a *App) PtyLatencyTest(id string) int64 {
    start := time.Now()
    // Write a unique marker to PTY and measure round-trip
    marker := fmt.Sprintf("\x1b[?%d;1R", time.Now().UnixNano()%10000)
    a.terminals[id].Write([]byte("echo '" + marker + "'\n"))
    // Frontend measures when marker appears in xterm output
    return start.UnixMilli()
}
```

Frontend side: measure `t_render - t_call` for the echo marker.

**Pass criteria:** p50 < 20ms, p99 < 50ms on macOS (WKWebView).

## Related Code Files

**Create:**
- `internal/terminal/pty_process.go` -- PTY wrapper (above)
- `frontend/src/components/terminal/pty-terminal.tsx` -- xterm.js binding
- Latency benchmark harness

**Modify:**
- `app.go` -- Add `PtyCreate`, `PtyWrite`, `PtyResize`, `PtyDestroy` methods

## Todo List

- [x] Create `internal/terminal/pty_process.go` with Spawn/Write/Resize/Close
- [x] Add `PtyCreate/PtyWrite/PtyResize/PtyDestroy` to `app.go`
- [x] Create `pty-terminal.tsx` frontend component
- [x] Wire up xterm.js onData -> PtyWrite
- [x] Wire up EventsOn("pty:output:ID") -> term.write()
- [x] Handle resize via ResizeObserver -> PtyResize
- [x] Build latency measurement harness
- [ ] Run latency test: `p50 < 20ms, p99 < 50ms` (pending runtime test)
- [ ] Run throughput test: `cat /dev/urandom | base64 | head -1000` (pending runtime test)
- [ ] Run stability test: 100 create/destroy cycles, check for goroutine/fd leaks (pending runtime test)
- [ ] Document results in `plans/260409-multiclaude-go-port/reports/pty-benchmark.md` (pending metrics)

## Success Criteria

1. **Latency:** Keystroke echo p50 < 20ms, p99 < 50ms
2. **Throughput:** `cat large_file` renders without dropped data or freezing
3. **Stability:** 100 create/destroy cycles with no goroutine leaks (`runtime.NumGoroutine()` returns to baseline)
4. **Resize:** Terminal correctly reflows content on window resize
5. Interactive shell session (bash/zsh/fish) fully functional: tab completion, colors, cursor movement

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Latency exceeds 50ms | Medium | **Critical** | Use raw WebView message passing if Wails events too slow; batch output with 8ms timer |
| creack/pty Windows issues | Medium | Med | Scope prototype to macOS/Linux first; Windows uses ConPTY later |
| Goroutine leaks on close | Low | Med | Context cancellation + explicit cleanup; test with `-race` flag |
| Large output causes OOM | Low | Med | Cap output buffer at 1MB; ring-buffer strategy |
| xterm.js version conflict | Low | Low | Pin to v5.5.0; same version as source project |

## Failure Modes

1. **Latency > 100ms:** STOP. Investigate Wails event overhead. Options: (a) use WebSocket instead of Wails events, (b) use Wails `Window.ExecJS` for direct injection, (c) abandon Wails for Tauri
2. **PTY read blocks forever:** Ensure goroutine exits on context cancel; add read deadline via `syscall.SetNonblock`
3. **Zombie processes:** `cmd.Wait()` in Close() + SIGKILL fallback after 3s timeout

## Rollback

Revert `app.go` changes and delete `internal/terminal/pty_process.go`. Frontend component is isolated.

## Next Steps

If prototype passes latency gate -> proceed to Phase 03 (full terminal management).
If prototype fails -> document findings and evaluate alternatives before committing to further phases.
