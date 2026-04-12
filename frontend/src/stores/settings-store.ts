import { create } from 'zustand'
import type { AppSettings, ThemeMode, ColorTheme, TerminalLimit, TerminalRenderMode, WindowsShell, WslInfo, UiStyle, TerminalStyleOptions, TerminalFontId, AppFontId, ActivityBarState } from '@shared/types'
import { DEFAULT_SETTINGS, APP_FONTS } from '@shared/constants'
import { useToastStore } from './toast-store'
import { api } from '../api'

/** Apply app/UI font immediately to DOM (both CSS variable and body inline style) */
function applyAppFont(fontId: AppFontId): void {
  const font = APP_FONTS.find(f => f.id === fontId)
  if (!font) return
  document.documentElement.style.setProperty('--modern-font', font.family)
  document.body.style.fontFamily = font.family
}

const STORAGE_KEY = 'multiclaude-settings' // For migration check

let migrationAttempted = false

interface SettingsState {
  savedSettings: AppSettings
  pendingSettings: AppSettings
  settings: AppSettings
  hasUnsavedChanges: boolean
  wslInfo: WslInfo | null
  gitPanelOpen: boolean

  setThemeMode: (mode: ThemeMode) => void
  setColorTheme: (theme: ColorTheme) => void
  setGlassmorphismEnabled: (enabled: boolean) => void
  setTerminalLimit: (limit: TerminalLimit) => void
  setTerminalRenderMode: (mode: TerminalRenderMode) => void
  setWindowsShell: (shell: WindowsShell) => void
  setUiStyle: (style: UiStyle) => void
  setModernFontFamily: (fontId: AppFontId) => void
  setTerminalFontFamily: (fontId: TerminalFontId) => void
  setTerminalStyleOptions: (options: Partial<TerminalStyleOptions>) => void
  setActivityBarState: (state: ActivityBarState) => void
  setVietnameseImeFix: (enabled: boolean) => void

  saveSettings: () => Promise<void>
  cancelSettings: () => void
  loadSettings: () => Promise<void>

  getTerminalLimitValue: () => number
  setGitPanelOpen: (open: boolean) => void
  detectWsl: () => Promise<void>
}

