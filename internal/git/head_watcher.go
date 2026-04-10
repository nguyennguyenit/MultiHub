package git

import (
	"path/filepath"
	"sync"

	"github.com/fsnotify/fsnotify"
)

// HeadWatcher monitors .git/HEAD files and calls onChange when they change.
type HeadWatcher struct {
	mu       sync.Mutex
	watchers map[string]*fsnotify.Watcher
	onChange func(projectPath string)
}

// NewHeadWatcher creates a HeadWatcher that calls onChange for each HEAD change.
func NewHeadWatcher(onChange func(projectPath string)) *HeadWatcher {
	return &HeadWatcher{
		watchers: make(map[string]*fsnotify.Watcher),
		onChange: onChange,
	}
}

// Watch starts watching .git/HEAD in the given project directory.
// If already watching, this is a no-op.
func (hw *HeadWatcher) Watch(projectPath string) error {
	hw.mu.Lock()
	defer hw.mu.Unlock()

	if _, exists := hw.watchers[projectPath]; exists {
		return nil
	}

	w, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}
	headFile := filepath.Join(projectPath, ".git", "HEAD")
	if err := w.Add(headFile); err != nil {
		w.Close()
		return err
	}
	hw.watchers[projectPath] = w

	go hw.loop(projectPath, w)
	return nil
}

// Unwatch stops watching a project directory.
func (hw *HeadWatcher) Unwatch(projectPath string) {
	hw.mu.Lock()
	defer hw.mu.Unlock()
	if w, ok := hw.watchers[projectPath]; ok {
		w.Close()
		delete(hw.watchers, projectPath)
	}
}

// Destroy closes all watchers.
func (hw *HeadWatcher) Destroy() {
	hw.mu.Lock()
	defer hw.mu.Unlock()
	for _, w := range hw.watchers {
		w.Close()
	}
	hw.watchers = make(map[string]*fsnotify.Watcher)
}

// loop processes fsnotify events for a single project.
func (hw *HeadWatcher) loop(projectPath string, w *fsnotify.Watcher) {
	for {
		select {
		case event, ok := <-w.Events:
			if !ok {
				return
			}
			if event.Has(fsnotify.Write) || event.Has(fsnotify.Create) {
				hw.onChange(projectPath)
			}
		case _, ok := <-w.Errors:
			if !ok {
				return
			}
		}
	}
}
