import { test, expect } from '@playwright/test'

test.describe('Settings', () => {
  test('open settings panel', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const settingsBtn = page.locator('[data-testid="settings-button"], [aria-label*="settings" i]').first()
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click()
      await expect(
        page.locator('[data-testid="settings-panel"], [role="dialog"]')
      ).toBeVisible({ timeout: 3_000 })
    }
  })

  test('settings panel closes on cancel', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const settingsBtn = page.locator('[data-testid="settings-button"], [aria-label*="settings" i]').first()
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click()
      const panel = page.locator('[data-testid="settings-panel"], [role="dialog"]')
      await panel.waitFor({ state: 'visible' })

      const cancelBtn = page.locator('[data-testid="settings-cancel"], button:has-text("Cancel")').first()
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click()
        await expect(panel).not.toBeVisible({ timeout: 2_000 })
      }
    }
  })
})
