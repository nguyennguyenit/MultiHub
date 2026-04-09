# MultiHub System Architecture

## High-Level Architecture

```
User Input (Keyboard)
     ↓
React App (xterm.js)
     ↓ PtyWrite(id, data)
Wails IPC Channel
     ↓
App.PtyWrite() → Manager.Write() → PTYProcess.Write()
     ↓
PTY Master Side (ptmx file descriptor)
     ↓
Shell Process (bash/zsh)
     ↓ stdout/stderr
PTY Master Side ← readLoop() → data buffer
     ↓ (8ms timer or 4KB threshold)
wailsRuntime.EventsEmit("pty:output:{id}", output)
     ↓ Wails IPC Channel
React App (Wails event listener)
     ↓ EventsOn("pty:output:{id}")
term.write(output) → xterm.js
     ↓
Rendered Pixels
```

## Backend Architecture

### 1. Wails Application Entry Point

**File:** `main.go`

```go
func main() {
    app := NewApp()
    err := wails.Run(&options.App{
        Title: "MultiHub",
        Width: 1400, Height: 900,
        AssetServer: &assetserver.Options{Assets: assets},
        OnStartup: app.startup,
        OnShutdown: app.shutdown,
        Bind: []interface{}{app},
    })
}
```

**Key Features:**
- Window: 1400x900, minimum 800x600
- Embedded static React assets
- Startup/shutdown lifecycle hooks
- `app` struct auto-bound as IPC endpoint

### 2. App Struct & IPC Bindings

**File:** `app.go`

```go
type App struct {
    ctx context.Context           // Wails app context for IPC
    terminal *terminal.Manager    // PTY manager instance
}

// IPC Methods (exported, callable from JS)
func (a *App) PtyCreate(id, shell, cwd string) error
func (a *App) PtyWrite(id, data string) error
func (a *App) PtyResize(id string, cols, rows int) error
func (a *App) PtyDestroy(id string) error
func (a *App) PtyLatencyTest(id string) string
func (a *App) PtyActiveCount() int
```

**Lifecycle:**
- `startup()`: Initializes `terminal.Manager` with Wails context
- `shutdown()`: Calls `DestroyAll()` on all active PTY processes

### 3. Terminal Manager

**File:** `internal/terminal/manager.go`

```go
type Manager struct {
    mu sync.RWMutex                    // Guards processes map
    processes map[string]*PTYProcess   // id → PTYProcess
    appCtx context.Context             // Wails context for event emission
}
```

**Methods:**
- `Spawn(id, shell, cwd)` → creates and registers PTYProcess
- `Write(id, data)` → routes keyboard input
- `Resize(id, cols, rows)` → updates terminal dimensions
- `Destroy(id)` → gracefully closes and removes
- `DestroyAll()` → cleanup on app shutdown
- `Count()` → active process count (for monitoring)

**Concurrency:** RWMutex protects process map; safe for concurrent Spawn/Destroy/Write operations.

### 4. PTY Process Implementation

**File:** `internal/terminal/pty_process.go`

```go
type PTYProcess struct {
    ID string                    // Terminal identifier
    ptmx *os.File               // PTY master file descriptor (from creack/pty)
    cmd *exec.Cmd               // Shell process
    ctx context.Context         // Derived from appCtx, cancels readLoop
    cancel context.CancelFunc
    mu sync.Mutex               // Guards closed flag
    closed bool
}
```

**Key Parameters:**
- `flushInterval = 8ms` → max wait before emitting buffered output
- `flushSize = 4096` → flush early when buffer reaches this size
- `readBufSize = 8192` → PTY read buffer size

**Spawn() Flow:**
1. Create `exec.Cmd` with shell, cwd, and environment (`TERM=xterm-256color`)
2. Use `creack/pty.Start()` to attach PTY master to process
3. Launch `readLoop()` goroutine (non-blocking, handles I/O)
4. Return PTYProcess struct

**readLoop() Logic:**
1. Buffered reads from ptmx in separate goroutine (avoid blocking select)
2. Accumulate output in memory
3. Emit via `wailsRuntime.EventsEmit("pty:output:{id}", output)` when:
   - Timer fires (8ms)
   - Buffer reaches 4KB
   - Data channel closes (process exit)
4. Emit `pty:exit:{id}` event with exit code

**Write():** Send keyboard input to ptmx file descriptor (mutex-guarded).

**Resize():** Call `creack/pty.Setsize()` to update terminal dimensions.

**Close():** Graceful shutdown with timeout:
1. Mark as closed
2. Cancel context (stops readLoop)
3. Send SIGINT to process
4. Wait 3 seconds for graceful exit
5. Send SIGKILL if timeout
6. Close ptmx file descriptor

## Frontend Architecture

### 1. React Application Entry Point

**File:** `frontend/src/App.tsx`

```tsx
export default function App() {
    // Demo: single hardcoded PTY
    const DEMO_ID = 'demo-pty-1'
    
    useEffect(() => {
        PtyCreate(DEMO_ID, '', '')  // Spawn PTY on mount
            .then(() => setTermReady(true))
        return () => PtyDestroy(DEMO_ID)  // Cleanup on unmount
    }, [])
    
    return (
        <div>
            <TabBar activeTab={activeTab} />
            {activeTab === 'terminal' && <PtyTerminal />}
            {activeTab === 'latency' && <LatencyHarness />}
        </div>
    )
}
```

