import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const globalsCss = readFileSync(join(process.cwd(), 'src/styles/globals.css'), 'utf8')
const shellCss = readFileSync(join(process.cwd(), 'src/styles/shell.css'), 'utf8')
const panelsCss = readFileSync(join(process.cwd(), 'src/styles/panels.css'), 'utf8')
const workspaceCss = readFileSync(join(process.cwd(), 'src/styles/workspace.css'), 'utf8')

describe('shell frame token ownership', () => {
  test('keeps compatibility aliases in globals.css', () => {
    expect(globalsCss).toContain('--mc-bg-primary: var(--bg-primary);')
    expect(globalsCss).toContain('--mc-terminal-font: var(--terminal-font);')
  })

  test('keeps live shell frame tokens out of globals.css', () => {
    expect(globalsCss).not.toMatch(/^\s*--toolbar-height:/m)
    expect(globalsCss).not.toMatch(/^\s*--panel-width:/m)
  })

  test('defines live shell frame tokens in shell.css', () => {
    expect(shellCss).toMatch(/^\s*--toolbar-height:\s*\d+px;/m)
    expect(shellCss).toMatch(/^\s*--panel-width:\s*clamp\(420px,\s*34vw,\s*560px\);/m)
    expect(shellCss).toMatch(/^\s*--github-panel-width:\s*clamp\(460px,\s*38vw,\s*620px\);/m)
  })

  test('keeps shell and panel geometry out of globals.css', () => {
    expect(globalsCss).not.toContain('.toolbar {')
    expect(globalsCss).not.toContain('.toolbar-group {')
    expect(globalsCss).not.toContain('.toolbar-brand {')
    expect(globalsCss).not.toContain('.toolbar-btn {')
    expect(globalsCss).not.toContain('.terminal-grid {')
    expect(globalsCss).not.toContain('.pane-tab-bar {')
    expect(globalsCss).not.toContain('.terminal-status-bar {')
    expect(globalsCss).not.toContain('.welcome-screen {')
    expect(globalsCss).not.toContain('.slide-panel {')
    expect(globalsCss).not.toContain('.slide-panel-open {')
    expect(globalsCss).not.toContain('.slide-panel-right.slide-panel-open {')
    expect(globalsCss).not.toContain('.slide-panel-bottom.slide-panel-open {')
  })

  test('keeps workspace chrome out of panels.css', () => {
    expect(panelsCss).not.toContain('.terminal-status-bar {')
    expect(panelsCss).not.toContain('.terminal-count-label {')
    expect(panelsCss).not.toContain('.status-btn {')
  })

  test('defines shell geometry in shell.css, workspace chrome in workspace.css, and drawer geometry in panels.css', () => {
    expect(shellCss).toContain('.toolbar {')
    expect(shellCss).toContain('.toolbar-drag {')
    expect(shellCss).toContain('.toolbar-group-left {')
    expect(shellCss).toContain('.toolbar-btn.highlight {')
    expect(shellCss).toContain('.toolbar-btn-badge {')
    expect(shellCss).toContain('.window-controls {')

    expect(workspaceCss).toContain('.welcome-screen {')
    expect(workspaceCss).toContain('.terminal-grid {')
    expect(workspaceCss).toContain('.terminal-row {')
    expect(workspaceCss).toContain('.terminal-cell {')
    expect(workspaceCss).toContain('.pane-tab-bar {')
    expect(workspaceCss).toContain('.pane-tab {')
    expect(workspaceCss).toContain('.terminal-status-bar {')
    expect(workspaceCss).toContain('.status-btn {')

    expect(panelsCss).toContain('.slide-panel {')
    expect(panelsCss).toContain('.slide-panel-open {')
    expect(panelsCss).toContain('.slide-panel-right.slide-panel-open {')
    expect(panelsCss).toContain('.slide-panel-bottom.slide-panel-open {')
    expect(panelsCss).toContain('.slide-panel-close:hover {')
  })
})
