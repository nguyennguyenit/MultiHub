import { getGlobalShortcut, shouldBypassXtermShortcut } from './shortcut-utils'

function createShortcutEvent(overrides: Partial<Parameters<typeof getGlobalShortcut>[0]> = {}) {
  return {
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    key: '',
    code: '',
    ...overrides,
  }
}

describe('shortcut-utils', () => {
  test('maps Alt+digit to project switching', () => {
    expect(getGlobalShortcut(createShortcutEvent({
      altKey: true,
      key: '2',
      code: 'Digit2',
    }))).toEqual({ type: 'switch-project', index: 1 })
  })

  test('maps terminal and GitHub shortcuts for ctrl/meta modifiers', () => {
    expect(getGlobalShortcut(createShortcutEvent({
      ctrlKey: true,
      key: 'n',
      code: 'KeyN',
    }))).toEqual({ type: 'new-terminal' })

    expect(getGlobalShortcut(createShortcutEvent({
      ctrlKey: true,
      key: 't',
      code: 'KeyT',
    }))).toEqual({ type: 'new-terminal' })

    expect(getGlobalShortcut(createShortcutEvent({
      metaKey: true,
      key: 'w',
      code: 'KeyW',
    }))).toEqual({ type: 'close-terminal' })

    expect(getGlobalShortcut(createShortcutEvent({
      ctrlKey: true,
      key: 'g',
      code: 'KeyG',
    }))).toEqual({ type: 'toggle-github-panel' })

    expect(getGlobalShortcut(createShortcutEvent({
      metaKey: true,
      key: 'n',
      code: '',
    }))).toEqual({ type: 'new-terminal' })
  })

  test('only bypasses xterm shortcuts when a global shortcut matches', () => {
    expect(shouldBypassXtermShortcut(createShortcutEvent({
      ctrlKey: true,
      key: 'g',
      code: 'KeyG',
    }))).toBe(true)

    expect(shouldBypassXtermShortcut(createShortcutEvent({
      key: 'x',
      code: 'KeyX',
    }))).toBe(false)
  })
})
