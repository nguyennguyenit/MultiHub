import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const shellCss = readFileSync(join(process.cwd(), 'src/styles/shell.css'), 'utf8')

describe('window chrome contract', () => {
  test('lets the shell absorb the top inset while keeping explicit drag boundaries', () => {
    expect(shellCss).toMatch(/^\s*--toolbar-safe-top:\s*env\(safe-area-inset-top,\s*0px\);/m)
    expect(shellCss).toMatch(
      /\.toolbar\s*\{[^}]*padding-top:\s*var\(--toolbar-safe-top\);[^}]*min-height:\s*calc\(var\(--toolbar-height\)\s*\+\s*var\(--toolbar-safe-top\)\);/s,
    )
    expect(shellCss).toMatch(/\.toolbar-drag\s*\{[^}]*-webkit-app-region:\s*drag;/s)
    expect(shellCss).toMatch(/\.toolbar-group\s*\{[^}]*-webkit-app-region:\s*no-drag;/s)
  })
})
