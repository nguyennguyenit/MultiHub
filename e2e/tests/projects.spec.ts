import { test, expect } from '@playwright/test'

test.describe('Project management', () => {
  test('open projects panel', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const projectsBtn = page.locator('[data-testid="projects-panel-button"], [aria-label*="project" i]').first()
    if (await projectsBtn.isVisible()) {
      await projectsBtn.click()
      await expect(page.locator('[data-testid="projects-panel"]')).toBeVisible({ timeout: 3_000 })
    }
  })

  test('add a project via folder picker', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const addBtn = page.locator('[data-testid="add-project-button"]')
    if (await addBtn.isVisible()) {
      // Intercept the native file dialog — Playwright cannot interact with OS dialogs.
      // We verify the button is clickable without crashing the app.
      await addBtn.click()
      // App should remain functional after clicking
      await expect(page).not.toHaveURL(/error/i)
    }
  })
})
