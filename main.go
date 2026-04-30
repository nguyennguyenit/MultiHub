package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

// version is injected at build time via -ldflags "-X main.version=vX.Y.Z"
var version = "dev"

func main() {
	// Create an instance of the app structure
	app := NewApp()
	app.version = version

	// Create application with options
	err := wails.Run(&options.App{
		Title:     "MultiHub",
		Width:     1400,
		Height:    900,
		MinWidth:  800,
		MinHeight: 600,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup:  app.startup,
		OnShutdown: app.shutdown,
		Bind: []interface{}{
			app,
		},
		// Enable WebKit inspector in dev mode
		Mac: buildMacOptions(),
		Debug: options.Debug{
			OpenInspectorOnStartup: true,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
