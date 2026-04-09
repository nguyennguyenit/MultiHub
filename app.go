package main

import (
	"context"
	"fmt"
	"time"

	"github.com/multihub/multihub/internal/terminal"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App is the Wails application struct. All exported methods are auto-bound to the frontend.
type App struct {
	ctx      context.Context
	terminal *terminal.Manager
}

// NewApp creates a new App instance.
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved for runtime calls.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.terminal = terminal.NewManager(ctx)
}

// shutdown is called when the app is closing.
func (a *App) shutdown(_ context.Context) {
	if a.terminal != nil {
		a.terminal.DestroyAll()
	}
}

// Greet returns a greeting -- placeholder binding for Phase 01 verification.
func (a *App) Greet(name string) string {
	return "Hello " + name + " from MultiHub!"
}

// ── PTY bindings ──────────────────────────────────────────────────────────────

// PtyCreate spawns a new PTY shell process.
// shell may be empty (uses $SHELL or /bin/bash).
// cwd may be empty (uses current working directory).
func (a *App) PtyCreate(id, shell, cwd string) error {
	return a.terminal.Spawn(id, shell, cwd)
}

// PtyWrite sends keyboard input to the PTY identified by id.
func (a *App) PtyWrite(id, data string) error {
	return a.terminal.Write(id, []byte(data))
}

// PtyResize updates the PTY window dimensions.
func (a *App) PtyResize(id string, cols, rows int) error {
	return a.terminal.Resize(id, uint16(cols), uint16(rows))
}

// PtyDestroy closes and removes the PTY process identified by id.
func (a *App) PtyDestroy(id string) error {
	return a.terminal.Destroy(id)
}

// PtyLatencyTest writes an echo marker to the PTY and returns the marker key.
// The frontend listens for the marker in PTY output and measures render time.
func (a *App) PtyLatencyTest(id string) string {
	key := fmt.Sprintf("%d", time.Now().UnixNano()%1_000_000)
	cmd := fmt.Sprintf("echo '__latency_%s__'\n", key)
	_ = a.terminal.Write(id, []byte(cmd))
	return key
}

// PtyActiveCount returns the number of currently active PTY processes.
func (a *App) PtyActiveCount() int {
	return a.terminal.Count()
}

// ── Window controls ───────────────────────────────────────────────────────────

// WindowMinimize minimizes the application window.
func (a *App) WindowMinimize() {
	wailsRuntime.WindowMinimise(a.ctx)
}

// WindowMaximize toggles maximize state.
func (a *App) WindowMaximize() {
	wailsRuntime.WindowToggleMaximise(a.ctx)
}

// WindowClose closes the application.
func (a *App) WindowClose() {
	wailsRuntime.Quit(a.ctx)
}
