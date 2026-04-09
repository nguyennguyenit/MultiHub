package terminal

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"sync"
	"time"

	"github.com/creack/pty"
	"github.com/multihub/multihub/pkg/types"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	flushInterval   = 8 * time.Millisecond  // max wait before emitting buffered output
	flushSize       = 4096                   // flush early when buffer reaches this size
	readBufSize     = 8192                   // PTY read buffer size
	outputBufMax    = 1024 * 1024            // 1MB hard cap per terminal
	outputBufTrim   = 512 * 1024            // trim to 500KB when cap hit
	oscBufferMax    = 2000                   // max OSC sequence buffer
	inputBufMax     = 1024                   // max keystroke input buffer
)

// PTYProcess wraps a single PTY-backed shell process and streams output via Wails events.
type PTYProcess struct {
	// Identity
	ID       string
	Metadata types.Terminal

	// PTY internals
	ptmx   *os.File
	cmd    *exec.Cmd
	ctx    context.Context
	cancel context.CancelFunc
	mu     sync.Mutex
	closed bool

	// State flags
	Destroying bool
	Suspended  bool

	// Buffers
	OutputBuffer []byte // capped at outputBufMax; trimmed when full
	InputBuffer  []byte // tracks keystrokes for agent detection
	OscBuffer    string // accumulates OSC escape sequences
	LastOutputAt int64  // unix ms of last output event
}

// newProcess creates a PTYProcess struct (without starting). Used internally by Spawn.
func newProcess(appCtx context.Context, meta types.Terminal, shell, cwd string) (*PTYProcess, error) {
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
		ID:       meta.ID,
		Metadata: meta,
		ptmx:     ptmx,
		cmd:      cmd,
		ctx:      ctx,
		cancel:   cancel,
	}
	return p, nil
}

// startReadLoop launches the output pump goroutine. Called after callbacks are set.
func (p *PTYProcess) startReadLoop(onData func(id, data string), onExit func(id string, code int)) {
	go p.readLoop(onData, onExit)
}

// readLoop reads PTY output and emits buffered Wails events.
// Batches output with an 8ms timer + 4KB size threshold to balance latency and throughput.
func (p *PTYProcess) readLoop(onData func(id, data string), onExit func(id string, code int)) {
	rawBuf := make([]byte, readBufSize)
	var accum []byte
	timer := time.NewTimer(flushInterval)
	defer timer.Stop()

	flush := func() {
		if len(accum) == 0 {
			return
		}
		data := string(accum)

		// Append to output buffer with cap enforcement.
		p.mu.Lock()
		p.OutputBuffer = append(p.OutputBuffer, accum...)
		if len(p.OutputBuffer) > outputBufMax {
			p.OutputBuffer = p.OutputBuffer[len(p.OutputBuffer)-outputBufTrim:]
		}
		p.LastOutputAt = time.Now().UnixMilli()
		p.mu.Unlock()

		// Emit Wails event + invoke callback.
		wailsRuntime.EventsEmit(p.ctx, "pty:output:"+p.ID, data)
		if onData != nil {
			onData(p.ID, data)
		}
		accum = accum[:0]
	}

	// Offload blocking PTY reads to avoid blocking the select.
	dataCh := make(chan []byte, 32)
	go func() {
		defer close(dataCh)
		for {
			n, err := p.ptmx.Read(rawBuf)
			if n > 0 {
				chunk := make([]byte, n)
				copy(chunk, rawBuf[:n])
				dataCh <- chunk
			}
			if err != nil {
				return
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
				code := p.exitCode()
				wailsRuntime.EventsEmit(p.ctx, "pty:exit:"+p.ID, code)
				if onExit != nil {
					onExit(p.ID, code)
				}
				return
			}
			accum = append(accum, data...)
			if len(accum) >= flushSize {
				flush()
				// Drain timer channel before reset to avoid spurious fire.
				if !timer.Stop() {
					select {
					case <-timer.C:
					default:
					}
				}
				timer.Reset(flushInterval)
			}
		case <-timer.C:
			flush()
			timer.Reset(flushInterval)
		}
	}
}

// Write sends raw input bytes to the PTY (keyboard input from xterm.js).
// Returns false if PTY is suspended or closed.
func (p *PTYProcess) Write(data []byte) bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.closed || p.Suspended {
		return false
	}
	_, err := p.ptmx.Write(data)
	return err == nil
}

// Resize updates the PTY window dimensions. No-ops if suspended or closed.
func (p *PTYProcess) Resize(cols, rows uint16) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.closed || p.Suspended {
		return nil
	}
	return pty.Setsize(p.ptmx, &pty.Winsize{
		Cols: cols,
		Rows: rows,
	})
}

// Snapshot returns an immutable session record for the ghost cache.
func (p *PTYProcess) Snapshot(exitedAt int64) types.TerminalSession {
	p.mu.Lock()
	defer p.mu.Unlock()
	return types.TerminalSession{
		ID:              p.ID,
		Title:           p.Metadata.Title,
		Cwd:             p.Metadata.Cwd,
		ProjectID:       p.Metadata.ProjectID,
		ClaudeSessionID: p.Metadata.ClaudeSessionID,
		OutputBuffer:    string(p.OutputBuffer),
		LastOutputAt:    p.LastOutputAt,
		ExitedAt:        exitedAt,
	}
}

// Close terminates the PTY process gracefully (SIGINT, then SIGKILL after 3s).
// The mutex is released before blocking on cmd.Wait to avoid stalling concurrent operations.
func (p *PTYProcess) Close() error {
	p.mu.Lock()
	if p.closed {
		p.mu.Unlock()
		return nil
	}
	p.closed = true
	p.Destroying = true
	proc := p.cmd.Process
	p.cancel()
	p.mu.Unlock() // release before blocking

	if proc != nil {
		_ = proc.Signal(os.Interrupt)
		done := make(chan error, 1)
		go func() { done <- p.cmd.Wait() }()
		select {
		case <-done:
		case <-time.After(3 * time.Second):
			_ = proc.Kill()
		}
	}
	return p.ptmx.Close()
}

func (p *PTYProcess) exitCode() int {
	if p.cmd.ProcessState == nil {
		return -1
	}
	return p.cmd.ProcessState.ExitCode()
}
