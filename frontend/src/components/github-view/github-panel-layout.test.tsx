import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { GitHubPanelContent } from './github-view'

const useGitPanelMock = vi.fn()

vi.mock('../../hooks/use-git-panel', () => ({
  useGitPanel: (...args: unknown[]) => useGitPanelMock(...args),
}))

vi.mock('../git-panel/commit-form', () => ({
  CommitForm: () => <div data-testid="commit-form-stub">commit form</div>,
}))

vi.mock('../git-panel/changes-list', () => ({
  ChangesList: () => <div data-testid="changes-list-stub">changes list</div>,
}))

vi.mock('../git-panel/history-tab', () => ({
  HistoryTab: () => <div data-testid="history-tab-stub">history tab</div>,
}))

vi.mock('../git-panel/stash-tab', () => ({
  StashTab: () => <div data-testid="stash-tab-stub">stash tab</div>,
}))

vi.mock('../git-panel/diff-modal', () => ({
  DiffModal: () => null,
}))

vi.mock('../git-panel/collapsible-section', () => ({
  CollapsibleSection: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section>
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  ),
}))

vi.mock('./issues-tab', () => ({
  IssuesTab: () => <div data-testid="issues-tab-stub">issues tab</div>,
}))

vi.mock('./prs-tab', () => ({
  PRsTab: () => <div data-testid="prs-tab-stub">prs tab</div>,
}))

vi.mock('./github-account-section', () => ({
  GitHubAccountSection: () => <div data-testid="github-account-stub">account section</div>,
}))

vi.mock('./branch-diff-file-list', () => ({
  BranchDiffFileList: () => <div data-testid="branch-diff-stub">branch diff</div>,
}))

function createGitPanelState() {
  return {
    gitStatus: {
      isRepo: true,
      branch: 'feature/panel-redesign',
      hasRemote: true,
      remoteName: 'origin',
      remoteUrl: 'https://github.com/acme/multihub.git',
      isDirty: true,
      staged: 1,
      unstaged: 1,
      untracked: 0,
    },
    files: [
      { path: 'src/app.tsx', status: 'modified', staged: false, additions: 4, deletions: 1 },
      { path: 'README.md', status: 'staged', staged: true, additions: 2, deletions: 0 },
    ],
    selectedFile: null,
    diff: null,
    isLoading: false,
    branches: [
      {
        name: 'feature/panel-redesign',
        current: true,
        commit: 'abc1234',
        label: 'feature/panel-redesign',
        isRemote: false,
      },
    ],
    currentBranch: 'feature/panel-redesign',
    branchDiff: {
      baseBranch: 'main',
      files: [],
      aheadBy: 2,
      behindBy: 0,
    },
    baseBranch: 'main',
    setBaseBranch: vi.fn(),
    logEntries: [],
    stashEntries: [],
    refresh: vi.fn(),
    refreshAll: vi.fn(),
    selectFile: vi.fn(),
    stageFile: vi.fn(),
    unstageFile: vi.fn(),
    stageAll: vi.fn(),
    discardFile: vi.fn(),
    commit: vi.fn().mockResolvedValue(true),
    pull: vi.fn().mockResolvedValue({ success: true }),
    fetch: vi.fn().mockResolvedValue({ success: true }),
    push: vi.fn().mockResolvedValue(true),
    checkoutBranch: vi.fn().mockResolvedValue(undefined),
    createBranch: vi.fn().mockResolvedValue(undefined),
    deleteBranch: vi.fn().mockResolvedValue(undefined),
    mergeBranch: vi.fn().mockResolvedValue(undefined),
    stashSave: vi.fn().mockResolvedValue(undefined),
    stashApply: vi.fn().mockResolvedValue(undefined),
    stashPop: vi.fn().mockResolvedValue(undefined),
    stashDrop: vi.fn().mockResolvedValue(undefined),
  }
}

describe('GitHubPanelContent', () => {
  beforeEach(() => {
    useGitPanelMock.mockReturnValue(createGitPanelState())
  })

  test('keeps the no-project empty state when no project is selected', () => {
    render(<GitHubPanelContent projectPath={undefined} />)

    expect(screen.getByText('No Project Selected')).toBeInTheDocument()
    expect(screen.getByText('Select a project from the toolbar to view Git status')).toBeInTheDocument()
  })

  test('renders the repo summary shell and tab contract with changes active by default', () => {
    render(<GitHubPanelContent projectPath="/tmp/repo" />)

    const shell = document.querySelector('.github-panel-shell')
    expect(shell).not.toBeNull()
    expect(screen.getByTestId('github-panel-summary')).toBeInTheDocument()
    expect(screen.getByTestId('github-panel-tabs')).toBeInTheDocument()
    expect(screen.getByTestId('github-panel-tab-changes')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('github-panel-tab-history')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('github-panel-tab-github')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByTestId('github-panel-tabpanel-changes')).toBeInTheDocument()
    expect(shell).toContainElement(screen.getByTestId('github-panel-summary'))
    expect(shell).toContainElement(screen.getByTestId('github-panel-tabs'))
  })

  test('switches between changes, history, and GitHub tabs', async () => {
    const user = userEvent.setup()

    render(<GitHubPanelContent projectPath="/tmp/repo" />)

    await user.click(screen.getByTestId('github-panel-tab-history'))
    expect(screen.getByTestId('github-panel-tabpanel-history')).toBeInTheDocument()

    await user.click(screen.getByTestId('github-panel-tab-github'))
    expect(screen.getByTestId('github-panel-tabpanel-github')).toBeInTheDocument()

    await user.click(screen.getByTestId('github-panel-tab-changes'))
    expect(screen.getByTestId('github-panel-tabpanel-changes')).toBeInTheDocument()
  })
})