**Current UI:**
- Tab bar (Terminal | Latency Test)
- Conditional rendering by tab
- Error handling for PTY spawn failures

### 2. PtyTerminal Component

**File:** `frontend/src/components/terminal/pty-terminal.tsx`

```tsx
export function PtyTerminal({ terminalId, onExit }: PtyTerminalProps) {
    const termRef = useRef<Terminal>()
    const fitAddonRef = useRef<FitAddon>()
    
    useEffect(() => {
        // Initialize xterm.js
        const term = new Terminal({
            cursorBlink: true,
            fontFamily: 'JetBrains Mono, ...',
            fontSize: 13,
            scrollback: 10000,
            theme: { /* GitHub dark colors */ }
        })
        
        // Listen for output events
        EventsOn(`pty:output:${terminalId}`, (data: string) => {
            term.write(data)
        })
        
        // Send keyboard input
        term.onData((data) => {
            PtyWrite(terminalId, data)
        })
        
        // Handle resize
        ResizeObserver on container
            → fitAddon.fit()
            → PtyResize(terminalId, cols, rows)
    }, [terminalId])
}
```

**Dependencies:**
- `@xterm/xterm` v5.5.0 → terminal emulator
- `@xterm/addon-fit` v0.10.0 → responsive resizing
- `@xterm/addon-web-links` v0.11.0 → clickable hyperlinks

**Theme:** GitHub dark (GitHub Copilot theme colors, not OS theme).

### 3. Wails IPC Binding Generation

**File:** `frontend/src/wailsjs/` (auto-generated)

The Wails CLI generates TypeScript stubs:
```tsx
// Generated from app.go methods
export function PtyCreate(arg1: string, arg2: string, arg3: string): Promise<void>
export function PtyWrite(arg1: string, arg2: string): Promise<void>
export function PtyResize(arg1: string, arg2: number, arg3: number): Promise<void>
// etc.
```

No manual editing; regenerate after backend changes with `wails dev`.

## Data Flow Diagrams

### PTY Creation Flow

```
App.tsx useEffect
    │
    ├─ PtyCreate(id, shell, cwd)  [Wails IPC]
    │       ↓
    ├─ app.PtyCreate()  [Go]
    │       ↓
    ├─ manager.Spawn(id, shell, cwd)
    │       ↓
    ├─ terminal.Spawn() [creack/pty]
    │       ├─ exec.Command(shell)
    │       ├─ pty.Start() → ptmx fd
    │       ├─ Launch readLoop() goroutine
    │       └─ return PTYProcess
    │       ↓
    ├─ setTermReady(true)
    │       ↓
    └─ Render <PtyTerminal />
```

### Keyboard Input Flow

```
xterm.js onData(char)
    ↓
PtyWrite(id, char)  [Wails IPC]
    ↓
app.PtyWrite()  [Go]
    ↓
manager.Write(id, data)
    ↓
ptmx.Write(data)  [File I/O]
    ↓
Shell Process (reads stdin)
```

### Output Streaming Flow

```
Shell Process (stdout)
    ↓
ptmx.Read()  [File I/O]
    ↓
readLoop() accumulates bytes
    │
    ├─ Timer (8ms) OR
    ├─ Buffer (4KB) OR
    ├─ EOF
    │
    ↓
wailsRuntime.EventsEmit("pty:output:id", string)  [Wails IPC]
    ↓
React Event Listener (EventsOn)
    ↓
term.write(output)  [xterm.js]
    ↓
Rendered Terminal
```

## Concurrency & Safety

| Component | Concurrency | Safety | Notes |
|-----------|-------------|--------|-------|
| Manager | Multiple Spawn/Write/Destroy calls | RWMutex on processes map | Safe for concurrent access |
| PTYProcess | readLoop (bg goroutine) + Write | Mutex on closed flag | Write() protected, readLoop() cancellable |
| Terminal (xterm.js) | EventsOn listeners + onData | Event-driven, no shared state | React handles async event batching |

## Error Handling

**Backend (Go):**
- `Spawn()` → returns error if `pty.Start()` fails
- `Write()` → returns error if ptmx write fails or PTY is closed
- `Resize()` → silently succeeds if PTY closed (safe to call during shutdown)
- `Close()` → ignores errors, always closes ptmx

**Frontend (React):**
- `PtyCreate()` promise rejection → sets error state, displayed as toast
- `PtyWrite()` errors logged to console (terminal continues)
- `EventsOn()` errors logged (network/IPC issues bubble to console)

## Performance Characteristics

| Operation | Latency | Throughput | Notes |
|-----------|---------|-----------|-------|
| Keyboard input → shell | <5ms | N/A | Direct ptmx.Write() |
| Shell output → xterm.js | 8-16ms | 4KB/burst | 8ms timer + FitAddon |
| Resize | <1ms | N/A | Immediate pty.Setsize() |
| Binary size | N/A | 7.9MB | macOS arm64 |

## Known Architectural Constraints

1. **Single Wails context:** All PTY processes share one Wails app context for event emission
2. **Blocking readLoop in goroutine:** Prevents main thread blocking; can spawn 100+ goroutines safely
3. **Event flooding risk:** No backpressure on EventsEmit; very high output rates could overflow browser
4. **No persistence:** All PTY state in-memory; lost on app restart
5. **Platform-specific:** PTY implementation uses Unix APIs (`creack/pty`); Windows uses `winpty` (TBD)

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-09  
**Architecture Review:** Phases 01 + 02 complete
