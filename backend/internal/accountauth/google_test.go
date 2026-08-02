package accountauth

import (
	"net/url"
	"strings"
	"testing"
)

func TestSignFlowCookieRoundTrip(t *testing.T) {
	secret := []byte("test-flow-secret")
	state := "abc123XYZ_=-"
	raw, err := SignFlowCookie(state, secret)
	if err != nil {
		t.Fatalf("SignFlowCookie: %v", err)
	}
	got, err := ParseFlowCookie(raw, secret)
	if err != nil {
		t.Fatalf("ParseFlowCookie: %v", err)
	}
	if got != state {
		t.Fatalf("expected state %q, got %q", state, got)
	}
}

func TestParseFlowCookieRejectsTampered(t *testing.T) {
	secret := []byte("test-flow-secret")
	raw, err := SignFlowCookie("original-state", secret)
	if err != nil {
		t.Fatalf("SignFlowCookie: %v", err)
	}
	// Flip the last character of the signature portion.
	last := raw[len(raw)-1]
	var flipped byte
	if last == 'a' {
		flipped = 'b'
	} else {
		flipped = 'a'
	}
	tampered := raw[:len(raw)-1] + string(flipped)
	if _, err := ParseFlowCookie(tampered, secret); err == nil {
		t.Fatal("expected tampered cookie to be rejected")
	}
}

func TestParseFlowCookieRejectsWrongKey(t *testing.T) {
	raw, err := SignFlowCookie("state", []byte("secret-one"))
	if err != nil {
		t.Fatalf("SignFlowCookie: %v", err)
	}
	if _, err := ParseFlowCookie(raw, []byte("secret-two")); err == nil {
		t.Fatal("expected cookie signed with another key to be rejected")
	}
}

func TestParseFlowCookieRejectsMalformed(t *testing.T) {
	for _, raw := range []string{"", "no-dot", "..", "a.b.c"} {
		if _, err := ParseFlowCookie(raw, []byte("secret")); err == nil {
			t.Fatalf("expected malformed cookie %q to be rejected", raw)
		}
	}
}

func TestNewGoogleVerifierValidation(t *testing.T) {
	if _, err := NewGoogleVerifier("", "secret", "https://api.example.com/cb"); err == nil {
		t.Fatal("expected empty client ID to fail")
	}
	if _, err := NewGoogleVerifier("client", "", "https://api.example.com/cb"); err == nil {
		t.Fatal("expected empty client secret to fail")
	}
	if _, err := NewGoogleVerifier("client", "secret", "not-a-url"); err == nil {
		t.Fatal("expected invalid redirect URL to fail")
	}
	if _, err := NewGoogleVerifier("client", "secret", "ftp://example.com/cb"); err == nil {
		t.Fatal("expected non-http redirect URL to fail")
	}
}

func TestAuthorizationURLIncludesStateNonceChallenge(t *testing.T) {
	v, err := NewGoogleVerifier("test-client", "test-secret", "https://api.example.com/cb")
	if err != nil {
		t.Fatalf("NewGoogleVerifier: %v", err)
	}
	authURL := v.AuthorizationURL("state123", "nonce456", "challenge789")
	parsed, err := url.Parse(authURL)
	if err != nil {
		t.Fatalf("url.Parse(%q): %v", authURL, err)
	}
	q := parsed.Query()
	if q.Get("state") != "state123" {
		t.Fatalf("expected state=state123, got %q", q.Get("state"))
	}
	if q.Get("nonce") != "nonce456" {
		t.Fatalf("expected nonce=nonce456, got %q", q.Get("nonce"))
	}
	if q.Get("code_challenge") != "challenge789" {
		t.Fatalf("expected code_challenge=challenge789, got %q", q.Get("code_challenge"))
	}
	if q.Get("code_challenge_method") != "S256" {
		t.Fatalf("expected code_challenge_method=S256, got %q", q.Get("code_challenge_method"))
	}
	if q.Get("response_type") != "code" {
		t.Fatalf("expected response_type=code, got %q", q.Get("response_type"))
	}
	if q.Get("client_id") != "test-client" {
		t.Fatalf("expected client_id=test-client, got %q", q.Get("client_id"))
	}
	if q.Get("redirect_uri") != "https://api.example.com/cb" {
		t.Fatalf("expected redirect_uri to be the callback URL, got %q", q.Get("redirect_uri"))
	}
	if !strings.Contains(authURL, "accounts.google.com") {
		t.Fatalf("expected Google authorization endpoint, got %q", authURL)
	}
}
