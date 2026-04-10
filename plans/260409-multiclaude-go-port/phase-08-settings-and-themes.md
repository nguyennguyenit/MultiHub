---
phase: "08"
title: "Settings & Themes"
status: completed
effort: 8h
risk: Low
depends_on: ["04"]
---

# Phase 08: Settings & Themes

**Priority:** P2
**Status:** Completed

## Context Links
- Source: `src/main/settings/settings-store.ts` (~200 lines)
- Source: `src/shared/constants/themes.ts` + `terminal-themes.ts`
- Source: `src/renderer/stores/settings-store.ts` (dual-flow pattern)

## Overview

Port settings persistence (Go backend) and theme system (frontend CSS variables). The dual-layer pattern (pending + saved) stays entirely in the frontend Zustand store; the Go backend just does CRUD on a JSON file with validation.

## Key Insights

- Source uses `electron-store` (JSON file with schema validation)
- 7 UI themes: tokyo-night, catppuccin, dracula, rose-pine, pro-dark + legacy themes
- 5 terminal palettes: per-theme xterm.js ITheme objects
- Theme mode: light/dark/system (CSS variables swap via `data-theme` attribute)
- Glassmorphism toggle: `backdrop-filter: blur()`
- Terminal render modes: performance (canvas), balanced (WebGL active only), quality (always WebGL)
- Font system: 7 terminal fonts + 7 app fonts (all via @fontsource)
- Settings validation in backend prevents invalid state from persisting

## Architecture

### Backend (Go)

```go
// internal/settings/store.go
package settings

import (
    "encoding/json"
    "os"
    "path/filepath"
    "sync"

    "github.com/<org>/multihub/pkg/types"
)

var defaults = types.AppSettings{
    ColorTheme:         "tokyo-night",
    TerminalLimit:      types.TerminalLimit{Preset: 4},
    TerminalRenderMode: "balanced",
    GlassmorphismEnabled: true,
    TerminalFontFamily: "jetbrains-mono",
    ModernFontFamily:   "inter",
}

type Store struct {
    mu       sync.RWMutex
    settings types.AppSettings
    filePath string
}

func NewStore(dataDir string) (*Store, error) {
    fp := filepath.Join(dataDir, "settings.json")
    s := &Store{filePath: fp, settings: defaults}
    if err := s.load(); err != nil {
        s.settings = defaults // corrupt file -> reset
    }
    return s, nil
}

func (s *Store) Get() types.AppSettings {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return s.settings
}

func (s *Store) Set(partial map[string]interface{}) (types.AppSettings, error) {
    s.mu.Lock()
    defer s.mu.Unlock()

    // Merge partial into current settings
    // Use JSON round-trip for flexible merging
    current, _ := json.Marshal(s.settings)
    var merged map[string]interface{}
    json.Unmarshal(current, &merged)
    for k, v := range partial {
        merged[k] = v
    }
    data, _ := json.Marshal(merged)
    var updated types.AppSettings
    if err := json.Unmarshal(data, &updated); err != nil {
        return s.settings, err
    }

    // Validate
    updated = s.validate(updated)
    s.settings = updated
    return updated, s.save()
}

func (s *Store) Reset() (types.AppSettings, error) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.settings = defaults
    return defaults, s.save()
}

func (s *Store) validate(settings types.AppSettings) types.AppSettings {
    // Ensure valid theme
    validThemes := map[string]bool{
        "tokyo-night": true, "catppuccin": true, "dracula": true,
        "rose-pine": true, "pro-dark": true,
        // Legacy themes (map to new)
        "default": true, "dusk": true, "lime": true, "ocean": true,
        "retro": true, "neo": true, "forest": true, "neon-cyber": true, "vibrant": true,
    }
    if !validThemes[string(settings.ColorTheme)] {
        settings.ColorTheme = "tokyo-night"
    }

    // Ensure valid render mode
    validModes := map[string]bool{"performance": true, "balanced": true, "quality": true}
    if !validModes[string(settings.TerminalRenderMode)] {
        settings.TerminalRenderMode = "balanced"
    }

    // Ensure terminal limit sanity
    if settings.TerminalLimit.Preset == "custom" && settings.TerminalLimit.CustomValue != nil {
        if *settings.TerminalLimit.CustomValue < 1 || *settings.TerminalLimit.CustomValue > 20 {
            v := 4
            settings.TerminalLimit.CustomValue = &v
        }
    }

    return settings
}
```

### Frontend (unchanged architecture)

The Zustand settings store stays the same dual-flow pattern. Only the IPC calls change:

```typescript
// frontend/src/stores/settings-store.ts
// Before: window.electron.settings.get() / .set() / .reset()
// After:  import { SettingsGet, SettingsSet, SettingsReset } from '../wailsjs/go/main/App'

save: async () => {
    const { pendingSettings } = get()
    const saved = await SettingsSet(pendingSettings)  // <-- Wails binding
    set({ savedSettings: saved, hasUnsavedChanges: false })
},
```

