package terminal

import (
	"regexp"
	"strings"
)

// oscPattern matches OSC 0, 1, 2 sequences: ESC ] N ; title BEL|ST
// BEL = \x07, ST = ESC \ (\x1b\\)
var oscPattern = regexp.MustCompile(`\x1b\]([012]);([^\x07\x1b]*?)(?:\x07|\x1b\\)`)

// ParseOscTitle extracts terminal title from OSC escape sequences in raw PTY output.
// Returns the new title if one was found and differs from the current title; empty string otherwise.
//
// Maintains p.OscBuffer as a sliding window of recent output to handle sequences
// that may span multiple read chunks.
func (p *PTYProcess) ParseOscTitle(data string) string {
	if !p.Metadata.AllowTitleUpdate {
		return ""
	}

	p.OscBuffer += data
	if len(p.OscBuffer) > oscBufferMax {
		// Keep the tail to preserve incomplete sequences.
		p.OscBuffer = p.OscBuffer[len(p.OscBuffer)-oscBufferMax/2:]
	}

	var newTitle string
	matches := oscPattern.FindAllStringSubmatch(p.OscBuffer, -1)
	for _, match := range matches {
		title := strings.TrimSpace(match[2])
		if title != "" && title != p.Metadata.Title {
			p.Metadata.Title = title
			newTitle = title
		}
	}

	// Trim processed sequences from buffer; keep any incomplete trailing sequence.
	if lastEsc := strings.LastIndex(p.OscBuffer, "\x1b]"); lastEsc >= 0 {
		tail := p.OscBuffer[lastEsc:]
		if strings.Contains(tail, "\x07") || strings.Contains(tail, "\x1b\\") {
			// Tail is complete — everything processed.
			p.OscBuffer = ""
		} else {
			// Tail is an incomplete sequence — keep it for next chunk.
			p.OscBuffer = tail
		}
	} else {
		p.OscBuffer = ""
	}

	return newTitle
}
