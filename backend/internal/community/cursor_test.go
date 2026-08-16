package community

import "testing"

func TestDecodeCursorRejectsMalformedInput(t *testing.T) {
	for _, value := range []string{"", "not-a-cursor", "e30"} {
		if _, err := DecodeCursor(value); err == nil {
			t.Fatalf("expected malformed cursor %q to fail", value)
		}
	}
}