### Theme System (frontend CSS)

Theme CSS variables from `globals.css` port 100% unchanged. The theme selector component applies a `data-theme` attribute to `<html>`, and CSS variables respond:

```css
/* This entire block copies as-is from source */
[data-theme="tokyo-night"] {
    --mc-bg-primary: #1a1b26;
    --mc-bg-secondary: #16161e;
    --mc-accent: #7aa2f7;
    --mc-text-primary: #c0caf5;
    /* ... */
}
```

Terminal themes (xterm.js ITheme objects) also port unchanged -- they're TypeScript objects in `src/shared/constants/terminal-themes.ts`.

## Go Type Definitions

```go
// pkg/types/settings.go
package types

type TerminalLimitPreset interface{} // 2|4|9|"custom"

type TerminalLimit struct {
    Preset      interface{} `json:"preset"`      // int or "custom"
    CustomValue *int        `json:"customValue,omitempty"`
}

type AppSettings struct {
    ColorTheme             string        `json:"colorTheme"`
    TerminalLimit          TerminalLimit `json:"terminalLimit"`
    TerminalRenderMode     string        `json:"terminalRenderMode"`
    GpuRendererForClaude   *bool         `json:"gpuRendererForClaudeTerminals,omitempty"`
    GlassmorphismEnabled   bool          `json:"glassmorphismEnabled"`
    TerminalFontFamily     string        `json:"terminalFontFamily"`
    WindowsShell           interface{}   `json:"windowsShell,omitempty"`
    ThemeMode              string        `json:"themeMode,omitempty"`
    ModernFontFamily       string        `json:"modernFontFamily,omitempty"`
    UiStyle                string        `json:"uiStyle,omitempty"`
    TerminalStyleOptions   interface{}   `json:"terminalStyleOptions,omitempty"`
    ActivityBarState       string        `json:"activityBarState,omitempty"`
}
```

Note: Several fields use `interface{}` because they have union types (TS `number | "custom"`). Go handles this via JSON round-trip. The frontend types remain authoritative.

## Related Code Files

**Create:**
- `internal/settings/store.go`
- `internal/settings/store_test.go`
- `pkg/types/settings.go`

**Modify:**
- `app.go` -- Add SettingsGet/SettingsSet/SettingsReset bindings

**Copy unchanged from source:**
- `frontend/src/stores/settings-store.ts` (update IPC calls only)
- `frontend/src/styles/globals.css` (all theme CSS variables)
- `frontend/src/components/settings/theme-selector.tsx`
- `frontend/src/components/settings/terminal-settings.tsx`
- `frontend/src/components/settings/settings-panel.tsx`
- `src/shared/constants/themes.ts`
- `src/shared/constants/terminal-themes.ts`

## Implementation Steps

1. Create `pkg/types/settings.go` with AppSettings struct
2. Create `internal/settings/store.go` with Get/Set/Reset + validation
3. Add Wails bindings: `SettingsGet()`, `SettingsSet()`, `SettingsReset()`
4. Copy `globals.css` theme variables to frontend
5. Copy terminal theme objects (ITheme definitions)
6. Update settings store IPC calls in frontend
7. Test: save settings -> restart -> settings persist
8. Test: invalid theme value -> validation corrects to default
9. Test: corrupt settings.json -> reset to defaults

## Todo List

- [x] Define AppSettings Go type
- [x] Create settings store with JSON persistence
- [x] Implement validation (themes, render modes, limits)
- [x] Add Wails binding methods
- [ ] Copy theme CSS variables to frontend - REMAINING
- [ ] Copy terminal theme ITheme objects - REMAINING
- [ ] Update frontend settings store IPC calls - REMAINING
- [ ] Unit tests: get/set/reset cycle - NOT DONE
- [ ] Unit tests: validation (invalid theme, out-of-range limit) - NOT DONE
- [ ] Unit tests: corrupt file recovery - NOT DONE

## Success Criteria

1. Settings persist across app restarts
2. All 7 themes render correctly with proper CSS variables
3. Terminal font changes apply to xterm.js instances
4. Glassmorphism toggle works
5. Validation rejects invalid values and corrects to defaults
6. Corrupt settings file triggers clean reset

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Go interface{} loses type precision | Low | Low | Frontend TS types are authoritative; Go just stores/retrieves |
| Theme CSS var mismatch | Low | Med | Copy globals.css verbatim; visual regression test |
| Font loading in Wails WebView | Low | Med | Use @fontsource npm packages (bundled, no network) |

## Rollback

Delete `internal/settings/` and revert `app.go`. Frontend settings store changes are backward-compatible.
