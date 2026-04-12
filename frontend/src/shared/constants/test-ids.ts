const PROJECT_DROPDOWN_ITEM_PREFIX = 'project-dropdown-item'
const SETTINGS_TAB_PREFIX = 'settings-tab'
const QUICK_SWITCHER_ITEM_PREFIX = 'quick-switcher-item'

export const TEST_IDS = {
  shell: {
    toolbar: 'app-toolbar',
    projectSwitcherButton: 'project-switcher-button',
    projectSwitcherMenu: 'project-switcher-menu',
    addProjectButton: 'add-project-button',
    projectDropdownAddButton: 'project-dropdown-add-button',
    githubPanelButton: 'github-panel-button',
    settingsButton: 'settings-button',
    terminalArea: 'terminal-area',
    terminalGrid: 'terminal-grid',
  },
  palette: {
    root: 'quick-switcher-root',
    input: 'quick-switcher-input',
    list: 'quick-switcher-list',
    emptyState: 'quick-switcher-empty-state',
  },
  emptyState: {
    project: 'project-empty-state',
    terminal: 'terminal-empty-state',
  },
  terminal: {
    actionBar: 'terminal-action-bar',
    countLabel: 'terminal-count-label',
    newTerminalButton: 'new-terminal-button',
    yoloToggleButton: 'toggle-yolo-button',
    killAllButton: 'kill-all-button',
    killAllDialog: 'kill-all-confirm-dialog',
    killAllCancelButton: 'kill-all-cancel-button',
    killAllConfirmButton: 'kill-all-confirm-button',
  },
  panel: {
    github: 'github-panel',
    githubEmptyState: 'github-panel-empty-state',
    githubSummary: 'github-panel-summary',
    githubTabs: 'github-panel-tabs',
    githubTabChanges: 'github-panel-tab-changes',
    githubTabHistory: 'github-panel-tab-history',
    githubTabGitHub: 'github-panel-tab-github',
    githubTabPanelChanges: 'github-panel-tabpanel-changes',
    githubTabPanelHistory: 'github-panel-tabpanel-history',
    githubTabPanelGitHub: 'github-panel-tabpanel-github',
    settings: 'settings-panel',
    settingsSidebar: 'settings-sidebar',
    settingsContent: 'settings-panel-content',
    settingsTabAppearance: `${SETTINGS_TAB_PREFIX}-appearance`,
    settingsTabTerminals: `${SETTINGS_TAB_PREFIX}-terminals`,
    settingsTabNotifications: `${SETTINGS_TAB_PREFIX}-notifications`,
    settingsTabUpdates: `${SETTINGS_TAB_PREFIX}-updates`,
    settingsCloseButton: 'settings-close-button',
    settingsCancelButton: 'settings-cancel-button',
    settingsSaveButton: 'settings-save-button',
  },
} as const

export function getProjectDropdownItemTestId(projectId: string): string {
  return `${PROJECT_DROPDOWN_ITEM_PREFIX}-${projectId}`
}

export function getSettingsTabTestId(tabId: string): string {
  return `${SETTINGS_TAB_PREFIX}-${tabId}`
}

export function getQuickSwitcherItemTestId(itemId: string): string {
  return `${QUICK_SWITCHER_ITEM_PREFIX}-${itemId}`
}
