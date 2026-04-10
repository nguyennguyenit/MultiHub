package main

import (
	"github.com/multihub/multihub/pkg/types"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// ── Project management bindings (stub – real impl in Phase 05) ────────────────

// ProjectList returns all projects.
func (a *App) ProjectList() []types.Project {
	return []types.Project{}
}

// ProjectCreate creates a new project from the given data.
func (a *App) ProjectCreate(data map[string]interface{}) (types.Project, error) {
	return types.Project{}, nil
}

// ProjectUpdate updates an existing project.
func (a *App) ProjectUpdate(id string, data map[string]interface{}) (types.Project, error) {
	return types.Project{}, nil
}

// ProjectDelete removes a project by ID.
func (a *App) ProjectDelete(id string) bool {
	return true
}

// ProjectSetActive marks a project as the active project.
func (a *App) ProjectSetActive(id string) bool {
	return true
}

// ProjectCheckFolder checks whether the given path is a valid project folder.
func (a *App) ProjectCheckFolder(cwd string) (bool, error) {
	return true, nil
}

// ProjectOpenFolder opens a native directory picker and returns the chosen path.
func (a *App) ProjectOpenFolder() (string, error) {
	path, err := wailsRuntime.OpenDirectoryDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Select Project Folder",
	})
	return path, err
}
