---
phase: "11"
title: "Cross-Platform Packaging & Testing"
status: pending
effort: 20h
risk: Medium
depends_on: ["01","02","03","04","05","06","07","08","09","10"]
---

# Phase 11: Cross-Platform Packaging & Testing

**Priority:** P1 -- Final phase, all features integrated
**Status:** Pending

## Context Links
- Source: `.github/workflows/release.yml` (Electron Builder config)
- Source: `scripts/release/` (release automation)
- Wails build docs: https://wails.io/docs/guides/building

## Overview

Build, sign, and package MultiHub for macOS (universal), Linux (AppImage + deb), and Windows (NSIS installer). Set up CI/CD with GitHub Actions. Run integration tests and visual regression checks.

## Key Insights

- Wails `wails build` produces single binary with embedded frontend
- macOS: universal binary (amd64 + arm64) via `wails build -platform darwin/universal`
- Linux: Wails produces binary; wrap in AppImage or package as .deb
- Windows: Wails produces .exe; wrap with NSIS or WiX installer
- Code signing: macOS requires Apple Developer certificate; Windows requires Authenticode
- GitHub Actions: `wailsapp/setup-wails@v1` action available
- Binary size: typically 20-40MB (Go binary + embedded web assets)

## Architecture

### Build Matrix

| Platform | Arch | Output | Signing |
|----------|------|--------|---------|
| macOS | universal (amd64+arm64) | MultiHub.app → .dmg | Apple Developer ID |
| Linux | amd64 | AppImage + .deb | N/A (optional GPG) |
| Linux | arm64 | AppImage + .deb | N/A |
| Windows | amd64 | .exe → NSIS installer | Authenticode (optional) |

