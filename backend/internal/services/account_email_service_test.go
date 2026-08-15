package services

import (
	"errors"
	"testing"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
)

func TestNewAccountEmailSenderCaptureMode(t *testing.T) {
	cfg := config.AccountAuthConfig{Enabled: true, Environment: "development", EmailMode: "capture"}
	sender, err := NewAccountEmailSender(cfg)
	if err != nil {
		t.Fatalf("capture mode must construct: %v", err)
	}
	if err := sender.Send(t.Context(), accountauth.EmailMessage{To: "visitor@example.com", Subject: "Hi", Body: "Body"}); err != nil {
		t.Fatalf("capture send: %v", err)
	}
}

func TestNewAccountEmailSenderRejectsCaptureInProduction(t *testing.T) {
	cfg := config.AccountAuthConfig{Enabled: true, Environment: "production", EmailMode: "capture"}
	if _, err := NewAccountEmailSender(cfg); err == nil {
		t.Fatal("capture mode must be rejected in production")
	}
}

func TestNewAccountEmailSenderResendRequiresKeys(t *testing.T) {
	cfg := config.AccountAuthConfig{Enabled: true, Environment: "production", EmailMode: "resend"}
	if _, err := NewAccountEmailSender(cfg); err == nil {
		t.Fatal("resend mode without keys must be rejected")
	}
}

func TestNewResendEmailSenderRequiresConfiguration(t *testing.T) {
	if _, err := NewResendEmailSender("", "contact@example.invalid"); err == nil {
		t.Fatal("expected missing API key error")
	}
	if _, err := NewResendEmailSender("re_test", ""); err == nil {
		t.Fatal("expected missing sender error")
	}
}

func TestResendEmailSenderRejectsEmptyFrom(t *testing.T) {
	sender := &resendEmailSender{apiKey: "re_key", from: ""}
	if err := sender.Send(t.Context(), accountauth.EmailMessage{}); err == nil {
		t.Fatal("expected empty from to fail")
	}
}

func TestResendEmailSenderHTTPFailure(t *testing.T) {
	// Point the sender at an unreachable address to force a transport error.
	sender := &resendEmailSender{
		apiKey:  "re_key",
		from:    "no-reply@watloungporsai.de",
		baseURL: "http://127.0.0.1:1",
	}
	if err := sender.Send(t.Context(), accountauth.EmailMessage{To: "visitor@example.com", Subject: "Hi", Body: "Body"}); err == nil {
		t.Fatal("expected transport error")
	}
}

func TestResendEmailSenderMissingAPIKey(t *testing.T) {
	sender := &resendEmailSender{apiKey: "", from: "no-reply@watloungporsai.de"}
	if err := sender.Send(t.Context(), accountauth.EmailMessage{}); err == nil {
		t.Fatal("expected missing api key to fail")
	}
}

var _ accountauth.EmailSender = (*captureEmailSender)(nil)
var _ accountauth.EmailSender = (*resendEmailSender)(nil)
var _ = errors.New // keep errors import when assertions evolve
