import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

// Global test setup for Vitest + jsdom

// Stub the Wails runtime so unit tests don't need a live app.
// Tests that need specific return values should override these mocks individually.
vi.stubGlobal('go', {
  main: {
    App: {
      AppGetVersion: vi.fn().mockResolvedValue('dev'),
      SettingsGet: vi.fn().mockResolvedValue({}),
      SettingsSet: vi.fn().mockResolvedValue({}),
      TerminalCreate: vi.fn().mockResolvedValue({ id: 'test-id' }),
      TerminalDestroy: vi.fn().mockResolvedValue(null),
      TerminalList: vi.fn().mockResolvedValue([]),
      TerminalGet: vi.fn().mockResolvedValue(null),
      TerminalWrite: vi.fn().mockResolvedValue(true),
      TerminalResize: vi.fn().mockResolvedValue(true),
      TerminalInvokeClaude: vi.fn().mockResolvedValue(true),
      TerminalDetectWsl: vi.fn().mockResolvedValue({ available: false, distros: [] }),
      ProjectList: vi.fn().mockResolvedValue([]),
      ProjectCreate: vi.fn(),
      ProjectUpdate: vi.fn(),
      ProjectDelete: vi.fn().mockResolvedValue(true),
      ProjectGetActive: vi.fn().mockResolvedValue(''),
      ProjectSetActive: vi.fn().mockResolvedValue(true),
      ProjectOpenFolder: vi.fn().mockResolvedValue(''),
      ProjectCheckFolder: vi.fn().mockResolvedValue(true),
      WindowGetState: vi.fn().mockResolvedValue({ isMaximized: false, isFullScreen: false, isExpanded: false }),
      UpdateGetState: vi.fn().mockResolvedValue({ status: 'idle' }),
      UpdateCheck: vi.fn().mockResolvedValue({ status: 'idle' }),
      UpdateDownload: vi.fn(),
      UpdateInstall: vi.fn(),
    },
  },
})

// Stub Wails event runtime used by stores
vi.stubGlobal('runtime', {
  EventsOn: vi.fn(),
  EventsOff: vi.fn(),
  EventsEmit: vi.fn(),
})
