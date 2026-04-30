package main

import (
	"github.com/multihub/multihub/pkg/types"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

func buildMacOptions() *mac.Options {
	return &mac.Options{
		TitleBar:             mac.TitleBarHiddenInset(),
		WebviewIsTransparent: false,
		WindowIsTranslucent:  false,
	}
}

func buildWindowState(isMaximized, isFullScreen bool) types.WindowState {
	return types.WindowState{
		IsMaximized: isMaximized,
		IsFullScreen: isFullScreen,
		IsExpanded:  isMaximized || isFullScreen,
	}
}
