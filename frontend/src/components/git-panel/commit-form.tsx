import { useCallback, useRef, useState } from 'react'
import { CommitComposerActions } from './commit-composer-actions'

interface CommitFormProps {
  stagedCount: number
  onCommit: (message: string) => Promise<boolean>
  onCommitAndPush?: (message: string) => Promise<boolean>
}

export function CommitForm({ stagedCount, onCommit, onCommitAndPush }: CommitFormProps) {
  const [message, setMessage] = useState('')
  const [isCommitting, setIsCommitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const canCommit = !!message.trim() && stagedCount > 0 && !isCommitting

  const adjustTextareaHeight = useCallback(() => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 180)}px`
  }, [])

  const resetComposer = () => {
    setMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = ''
    }
  }

  const handleCommit = async () => {
    if (!canCommit) return
    setIsCommitting(true)
    const success = await onCommit(message)
    setIsCommitting(false)
    if (success) resetComposer()
  }

  const handleCommitAndPush = async () => {
    if (!canCommit || !onCommitAndPush) return
    setIsCommitting(true)
    const success = await onCommitAndPush(message)
    setIsCommitting(false)
    if (success) resetComposer()
  }

  return (
    <div className={`commit-composer ${stagedCount === 0 ? 'is-inactive' : ''}`}>
      <div className="commit-composer-header">
        <div className="commit-composer-copy">
          <span className="commit-composer-kicker">Commit</span>
          <span className="commit-composer-title">
            {stagedCount > 0 ? 'Summarize the staged work' : 'Stage files to unlock the composer'}
          </span>
        </div>
        <span className={`commit-composer-badge ${stagedCount > 0 ? 'is-ready' : ''}`}>
          {stagedCount} staged
        </span>
      </div>

      <textarea
        ref={textareaRef}
        value={message}
        onChange={(event) => {
          setMessage(event.target.value)
          adjustTextareaHeight()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault()
            if (event.shiftKey) {
              void handleCommitAndPush()
            } else {
              void handleCommit()
            }
          }
        }}
        placeholder={stagedCount > 0 ? 'Describe what changed…' : 'Stage one or more files to start composing a commit.'}
        rows={3}
        disabled={isCommitting}
        className="commit-composer-textarea"
      />

      <CommitComposerActions
        canCommit={canCommit}
        isCommitting={isCommitting}
        onCommit={handleCommit}
        onCommitAndPush={onCommitAndPush ? handleCommitAndPush : undefined}
      />

      <p className="commit-composer-hint">
        <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>Enter</kbd> commits. Add <kbd>Shift</kbd> to commit and push.
      </p>
    </div>
  )
}
