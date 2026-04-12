import { test, expect } from '@playwright/test'
import { TEST_IDS } from '../../frontend/src/shared/constants/test-ids'

const PALETTE_SHORTCUT = process.platform === 'darwin' ? 'Meta+K' : 'Control+K'

test.describe('Quick switcher palette', () => {
  test('opens from the keyboard and routes a settings action', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.keyboard.press(PALETTE_SHORTCUT)

    const palette = page.getByTestId(TEST_IDS.palette.root)
    const input = page.getByTestId(TEST_IDS.palette.input)

    await expect(palette).toBeVisible()
    await expect(input).toBeFocused()

    await input.fill('settings')
    await page.keyboard.press('Enter')

    await expect(page.getByTestId(TEST_IDS.panel.settings)).toBeVisible()
    await expect(palette).not.toBeVisible()
  })
})
