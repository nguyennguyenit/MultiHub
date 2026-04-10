import { create } from 'zustand'
import type { NotificationSettings, NotificationEvent, SoundPreset, RemoteControlStatus } from '@shared/types'
import { DEFAULT_NOTIFICATION_SETTINGS } from '@shared/constants'
import { api } from '../api'

interface NotificationState {
  settings: NotificationSettings
  isLoading: boolean
  remoteControlStatus: RemoteControlStatus
  loadSettings: () => Promise<void>
  updateSettings: (partial: Partial<NotificationSettings>) => Promise<void>
  playSound: (type: 'success' | 'error' | 'info') => void
}

const soundCache = new Map<string, HTMLAudioElement>()

function getSound(preset: SoundPreset, type: string): HTMLAudioElement {
  const key = `${preset}-${type}`
  if (!soundCache.has(key)) {
    const audio = new Audio(`/sounds/${preset}-${type}.mp3`)
    audio.preload = 'auto'
    soundCache.set(key, audio)
  }
  return soundCache.get(key)!
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  settings: DEFAULT_NOTIFICATION_SETTINGS,
  isLoading: false,
  remoteControlStatus: 'disconnected',

  loadSettings: async () => {
    set({ isLoading: true })
    try {
      const settings = await api.notification.getSettings()
      set({ settings: settings ?? DEFAULT_NOTIFICATION_SETTINGS, isLoading: false })
    } catch (error) {
      console.error('Failed to load notification settings:', error)
      set({ isLoading: false })
    }
  },

  updateSettings: async (partial) => {
    const current = get().settings
    const updated = { ...current, ...partial }
    set({ settings: updated })
    try {
      await api.notification.setSettings(partial)
    } catch (error) {
      console.error('Failed to save notification settings:', error)
      set({ settings: current })
    }
  },

  playSound: (type) => {
    const { settings } = get()
    if (!settings.soundEnabled) return
    try {
      const audio = getSound(settings.soundPreset, type)
      audio.currentTime = 0
      audio.play().catch(() => {})
    } catch {
      // Ignore sound errors
    }
  }
}))

// Setup notification event listener — call once in App
export function setupNotificationListener(): () => void {
  const handleEvent = (event: NotificationEvent) => {
    const { playSound } = useNotificationStore.getState()
    switch (event.type) {
      case 'taskComplete':
        playSound('success')
        break
      case 'taskFailed':
        playSound('error')
        break
      case 'reviewNeeded':
        playSound('info')
        break
    }
  }

  const cleanupEvent = api.notification.onEvent(handleEvent as (event: unknown) => void)
  const cleanupRemoteStatus = api.notification.onRemoteControlStatus((status) => {
    useNotificationStore.setState({ remoteControlStatus: status })
  })

  api.notification.getRemoteControlStatus().then((status) => {
    if (status) useNotificationStore.setState({ remoteControlStatus: status })
  })

  return () => {
    cleanupEvent()
    cleanupRemoteStatus()
  }
}
