/**
 * Document-level file drop handler for Wails.
 * Uses Wails runtime OnFileDrop for native file path resolution.
 */

import { useAppStore } from '../stores'
import { joinPathsForTerminal } from './terminal-path-utils'
import { OnFileDrop, OnFileDropOff, ResolveFilePaths, CanResolveFilePaths } from '../../wailsjs/runtime/runtime'
import { api } from '../api'

const TERMINAL_DROP_TARGET_SELECTOR = '[data-terminal-id]'

let initialized = false
let pendingDropTerminalId: string | null = null

function getTerminalIdFromTarget(target: EventTarget | null | undefined): string | null {
  if (!target || typeof target !== 'object' || !('closest' in target)) return null
  const terminalElement = (target as {
    closest: (selector: string) => { dataset?: Record<string, string | undefined> } | null
  }).closest(TERMINAL_DROP_TARGET_SELECTOR)
  return terminalElement?.dataset?.terminalId ?? null
}

function getTerminalIdFromPoint(clientX: number, clientY: number): string | null {
  if (typeof document.elementFromPoint !== 'function') return null
  return getTerminalIdFromTarget(document.elementFromPoint(clientX, clientY))
}

export function setPendingDropTerminal(terminalId: string | null): void {
  pendingDropTerminalId = terminalId
}

export function clearPendingDropTerminal(terminalId?: string): void {
  if (terminalId && pendingDropTerminalId !== terminalId) return
  pendingDropTerminalId = null
}

export function resolvePreferredDropTerminalId(activeTerminalId: string | null, targetTerminalId: string | null): string | null {
  return targetTerminalId ?? activeTerminalId
}

export function writePathsToTerminal(terminalId: string, paths: string[]): void {
  const input = joinPathsForTerminal(paths)
  if (!input) return
  api.terminal.write(terminalId, input)
}

function resolveDropTerminalId(target?: EventTarget | null): string | null {
  return resolvePreferredDropTerminalId(
    useAppStore.getState().activeTerminalId,
    getTerminalIdFromTarget(target) ?? pendingDropTerminalId
  )
}

function writePathsToResolvedTerminal(paths: string[], target?: EventTarget | null): void {
  const terminalId = resolveDropTerminalId(target)
  if (!terminalId) return
  writePathsToTerminal(terminalId, paths)
}

async function extractFilePaths(files: FileList | null | undefined): Promise<string[]> {
  if (!files || files.length === 0) return []
  const fileArray = Array.from(files)
  if (CanResolveFilePaths()) {
    ResolveFilePaths(fileArray)
    return fileArray.map(f => (f as unknown as { path?: string }).path ?? f.name).filter(Boolean)
  }
  return fileArray.map(f => f.name).filter(Boolean)
}

export function initFileDropHandler(): void {
  if (initialized) return
  initialized = true

  document.addEventListener('dragover', (e) => {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    const hovered = getTerminalIdFromPoint(e.clientX, e.clientY) ?? getTerminalIdFromTarget(e.target)
    if (hovered) setPendingDropTerminal(hovered)
  })

  document.addEventListener('drop', async (e) => {
    e.preventDefault()
    const paths = await extractFilePaths(e.dataTransfer?.files)
    if (paths.length > 0) writePathsToResolvedTerminal(paths, e.target)
    clearPendingDropTerminal()
  })

  document.addEventListener('dragend', () => clearPendingDropTerminal())
  document.addEventListener('dragleave', (e) => { if (e.relatedTarget === null) clearPendingDropTerminal() })
  window.addEventListener('blur', () => clearPendingDropTerminal())

  // Wails native file drop handler (fires when files are dropped on the window)
  OnFileDrop((_x, _y, paths) => {
    writePathsToResolvedTerminal(paths)
    clearPendingDropTerminal()
  }, false)
}

export function disposeFileDropHandler(): void {
  if (!initialized) return
  OnFileDropOff()
  initialized = false
}
