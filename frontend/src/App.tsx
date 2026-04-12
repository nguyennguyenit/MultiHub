import { useEffect, useCallback, useState, useRef, useMemo } from 'react'
import { Toolbar } from './components/toolbar'
import { UpdateBanner } from './components/update-banner'
import { TerminalGrid, TerminalActionBar } from './components/terminal'
import { WelcomeScreen } from './components/welcome-screen'
import { ToastContainer } from './components/toast-container'
import { SettingsPanelContent } from './components/settings'
import { SlidePanel } from './components/slide-panel'
import { QuickSwitcherDialog, type QuickSwitcherItem } from './components/quick-switcher'
import { GitHubPanelContent } from './components/github-view/github-view'
import { GitInitDialog, GitHubConnectDialog } from './components/github-setup'
import { useAppStore, useSettingsStore, useToastStore, setupNotificationListener, setupUpdateListener } from './stores'
import { useKeyboardShortcuts, TERMINAL_DISPOSE_DELAY } from './hooks'
import { joinPathsForTerminal } from './utils'
import { THEMES, APP_FONTS, TEST_IDS, getTerminalFontFamilyById } from '@shared/constants'
import type { WindowsShell, Project } from '@shared/types'
import { api } from './api'

function App() {
  const terminals = useAppStore((state) => state.terminals)
  const projects = useAppStore((state) => state.projects)
  const activeProjectId = useAppStore((state) => state.activeProjectId)
  const activeTerminalId = useAppStore((state) => state.activeTerminalId)
  const addTerminal = useAppStore((state) => state.addTerminal)
  const removeTerminal = useAppStore((state) => state.removeTerminal)
  const updateTerminalTitle = useAppStore((state) => state.updateTerminalTitle)
  const addProject = useAppStore((state) => state.addProject)
  const removeProject = useAppStore((state) => state.removeProject)
  const setProjects = useAppStore((state) => state.setProjects)
  const setActiveProject = useAppStore((state) => state.setActiveProject)
  const setActiveTerminal = useAppStore((state) => state.setActiveTerminal)
  const switchToProject = useAppStore((state) => state.switchToProject)

  const [activePanel, setActivePanel] = useState<string | null>(null)
  const [isQuickSwitcherOpen, setIsQuickSwitcherOpen] = useState(false)
  const togglePanel = useCallback((panel: string) => {
    setActivePanel(prev => prev === panel ? null : panel)
  }, [])

  const { pendingSettings, loadSettings, detectWsl, getTerminalLimitValue, cancelSettings } = useSettingsStore()

  const [gitInitDialogOpen, setGitInitDialogOpen] = useState(false)
  const [githubConnectDialogOpen, setGithubConnectDialogOpen] = useState(false)
  const [pendingSetupProject, setPendingSetupProject] = useState<Project | null>(null)

  const projectSelectionRequestRef = useRef(0)
  const activeProject = projects.find(p => p.id === activeProjectId)
  const showTerminalWorkspace = Boolean(activeProjectId || terminals.length > 0)
  const visibleTerminals = activeProjectId
    ? terminals.filter(t => t.projectId === activeProjectId)
    : terminals

  const handleAddProject = useCallback(async () => {
    const path = await api.project.openFolder()
    if (!path) return
    const name = path.split(/[/\\]/).pop() || 'Untitled'
    const project = await api.project.create({ name, path })
    addProject(project)
    setActiveProject(project.id)
    if (project.skipGitSetup) return
    const gitStatus = await api.git.status(path)
    if (!gitStatus?.isRepo) {
      setPendingSetupProject(project)
      setGitInitDialogOpen(true)
    } else if (!gitStatus?.hasRemote) {
      setPendingSetupProject(project)
      setGithubConnectDialogOpen(true)
    }
  }, [addProject, setActiveProject])

  const handleDeleteProject = useCallback(async (id: string) => {
    const projectTerminals = terminals.filter(t => t.projectId === id)
    for (const terminal of projectTerminals) {
      await api.terminal.destroy(terminal.id)
      removeTerminal(terminal.id)
    }
    await api.project.delete(id)
    removeProject(id)
  }, [terminals, removeProject, removeTerminal])

  const handleSelectProject = useCallback(async (id: string | null, terminalId?: string) => {
    const requestId = ++projectSelectionRequestRef.current
    if (!id) {
      setActiveProject(null)
      setActiveTerminal(terminalId ?? null)
      return
    }
    const project = projects.find(p => p.id === id)
    if (!project) return
    const exists = await api.project.checkFolder(project.path)
    if (requestId !== projectSelectionRequestRef.current) return
    if (!exists) {
      useToastStore.getState().addToast(
        `Project "${project.name}" folder no longer exists. Removing from list.`, 'warning'
      )
      await api.project.delete(id)
      removeProject(id)
      return
    }
    switchToProject(id, terminalId)
  }, [projects, switchToProject, removeProject, setActiveProject, setActiveTerminal])

  const handleCloseSettingsPanel = useCallback(() => {
    cancelSettings()
    setActivePanel(null)
  }, [cancelSettings])

  const handleToggleGitHubPanel = useCallback(() => {
    if (activePanel === 'github') {
      setActivePanel(null)
      return
    }

    if (activePanel === 'settings') {
      cancelSettings()
    }

    setActivePanel('github')
  }, [activePanel, cancelSettings])

  const handleToggleSettingsPanel = useCallback(() => {
    cancelSettings()

    if (activePanel === 'settings') {
      setActivePanel(null)
      return
    }

    setActivePanel('settings')
  }, [activePanel, cancelSettings])

  const handleToggleQuickSwitcher = useCallback(() => {
    setIsQuickSwitcherOpen((current) => !current)
  }, [])

  const handleAddTerminal = useCallback(async (shell?: WindowsShell) => {
    const { terminals } = useAppStore.getState()
    const currentProjectTerminals = activeProjectId
      ? terminals.filter(t => t.projectId === activeProjectId)
      : terminals
    const limit = useSettingsStore.getState().getTerminalLimitValue()
    if (currentProjectTerminals.length >= limit) {
      useToastStore.getState().addToast(
        `Terminal limit reached (${limit}). Close a terminal or increase limit in Settings.`, 'warning'
      )
      return
    }
    const effectiveShell = shell ?? useSettingsStore.getState().savedSettings.windowsShell
    try {
      const terminal = await api.terminal.create({
        cwd: activeProject?.path,
        projectId: activeProject?.id,
        shell: effectiveShell as string | undefined
      })
      addTerminal(terminal)
    } catch (err) {
      console.error('[handleAddTerminal] Failed to create terminal:', err)
      useToastStore.getState().addToast('Failed to create terminal. Please try again.', 'error')
    }
  }, [activeProject, activeProjectId, addTerminal])

  const handleCloseTerminal = useCallback(async (terminalId?: string) => {
    const idToClose = terminalId ?? activeTerminalId
    if (!idToClose) return
    await api.terminal.destroy(idToClose)
    removeTerminal(idToClose)
  }, [activeTerminalId, removeTerminal])

  const handleInsertFilePath = useCallback((terminalId: string, paths: string[]) => {
    const formatted = joinPathsForTerminal(paths)
    if (!formatted) return
    api.terminal.write(terminalId, formatted)
  }, [])

  const handleKillAll = useCallback(async () => {
    const terminalsToKill = [...visibleTerminals]
    for (const terminal of terminalsToKill) {
      await api.terminal.destroy(terminal.id)
      removeTerminal(terminal.id)
      if (terminalsToKill.indexOf(terminal) < terminalsToKill.length - 1) {
        await new Promise(resolve => setTimeout(resolve, TERMINAL_DISPOSE_DELAY + 50))
      }
    }
  }, [visibleTerminals, removeTerminal])

  const handleGitInit = useCallback(async () => {
    if (!pendingSetupProject) return
    await api.git.init(pendingSetupProject.path)
    setGitInitDialogOpen(false)
    setGithubConnectDialogOpen(true)
  }, [pendingSetupProject])

  const handleGitInitSkip = useCallback(async (dontAskAgain: boolean) => {
    if (pendingSetupProject && dontAskAgain) {
      await api.project.update(pendingSetupProject.id, { skipGitSetup: true })
    }
    setGitInitDialogOpen(false)
    setPendingSetupProject(null)
  }, [pendingSetupProject])

  const handleGitHubConnectComplete = useCallback(async (
    action: 'created' | 'linked' | 'skipped',
    dontAskAgain: boolean
  ) => {
    if (pendingSetupProject && dontAskAgain) {
      await api.project.update(pendingSetupProject.id, { skipGitSetup: true })
    }
    setGithubConnectDialogOpen(false)
    setPendingSetupProject(null)
    if (action !== 'skipped') {
      useToastStore.getState().addToast(
        action === 'created' ? 'GitHub repository created successfully' : 'Repository linked successfully',
        'info'
      )
    }
  }, [pendingSetupProject])

  useKeyboardShortcuts({
    onAddTerminal: handleAddTerminal,
    onCloseTerminal: handleCloseTerminal,
    onSelectProject: handleSelectProject,
    onToggleGitHubPanel: handleToggleGitHubPanel,
    onToggleQuickSwitcher: handleToggleQuickSwitcher
  })

  const projectNameById = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects]
  )

  const quickSwitcherItems = useMemo<QuickSwitcherItem[]>(() => {
    const projectItems = projects.map((project) => ({
      id: `project-${project.id}`,
      title: project.name,
      subtitle: project.path,
      group: 'Projects',
      keywords: [project.path, project.id],
    }))

    const terminalItems = terminals.map((terminal) => ({
      id: `terminal-${terminal.id}`,
      title: terminal.title,
      subtitle: terminal.projectId
        ? `Terminal in ${projectNameById.get(terminal.projectId) ?? 'project'}`
        : 'Unscoped terminal',
      group: 'Terminals',
      keywords: [terminal.id, terminal.projectId ?? '', projectNameById.get(terminal.projectId ?? '') ?? ''],
    }))

    const drawerItems = [
      {
        id: 'drawer-github',
        title: activePanel === 'github' ? 'Close GitHub Drawer' : 'Open GitHub Drawer',
        subtitle: 'Issues, pull requests, and repository status',
        group: 'Drawers',
        keywords: ['github', 'git', 'pull requests'],
      },
      {
        id: 'drawer-settings',
        title: activePanel === 'settings' ? 'Close Settings Drawer' : 'Open Settings Drawer',
        subtitle: 'Workspace behavior and terminal preferences',
        group: 'Drawers',
        keywords: ['settings', 'preferences'],
      },
    ]

    const actionItems = [
      {
        id: 'action-new-terminal',
        title: 'New Terminal',
        subtitle: activeProject ? `Create a terminal in ${activeProject.name}` : 'Create a new terminal',
        group: 'Actions',
        keywords: ['terminal', 'new', 'shell'],
      },
      {
        id: 'action-open-project',
        title: 'Open Project Folder',
        subtitle: 'Add a project to the workbench',
        group: 'Actions',
        keywords: ['project', 'folder', 'open'],
      },
    ]

    return [...projectItems, ...terminalItems, ...drawerItems, ...actionItems]
  }, [activePanel, activeProject, projectNameById, projects, terminals])

  const handleQuickSwitcherSelect = useCallback((item: QuickSwitcherItem) => {
    if (item.id.startsWith('project-')) {
      const projectId = item.id.replace('project-', '')
      void handleSelectProject(projectId)
      return
    }

    if (item.id.startsWith('terminal-')) {
      const terminalId = item.id.replace('terminal-', '')
      const terminal = terminals.find((candidate) => candidate.id === terminalId)
      if (!terminal) return

      if (terminal.projectId) {
        void handleSelectProject(terminal.projectId, terminal.id)
        return
      }

      setActiveProject(null)
      setActiveTerminal(terminal.id)
      return
    }

    switch (item.id) {
      case 'drawer-github':
        handleToggleGitHubPanel()
        return
      case 'drawer-settings':
        handleToggleSettingsPanel()
        return
      case 'action-new-terminal':
        void handleAddTerminal()
        return
      case 'action-open-project':
        void handleAddProject()
        return
    }
  }, [
    handleAddProject,
    handleAddTerminal,
    handleSelectProject,
    handleToggleGitHubPanel,
    handleToggleSettingsPanel,
    handleSelectProject,
    setActiveProject,
    setActiveTerminal,
    terminals,
  ])

  useEffect(() => { loadSettings(); detectWsl() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const cleanup = setupNotificationListener(); return cleanup }, [])
  useEffect(() => { const cleanup = setupUpdateListener(); return cleanup }, [])

  useEffect(() => {
    if (activeTerminalId) api.notification.setActiveTerminal(activeTerminalId)
  }, [activeTerminalId])

  useEffect(() => {
    const root = document.documentElement
    const theme = THEMES.find(t => t.id === pendingSettings.colorTheme) ?? THEMES[0]
    root.style.setProperty('--bg-primary', theme.background)
    root.style.setProperty('--bg-secondary', theme.tabBg)
    root.style.setProperty('--bg-tertiary', theme.border)
    root.style.setProperty('--text-primary', theme.foreground)
    root.style.setProperty('--text-secondary', `${theme.foreground}99`)
    root.style.setProperty('--text-muted', `${theme.foreground}66`)
    root.style.setProperty('--accent', theme.accent)
    root.style.setProperty('--border', theme.border)
    root.style.setProperty('--hover', theme.hover)
    root.style.setProperty('--tab-bg', theme.tabBg)
    root.style.setProperty('--tab-active-bg', theme.tabActiveBg)
    root.style.setProperty('--cursor', theme.cursor)
    root.style.setProperty('--selection-bg', theme.selectionBg)
    root.style.setProperty('--terminal-font', getTerminalFontFamilyById(pendingSettings.terminalFontFamily ?? 'jetbrains-mono'))
    const appFont = APP_FONTS.find(f => f.id === (pendingSettings.modernFontFamily ?? 'system'))
    if (appFont) { root.style.setProperty('--modern-font', appFont.family); document.body.style.fontFamily = appFont.family }
  }, [pendingSettings.colorTheme, pendingSettings.terminalFontFamily, pendingSettings.modernFontFamily])

  useEffect(() => {
    const init = async () => {
      const loadedProjects = await api.project.list()
      const validationResults = await Promise.all(
        loadedProjects.map(async (project) => ({ project, exists: await api.project.checkFolder(project.path) }))
      )
      const validProjects = validationResults.filter(r => r.exists).map(r => r.project)
      const invalidProjects = validationResults.filter(r => !r.exists).map(r => r.project)
      if (invalidProjects.length > 0) {
        for (const project of invalidProjects) await api.project.delete(project.id)
        useToastStore.getState().addToast(
          `Removed ${invalidProjects.length} project(s) with missing folders: ${invalidProjects.map(p => p.name).join(', ')}`,
          'warning'
        )
      }
      setProjects(validProjects)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const unsubscribe = api.terminal.onExit(({ id }: { id: string }) => {
      useAppStore.getState().removeTerminal(id)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = api.terminal.onTitleChange(({ id, title }: { id: string; title: string }) => {
      updateTerminalTitle(id, title)
    })
    return unsubscribe
  }, [updateTerminalTitle])

  useEffect(() => {
    const handleBeforeUnload = () => { api.session.save() }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return (
    <div className="app">
      <ToastContainer />
      <GitInitDialog
        isOpen={gitInitDialogOpen}
        projectName={pendingSetupProject?.name || ''}
        projectPath={pendingSetupProject?.path || ''}
        onInitialize={handleGitInit}
        onSkip={handleGitInitSkip}
        onClose={() => { setGitInitDialogOpen(false); setPendingSetupProject(null) }}
      />
      <GitHubConnectDialog
        isOpen={githubConnectDialogOpen}
        projectName={pendingSetupProject?.name || ''}
        projectPath={pendingSetupProject?.path || ''}
        onComplete={handleGitHubConnectComplete}
        onClose={() => { setGithubConnectDialogOpen(false); setPendingSetupProject(null) }}
      />
      <Toolbar
        onAddTerminal={handleAddTerminal}
        terminalCount={visibleTerminals.length}
        terminalLimit={getTerminalLimitValue()}
        projects={projects}
        activeProjectId={activeProjectId}
        activeProjectPath={activeProject?.path}
        onSelectProject={handleSelectProject}
        onAddProject={handleAddProject}
        onDeleteProject={handleDeleteProject}
        onToggleGitHub={handleToggleGitHubPanel}
        onToggleSettings={handleToggleSettingsPanel}
        activePanel={activePanel}
      />
      <UpdateBanner />
      <div className="main-content">
        {showTerminalWorkspace ? (
          <div className="terminal-area">
            <TerminalActionBar
              terminalCount={visibleTerminals.length}
              terminalLimit={getTerminalLimitValue()}
              yoloEnabled={false}
              onAddTerminal={handleAddTerminal}
              onToggleYolo={() => {}}
              onKillAll={handleKillAll}
              showYolo={false}
            />
            <div data-testid={TEST_IDS.shell.terminalArea} style={{ flex: 1, minHeight: 0 }}>
              <TerminalGrid
                terminals={terminals}
                activeProjectId={activeProjectId}
                activeProjectName={activeProject?.name}
                activeProjectPath={activeProject?.path}
                activeTerminalId={activeTerminalId}
                onTerminalClick={setActiveTerminal}
                onAddTerminal={handleAddTerminal}
                onCloseTerminal={handleCloseTerminal}
                onInsertFilePath={handleInsertFilePath}
                onTitleChange={updateTerminalTitle}
              />
            </div>
          </div>
        ) : (
          <WelcomeScreen onAddProject={handleAddProject} />
        )}

        <SlidePanel
          isOpen={activePanel === 'github'}
          onClose={() => setActivePanel(null)}
          variant="github"
          title="GitHub"
          description={activeProject ? 'Issues, pull requests, and repo status' : 'Connect a project to inspect repo state'}
          testId={TEST_IDS.panel.github}
        >
          {activePanel === 'github' && <GitHubPanelContent projectPath={activeProject?.path} />}
        </SlidePanel>

        <SlidePanel
          isOpen={activePanel === 'settings'}
          onClose={handleCloseSettingsPanel}
          title="Settings"
          description="Workspace behavior, terminal preferences, notifications, and updates"
          testId={TEST_IDS.panel.settings}
          closeTestId={TEST_IDS.panel.settingsCloseButton}
        >
          <SettingsPanelContent onClose={handleCloseSettingsPanel} />
        </SlidePanel>

        <QuickSwitcherDialog
          isOpen={isQuickSwitcherOpen}
          items={quickSwitcherItems}
          onClose={() => setIsQuickSwitcherOpen(false)}
          onSelect={handleQuickSwitcherSelect}
        />
      </div>
    </div>
  )
}

export default App
