// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { getShellKey } from './shell-utils'
import type { WindowsShell } from '@shared/types'

describe('getShellKey', () => {
  it('returns "cmd" for cmd shell', () => {
    const shell: WindowsShell = { type: 'cmd' }
    expect(getShellKey(shell)).toBe('cmd')
  })

  it('returns "powershell" for powershell shell', () => {
    const shell: WindowsShell = { type: 'powershell' }
    expect(getShellKey(shell)).toBe('powershell')
  })

  it('returns "wsl:<distro>" for WSL shells', () => {
    const shell: WindowsShell = { type: 'wsl', distro: 'Ubuntu-22.04' }
    expect(getShellKey(shell)).toBe('wsl:Ubuntu-22.04')
  })
})
