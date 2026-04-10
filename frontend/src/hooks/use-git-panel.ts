import { useState, useEffect, useCallback, useRef } from 'react'
import type { GitFileStatus, GitBranch, GitLogEntry, GitStashEntry, GitStatus, GitBranchDiff } from '@shared/types'
import { api } from '../api'

interface UseGitPanelOptions {
  projectPath: string | undefined
  enabled?: boolean
}

interface UseGitPanelReturn {
  gitStatus: GitStatus | null
  files: GitFileStatus[]
  selectedFile: string | null
  diff: string | null
  isLoading: boolean
  branches: GitBranch[]
  currentBranch: string | undefined
  branchDiff: GitBranchDiff | null
  baseBranch: string
  setBaseBranch: (branch: string) => void
  logEntries: GitLogEntry[]
  stashEntries: GitStashEntry[]
  refresh: () => Promise<void>
  refreshAll: () => Promise<void>
  selectFile: (path: string | null) => void
  stageFile: (path: string) => Promise<void>
  unstageFile: (path: string) => Promise<void>
  stageAll: () => Promise<void>
  discardFile: (path: string) => Promise<void>
  commit: (message: string) => Promise<boolean>
  pull: () => Promise<{ success: boolean; message?: string; error?: string }>
  fetch: () => Promise<{ success: boolean; message?: string; error?: string }>
  push: () => Promise<boolean>
  checkoutBranch: (name: string) => Promise<void>
  createBranch: (name: string) => Promise<void>
  deleteBranch: (name: string, force?: boolean) => Promise<void>
  mergeBranch: (branch: string) => Promise<void>
  stashSave: (message?: string) => Promise<void>
  stashApply: (index: number) => Promise<void>
  stashPop: (index: number) => Promise<void>
  stashDrop: (index: number) => Promise<void>
}