function areSettingsEqual(a: AppSettings, b: AppSettings): boolean {
  if (a.themeMode !== b.themeMode) return false
  if (a.colorTheme !== b.colorTheme) return false
  if (a.terminalRenderMode !== b.terminalRenderMode) return false
  if (a.glassmorphismEnabled !== b.glassmorphismEnabled) return false
  if (a.uiStyle !== b.uiStyle) return false
  if (a.modernFontFamily !== b.modernFontFamily) return false
  if (a.terminalFontFamily !== b.terminalFontFamily) return false
  if (a.activityBarState !== b.activityBarState) return false
  if (a.vietnameseImeFix !== b.vietnameseImeFix) return false
  const aLimit = a.terminalLimit
  const bLimit = b.terminalLimit
  if (aLimit?.preset !== bLimit?.preset) return false
  if (aLimit?.preset === 'custom' && bLimit?.preset === 'custom') {
    if (aLimit.customValue !== bLimit.customValue) return false
  }
  const aStyle = a.terminalStyleOptions
  const bStyle = b.terminalStyleOptions
  if (aStyle?.colorPreset !== bStyle?.colorPreset) return false
  if (aStyle?.fontFamily !== bStyle?.fontFamily) return false
  if (aStyle?.useBorderChars !== bStyle?.useBorderChars) return false
  const aShell = a.windowsShell
  const bShell = b.windowsShell
  if (!aShell && bShell) return false
  if (aShell && !bShell) return false
  if (aShell && bShell) {
    if (aShell.type !== bShell.type) return false
    if (aShell.type === 'wsl' && bShell.type === 'wsl') {
      if (aShell.distro !== bShell.distro) return false
    }
  }
  return true
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  savedSettings: DEFAULT_SETTINGS,
  pendingSettings: DEFAULT_SETTINGS,
  get settings() { return get().pendingSettings },
  hasUnsavedChanges: false,
  wslInfo: null,
  gitPanelOpen: false,

  setThemeMode: (mode) => {
    const pending = { ...get().pendingSettings, themeMode: mode }
    set({ pendingSettings: pending, hasUnsavedChanges: !areSettingsEqual(pending, get().savedSettings) })
  },
  setColorTheme: (theme) => {
    const pending = { ...get().pendingSettings, colorTheme: theme }
    set({ pendingSettings: pending, hasUnsavedChanges: !areSettingsEqual(pending, get().savedSettings) })
  },
  setGlassmorphismEnabled: (enabled) => {
    const pending = { ...get().pendingSettings, glassmorphismEnabled: enabled }
    set({ pendingSettings: pending, hasUnsavedChanges: !areSettingsEqual(pending, get().savedSettings) })
  },
  setTerminalLimit: (limit) => {
    const pending = { ...get().pendingSettings, terminalLimit: limit }
    set({ pendingSettings: pending, hasUnsavedChanges: !areSettingsEqual(pending, get().savedSettings) })
  },
  setTerminalRenderMode: (mode) => {
    const pending = { ...get().pendingSettings, terminalRenderMode: mode }
    set({ pendingSettings: pending, hasUnsavedChanges: !areSettingsEqual(pending, get().savedSettings) })
  },
  setWindowsShell: (shell) => {
    const pending = { ...get().pendingSettings, windowsShell: shell }
    set({ pendingSettings: pending, hasUnsavedChanges: !areSettingsEqual(pending, get().savedSettings) })
  },
  setUiStyle: (style) => {
    const pending = { ...get().pendingSettings, uiStyle: style }
    set({ pendingSettings: pending, hasUnsavedChanges: !areSettingsEqual(pending, get().savedSettings) })
  },
  setModernFontFamily: (fontId) => {
    const pending = { ...get().pendingSettings, modernFontFamily: fontId }
    set({ pendingSettings: pending, hasUnsavedChanges: !areSettingsEqual(pending, get().savedSettings) })
    applyAppFont(fontId)
  },
  setTerminalFontFamily: (fontId) => {
    const pending = { ...get().pendingSettings, terminalFontFamily: fontId }
    set({ pendingSettings: pending, hasUnsavedChanges: !areSettingsEqual(pending, get().savedSettings) })
  },
  setTerminalStyleOptions: (options) => {
    const pending: AppSettings = {
      ...get().pendingSettings,
      terminalStyleOptions: {
        ...get().pendingSettings.terminalStyleOptions,
        ...options
      } as TerminalStyleOptions
    }
    set({ pendingSettings: pending, hasUnsavedChanges: !areSettingsEqual(pending, get().savedSettings) })
  },
  setActivityBarState: (state) => {
    const pending = { ...get().pendingSettings, activityBarState: state }
    set({ pendingSettings: pending, hasUnsavedChanges: !areSettingsEqual(pending, get().savedSettings) })
  },
  setVietnameseImeFix: (enabled) => {
    const pending = { ...get().pendingSettings, vietnameseImeFix: enabled }
    set({ pendingSettings: pending, hasUnsavedChanges: !areSettingsEqual(pending, get().savedSettings) })
  },

  saveSettings: async () => {
    const pending = get().pendingSettings
    try {
      const result = await api.settings.set(pending)
      set({ savedSettings: result ?? pending, hasUnsavedChanges: false })
    } catch (err) {
      console.error('Failed to save settings:', err)
      throw err
    }
  },

  cancelSettings: () => {
    set({ pendingSettings: { ...get().savedSettings }, hasUnsavedChanges: false })
  },

  loadSettings: async () => {
    try {
      const settings = await api.settings.get()
      if (settings) {
        set({ savedSettings: settings, pendingSettings: settings, hasUnsavedChanges: false })
        if (settings.modernFontFamily) applyAppFont(settings.modernFontFamily)
      }

      if (!migrationAttempted) {
        migrationAttempted = true
        const oldData = localStorage.getItem(STORAGE_KEY)
        if (oldData) {
          try {
            const parsed = JSON.parse(oldData)
            const merged = { ...(settings ?? DEFAULT_SETTINGS), ...parsed }
            await api.settings.set(merged)
            set({ savedSettings: merged, pendingSettings: merged })
            localStorage.removeItem(STORAGE_KEY)
          } catch (migrationErr) {
            console.warn('[settings] localStorage migration failed:', migrationErr)
          }
        }
      }
    } catch (err) {
      console.error('Failed to load settings from disk:', err)
      useToastStore.getState().addToast('Failed to load settings. Using defaults.', 'warning')
      set({ savedSettings: DEFAULT_SETTINGS, pendingSettings: DEFAULT_SETTINGS })
    }
  },

  getTerminalLimitValue: () => {
    const { terminalLimit } = get().pendingSettings
    if (!terminalLimit) return 9
    if (terminalLimit.preset === 'custom') return terminalLimit.customValue ?? 9
    return terminalLimit.preset
  },

  setGitPanelOpen: (open) => set({ gitPanelOpen: open }),

  detectWsl: async () => {
    try {
      const info = await api.terminal.detectWsl()
      if (!info) return
      set({ wslInfo: info })

      const currentShell = get().pendingSettings.windowsShell
      if (currentShell?.type === 'wsl' && info.available) {
        const distroExists = info.distros.some(d => d.name === currentShell.distro)
        if (!distroExists) {
          const pending = { ...get().pendingSettings, windowsShell: { type: 'cmd' as const } }
          set({ pendingSettings: pending })
        }
      }
    } catch {
      set({ wslInfo: { available: false, distros: [] } })
    }
  }
}))
