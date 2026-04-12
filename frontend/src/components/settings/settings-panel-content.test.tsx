import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { TEST_IDS } from '@shared/constants'
import { useSettingsStore } from '../../stores'
import { SettingsPanelContent } from './settings-panel-content'

vi.mock('./theme-selector', () => ({
  ThemeSelector: () => <div data-testid="theme-selector-stub">theme selector</div>,
}))

vi.mock('./terminal-settings', () => ({
  TerminalSettings: () => <div data-testid="terminal-settings-stub">terminal settings</div>,
}))

vi.mock('./notification-settings', () => ({
  NotificationSettings: () => <div data-testid="notification-settings-stub">notification settings</div>,
}))

vi.mock('./update-settings', () => ({
  UpdateSettings: () => <div data-testid="update-settings-stub">update settings</div>,
}))

describe('SettingsPanelContent', () => {
  beforeEach(() => {
    const settingsStore = useSettingsStore.getState()
    useSettingsStore.setState({
      savedSettings: settingsStore.savedSettings,
      pendingSettings: settingsStore.savedSettings,
      hasUnsavedChanges: false,
    })
  })

  test('renders stable interior anchors and switches content by sidebar tab', async () => {
    const user = userEvent.setup()

    render(<SettingsPanelContent onClose={() => {}} />)

    expect(screen.getByTestId(TEST_IDS.panel.settingsSidebar)).toBeInTheDocument()
    expect(screen.getByTestId(TEST_IDS.panel.settingsContent)).toBeInTheDocument()
    expect(screen.getByTestId(TEST_IDS.panel.settingsTabAppearance)).toBeInTheDocument()
    expect(screen.getByTestId(TEST_IDS.panel.settingsTabTerminals)).toBeInTheDocument()
    expect(screen.getByTestId(TEST_IDS.panel.settingsTabNotifications)).toBeInTheDocument()
    expect(screen.getByTestId(TEST_IDS.panel.settingsTabUpdates)).toBeInTheDocument()
    expect(screen.getByTestId(TEST_IDS.panel.settingsCancelButton)).toBeInTheDocument()
    expect(screen.getByTestId(TEST_IDS.panel.settingsSaveButton)).toBeDisabled()
    expect(screen.getByTestId('theme-selector-stub')).toBeInTheDocument()

    await user.click(screen.getByTestId(TEST_IDS.panel.settingsTabUpdates))

    expect(screen.getByTestId('update-settings-stub')).toBeInTheDocument()
  })

  test('cancels pending settings before closing the panel', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const cancelSettingsSpy = vi.spyOn(useSettingsStore.getState(), 'cancelSettings')

    render(<SettingsPanelContent onClose={onClose} />)

    await user.click(screen.getByTestId(TEST_IDS.panel.settingsCancelButton))

    expect(cancelSettingsSpy).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('closes after a successful save', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const saveSettings = vi.fn().mockResolvedValue(undefined)

    useSettingsStore.setState({
      hasUnsavedChanges: true,
      saveSettings,
    })

    render(<SettingsPanelContent onClose={onClose} />)

    await user.click(screen.getByTestId(TEST_IDS.panel.settingsSaveButton))

    await waitFor(() => {
      expect(saveSettings).toHaveBeenCalledTimes(1)
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  test('keeps the panel open and restores the save button after a failed save', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const saveSettings = vi.fn().mockRejectedValue(new Error('save failed'))
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    useSettingsStore.setState({
      hasUnsavedChanges: true,
      saveSettings,
    })

    render(<SettingsPanelContent onClose={onClose} />)

    const saveButton = screen.getByTestId(TEST_IDS.panel.settingsSaveButton)
    await user.click(saveButton)

    await waitFor(() => {
      expect(saveSettings).toHaveBeenCalledTimes(1)
      expect(onClose).not.toHaveBeenCalled()
      expect(saveButton).toBeEnabled()
    })

    consoleErrorSpy.mockRestore()
  })
})
