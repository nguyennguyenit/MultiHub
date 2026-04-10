import { useState, useCallback, DragEvent } from 'react'
import { ResolveFilePaths, CanResolveFilePaths } from '../../wailsjs/runtime/runtime'

interface UseFileDropOptions {
  onDrop: (paths: string[]) => void
  onDragStateChange?: (isDragOver: boolean) => void
}

interface UseFileDropReturn {
  isDragOver: boolean
  dropHandlers: {
    onDragEnter: (e: DragEvent) => void
    onDragOver: (e: DragEvent) => void
    onDragLeave: (e: DragEvent) => void
    onDrop: (e: DragEvent) => void
  }
}

function isFileDrag(e: DragEvent): boolean {
  return Array.from(e.dataTransfer?.types ?? []).includes('Files')
}

/**
 * Hook for handling file drag-drop into a component.
 * Uses Wails ResolveFilePaths to obtain native file paths from dropped File objects.
 */
export function useFileDrop(options: UseFileDropOptions): UseFileDropReturn {
  const { onDrop, onDragStateChange } = options
  const [isDragOver, setIsDragOver] = useState(false)
  const [, setDragCounter] = useState(0)

  const handleDragEnter = useCallback((e: DragEvent) => {
    if (!isFileDrag(e)) return
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => {
      if (prev === 0) {
        setIsDragOver(true)
        onDragStateChange?.(true)
      }
      return prev + 1
    })
  }, [onDragStateChange])

  const handleDragOver = useCallback((e: DragEvent) => {
    if (!isFileDrag(e)) return
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    if (!isFileDrag(e)) return
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => {
      const next = prev - 1
      if (next <= 0) {
        setIsDragOver(false)
        onDragStateChange?.(false)
        return 0
      }
      return next
    })
  }, [onDragStateChange])

  const handleDrop = useCallback(async (e: DragEvent) => {
    if (!isFileDrag(e)) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setDragCounter(0)
    onDragStateChange?.(false)

    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)

    // Use Wails runtime to resolve native file paths if supported
    if (CanResolveFilePaths()) {
      ResolveFilePaths(fileArray)
      const paths = fileArray.map(f => (f as unknown as { path?: string }).path ?? f.name).filter(Boolean)
      if (paths.length > 0) onDrop(paths)
    } else {
      // Fallback: use file names (no full path available without native support)
      const paths = fileArray.map(f => f.name).filter(Boolean)
      if (paths.length > 0) onDrop(paths)
    }
  }, [onDrop, onDragStateChange])

  return {
    isDragOver,
    dropHandlers: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop
    }
  }
}
