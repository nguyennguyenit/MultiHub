# MultiHub Code Standards

## Go Code Standards

### File Organization

- **Naming:** snake_case for file names (e.g., `pty_process.go`, `head_watcher.go`)
- **Package structure:** Logical grouping by concern within `internal/`
  - `internal/terminal/` → PTY lifecycle
  - `internal/git/` → Git operations
  - `internal/project/` → Project/workspace management
  - `internal/notification/` → Multi-channel notifications
  - `pkg/types/` → Shared types across modules

### Code Style

- **Formatting:** Use `gofmt` before commit (enforced by CI/CD)
- **Naming conventions:**
  - Exported functions: PascalCase (`Spawn`, `Write`, `Close`)
  - Unexported functions: camelCase (`readLoop`, `defaultShell`, `exitCode`)
  - Constants: UPPER_SNAKE_CASE only for package-level constants (`flushInterval`, `flushSize`)
  - Receivers: Use pointer receivers for mutability, single-letter names acceptable (`p *PTYProcess`, `m *Manager`)

- **Line length:** Prefer ≤100 characters; exceptions for long strings or package paths
- **Comments:**
  - Package-level doc strings for all packages
  - Exported function doc strings required (e.g., `// Spawn creates a new PTY process...`)
  - Unexported function comments optional if self-documenting
  - Multi-line comments for complex logic (readLoop buffer flushing, shutdown sequence)

### Concurrency

- **Use `sync.RWMutex`** for protecting shared maps/slices
  - Always defer `Unlock()` after `Lock()`
  - Use `RLock()/RUnlock()` for read-only access

- **Goroutine patterns:**
  - Background work via `go func()` in constructors or methods
  - Always provide cancellation via context.Context
  - Use channels for signaling (close triggers cleanup)

- **Error handling:**
  - Return error as last return value: `func (m *Manager) Spawn(...) error`
  - Wrap errors with context: `fmt.Errorf("spawn %s: %w", id, err)`
  - Don't ignore errors in critical paths (shutdown cleanup can ignore)

### Example: Typical Backend Module

```go
// Package terminal manages PTY processes and terminal lifecycle.
package terminal

import (
    "context"
    "fmt"
    "sync"
)

// Manager holds all active PTY processes keyed by terminal ID.
type Manager struct {
    mu        sync.RWMutex
    processes map[string]*PTYProcess
    appCtx    context.Context
}

// NewManager creates a Manager. appCtx is the Wails application context.
func NewManager(appCtx context.Context) *Manager {
    return &Manager{
        processes: make(map[string]*PTYProcess),
        appCtx:    appCtx,
    }
}

// Spawn creates a new PTY process and registers it.
func (m *Manager) Spawn(id, shell, cwd string) error {
    // ... implementation
    return err
}

// get retrieves a PTY by ID (unexported helper).
func (m *Manager) get(id string) (*PTYProcess, error) {
    m.mu.RLock()
    defer m.mu.RUnlock()
    p, ok := m.processes[id]
    if !ok {
        return nil, fmt.Errorf("terminal %s not found", id)
    }
    return p, nil
}
```

## TypeScript/React Code Standards

### File Organization

- **Naming:** kebab-case for component and utility files
  - Components: `pty-terminal.tsx`, `latency-harness.tsx`
  - Utilities: `format-time.ts`, `event-handler.ts`
  - Styles: co-locate with component or use Tailwind classes

- **Directory structure:**
  ```
  frontend/src/
  ├── App.tsx                  # Root component
  ├── components/
  │   └── terminal/
  │       ├── pty-terminal.tsx
  │       └── latency-harness.tsx
  ├── hooks/                   # Custom React hooks (future)
  ├── utils/                   # Utility functions (future)
  ├── wailsjs/                 # Auto-generated IPC stubs (never edit)
  └── main.tsx                 # React entry point
  ```

### Code Style

- **Formatting:** Ensure `npm run build` passes without errors
  - TypeScript strict mode enabled
  - No `any` types without `// @ts-ignore` comment (with reason)

- **Naming conventions:**
  - Components: PascalCase (`PtyTerminal`, `LatencyHarness`)
  - Hooks: camelCase with `use` prefix (`useTerminal`, `useEventListener`)
  - Variables/functions: camelCase (`terminalId`, `handleResize`)
  - Constants: UPPER_SNAKE_CASE if file-level (`DEMO_ID`, `READ_BUFFER_SIZE`)

- **React patterns:**
  - Use functional components with hooks
  - Prefer `useRef` over `useState` for DOM/instance data
  - Use `useEffect` for side effects; always cleanup (return unmount function)
  - Type props interfaces: `interface PtyTerminalProps { ... }`

- **Tailwind usage:**
  - Use Tailwind v4 classes inline (no custom CSS unless unavoidable)
  - Color variables via CSS custom properties (e.g., `var(--color-bg-primary)`)
  - Responsive utilities: `md:`, `lg:` prefixes

