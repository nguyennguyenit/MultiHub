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
    },
  },
})

// Stub Wails event runtime used by stores
vi.stubGlobal('runtime', {
  EventsOn: vi.fn(),
  EventsOff: vi.fn(),
  EventsEmit: vi.fn(),
})
