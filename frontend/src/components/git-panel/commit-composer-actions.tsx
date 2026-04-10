import { useEffect, useRef, useState } from 'react'

interface CommitComposerActionsProps {
  canCommit: boolean
  isCommitting: boolean
  onCommit: () => Promise<void>
  onCommitAndPush?: () => Promise<void>
}

export function CommitComposerActions({
  canCommit,
  isCommitting,
  onCommit,
  onCommitAndPush,
}: CommitComposerActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="commit-composer-actions" ref={menuRef}>
      <button
        type="button"
        onClick={() => void onCommit()}
        disabled={!canCommit}
        className="commit-composer-primary-action"
      >
        {isCommitting ? 'Committing…' : 'Commit'}
      </button>

      {onCommitAndPush && (
        <div className="commit-composer-menu">
          <button
            type="button"
            onClick={() => canCommit && setMenuOpen((current) => !current)}
            disabled={!canCommit}
            className="commit-composer-secondary-action"
            aria-label="More commit actions"
          >
            ▾
          </button>

          {menuOpen && (
            <div className="commit-composer-menu-popover">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  void onCommitAndPush()
                }}
                className="commit-composer-menu-item"
              >
                Commit &amp; Push
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
