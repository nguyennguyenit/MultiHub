import { test, expect } from '@playwright/test'
import { TEST_IDS } from '../../frontend/src/shared/constants/test-ids'

test.describe('Project management', () => {
  test('header exposes the project switcher and open-project action', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId(TEST_IDS.shell.projectSwitcherButton)).toBeVisible()
    await expect(page.getByTestId(TEST_IDS.shell.addProjectButton)).toBeVisible()

    await page.getByTestId(TEST_IDS.shell.projectSwitcherButton).click()
    await expect(page.getByTestId(TEST_IDS.shell.projectSwitcherMenu)).toBeVisible({ timeout: 3_000 })
  })

  test('open-project action remains clickable without crashing the app', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByTestId(TEST_IDS.shell.addProjectButton).click()
    await expect(page).not.toHaveURL(/error/i)
  })
})
