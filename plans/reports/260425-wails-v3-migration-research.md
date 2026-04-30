# Wails v3 Migration Assessment — MultiHub

**Date:** 2026-04-25  
**Project:** MultiHub (Wails v2.12 → v3 evaluation)

---

## Release Status

**Wails v3 is in ALPHA** (v3.0.0-alpha.73 as of 2026-02-27). API reasonably stable; production apps running. Core APIs (app, window, events, bindings) marked stable for production. No public release timeline stated—"when ready" strategy.

**Verdict:** Not formally stable, but low-risk for new projects. Legacy app migration carries adoption risk given ongoing alpha iterations.

---

## Breaking Changes Affecting MultiHub

### 1. Bindings Architecture (HIGH IMPACT)
**v2:** Auto-bind via `Bind: []interface{}{&App{}}` scans public methods.  
**v3:** Explicit service registration + `NewService()` wrapper.

```go
// v2: Auto-bind
app.Options.Bind = []interface{}{&App{}}

// v3: Explicit service + dependency injection
app.Services = []application.Service{
  application.NewService(&App{}),
}
```

**Impact:** Must refactor `app-misc-bindings.go` + `app-project-bindings.go`. Requires wrapping each service in `NewService()`. Generated bindings path changes: `wailsjs/go/main/App` → `bindings/multihub/app`.

### 2. Runtime Context (HIGH IMPACT)
**v2:** `runtime.EventsEmit(ctx, "event", data)` + `runtime.EventsOn(ctx, "event", handler)`.  
**v3:** `app.Event.Emit("event", data)` + `app.Event.On("event", handler)` (no ctx).

```go
// v2
wailsRuntime.EventsEmit(a.ctx, "pty-output", output)

// v3
a.app.Event.Emit("pty-output", output)
```

**Impact:** All 60+ bindings using `wailsRuntime.EventsEmit` must switch to `a.app.Event.Emit`. Requires injecting `*application.App` into service struct (no longer `ctx`). Frontend changes: `runtime.EventsOn()` → `Events.On()` from `@wailsio/runtime`.

### 3. Window Lifecycle (MEDIUM IMPACT)
**v2:** Single window via `App.CreateWindow()` in startup.  
**v3:** Explicit `app.CreateWindow()` calls, decoupled from startup. Window as first-class object with methods.

```go
// v2: Implicit in Startup()
func (a *App) Startup(ctx context.Context) error {
  // window already exists
}

// v3: Explicit window creation
window, err := app.NewWebviewWindow()
if err != nil { panic(err) }
window.SetTitle("My Window")
```

**Impact:** For shell-first multi-window roadmap (project tabs, pop-outs), v3 is **better**—native multi-window API vs v2 workarounds. No migration blocker for current single-window state.

### 4. Menu API (LOW IMPACT for MultiHub)
**v2:** `runtime.MenuSetApplicationMenu(ctx, menu)`.  
**v3:** `app.SetMenu(menu)`.

**Impact:** If using app menus, lightweight refactor. MultiHub uses custom toolbar—minimal risk.

### 5. TypeScript Bindings Generation (LOW-MODERATE IMPACT)
**v2:** Auto-generates `wailsjs/go/` folder with `window.wails.` calls.  
**v3:** Generates `bindings/` with `@wailsio/runtime` imports, typed event objects, call-by-ID (faster).

```ts
// v2
import { GreetingService } from './wailsjs/go/main/GreetingService'
GreetingService.Greet("World")

// v3
import { App } from './bindings/multihub/app'
const result = await App.Greet("World")
```

**Impact:** Frontend API adapter (`frontend/src/api/index.ts`) must be rewritten. Gains type safety + better IDE support. No runtime risk.

---

## Multi-Window for Shell-First Roadmap

**Verdict: Excellent fit.** v3's native multi-window API was built for exactly this use case (Warp-style project tabs, pop-out windows, tool palettes).

**Capabilities:**
- `app.CreateWindow()` — dynamic window creation (project windows on demand).
- Window as first-class object — each window tracks state independently.
- `window.EmitEvent()` — per-window event streams (xterm.js output per tab).
- IPC between windows via shared event bus + services.

**v2 vs v3:** v2 required complex workarounds (hidden frames, JS window routing). v3 native support means simplified architecture for tab switching, window management, and per-project state isolation.

**Timing:** If shell-first is a 2-3 month roadmap, delaying migration until v3 stable (Q3? Q4?) is safer. Migrating now means living with alpha churn.

---

## Migration Effort Estimate

