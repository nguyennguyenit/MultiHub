import { create } from 'zustand'
import type { UpdateState } from '@shared/types'
import { api } from '../api'

interface UpdateStore {
  state: UpdateState
  isLoading: boolean
  loadState: () => Promise<void>
  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  installUpdate: () => Promise<void>
}

const DEFAULT_STATE: UpdateState = {
  status: 'idle',
  currentVersion: '',
  latestVersion: null,
  releaseNotes: null,
  downloadProgress: 0,
  error: null,
  installMode: 'auto-install'
}

export const useUpdateStore = create<UpdateStore>((set) => ({
  state: DEFAULT_STATE,
  isLoading: false,

  loadState: async () => {
    set({ isLoading: true })
    try {
      const state = await api.update.getState()
      set({ state: state ?? DEFAULT_STATE, isLoading: false })
    } catch (error) {
      console.error('Failed to load update state:', error)
      set({ isLoading: false })
    }
  },

  checkForUpdates: async () => {
    try {
      const state = await api.update.check()
      if (state) set({ state })
    } catch (error) {
      console.error('Failed to check for updates:', error)
    }
  },

  downloadUpdate: async () => {
    try {
      await api.update.download()
    } catch (error) {
      console.error('Failed to download update:', error)
    }
  },

  installUpdate: async () => {
    try {
      await api.update.install()
    } catch (error) {
      console.error('Failed to install update:', error)
    }
  }
}))

// Setup IPC listener — call once in App
export function setupUpdateListener(): () => void {
  return api.update.onStatusChanged((state) => {
    useUpdateStore.setState({ state })
  })
}
