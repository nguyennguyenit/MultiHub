import { useState, useCallback } from 'react'
import { useSettingsStore } from '../../stores'
import { TEST_IDS } from '@shared/constants'
import { SettingsSidebar, type SettingsTab } from './settings-sidebar'
import { ThemeSelector } from './theme-selector'
import { TerminalSettings } from './terminal-settings'
import { NotificationSettings } from './notification-settings'
import { UpdateSettings } from './update-settings'

interface SettingsPanelContentProps {
  onClose: () => void
}

export function SettingsPanelContent({ onClose }: SettingsPanelContentProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance')
  const [isSaving, setIsSaving] = useState(false)
  const { saveSettings, cancelSettings, hasUnsavedChanges } = useSettingsStore()

  const handleCancel = useCallback(() => {
    cancelSettings()
    onClose()
  }, [cancelSettings, onClose])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveSettings()
      onClose()
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="settings-panel-shell">
      <div className="settings-panel-layout">
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="settings-panel-content">
          {activeTab === 'appearance' && <ThemeSelector />}
          {activeTab === 'terminals' && <TerminalSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'updates' && <UpdateSettings />}
        </div>
      </div>

      <div className="settings-panel-footer">
        <button
          type="button"
          data-testid={TEST_IDS.panel.settingsCancelButton}
          onClick={handleCancel}
          className="settings-panel-secondary-action"
        >
          Cancel
        </button>
        <button
          type="button"
          data-testid={TEST_IDS.panel.settingsSaveButton}
          onClick={handleSave}
          disabled={!hasUnsavedChanges || isSaving}
          className="settings-panel-primary-action"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
