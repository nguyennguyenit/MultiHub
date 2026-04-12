import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const globalsCss = readFileSync(join(process.cwd(), 'src/styles/globals.css'), 'utf8')
const shellCss = readFileSync(join(process.cwd(), 'src/styles/shell.css'), 'utf8')

describe('toolbar density contract', () => {
  test('keeps the top shell materially denser than the phase-02 frame', () => {
    expect(shellCss).toMatch(/^\s*--toolbar-height:\s*44px;/m)
    expect(shellCss).toMatch(/\.toolbar-btn\s*\{[^}]*width:\s*30px;[^}]*height:\s*30px;/s)
    expect(shellCss).toMatch(/\.project-dropdown-trigger\s*\{[^}]*height:\s*32px;/s)
    expect(shellCss).toMatch(/\.toolbar-add-project\s*\{[^}]*height:\s*32px;/s)
    expect(shellCss).toMatch(/\.toolbar-terminal-summary\s*\{[^}]*height:\s*32px;/s)
  })

  test('keeps context and update chrome compressed', () => {
    expect(shellCss).toMatch(/\.toolbar-context-card\s*\{[^}]*border:\s*none;[^}]*background:\s*transparent;/s)
    expect(globalsCss).toMatch(/\.update-banner\s*\{[^}]*height:\s*30px;/s)
  })
})
