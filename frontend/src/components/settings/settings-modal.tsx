import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '../../stores'
import { SettingsPanelContent } from './settings-panel-content'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { cancelSettings } = useSettingsStore()

  const handleCancel = useCallback(() => {
    cancelSettings()
    onClose()
  }, [cancelSettings, onClose])

  // ESC key to close (cancel changes)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel()
    }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, handleCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 top-10 z-50 flex items-center justify-center">
      {/* Backdrop - dark mode: black 80%, light mode: white 80% - starts below titlebar */}
      <div
        data-testid="settings-backdrop"
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Modal - centered with max dimensions */}
      <div data-testid="settings-modal" className="relative bg-[var(--mc-bg-primary)] shadow-xl flex flex-col overflow-hidden rounded-xl" style={{ border: '1px solid color-mix(in srgb, var(--mc-accent) 30%, var(--mc-border))', width: 'calc(100% - 80px)', height: 'calc(100% - 60px)' }}>
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '25px 40px 25px 32px', borderBottom: '1px solid color-mix(in srgb, var(--mc-accent) 20%, var(--mc-border))' }}>
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span style={{ color: 'var(--mc-accent)' }}><SettingsIcon /></span>
              Settings
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--mc-accent)', opacity: 0.7 }}>App Settings & Project Settings</p>
          </div>
          <button
            data-testid="settings-modal-close-button"
            onClick={handleCancel}
            className="p-1.5 rounded transition-colors hover:bg-[var(--mc-bg-hover)]"
            style={{ color: 'var(--mc-accent)', border: 'none', background: 'transparent', cursor: 'pointer' }}
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <SettingsPanelContent onClose={handleCancel} />
      </div>
    </div>
  )
}

// Icons
function SettingsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
