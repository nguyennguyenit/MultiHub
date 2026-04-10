import { test, expect } from '@playwright/test'
import { TEST_IDS } from '../../frontend/src/shared/constants/test-ids'

test.describe('Terminal management', () => {
  test('app loads the workbench shell and empty project state', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/MultiHub/i, { timeout: 5_000 })
    await expect(page.getByTestId(TEST_IDS.shell.toolbar)).toBeVisible()
    await expect(page.getByTestId(TEST_IDS.emptyState.project)).toBeVisible()
  })

  test('github panel opens from the shell', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByTestId(TEST_IDS.shell.githubPanelButton).click()
    const panel = page.getByTestId(TEST_IDS.panel.github)
    await expect(panel).toBeVisible({ timeout: 3_000 })
    await expect(panel).toHaveAttribute('data-panel-variant', 'github')
    await expect(page.getByTestId(TEST_IDS.panel.githubEmptyState)).toBeVisible()
  })

  test('project-empty state keeps the open-project CTA visible', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const projectEmptyState = page.getByTestId(TEST_IDS.emptyState.project)
    await expect(projectEmptyState).toBeVisible()
    await expect(projectEmptyState.getByRole('button', { name: 'Open Project Folder' })).toBeVisible()
  })
})
