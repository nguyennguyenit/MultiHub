package notification

import (
	"encoding/json"
	"strings"
)

// parserMode is auto-detected from the first output chunk.
type parserMode int

const (
	modeUnknown   parserMode = iota
	modePlainText             // raw terminal output
	modeJSONStream            // NDJSON from --output-format=stream-json
)

// OutputParser auto-detects plain-text vs JSON-stream output and extracts
// user-visible text for pattern detection.
// The mode is locked for the lifetime of the session.
type OutputParser struct {
	mode parserMode
}

// NewOutputParser returns a parser in auto-detect mode.
func NewOutputParser() *OutputParser {
	return &OutputParser{mode: modeUnknown}
}

// Extract returns the human-readable text fragment extracted from a raw output
// chunk.  For plain-text output this is the chunk itself.  For JSON-stream
// output only assistant text deltas and stop-reason messages are returned.
func (p *OutputParser) Extract(raw string) string {
	if p.mode == modeUnknown {
		p.detect(raw)
	}
	if p.mode == modeJSONStream {
		return p.extractJSON(raw)
	}
	return raw
}

func (p *OutputParser) detect(raw string) {
	trimmed := strings.TrimSpace(raw)
	if strings.HasPrefix(trimmed, "{") {
		p.mode = modeJSONStream
	} else {
		p.mode = modePlainText
	}
}

// extractJSON extracts text from NDJSON lines produced by Claude's
// --output-format=stream-json mode.
func (p *OutputParser) extractJSON(raw string) string {
	var sb strings.Builder
	for _, line := range strings.Split(raw, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		var event map[string]interface{}
		if err := json.Unmarshal([]byte(line), &event); err != nil {
			continue
		}
		// content_block_delta → text_delta
		if delta, ok := event["delta"].(map[string]interface{}); ok {
			if delta["type"] == "text_delta" {
				if text, ok := delta["text"].(string); ok {
					sb.WriteString(text)
				}
			}
			// stop_reason signals task end
			if stop, ok := delta["stop_reason"].(string); ok && stop != "" {
				sb.WriteString("\n[stop_reason=" + stop + "]\n")
			}
		}
	}
	return sb.String()
}
