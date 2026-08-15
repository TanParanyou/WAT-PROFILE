package services

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/registrations"
	"gorm.io/gorm"
)

type registrationEmailCapture struct {
	messages []accountauth.EmailMessage
}

func (c *registrationEmailCapture) Send(_ context.Context, message accountauth.EmailMessage) error {
	c.messages = append(c.messages, message)
	return nil
}

func TestRegistrationEmailRendersAllLocales(t *testing.T) {
	event := &models.Event{Title: models.MultiLangText{"th": "กิจกรรม", "en": "Practice", "de": "Übung"}, StartDate: time.Date(2026, 9, 12, 7, 0, 0, 0, time.UTC)}
	registration := models.EventRegistration{Email: "person@example.com", FirstName: "Person", LastName: "Example", Locale: "th", Event: event, Participants: []models.EventRegistrationParticipant{{FirstName: "Ada", LastName: "Lovelace", AttendanceStatus: "registered"}}}
	for _, locale := range []string{"th", "en", "de"} {
		message := renderRegistrationEmail(registration, RegistrationReceived, locale, "https://example.test", "opaque-token")
		if message.Locale != locale || message.To != registration.Email || !strings.Contains(message.Body, "Ada Lovelace") || !strings.Contains(message.ActionURL, "#token=opaque-token") {
			t.Fatalf("locale %s rendered unexpected message: %#v", locale, message)
		}
	}
}

func TestRegistrationEmailEscapesUserContent(t *testing.T) {
	registration := models.EventRegistration{Email: "person@example.com", FirstName: "<img>", LastName: "&", Locale: "en", Event: &models.Event{Title: models.MultiLangText{"en": "<script>alert(1)</script>"}, StartDate: time.Now()}}
	message := renderRegistrationEmail(registration, RegistrationConfirmed, "en", "https://example.test", "")
	if strings.Contains(message.HTML, "<script>") || strings.Contains(message.HTML, "<img>") {
		t.Fatalf("user content was not escaped: %s", message.HTML)
	}
}

func TestRegistrationEmailServiceRejectsInsecureProductionOrigin(t *testing.T) {
	cipher, err := registrations.NewTokenCipher([]byte("0123456789abcdef0123456789abcdef"))
	if err != nil {
		t.Fatal(err)
	}
	_, err = NewRegistrationEmailService(&gorm.DB{}, &registrationEmailCapture{}, "http://example.test", cipher, "production")
	if err == nil {
		t.Fatal("expected insecure production origin to fail")
	}
}
