import { useEffect, useMemo, useRef, useState } from 'react'
import { TEST_IDS, getQuickSwitcherItemTestId } from '@shared/constants'

export interface QuickSwitcherItem {
  id: string
  title: string
  subtitle: string
  group: string
  keywords?: string[]
}

interface QuickSwitcherDialogProps {
  isOpen: boolean
  items: QuickSwitcherItem[]
  onClose: () => void
  onSelect: (item: QuickSwitcherItem) => void
}

interface QuickSwitcherItemGroup {
  group: string
  items: QuickSwitcherItem[]
}

function matchesQuery(item: QuickSwitcherItem, query: string): boolean {
  if (!query) return true

  const haystack = [
    item.title,
    item.subtitle,
    item.group,
    ...(item.keywords ?? []),
  ].join(' ').toLowerCase()

  return haystack.includes(query)
}

export function QuickSwitcherDialog({
  isOpen,
  items,
  onClose,
  onSelect,
}: QuickSwitcherDialogProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const shouldRestoreFocusRef = useRef(true)

  const filteredGroups = useMemo<QuickSwitcherItemGroup[]>(() => {
    const groups = new Map<string, QuickSwitcherItem[]>()

    for (const item of items) {
      if (!matchesQuery(item, query.trim().toLowerCase())) continue

      const groupItems = groups.get(item.group) ?? []
      groupItems.push(item)
      groups.set(item.group, groupItems)
    }

    return Array.from(groups.entries()).map(([group, groupItems]) => ({
      group,
      items: groupItems,
    }))
  }, [items, query])

  const filteredItems = useMemo(
    () => filteredGroups.flatMap((group) => group.items),
    [filteredGroups]
  )

  useEffect(() => {
    if (isOpen) {
      shouldRestoreFocusRef.current = true
      previouslyFocusedRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      setQuery('')
      setActiveIndex(0)
      inputRef.current?.focus()
      return
    }

    if (shouldRestoreFocusRef.current) {
      previouslyFocusedRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    setActiveIndex((current) => {
      if (filteredItems.length === 0) return 0
      return Math.min(current, filteredItems.length - 1)
    })
  }, [filteredItems.length])

  const handleSelectItem = (item: QuickSwitcherItem) => {
    shouldRestoreFocusRef.current = false
    onSelect(item)
    onClose()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (filteredItems.length === 0 ? 0 : (current + 1) % filteredItems.length))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => (
        filteredItems.length === 0
          ? 0
          : (current - 1 + filteredItems.length) % filteredItems.length
      ))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const selectedItem = filteredItems[activeIndex]
      if (selectedItem) {
        handleSelectItem(selectedItem)
      }
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  if (!isOpen) {
    return null
  }

  const activeDescendant = filteredItems[activeIndex]
    ? getQuickSwitcherItemTestId(filteredItems[activeIndex].id)
    : undefined

  let runningIndex = -1

  return (
    <div
      className="quick-switcher-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          event.preventDefault()
          event.stopPropagation()
          onClose()
        }
      }}
    >
      <div
        className="quick-switcher-dialog"
        data-testid={TEST_IDS.palette.root}
        role="dialog"
        aria-modal="true"
        aria-label="Workspace omnibox"
      >
        <div className="quick-switcher-search">
          <div className="quick-switcher-intro">
            <span className="quick-switcher-kicker" id="workspace-omnibox-title">Workspace Omnibox</span>
            <p className="quick-switcher-description" id="workspace-omnibox-description">
              Projects, terminals, drawers, and shell actions only.
            </p>
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            className="quick-switcher-input"
            data-testid={TEST_IDS.palette.input}
            role="combobox"
            aria-label="Search workspace omnibox"
            aria-describedby="workspace-omnibox-description"
            aria-controls={TEST_IDS.palette.list}
            aria-activedescendant={activeDescendant}
            aria-expanded="true"
            aria-autocomplete="list"
            placeholder="Jump to project, terminal, drawer, or action"
            spellCheck={false}
          />
        </div>

        <div
          id={TEST_IDS.palette.list}
          className="quick-switcher-list"
          data-testid={TEST_IDS.palette.list}
          role="listbox"
          aria-label="Workspace omnibox results"
        >
          {filteredGroups.length === 0 ? (
            <div
              className="quick-switcher-empty-state"
              data-testid={TEST_IDS.palette.emptyState}
            >
              No matching actions
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.group} className="quick-switcher-group">
                <div className="quick-switcher-group-label">{group.group}</div>
                <div className="quick-switcher-group-items">
                  {group.items.map((item) => {
                    runningIndex += 1
                    const itemIndex = runningIndex
                    const itemDomId = getQuickSwitcherItemTestId(item.id)

                    return (
                      <button
                        key={item.id}
                        id={itemDomId}
                        type="button"
                        className={`quick-switcher-item${itemIndex === activeIndex ? ' is-active' : ''}`}
                        data-testid={itemDomId}
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                        onClick={() => handleSelectItem(item)}
                        aria-selected={itemIndex === activeIndex}
                        role="option"
                      >
                        <div className="quick-switcher-item-copy">
                          <span className="quick-switcher-item-title">{item.title}</span>
                          <span className="quick-switcher-item-subtitle">{item.subtitle}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
