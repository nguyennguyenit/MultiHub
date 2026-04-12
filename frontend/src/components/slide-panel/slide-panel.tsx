import { useEffect, useState } from 'react'

interface SlidePanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  testId?: string
  closeTestId?: string
  variant?: 'default' | 'github'
  /** Optional extra content rendered in the header, between the title and close button */
  headerExtra?: React.ReactNode
  children: React.ReactNode
}

/** Generic slide panel that overlays from right (landscape) or bottom (portrait) */
export function SlidePanel({
  isOpen,
  onClose,
  title,
  description,
  testId,
  closeTestId,
  variant = 'default',
  headerExtra,
  children,
}: SlidePanelProps) {
  const [isPortrait, setIsPortrait] = useState(
    () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth
  )

  useEffect(() => {
    const handleResize = () => setIsPortrait(window.innerHeight > window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Escape key closes active panel
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  const panelSide = isPortrait ? 'bottom' : 'right'
  const dirClass = `slide-panel-${panelSide}`
  const openClass = isOpen ? 'slide-panel-open' : ''

  return (
    <div
      className={`slide-panel slide-panel-${variant} ${dirClass} ${openClass} slide-panel-attached`}
      // visibility:hidden preserves child state (data, form state) when closed
      style={{ visibility: isOpen ? 'visible' : 'hidden' }}
      data-testid={testId}
      data-panel-variant={variant}
      data-panel-side={panelSide}
      data-panel-state={isOpen ? 'open' : 'closed'}
      data-panel-attached="true"
      role="dialog"
      aria-modal="false"
      aria-label={title}
      aria-hidden={!isOpen}
    >
      <div className="slide-panel-header">
        <div className="slide-panel-heading">
          <span className="slide-panel-title">{title}</span>
          {description && <span className="slide-panel-description">{description}</span>}
        </div>
        {headerExtra && (
          <div className="slide-panel-header-extra">
            {headerExtra}
          </div>
        )}
        <button
          type="button"
          className="slide-panel-close"
          onClick={onClose}
          aria-label={`Close ${title} panel`}
          title="Close (Esc)"
          data-testid={closeTestId}
        >
          ×
        </button>
      </div>
      <div className="slide-panel-body">
        {children}
      </div>
    </div>
  )
}
