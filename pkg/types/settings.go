package types

type Theme string

const (
	ThemeDark  Theme = "dark"
	ThemeLight Theme = "light"
)

type Settings struct {
	Theme               Theme                `json:"theme"`
	FontSize            int                  `json:"fontSize"`
	FontFamily          string               `json:"fontFamily"`
	ScrollbackLines     int                  `json:"scrollbackLines"`
	Notifications       []NotificationConfig `json:"notifications"`
	DefaultShell        string               `json:"defaultShell"`
	DefaultWorkDir      string               `json:"defaultWorkDir"`
	AutoUpdateEnabled   bool                 `json:"autoUpdateEnabled"`
	GitHubToken         string               `json:"githubToken,omitempty"`
}

func DefaultSettings() Settings {
	return Settings{
		Theme:             ThemeDark,
		FontSize:          14,
		FontFamily:        "monospace",
		ScrollbackLines:   10000,
		Notifications:     []NotificationConfig{},
		AutoUpdateEnabled: true,
	}
}
