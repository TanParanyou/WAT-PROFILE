package services

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

type ContactNotificationService struct {
	sender    accountauth.EmailSender
	recipient string
}

func NewContactNotificationService(sender accountauth.EmailSender, recipient string) *ContactNotificationService {
	return &ContactNotificationService{sender: sender, recipient: accountauth.NormalizeEmail(recipient)}
}

func (s *ContactNotificationService) Send(ctx context.Context, inquiry *models.ContactInquiry) error {
	if s == nil || s.sender == nil {
		return errors.New("contact notification sender is not configured")
	}
	if inquiry == nil {
		return errors.New("contact inquiry is required")
	}
	if !accountauth.ValidEmail(s.recipient) {
		return errors.New("contact notification recipient is invalid")
	}

	locale := inquiry.CommunicationLocale
	if locale != "th" && locale != "en" && locale != "de" {
		locale = "en"
	}
	subject := fmt.Sprintf("[Website contact #%d] %s", inquiry.ID, inquiry.Subject)
	body := fmt.Sprintf(
		"Contact ID: %d\nLocale: %s\nName: %s\nEmail: %s\nSubject: %s\n\nMessage:\n%s",
		inquiry.ID, locale, inquiry.Name, inquiry.Email, inquiry.Subject, inquiry.Message,
	)
	return s.sender.Send(ctx, accountauth.EmailMessage{
		To:      s.recipient,
		Locale:  locale,
		Subject: subject,
		Body:    strings.TrimSpace(body),
	})
}