| Area | Effort | Notes |
|------|--------|-------|
| **Go bindings refactor** | 2-4 days | Wrap 60+ methods in `NewService()`, inject `*app`, replace `wailsRuntime.EventsEmit` calls in all binding files |
| **Runtime context injection** | 1-2 days | Modify App struct to hold `*application.App`, update all event emission sites |
| **Frontend API adapter** | 1-2 days | Rewrite `frontend/src/api/index.ts`, update test mocks, verify xterm.js stream integration |
| **Window lifecycle** | 1 day | Minimal for current single-window state; more if implementing multi-window early |
| **Bindings generation & build** | 1 day | Adapt `wails.json` to v3 schema, test `wails3 generate bindings`, update CI/CD |
| **Testing & stabilization** | 2-3 days | Integration tests for PTY streams, event dispatch, multi-window if added |
| **Total (central case)** | **8–14 days** | Assumes no major breakage; α stability lower = buffer for unknowns |

---

## Recommendation: Wait for v3 RC

**Do not migrate now.** Rationale:

1. **Alpha instability risk:** v3.0.0-alpha.73 still shipping breaking changes. Known issues: drag-drop on Windows broken, WebView crashes on macOS, schema validation failures. Typical alpha churn.

2. **Shell-first timing:** Your Warp-inspired multi-window roadmap aligns perfectly with v3 architecture. Waiting 2–3 months for RC locks in API stability + multi-window docs/examples. Migrating now means porting again when stable releases.

3. **v2 stability:** v2.12 remains stable, receiving critical updates. Production-grade; no blocking bugs for current architecture.

4. **Documentation gap:** No comprehensive v2→v3 migration guide. Community reports ~1–4 hours for typical apps, but with 60+ bindings + custom event streams, risk is **moderate-to-high** without precedent.

5. **Hedge:** Plan migration in parallel (research branch, script bindings refactor, test local) during shell-first development. When v3 RC drops, you'll be ready within days instead of weeks.

**If you must migrate now:** Spike phase (2–3 days) to validate event streaming, multi-window window creation, and binding generation with your 60+ methods. Plan for 1–2 additional alpha releases during active development.

---

## Known Gotchas & Issues

- **Drag-and-drop:** Broken on Windows since alpha.19—file dialogs unaffected, but drag-drop events don't reach Go.
- **macOS WebView crashes:** Rapid UI updates on macOS 26 (Tahoe). Mitigated in recent alphas.
- **Build performance:** 20–30 min hangs during `wails3 dev` if node_modules not excluded from Taskfile. Fixed in recent alphas.
- **Linux GPU:** WebKitGTK on Wayland + NVIDIA crashes without DMA-BUF auto-disable. Auto-mitigated in v3.
- **Tray icon events:** v3 OnClick handler different from v2. Low impact for MultiHub.

---

## Ecosystem & Templates

v3 has active template ecosystem (Svelte, Solid, Vue, SvelteKit templates available). Plugin system (experimental server plugin visible). Community "awesome-wails" collection smaller than v2, but growing. No blocker for standard React + TypeScript setup.

---

## Summary

**Status:** Alpha, production-capable but unstable.  
**Multi-window fit:** Excellent—native support outweighs v2 hacks.  
**Migration effort:** 8–14 days central case, moderate risk due to 60+ bindings + event streams.  
**Recommendation:** **Wait for v3 RC (est. Q2–Q3 2026).** Spike now to derisk event streaming and multi-window architecture. Plan refactoring scripts (binding wrapping, event emission replacement) as background work.

---

## Unresolved Questions

1. **Exact v3 stable release date?** No public timeline found; "when ready" approach.
2. **PTY streaming performance in v3?** No benchmarks found. Event emission rate limits unknown vs v2.
3. **Multi-window IPC patterns?** Docs exist but no MultiHub-specific example (60+ bindings + shared event bus across windows).
4. **Alpha breakage risk?** v3.0.0-alpha.73 → next alpha—expect 1–2 more before RC; breaking changes possible (happened in past alphas).
5. **v2 LTS window?** No stated EOL for v2. How long will v2 receive critical updates?

---

## Sources

- [Wails v3 Official Site](https://v3alpha.wails.io/)
- [GitHub Releases — wailsapp/wails](https://github.com/wailsapp/wails/releases)
- [Migration Guide: v2 to v3](https://v3alpha.wails.io/migration/v2-to-v3/)
- [Wails v3 Bindings Reference](https://v3alpha.wails.io/learn/bindings/)
- [Wails v3 Multiple Windows](https://v3alpha.wails.io/features/windows/multiple/)
- [The Road to Wails v3 Blog](https://wails.io/blog/the-road-to-wails-v3/)
- [GitHub Discussion: Migration Guide v2→v3](https://github.com/wailsapp/wails/discussions/4509)
- [GitHub Issues: Known Wails v3 Gotchas](https://github.com/wailsapp/wails/issues)
- [Wails Events Guide](https://v3alpha.wails.io/guides/events-reference/)
- [Wails Services Architecture](https://v3alpha.wails.io/reference/application/)
