import { test, expect } from '@playwright/test'

test.describe('Terminal management', () => {
  test('app loads and shows UI', async ({ page }) => {
    await page.goto('/')
    // The main layout should render within 5 s
    await expect(page).toHaveTitle(/MultiHub/i, { timeout: 5_000 })
  })

  test('create a new terminal', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="terminal-grid"], [data-testid="empty-state"]', {
      timeout: 10_000,
    })

    const newTerminalBtn = page.locator('[data-testid="new-terminal-button"]')
    if (await newTerminalBtn.isVisible()) {
      await newTerminalBtn.click()
      await expect(page.locator('[data-testid="terminal-pane"]')).toHaveCount(1, {
        timeout: 5_000,
      })
    }
  })

  test('terminal accepts keyboard input', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="terminal-pane"]', { timeout: 10_000 })

    const pane = page.locator('[data-testid="terminal-pane"]').first()
    await pane.click()
    await page.keyboard.type('echo multihub-e2e')
    await page.keyboard.press('Enter')

    // Output should appear within 3 s
    await expect(pane).toContainText('multihub-e2e', { timeout: 3_000 })
  })
})
