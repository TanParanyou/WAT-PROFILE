package services

import (
	"context"
	"errors"
	"testing"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
)

func TestAccountCredentialsSendReturnsDeliveryFailure(t *testing.T) {
	expected := errors.New("resend rejected sender domain")
	service := AccountCredentialsService{
		sender: &fakeEmailSender{err: expected},
	}

	err := service.send(
		context.Background(),
		accountauth.EmailMessage{To: "new@example.com", Locale: "en"},
		"change_email",
		accountauth.EmailTemplateVar{DisplayName: "Test User"},
	)

	if !errors.Is(err, expected) {
		t.Fatalf("send error = %v, want %v", err, expected)
	}
}