### CI/CD Pipeline

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: '1.22' }
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Install Wails
        run: go install github.com/wailsapp/wails/v2/cmd/wails@latest
      - name: Build
        run: wails build -platform darwin/universal -o MultiHub
      - name: Create DMG
        run: |
          npm install -g create-dmg
          create-dmg build/bin/MultiHub.app build/bin/ || true
      - name: Upload
        uses: actions/upload-artifact@v4
        with:
          name: MultiHub-macOS
          path: build/bin/*.dmg

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: '1.22' }
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Install deps
        run: |
          sudo apt-get update
          sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.1-dev
      - name: Install Wails
        run: go install github.com/wailsapp/wails/v2/cmd/wails@latest
      - name: Build
        run: wails build -o MultiHub
      - name: Package AppImage
        run: |
          # Use linuxdeploy to create AppImage
          wget -q https://github.com/linuxdeploy/linuxdeploy/releases/download/continuous/linuxdeploy-x86_64.AppImage
          chmod +x linuxdeploy-x86_64.AppImage
          ./linuxdeploy-x86_64.AppImage \
            --appdir AppDir \
            --executable build/bin/MultiHub \
            --desktop-file build/linux/MultiHub.desktop \
            --icon-file build/appicon.png \
            --output appimage
      - name: Upload
        uses: actions/upload-artifact@v4
        with:
          name: MultiHub-Linux
          path: '*.AppImage'

  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: '1.22' }
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Install Wails
        run: go install github.com/wailsapp/wails/v2/cmd/wails@latest
      - name: Build
        run: wails build -nsis -o MultiHub
      - name: Upload
        uses: actions/upload-artifact@v4
        with:
          name: MultiHub-Windows
          path: build/bin/*.exe

  release:
    needs: [build-macos, build-linux, build-windows]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            MultiHub-macOS/*.dmg
            MultiHub-Linux/*.AppImage
            MultiHub-Windows/*.exe
```

### Test Matrix

| Test Type | Scope | Tool | Phase |
|-----------|-------|------|-------|
| Unit (Go) | All internal/ packages | `go test -race ./...` | Each phase |
| Unit (TS) | Frontend stores/utils | Vitest | Phase 04 |
| Integration | PTY latency benchmark | Custom harness | Phase 02 |
| Integration | Git operations on real repos | `go test` with temp dirs | Phase 06 |
| E2E | Full app workflow | Playwright (Wails WebView) | Phase 11 |
| Visual | Theme rendering | Screenshot comparison | Phase 11 |
| Cross-platform | Build on 3 OS | GitHub Actions matrix | Phase 11 |

### E2E Test Strategy

Wails apps can be tested with Playwright by connecting to the WebView:

```typescript
// e2e/app.spec.ts
import { test, expect } from '@playwright/test'

test('create and destroy terminal', async ({ page }) => {
    // Wait for app to load
    await page.waitForSelector('[data-testid="terminal-grid"]')

    // Create terminal
    await page.click('[data-testid="new-terminal-button"]')
    await expect(page.locator('[data-testid="terminal-pane"]')).toHaveCount(1)

    // Type in terminal
    const terminal = page.locator('[data-testid="terminal-pane"]').first()
    await terminal.click()
    await page.keyboard.type('echo hello')
    await page.keyboard.press('Enter')

    // Verify output appears
    await expect(terminal).toContainText('hello')
})
```

## Build Configuration

### wails.json

```json
{
  "name": "MultiHub",
  "outputfilename": "MultiHub",
  "frontend:install": "npm install",
  "frontend:build": "npm run build",
  "frontend:dev:watcher": "npm run dev",
  "frontend:dev:serverUrl": "auto",
  "wailsjsdir": "./frontend",
  "author": {
    "name": "MultiHub Team"
  },
  "info": {
    "companyName": "MultiHub",
    "productName": "MultiHub",
    "productVersion": "1.0.0",
    "copyright": "MIT License",
    "comments": "Desktop workspace for running AI coding agents in parallel"
  }
}
```

### macOS Info.plist additions

```xml
<key>NSAppleEventsUsageDescription</key>
<string>MultiHub needs to send notifications</string>
<key>NSDesktopFolderUsageDescription</key>
<string>MultiHub needs access to project folders</string>
```

### Linux .desktop file

```ini
[Desktop Entry]
Name=MultiHub
Exec=MultiHub
Icon=multihub
Type=Application
Categories=Development;
Comment=Desktop workspace for AI coding agents
```

## Related Code Files

**Create:**
- `.github/workflows/release.yml`
- `.github/workflows/test.yml` (CI on push/PR)
- `build/linux/MultiHub.desktop`
- `build/darwin/Info.plist` (additions)
- `build/windows/installer/` (NSIS config)
- `e2e/` (Playwright test files)
- `Makefile` (build convenience targets)

**Modify:**
- `wails.json` -- Final build configuration
- `main.go` -- Version string injection via `-ldflags`

## Implementation Steps

1. Configure `wails.json` with final build settings
2. Create Makefile with build targets:
   ```makefile
   .PHONY: dev build test

   VERSION := $(shell git describe --tags --always)

   dev:
       wails dev

   build:
       wails build -ldflags "-X main.version=$(VERSION)"

   build-all:
       wails build -platform darwin/universal -ldflags "-X main.version=$(VERSION)"
       wails build -platform linux/amd64 -ldflags "-X main.version=$(VERSION)"
       wails build -platform windows/amd64 -ldflags "-X main.version=$(VERSION)"

   test:
       go test -race ./internal/... ./pkg/...
       cd frontend && npm test

   test-e2e:
       cd e2e && npx playwright test
   ```
3. Set up GitHub Actions for CI (test on push) and release (on tag)
4. Configure macOS code signing (Apple Developer ID)
5. Create Linux AppImage packaging
6. Create Windows NSIS installer config
7. Set up E2E test suite with Playwright
8. Run full test matrix on all 3 platforms
9. Create release automation script
10. Performance benchmark: startup time, memory usage, binary size
11. Visual regression: screenshot each theme on each platform

## Todo List

- [ ] Configure wails.json with final settings
- [ ] Create Makefile with build/test/dev targets
- [ ] Set up GitHub Actions CI workflow (test on push)
- [ ] Set up GitHub Actions release workflow (build on tag)
- [ ] Configure macOS universal binary build
- [ ] Create Linux AppImage packaging
- [ ] Create Windows NSIS installer
- [ ] Set up Playwright E2E test suite
- [ ] Write E2E tests: terminal create/destroy
- [ ] Write E2E tests: project CRUD
- [ ] Write E2E tests: settings save/cancel
- [ ] Write E2E tests: git panel operations
- [ ] Run Go unit tests with -race flag on CI
- [ ] Run frontend Vitest tests on CI
- [ ] Performance benchmark: startup time < 3s
- [ ] Performance benchmark: memory < 200MB idle
- [ ] Performance benchmark: binary size < 50MB
- [ ] Visual regression: screenshot all themes
- [ ] Test on macOS (Intel + Apple Silicon)
- [ ] Test on Ubuntu 22.04 + 24.04
- [ ] Test on Windows 10 + 11
- [ ] Create release notes template

## Success Criteria

1. Single binary builds for all 3 platforms
2. macOS universal binary works on both Intel and Apple Silicon
3. Linux AppImage runs without additional dependencies
4. Windows installer creates Start Menu shortcut
5. All Go tests pass with `-race` flag
6. E2E tests pass on all platforms
7. Binary size < 50MB per platform
8. Startup time < 3s on all platforms
9. GitHub Actions builds green on all platforms
10. Auto-update correctly detects new releases

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| macOS code signing issues | Medium | High | Test locally first; use `codesign --verify` |
| Linux WebView compatibility | Medium | Med | Test on Ubuntu 22.04 (min supported); check webkit2gtk version |
| Windows WebView2 missing | Low | Med | Wails auto-installs WebView2 bootstrapper |
| E2E tests flaky across platforms | High | Med | Retry logic; generous timeouts; platform-specific skips |
| Binary size > 50MB | Medium | Low | Trim debug symbols (`-s -w` ldflags); compress assets |

## Rollback

This phase is additive (CI/CD configs, packaging). Rollback = delete workflows and packaging scripts. Core app unaffected.
