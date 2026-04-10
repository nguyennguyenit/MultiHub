.PHONY: dev build build-all test test-go test-frontend test-e2e lint clean

# Inject version from git tag (e.g. v1.0.0) or commit hash
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
LDFLAGS  := -X main.version=$(VERSION) -s -w

# ── Development ────────────────────────────────────────────────────────────────

dev:
	wails dev

# ── Build ──────────────────────────────────────────────────────────────────────

build:
	wails build -ldflags "$(LDFLAGS)"

build-macos:
	wails build -platform darwin/universal -ldflags "$(LDFLAGS)"

build-linux-amd64:
	wails build -platform linux/amd64 -ldflags "$(LDFLAGS)"

build-linux-arm64:
	wails build -platform linux/arm64 -ldflags "$(LDFLAGS)"

build-windows:
	wails build -platform windows/amd64 -nsis -ldflags "$(LDFLAGS)"

build-all: build-macos build-linux-amd64 build-windows

# ── Testing ────────────────────────────────────────────────────────────────────

test: test-go test-frontend

test-go:
	go test -race -timeout 120s ./internal/... ./pkg/...

test-frontend:
	cd frontend && npm test -- --run

test-e2e:
	cd e2e && npx playwright test

# ── Quality ────────────────────────────────────────────────────────────────────

lint:
	go vet ./...
	cd frontend && npx tsc --noEmit

# ── Housekeeping ───────────────────────────────────────────────────────────────

clean:
	rm -rf build/bin
	rm -rf frontend/dist
	rm -rf e2e/test-results e2e/playwright-report

.DEFAULT_GOAL := build
