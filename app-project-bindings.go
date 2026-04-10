package main

import (
	"github.com/multihub/multihub/internal/project"
	"github.com/multihub/multihub/pkg/types"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// ── Project management bindings ───────────────────────────────────────────────

// ProjectList returns all projects.
func (a *App) ProjectList() []types.Project {
	if a.projectStore == nil {
		return []types.Project{}
	}
	return a.projectStore.List()
}

// ProjectCreate creates a new project from the given data.
func (a *App) ProjectCreate(data map[string]interface{}) (types.Project, error) {
	name, _ := data["name"].(string)
	path, _ := data["path"].(string)
	return a.projectStore.Create(name, path)
}

// ProjectUpdate updates an existing project.
func (a *App) ProjectUpdate(id string, data map[string]interface{}) (types.Project, error) {
	p, err := a.projectStore.Update(id, data)
	if err != nil || p == nil {
		return types.Project{}, err
	}
	return *p, nil
}

// ProjectDelete removes a project by ID.
func (a *App) ProjectDelete(id string) bool {
	return a.projectStore.Delete(id) == nil
}

// ProjectSetActive marks a project as the active project.
func (a *App) ProjectSetActive(id string) bool {
	return a.projectStore.SetActive(id) == nil
}

// ProjectCheckFolder checks whether the given path is a valid project folder.
func (a *App) ProjectCheckFolder(cwd string) (project.FolderStatus, error) {
	return project.CheckFolder(cwd)
}

// ProjectOpenFolder opens a native directory picker and returns the chosen path.
func (a *App) ProjectOpenFolder() (string, error) {
	path, err := wailsRuntime.OpenDirectoryDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Select Project Folder",
	})
	return path, err
}
