package terminal

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"sync"
	"time"

	"github.com/creack/pty"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	flushInterval = 8 * time.Millisecond // max wait before emitting buffered output
	flushSize     = 4096                  // flush early when buffer reaches this size
	readBufSize   = 8192                  // PTY read buffer size
)

// PTYProcess wraps a single PTY-backed shell process and streams output via Wails events.
type PTYProcess struct {
	ID     string
	ptmx   *os.File
	cmd    *exec.Cmd
	ctx    context.Context // Wails app context for event emission
	cancel context.CancelFunc
	mu     sync.Mutex
	closed bool
}

// Spawn creates a new PTY process running the given shell in cwd.
// Output is streamed as Wails events: "pty:output:<id>" and "pty:exit:<id>".
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

// readLoop reads PTY output and emits buffered Wails events.
// Batches output with an 8ms timer + 4KB size threshold to balance latency and throughput.
func (p *PTYProcess) readLoop() {
	rawBuf := make([]byte, readBufSize)
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

	// Offload blocking PTY reads to a separate goroutine to avoid blocking the select.
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
				return // EOF or closed fd
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
				wailsRuntime.EventsEmit(p.ctx, "pty:exit:"+p.ID, p.exitCode())
				return
			}
			accum = append(accum, data...)
			if len(accum) >= flushSize {
				flush()
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
func (p *PTYProcess) Write(data []byte) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.closed {
		return fmt.Errorf("pty %s is closed", p.ID)
	}
	_, err := p.ptmx.Write(data)
	return err
}

// Resize updates the PTY window dimensions.
func (p *PTYProcess) Resize(cols, rows uint16) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.closed {
		return nil
	}
	return pty.Setsize(p.ptmx, &pty.Winsize{
		Cols: cols,
		Rows: rows,
	})
}

// Close terminates the PTY process gracefully (SIGINT, then SIGKILL after 3s).
func (p *PTYProcess) Close() error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.closed {
		return nil
	}
	p.closed = true
	p.cancel()

	if p.cmd.Process != nil {
		_ = p.cmd.Process.Signal(os.Interrupt)
		done := make(chan error, 1)
		go func() { done <- p.cmd.Wait() }()
		select {
		case <-done:
		case <-time.After(3 * time.Second):
			_ = p.cmd.Process.Kill()
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
