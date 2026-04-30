package main

import (
	"testing"

	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

func TestBuildMacOptionsUsesHiddenInsetTitlebar(t *testing.T) {
	t.Parallel()

	options := buildMacOptions()
	if options == nil {
		t.Fatal("expected mac options")
	}
	if options.TitleBar == nil {
		t.Fatal("expected mac titlebar options")
	}

	expected := mac.TitleBarHiddenInset()
	if *options.TitleBar != *expected {
		t.Fatalf("expected hidden inset titlebar, got %#v", options.TitleBar)
	}
	if options.WebviewIsTransparent {
		t.Fatal("expected opaque webview")
	}
	if options.WindowIsTranslucent {
		t.Fatal("expected opaque window")
	}
}

func TestBuildWindowStateMarksExpandedForFullscreenAndMaximize(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name         string
		isMaximized  bool
		isFullScreen bool
		wantExpanded bool
	}{
		{
			name:         "normal window",
			isMaximized:  false,
			isFullScreen: false,
			wantExpanded: false,
		},
		{
			name:         "maximized window",
			isMaximized:  true,
			isFullScreen: false,
			wantExpanded: true,
		},
		{
			name:         "fullscreen window",
			isMaximized:  false,
			isFullScreen: true,
			wantExpanded: true,
		},
	}

	for _, testCase := range testCases {
		testCase := testCase
		t.Run(testCase.name, func(t *testing.T) {
			t.Parallel()

			state := buildWindowState(testCase.isMaximized, testCase.isFullScreen)
			if state.IsMaximized != testCase.isMaximized {
				t.Fatalf("expected maximized=%t, got %t", testCase.isMaximized, state.IsMaximized)
			}
			if state.IsFullScreen != testCase.isFullScreen {
				t.Fatalf("expected fullscreen=%t, got %t", testCase.isFullScreen, state.IsFullScreen)
			}
			if state.IsExpanded != testCase.wantExpanded {
				t.Fatalf("expected expanded=%t, got %t", testCase.wantExpanded, state.IsExpanded)
			}
		})
	}
}
