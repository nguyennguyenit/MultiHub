package project

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"
)

// generateID creates a project ID in the format: proj-{timestamp}-{random}
func generateID() string {
	ts := time.Now().UnixMilli()
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	return fmt.Sprintf("proj-%d-%s", ts, hex.EncodeToString(b))
}
