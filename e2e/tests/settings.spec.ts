import { test, expect } from '@playwright/test'
import { TEST_IDS } from '../../frontend/src/shared/constants/test-ids'

test.describe('Settings', () => {
  test('open settings panel', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const panel = page.getByTestId(TEST_IDS.panel.settings)
    await page.getByTestId(TEST_IDS.shell.settingsButton).click()
    await expect(panel).toBeVisible({ timeout: 3_000 })
    await expect(panel).toHaveAttribute('data-panel-variant', 'default')
    await expect(page.getByTestId(TEST_IDS.panel.settingsCloseButton)).toBeVisible()
  })

  test('settings panel closes on cancel', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByTestId(TEST_IDS.shell.settingsButton).click()
    const panel = page.getByTestId(TEST_IDS.panel.settings)
    await expect(panel).toBeVisible({ timeout: 3_000 })

    await page.getByTestId(TEST_IDS.panel.settingsCancelButton).click()
    await expect(panel).not.toBeVisible({ timeout: 2_000 })
  })
})
