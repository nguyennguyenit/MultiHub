package types

// TerminalLimit represents the max terminal count with preset or custom value.
type TerminalLimit struct {
	Preset      interface{} `json:"preset"`                // int (2|4|9) or string "custom"
	CustomValue *int        `json:"customValue,omitempty"` // required when Preset == "custom"
}

// AppSettings is the full application settings schema persisted to disk.
// Fields use interface{} for union types where TypeScript is authoritative.
type AppSettings struct {
	ColorTheme           string        `json:"colorTheme"`
	TerminalLimit        TerminalLimit `json:"terminalLimit"`
	TerminalRenderMode   string        `json:"terminalRenderMode"`
	GpuRendererForClaude *bool         `json:"gpuRendererForClaudeTerminals,omitempty"`
	GlassmorphismEnabled bool          `json:"glassmorphismEnabled"`
	TerminalFontFamily   string        `json:"terminalFontFamily"`
	WindowsShell         interface{}   `json:"windowsShell,omitempty"`
	ThemeMode            string        `json:"themeMode,omitempty"`
	ModernFontFamily     string        `json:"modernFontFamily,omitempty"`
	UiStyle              string        `json:"uiStyle,omitempty"`
	TerminalStyleOptions interface{}   `json:"terminalStyleOptions,omitempty"`
	ActivityBarState     string        `json:"activityBarState,omitempty"`
}

// DefaultAppSettings returns factory-default settings.
func DefaultAppSettings() AppSettings {
	return AppSettings{
		ColorTheme:           "tokyo-night",
		TerminalLimit:        TerminalLimit{Preset: 4},
		TerminalRenderMode:   "balanced",
		GlassmorphismEnabled: true,
		TerminalFontFamily:   "jetbrains-mono",
		ModernFontFamily:     "inter",
	}
}
