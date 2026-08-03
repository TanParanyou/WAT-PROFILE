package services

import (
	"testing"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
)

// TestSecurityEventDropsSecretsAndCoarsensIP verifies that the security-event
// builder never stores secrets and only records a coarse network prefix.
func TestSecurityEventDropsSecretsAndCoarsensIP(t *testing.T) {
	event := BuildSecurityEvent(accountauth.ClientInfo{IP: "203.0.113.42", UserAgent: "Browser/1.0"}, map[string]any{
		"provider":      "google",
		"refresh_token": "secret",
		"password":      "secret",
	})

	if event.IPPrefix != "203.0.113.0/24" {
		t.Errorf("expected coarse /24 prefix, got %q", event.IPPrefix)
	}
	if _, ok := event.Metadata["refresh_token"]; ok {
		t.Error("refresh_token must not appear in security event metadata")
	}
	if _, ok := event.Metadata["password"]; ok {
		t.Error("password must not appear in security event metadata")
	}
	if got := event.Metadata["provider"]; got != "google" {
		t.Errorf("allow-listed provider key must survive sanitization, got %q", got)
	}
}

// TestBuildSecurityEventNonSecretAllowListOnly verifies that arbitrary request
// fields are never copied into the event metadata.
func TestBuildSecurityEventNonSecretAllowListOnly(t *testing.T) {
	event := BuildSecurityEvent(accountauth.ClientInfo{IP: "198.51.100.7", UserAgent: "Agent/1.0"}, map[string]any{
		"session_id":     "abc",
		"client_id":      "super-secret-client",
		"auth_code":      "one-time-code",
		"random_request": "arbitrary-body-field",
	})

	for _, key := range []string{"session_id", "client_id", "auth_code", "random_request"} {
		if value, ok := event.Metadata[key]; ok && value != "" {
			t.Errorf("non allow-listed key %q must be dropped from metadata, got %q", key, value)
		}
	}
}

// TestBuildSecurityEventSanitizesClientInfo verifies invalid client inputs are
// neutralized and never crash the builder.
func TestBuildSecurityEventSanitizesClientInfo(t *testing.T) {
	event := BuildSecurityEvent(accountauth.ClientInfo{IP: "not-an-ip", UserAgent: "Agent\x01Bad"}, nil)

	if event.IPPrefix != "" {
		t.Errorf("invalid IP must yield an empty prefix, got %q", event.IPPrefix)
	}
}
