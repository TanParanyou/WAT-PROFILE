package services

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

type contactCaptureSender struct {
	messages []accountauth.EmailMessage
	err      error
}

func (s *contactCaptureSender) Send(_ context.Context, message accountauth.EmailMessage) error {
	s.messages = append(s.messages, message)
	return s.err
}

func TestContactNotificationTargetsConfiguredRecipient(t *testing.T) {
	sender := &contactCaptureSender{}
	service := NewContactNotificationService(sender, " Office@Example.Invalid ")
	err := service.Send(context.Background(), &models.ContactInquiry{
		ID: 42, Name: "Visitor", Email: "visitor@example.invalid", Subject: "Visit", Message: "Hello", CommunicationLocale: "de",
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(sender.messages) != 1 || sender.messages[0].To != "office@example.invalid" {
		t.Fatalf("unexpected message: %+v", sender.messages)
	}
	if !strings.Contains(sender.messages[0].Body, "Contact ID: 42") || !strings.Contains(sender.messages[0].Body, "Locale: de") {
		t.Fatalf("missing identifiers: %s", sender.messages[0].Body)
	}
}

func TestContactNotificationRejectsIncompleteConfiguration(t *testing.T) {
	if err := NewContactNotificationService(nil, "office@example.invalid").Send(context.Background(), &models.ContactInquiry{}); err == nil {
		t.Fatal("expected missing sender error")
	}
	if err := NewContactNotificationService(&contactCaptureSender{}, "not-an-email").Send(context.Background(), &models.ContactInquiry{}); err == nil {
		t.Fatal("expected invalid recipient error")
	}
	if err := NewContactNotificationService(&contactCaptureSender{}, "office@example.invalid").Send(context.Background(), nil); err == nil {
		t.Fatal("expected missing inquiry error")
	}
}

func TestContactNotificationPropagatesSenderError(t *testing.T) {
	want := errors.New("resend unavailable")
	err := NewContactNotificationService(&contactCaptureSender{err: want}, "office@example.invalid").Send(context.Background(), &models.ContactInquiry{ID: 1, Subject: "Hi"})
	if !errors.Is(err, want) {
		t.Fatalf("error = %v, want %v", err, want)
	}
}
