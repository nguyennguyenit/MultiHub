// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { formatPathForTerminal, joinPathsForTerminal } from './terminal-path-utils'

describe('formatPathForTerminal', () => {
  it('returns plain paths unchanged', () => {
    expect(formatPathForTerminal('/usr/bin/node')).toBe('/usr/bin/node')
    expect(formatPathForTerminal('relative/path')).toBe('relative/path')
  })

  it('quotes paths with spaces', () => {
    expect(formatPathForTerminal('/path with spaces/file')).toBe('"/path with spaces/file"')
  })

  it('quotes paths with special shell characters', () => {
    expect(formatPathForTerminal('/path$var')).toBe('"/path$var"')
    expect(formatPathForTerminal('/path&file')).toBe('"/path&file"')
    expect(formatPathForTerminal('/path|pipe')).toBe('"/path|pipe"')
  })

  it('escapes inner double-quotes', () => {
    expect(formatPathForTerminal('/path "with" quotes')).toBe('"/path \\"with\\" quotes"')
  })
})

describe('joinPathsForTerminal', () => {
  it('joins multiple plain paths with spaces', () => {
    expect(joinPathsForTerminal(['/a/b', '/c/d'])).toBe('/a/b /c/d')
  })

  it('filters out empty strings', () => {
    expect(joinPathsForTerminal(['/a/b', '', '/c/d'])).toBe('/a/b /c/d')
  })

  it('quotes paths that need quoting', () => {
    expect(joinPathsForTerminal(['/a/b', '/path with space'])).toBe('/a/b "/path with space"')
  })

  it('returns empty string for empty array', () => {
    expect(joinPathsForTerminal([])).toBe('')
  })
})
