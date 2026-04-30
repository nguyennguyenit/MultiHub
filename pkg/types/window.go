package types

type WindowState struct {
	IsMaximized bool `json:"isMaximized"`
	IsFullScreen bool `json:"isFullScreen"`
	IsExpanded  bool `json:"isExpanded"`
}