export function useGitPanel({ projectPath, enabled = true }: UseGitPanelOptions): UseGitPanelReturn {
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null)
  const [files, setFiles] = useState<GitFileStatus[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [diff, setDiff] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [branches, setBranches] = useState<GitBranch[]>([])
  const [logEntries, setLogEntries] = useState<GitLogEntry[]>([])
  const [stashEntries, setStashEntries] = useState<GitStashEntry[]>([])
  const [branchDiff, setBranchDiff] = useState<GitBranchDiff | null>(null)
  const [baseBranch, setBaseBranch] = useState<string>('main')
  const baseBranchRef = useRef(baseBranch)
  baseBranchRef.current = baseBranch
  const currentBranch = gitStatus?.branch
  const isRefreshingRef = useRef(false)

  const refresh = useCallback(async () => {
    if (!projectPath || !enabled || isRefreshingRef.current) return
    isRefreshingRef.current = true
    setIsLoading(true)
    try {
      const [status, fileStatus] = await Promise.all([
        api.git.status(projectPath),
        api.git.fileStatus(projectPath)
      ])
      setGitStatus(status)
      setFiles(fileStatus ?? [])
    } finally {
      setIsLoading(false)
      isRefreshingRef.current = false
    }
  }, [projectPath, enabled])

  const refreshAll = useCallback(async () => {
    if (!projectPath || !enabled || isRefreshingRef.current) return
    isRefreshingRef.current = true
    setIsLoading(true)
    try {
      const [status, fileStatus, branchList, log, stash, brDiff] = await Promise.all([
        api.git.status(projectPath),
        api.git.fileStatus(projectPath),
        api.git.branches(projectPath),
        api.git.log(projectPath, 50),
        api.git.stashList(projectPath),
        api.git.diffBranch(projectPath, baseBranchRef.current)
      ])
      setGitStatus(status)
      setFiles(fileStatus ?? [])
      setBranches(branchList ?? [])
      setLogEntries(log ?? [])
      setStashEntries(stash ?? [])
      if (brDiff) {
        setBranchDiff(brDiff)
        if (brDiff.baseBranch && brDiff.baseBranch !== baseBranchRef.current) {
          setBaseBranch(brDiff.baseBranch)
        }
      }
    } finally {
      setIsLoading(false)
      isRefreshingRef.current = false
    }
  }, [projectPath, enabled])

  const selectFile = useCallback(async (path: string | null) => {
    setSelectedFile(path)
    if (!path || !projectPath) { setDiff(null); return }
    const file = files.find(f => f.path === path)
    const result = await api.git.diff(projectPath, path, file?.staged ?? false, file?.oldPath ?? '')
    setDiff(result?.success ? result.diff || '' : null)
  }, [projectPath, files])

  const stageFile = useCallback(async (path: string) => {
    if (!projectPath) return
    await api.git.stageFile(projectPath, path)
    await refresh()
  }, [projectPath, refresh])

  const unstageFile = useCallback(async (path: string) => {
    if (!projectPath) return
    await api.git.unstageFile(projectPath, path)
    await refresh()
  }, [projectPath, refresh])

  const stageAll = useCallback(async () => {
    if (!projectPath) return
    await api.git.stageAll(projectPath)
    await refresh()
  }, [projectPath, refresh])

  const discardFile = useCallback(async (path: string) => {
    if (!projectPath) return
    await api.git.discard(projectPath, path)
    await refresh()
    if (selectedFile === path) { setSelectedFile(null); setDiff(null) }
  }, [projectPath, refresh, selectedFile])

  const commit = useCallback(async (message: string): Promise<boolean> => {
    if (!projectPath || !message.trim()) return false
    const result = await api.git.commit(projectPath, message)
    if (result?.success) {
      await refreshAll()
      setSelectedFile(null)
      setDiff(null)
    }
    return result?.success ?? false
  }, [projectPath, refreshAll])

  const pull = useCallback(async () => {
    if (!projectPath) return { success: false, error: 'No project' }
    await api.git.pull(projectPath)
    await refreshAll()
    return { success: true }
  }, [projectPath, refreshAll])

  const fetch = useCallback(async () => {
    if (!projectPath) return { success: false, error: 'No project' }
    await api.git.fetch(projectPath)
    await refreshAll()
    return { success: true }
  }, [projectPath, refreshAll])

  const push = useCallback(async (): Promise<boolean> => {
    if (!projectPath) return false
    try {
      await api.git.push(projectPath, '', false)
      await refresh()
      return true
    } catch {
      return false
    }
  }, [projectPath, refresh])

  const checkoutBranch = useCallback(async (name: string) => {
    if (!projectPath) return
    await api.git.checkoutBranch(projectPath, name)
    await refreshAll()
    window.dispatchEvent(new CustomEvent('git-status-changed', { detail: { projectPath } }))
  }, [projectPath, refreshAll])

  const createBranch = useCallback(async (name: string) => {
    if (!projectPath) return
    await api.git.createBranch(projectPath, name, true)
    await refreshAll()
    window.dispatchEvent(new CustomEvent('git-status-changed', { detail: { projectPath } }))
  }, [projectPath, refreshAll])

  const deleteBranch = useCallback(async (name: string, force = false) => {
    if (!projectPath) return
    await api.git.deleteBranch(projectPath, name, force)
    await refreshAll()
  }, [projectPath, refreshAll])

  const mergeBranch = useCallback(async (branch: string) => {
    if (!projectPath) return
    await api.git.merge(projectPath, branch)
    await refreshAll()
  }, [projectPath, refreshAll])

  const stashSave = useCallback(async (message?: string) => {
    if (!projectPath) return
    await api.git.stashSave(projectPath, message ?? '')
    await refreshAll()
  }, [projectPath, refreshAll])

  const stashApply = useCallback(async (index: number) => {
    if (!projectPath) return
    await api.git.stashApply(projectPath, index)
    await refreshAll()
  }, [projectPath, refreshAll])

  const stashPop = useCallback(async (index: number) => {
    if (!projectPath) return
    await api.git.stashPop(projectPath, index)
    await refreshAll()
  }, [projectPath, refreshAll])

  const stashDrop = useCallback(async (index: number) => {
    if (!projectPath) return
    await api.git.stashDrop(projectPath, index)
    await refreshAll()
  }, [projectPath, refreshAll])

  useEffect(() => {
    if (!enabled || !projectPath) return
    refreshAll()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [refresh, refreshAll, enabled, projectPath])

  return {
    gitStatus, files, selectedFile, diff, isLoading,
    branches, currentBranch, branchDiff, baseBranch, setBaseBranch,
    logEntries, stashEntries,
    refresh, refreshAll, selectFile,
    stageFile, unstageFile, stageAll, discardFile, commit,
    pull, fetch, push,
    checkoutBranch, createBranch, deleteBranch, mergeBranch,
    stashSave, stashApply, stashPop, stashDrop
  }
}
