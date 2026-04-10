import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GitBranch, GitFileStatus, GitStatus } from '@shared/types'
import { useGitPanel } from './use-git-panel'

const gitApiMock = vi.hoisted(() => ({
  status: vi.fn(),
  fileStatus: vi.fn(),
  branches: vi.fn(),
  log: vi.fn(),
  stashList: vi.fn(),
  diffBranch: vi.fn(),
  diff: vi.fn(),
  stageFile: vi.fn(),
  unstageFile: vi.fn(),
  stageAll: vi.fn(),
  discard: vi.fn(),
  commit: vi.fn(),
  pull: vi.fn(),
  fetch: vi.fn(),
  push: vi.fn(),
  checkoutBranch: vi.fn(),
  createBranch: vi.fn(),
  deleteBranch: vi.fn(),
  merge: vi.fn(),
  stashSave: vi.fn(),
  stashApply: vi.fn(),
  stashPop: vi.fn(),
  stashDrop: vi.fn(),
}))

vi.mock('../api', () => ({
  api: {
    git: gitApiMock,
  },
}))

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('useGitPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps repo state when branch diff loading fails', async () => {
    const status: GitStatus = {
      isRepo: true,
      branch: 'feature/test',
      hasRemote: true,
      remoteName: 'origin',
      remoteUrl: 'https://github.com/example/repo.git',
      isDirty: true,
      staged: 1,
      unstaged: 0,
      untracked: 0,
    }
    const files: GitFileStatus[] = [
      { path: 'README.md', status: 'staged', staged: true },
    ]
    const branches: GitBranch[] = [
      { name: 'feature/test', current: true, commit: 'abc1234', label: 'feature/test', isRemote: false },
    ]

    gitApiMock.status.mockResolvedValue(status)
    gitApiMock.fileStatus.mockResolvedValue(files)
    gitApiMock.branches.mockResolvedValue(branches)
    gitApiMock.log.mockResolvedValue([])
    gitApiMock.stashList.mockResolvedValue([])
    gitApiMock.diffBranch.mockRejectedValue(new Error('missing base branch'))

    const { result } = renderHook(() => useGitPanel({ projectPath: '/tmp/repo', enabled: true }))

    await waitFor(() => {
      expect(result.current.gitStatus).toEqual(status)
    })

    expect(result.current.files).toEqual(files)
    expect(result.current.branches).toEqual(branches)
    expect(result.current.branchDiff).toBeNull()
  })

  it('ignores stale repo responses after projectPath changes', async () => {
    const repoAStatus: GitStatus = {
      isRepo: true,
      branch: 'feature/a',
      hasRemote: true,
      remoteName: 'origin',
      remoteUrl: 'https://github.com/example/repo-a.git',
      isDirty: true,
      staged: 1,
      unstaged: 0,
      untracked: 0,
    }
    const repoBStatus: GitStatus = {
      isRepo: true,
      branch: 'feature/b',
      hasRemote: true,
      remoteName: 'origin',
      remoteUrl: 'https://github.com/example/repo-b.git',
      isDirty: false,
      staged: 0,
      unstaged: 2,
      untracked: 0,
    }
    const repoAFiles: GitFileStatus[] = [{ path: 'repo-a.txt', status: 'modified', staged: false }]
    const repoBFiles: GitFileStatus[] = [{ path: 'repo-b.txt', status: 'modified', staged: false }]
    const statusDeferred = createDeferred<GitStatus>()

    gitApiMock.status.mockImplementation((path: string) => {
      if (path === '/tmp/repo-a') return statusDeferred.promise
      return Promise.resolve(repoBStatus)
    })
    gitApiMock.fileStatus.mockImplementation((path: string) =>
      Promise.resolve(path === '/tmp/repo-a' ? repoAFiles : repoBFiles)
    )
    gitApiMock.branches.mockResolvedValue([])
    gitApiMock.log.mockResolvedValue([])
    gitApiMock.stashList.mockResolvedValue([])
    gitApiMock.diffBranch.mockResolvedValue({ baseBranch: 'main', files: [], aheadBy: 0, behindBy: 0 })

    const { result, rerender } = renderHook(
      ({ projectPath }) => useGitPanel({ projectPath, enabled: true }),
      { initialProps: { projectPath: '/tmp/repo-a' } }
    )

    rerender({ projectPath: '/tmp/repo-b' })

    await waitFor(() => {
      expect(result.current.gitStatus).toEqual(repoBStatus)
    })
    expect(result.current.files).toEqual(repoBFiles)

    statusDeferred.resolve(repoAStatus)

    await waitFor(() => {
      expect(result.current.gitStatus).toEqual(repoBStatus)
    })
    expect(result.current.files).toEqual(repoBFiles)
  })
})
