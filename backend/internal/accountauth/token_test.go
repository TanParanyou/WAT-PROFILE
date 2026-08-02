package accountauth

import (
	"strings"
	"testing"
)

// TestOpaqueTokenStoresOnlyHash verifies NewOpaqueToken returns a plain token
// whose hash round-trips and never equals the plain value.
func TestOpaqueTokenStoresOnlyHash(t *testing.T) {
	plain, hash, err := NewOpaqueToken()
	if err != nil {
		t.Fatalf("NewOpaqueToken failed: %v", err)
	}
	if plain == "" || hash == "" {
		t.Fatal("expected non-empty token and hash")
	}
	if plain == hash {
		t.Fatal("plain token must never equal its hash")
	}
	if HashOpaqueToken(plain) != hash {
		t.Fatal("HashOpaqueToken(plain) must reproduce the returned hash")
	}
	if len(hash) != 64 {
		t.Fatalf("expected 64-char SHA-256 hex hash, got %d", len(hash))
	}
}

// TestOpaqueTokenCollisionResistance ensures consecutive tokens differ.
func TestOpaqueTokenCollisionResistance(t *testing.T) {
	a, _, err := NewOpaqueToken()
	if err != nil {
		t.Fatalf("NewOpaqueToken failed: %v", err)
	}
	b, _, err := NewOpaqueToken()
	if err != nil {
		t.Fatalf("NewOpaqueToken failed: %v", err)
	}
	if a == b {
		t.Fatal("expected distinct tokens across calls")
	}
}

// TestOpaqueTokenURLSafe ensures the plain token survives cookie/URL transport.
func TestOpaqueTokenURLSafe(t *testing.T) {
	plain, _, err := NewOpaqueToken()
	if err != nil {
		t.Fatalf("NewOpaqueToken failed: %v", err)
	}
	for _, r := range plain {
		if strings.ContainsAny(string(r), "=+/") {
			t.Fatalf("token contains non-url-safe character %q", r)
		}
	}
}
