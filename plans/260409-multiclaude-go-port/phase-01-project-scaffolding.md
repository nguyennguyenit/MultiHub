---
phase: "01"
title: "Project Scaffolding"
status: completed
effort: 4h
risk: Low
depends_on: []
---

# Phase 01: Project Scaffolding

**Priority:** P1 -- Foundation for all other phases
**Status:** Completed

## Context Links
- [Stack Research](/research-desktop-terminal-stack.md)
- [Wails v2 Docs](https://wails.io/docs/introduction)

## Overview

Initialize Wails v2 project, Go module, directory structure, and build tooling. Establishes the skeleton that all subsequent phases build on.

## Key Insights

- Wails CLI generates project scaffold: `wails init -n multihub -t react-ts`
- Go module path: `github.com/<org>/multihub`
- Frontend uses Vite (same as source Electron project), enabling direct config reuse
- Wails embeds frontend assets into Go binary at build time via `embed` directive

## Requirements

### Functional
- Wails v2 project compiles and launches empty window
- Go backend exposes at least one binding callable from frontend
- Frontend renders React 19 + Tailwind CSS inside WebView
- Hot reload works in dev mode (`wails dev`)

### Non-Functional
- Binary size < 30MB (without frontend assets)
- Dev startup time < 5s
- macOS, Linux, Windows build targets configured

## Architecture

```
multihub/
├── go.mod
├── go.sum
├── main.go                       # Wails app entry point
├── wails.json                    # Wails build config
├── build/                        # Platform build assets (icons, Info.plist)
│   └── appicon.png
├── internal/                     # Go backend packages (unexported)
│   ├── terminal/                 # Phase 03
│   │   ├── manager.go
│   │   └── pty_process.go
│   ├── project/                  # Phase 05
│   │   └── store.go
│   ├── git/                      # Phase 06
│   │   ├── manager.go
│   │   └── head_watcher.go
│   ├── notification/             # Phase 07
│   │   ├── manager.go
│   │   ├── telegram.go
│   │   └── discord.go
│   ├── settings/                 # Phase 08
│   │   └── store.go
│   ├── github/                   # Phase 09
│   │   └── client.go
│   ├── updater/                  # Phase 10
│   │   └── checker.go
│   └── platform/                 # Cross-platform helpers
│       ├── notify_darwin.go
│       ├── notify_linux.go
│       └── notify_windows.go
├── pkg/                          # Shared types (exported)
│   └── types/
│       ├── terminal.go
│       ├── project.go
│       ├── git.go
│       ├── notification.go
│       └── settings.go
├── app.go                        # Wails App struct with bound methods
└── frontend/                     # React + TypeScript + Tailwind
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── components/           # Ported from source renderer/components
    │   ├── hooks/                # Ported from source renderer/hooks
    │   ├── stores/               # Ported from source renderer/stores
    │   ├── utils/                # Ported from source renderer/utils
    │   └── styles/
    │       └── globals.css
    └── wailsjs/                  # Auto-generated Wails bindings (DO NOT EDIT)
        ├── go/
        │   └── main/
        │       └── App.js        # Auto-gen from app.go methods
        └── runtime/
            └── runtime.js        # Wails runtime (EventsOn, etc.)
```

## Go Type Definitions (Core)

These types form the contract between Go backend and TypeScript frontend.

```go
// pkg/types/terminal.go
package types

import "time"

type AgentType string

const (
	AgentClaude  AgentType = "claude"
	AgentCodex   AgentType = "codex"
	AgentGemini  AgentType = "gemini"
	AgentAider   AgentType = "aider"
	AgentGeneric AgentType = "generic"
)

type Terminal struct {
	ID               string    `json:"id"`
	Title            string    `json:"title"`
	Cwd              string    `json:"cwd"`
	IsClaudeMode     bool      `json:"isClaudeMode"`
	ClaudeSessionID  string    `json:"claudeSessionId,omitempty"`
	ProjectID        string    `json:"projectId,omitempty"`
	CreatedAt        time.Time `json:"createdAt"`
	AllowTitleUpdate bool      `json:"allowTitleUpdate"`
	AgentType        AgentType `json:"agentType,omitempty"`
}

type TerminalSession struct {
	ID              string `json:"id"`
	Title           string `json:"title"`
	Cwd             string `json:"cwd"`
	ProjectID       string `json:"projectId,omitempty"`
	ClaudeSessionID string `json:"claudeSessionId,omitempty"`
	OutputBuffer    string `json:"outputBuffer"`
	LastOutputAt    int64  `json:"lastOutputAt,omitempty"`
	ExitedAt        int64  `json:"exitedAt,omitempty"`
}
```

```go
// pkg/types/project.go
package types

import "time"

type Project struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Path         string    `json:"path"`
	GitRemote    string    `json:"gitRemote,omitempty"`
	SkipGitSetup bool      `json:"skipGitSetup,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}
```

## Related Code Files

**Create:**
- `main.go` -- Wails entry point
- `app.go` -- App struct with placeholder bindings
- `wails.json` -- Build configuration
- `go.mod` / `go.sum`
- `pkg/types/*.go` -- All type definitions
- `internal/` -- Package stubs (empty files with package declarations)
- `frontend/` -- React + Tailwind scaffold (via Wails init, then customize)

**Reuse from source:**
- `frontend/src/styles/globals.css` -- Copy CSS variables and theme definitions
- Font imports from `src/renderer/main.tsx`

## Implementation Steps

1. Install Wails CLI: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
2. Verify: `wails doctor` (checks all dependencies)
3. Init project: `wails init -n multihub -t react-ts`
4. Move generated files into project root (or init in a temp dir and copy)
5. Update `go.mod` module path to `github.com/<org>/multihub`
6. Add Go dependencies:
   ```
   go get github.com/creack/pty
   go get github.com/go-git/go-git/v6
   go get github.com/zalando/go-keyring
   ```
7. Create `internal/` package structure with stub files
8. Create `pkg/types/` with all Go struct definitions
9. Create `app.go` with minimal App struct:
   ```go
   package main

   import "context"

   type App struct {
       ctx context.Context
   }

   func NewApp() *App {
       return &App{}
   }

   func (a *App) startup(ctx context.Context) {
       a.ctx = ctx
   }

   // Greet returns a greeting -- placeholder binding
   func (a *App) Greet(name string) string {
       return "Hello " + name + " from MultiHub!"
   }
   ```
10. Update `main.go`:
    ```go
    package main

    import (
        "embed"
        "github.com/wailsapp/wails/v2"
        "github.com/wailsapp/wails/v2/pkg/options"
        "github.com/wailsapp/wails/v2/pkg/options/assetserver"
    )

    //go:embed all:frontend/dist
    var assets embed.FS

    func main() {
        app := NewApp()
        err := wails.Run(&options.App{
            Title:     "MultiHub",
            Width:     1400,
            Height:    900,
            MinWidth:  800,
            MinHeight: 600,
            AssetServer: &assetserver.Options{
                Assets: assets,
            },
            OnStartup: app.startup,
            Bind: []interface{}{
                app,
            },
        })
        if err != nil {
            panic(err)
        }
    }
    ```
11. Install frontend deps: `cd frontend && npm install`
12. Add Tailwind CSS to frontend (if not in template):
    ```
    npm install -D tailwindcss @tailwindcss/vite
    ```
13. Configure `tailwind.config.js` with MultiHub theme tokens
14. Copy `globals.css` theme variables from source
15. Verify: `wails dev` launches window with React app
16. Verify: `wails build` produces single binary

## Todo List

- [x] Install Wails CLI and verify with `wails doctor`
- [x] Initialize Wails project with react-ts template
- [x] Set up Go module and add dependencies
- [x] Create `internal/` package structure with stubs
- [x] Create `pkg/types/` with all type definitions
- [x] Create `app.go` with placeholder binding
- [x] Configure `main.go` entry point
- [x] Set up Tailwind CSS in frontend
- [x] Copy theme CSS variables from source
- [x] Verify `wails dev` launches successfully
- [x] Verify `wails build` produces binary
- [x] Add `.gitignore` for Go + Node artifacts

## Success Criteria

1. `wails dev` starts and shows React app in native window
2. Frontend can call `window.go.main.App.Greet("test")` and receive response
3. `wails build` produces single binary under 30MB
4. All type definitions in `pkg/types/` compile without errors
5. Directory structure matches architecture diagram above

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Wails CLI install fails | Low | High | Use `go install` fallback; check Go version >= 1.21 |
| WebView not available on Linux | Low | Med | `wails doctor` detects; install `libwebkit2gtk-4.1-dev` |
| Template React version mismatch | Low | Low | Override in package.json; Wails templates update frequently |

## Rollback

Delete generated project. No external state modified.