### Example: Typical React Component

```tsx
import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { EventsOn } from '../../wailsjs/runtime/runtime'
import { PtyWrite } from '../../wailsjs/go/main/App'
import '@xterm/xterm/css/xterm.css'

interface PtyTerminalProps {
  terminalId: string
  onExit?: (code: number) => void
}

export function PtyTerminal({ terminalId, onExit }: PtyTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      fontSize: 13,
      theme: { background: '#0d1117', foreground: '#e6edf3' },
    })
    term.open(containerRef.current)
    termRef.current = term

    // Listen for output
    const handler = (data: string) => term.write(data)
    EventsOn(`pty:output:${terminalId}`, handler)

    return () => {
      EventsOff(`pty:output:${terminalId}`, handler)
      term.dispose()
    }
  }, [terminalId])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
```

## Testing Standards

### Go Tests

- **Location:** `*_test.go` files in same package
- **Naming:** `TestFunctionName` format
- **Coverage target:** ≥80% for critical paths (terminal/, project/)
- **Example:**
  ```go
  func TestManagerSpawn(t *testing.T) {
      m := NewManager(context.Background())
      err := m.Spawn("test-1", "/bin/sh", "/tmp")
      if err != nil {
          t.Fatalf("Spawn failed: %v", err)
      }
  }
  ```

### React Tests

- **Framework:** (TBD — recommend Vitest + React Testing Library)
- **Location:** `*.test.tsx` files
- **Coverage target:** ≥70% for UI components
- **Patterns:**
  - Test user interactions (keyboard input, resize)
  - Mock Wails IPC calls
  - Verify event listeners are cleaned up

## Wails IPC Bindings

### Backend (Go)

- **Exported methods on App struct** are auto-bound to IPC
- **Method signature rules:**
  - First receiver `(a *App)`, then parameters, error as last return
  - No variadic arguments
  - Supported parameter types: primitives, strings, structs, slices
  - Return `error` if operation can fail

- **Example:**
  ```go
  func (a *App) PtyCreate(id, shell, cwd string) error {
      return a.terminal.Spawn(id, shell, cwd)
  }
  ```

### Frontend (TypeScript)

- **Auto-generated stubs:** Never edit `wailsjs/` directory
- **Regenerate:** Run `wails dev` or `wails generate` after backend changes
- **Usage:**
  ```tsx
  import { PtyCreate } from '../../wailsjs/go/main/App'
  
  await PtyCreate('term-1', '/bin/bash', '/home/user')
  ```

## Security Standards

### Backend

- **Input validation:** Always validate `id` and `cwd` from IPC calls
  - Check `id` matches allowed characters (alphanumeric, `-`, `_`)
  - Check `cwd` is absolute path or relative within allowed scope
- **Process isolation:** Each PTY runs as current user (no privilege escalation)
- **Signal handling:** Never send unsafe signals; SIGINT → SIGKILL with timeout

### Frontend

- **XSS prevention:** xterm.js auto-escapes output; no direct `innerHTML` assignments
- **IPC trust:** Assume IPC responses are untrusted; validate before rendering
- **Third-party deps:** Audit `npm install` outputs before commit

## Logging & Debugging

### Go

- Use `fmt.Fprintf(os.Stderr, ...)` for debug output (will appear in app console)
- Log startup events: "PTY created", "manager initialized"
- Log errors with full context: `fmt.Errorf("write %s: %w", id, err)`

### React

- Use `console.log`, `console.error` (appears in Wails dev console)
- Log component mount/unmount: `useEffect(() => { console.log('mounted'); return () => console.log('unmounted') })`
- Debug latency: use `PtyLatencyTest()` to measure round-trip time

## Version Control

### Commit Messages

- Format: `<type>(<scope>): <message>`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- Scope: component name or module (e.g., `terminal`, `pty`, `ui`)
- Examples:
  - `feat(terminal): implement graceful PTY shutdown with timeout`
  - `fix(pty): correct buffer flush logic for edge case`
  - `docs(arch): update system architecture diagram`

### Branch Naming

- Format: `<type>/<description>` (kebab-case)
- Examples: `feat/multi-tab-ui`, `fix/pty-resize-hang`

## File Size Limits

- **Go files:** Keep <200 lines; split into sub-packages if larger
- **React components:** Keep <150 lines; extract sub-components if larger
- **No limits:** Configuration files, type definitions, Markdown docs

## Tools & CI/CD

- **Go:** `gofmt`, `go vet`, `golangci-lint` (future)
- **TypeScript:** `tsc --noEmit`, `eslint` (future)
- **Wails:** `wails build` for production binaries
- **Frontend:** `npm run build` produces optimized bundle

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-09  
**Enforced in CI/CD:** `wails build`, `npm run build`
