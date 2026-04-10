import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for MultiHub E2E tests.
 *
 * In CI the app is already running (launched by the test runner or pre-built).
 * Locally, Wails dev server runs on a WebView — Playwright connects via CDP.
 *
 * To run against a Wails dev build:
 *   1. `wails dev` (leaves WebView accessible on a CDP port)
 *   2. `npx playwright test`
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // serial — single app instance

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    // Connect to the Wails WebView via CDP on the default debug port.
    // In headless CI the app must be pre-launched; locally use `wails dev`.
    baseURL: process.env.MULTIHUB_URL || 'http://localhost:34115',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
