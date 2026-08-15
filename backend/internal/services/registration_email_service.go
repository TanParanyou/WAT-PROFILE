package services

import (
	"context"
	"errors"
	"fmt"
	"html"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/registrations"
	"gorm.io/gorm"
)

type RegistrationEmailKind string

const (
	RegistrationReceived       RegistrationEmailKind = "received"
	RegistrationConfirmed      RegistrationEmailKind = "confirmed"
	RegistrationCancelled      RegistrationEmailKind = "cancelled"
	RegistrationReviewRequired RegistrationEmailKind = "review_required"
)

type RegistrationEmailService struct {
	db          *gorm.DB
	sender      accountauth.EmailSender
	frontendURL string
	cipher      *registrations.TokenCipher
	environment string
}

func NewRegistrationEmailService(db *gorm.DB, sender accountauth.EmailSender, frontendURL string, cipher *registrations.TokenCipher, environment ...string) (*RegistrationEmailService, error) {
	frontendURL = strings.TrimRight(strings.TrimSpace(frontendURL), "/")
	if frontendURL == "" {
		return nil, errors.New("public account frontend URL is required for registration email")
	}
	parsed, err := url.Parse(frontendURL)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return nil, errors.New("public account frontend URL is invalid")
	}
	env := "development"
	if len(environment) > 0 && strings.TrimSpace(environment[0]) != "" {
		env = strings.TrimSpace(environment[0])
	}
	if env != "development" && parsed.Scheme != "https" {
		return nil, errors.New("public account frontend URL must use https outside development")
	}
	if db == nil || sender == nil || cipher == nil {
		return nil, errors.New("registration email dependencies are not configured")
	}
	return &RegistrationEmailService{db: db, sender: sender, frontendURL: frontendURL, cipher: cipher, environment: env}, nil
}

func (s *RegistrationEmailService) Send(ctx context.Context, job models.OperationOutbox) error {
	id, err := strconv.Atoi(strings.TrimSpace(job.AggregateID))
	if err != nil || id <= 0 {
		return errors.New("registration email job has an invalid aggregate id")
	}
	kind, err := registrationEmailKind(job.Kind)
	if err != nil {
		return err
	}
	var registration models.EventRegistration
	if err := s.db.WithContext(ctx).Preload("Event").Preload("Participants").First(&registration, id).Error; err != nil {
		return err
	}
	if strings.TrimSpace(registration.Email) == "" {
		return errors.New("registration contact email is empty")
	}
	locale := safeRegistrationLocale(registration.Locale)
	rawToken := ""
	if kind == RegistrationReceived {
		ciphertext, ok := outboxPayloadString(job, "token_ciphertext")
		if !ok {
			return errors.New("registration receipt token ciphertext is missing")
		}
		rawToken, err = s.cipher.Open(ciphertext)
		if err != nil {
			return fmt.Errorf("open registration receipt token: %w", err)
		}
	}
	message := renderRegistrationEmail(registration, kind, locale, s.frontendURL, rawToken)
	return s.sender.Send(ctx, message)
}

func registrationEmailKind(kind string) (RegistrationEmailKind, error) {
	switch kind {
	case "registration.received":
		return RegistrationReceived, nil
	case "registration.confirmed":
		return RegistrationConfirmed, nil
	case "registration.cancelled":
		return RegistrationCancelled, nil
	case "registration.review_required":
		return RegistrationReviewRequired, nil
	default:
		return "", fmt.Errorf("unsupported registration email kind %q", kind)
	}
}

func renderRegistrationEmail(registration models.EventRegistration, kind RegistrationEmailKind, locale, frontendURL, rawToken string) accountauth.EmailMessage {
	eventTitle := "Event"
	eventSchedule := ""
	if registration.Event != nil {
		eventTitle = registration.Event.Title.Get(locale)
		if eventTitle == "" {
			eventTitle = registration.Event.Title.Get("th")
		}
		eventSchedule = formatRegistrationSchedule(registration.Event)
	}
	contactName := strings.TrimSpace(registration.FirstName + " " + registration.LastName)
	participantLines := make([]string, 0, len(registration.Participants))
	for index, participant := range registration.Participants {
		participantLines = append(participantLines, fmt.Sprintf("%d. %s", index+1, strings.TrimSpace(participant.FirstName+" "+participant.LastName)))
	}
	participantText := strings.Join(participantLines, "\n")
	subject, intro, statusText, actionLabel := registrationEmailCopy(locale, kind)
	bodyParts := []string{intro, eventTitle, eventSchedule, contactName, statusText, participantText}
	body := strings.TrimSpace(strings.Join(bodyParts, "\n\n"))
	actionURL := ""
	if kind == RegistrationReceived && rawToken != "" {
		actionURL = frontendURL + "/" + locale + "/events/registrations/manage#token=" + url.QueryEscape(rawToken)
		body += "\n\n" + actionLabel + ": " + actionURL
	}
	return accountauth.EmailMessage{To: registration.Email, Locale: locale, Subject: subject + ": " + eventTitle, Body: body, HTML: registrationEmailHTML(body, actionURL, actionLabel), ActionURL: actionURL}
}

func registrationEmailHTML(body, actionURL, actionLabel string) string {
	content := html.EscapeString(body)
	content = strings.ReplaceAll(content, "\n", "<br>\n")
	if actionURL == "" {
		return "<p>" + content + "</p>"
	}
	return "<p>" + content + "</p><p><a href=\"" + html.EscapeString(actionURL) + "\">" + html.EscapeString(actionLabel) + "</a></p>"
}

func registrationEmailCopy(locale string, kind RegistrationEmailKind) (string, string, string, string) {
	type copySet struct{ subject, intro, status, action string }
	copies := map[string]map[RegistrationEmailKind]copySet{
		"th": {
			RegistrationReceived:       {"ได้รับการลงทะเบียนกิจกรรม", "เราได้รับการลงทะเบียนกลุ่มของคุณแล้ว", "สถานะ: รอตรวจสอบการยืนยัน", "จัดการการลงทะเบียน"},
			RegistrationConfirmed:      {"ยืนยันการเข้าร่วมกิจกรรม", "การลงทะเบียนกลุ่มของคุณได้รับการยืนยันแล้ว", "สถานะ: ยืนยันแล้ว", ""},
			RegistrationCancelled:      {"ยกเลิกการลงทะเบียนกิจกรรม", "การลงทะเบียนกลุ่มของคุณถูกยกเลิกแล้ว", "สถานะ: ยกเลิก", ""},
			RegistrationReviewRequired: {"มีการแก้ไขการลงทะเบียนกิจกรรม", "การลงทะเบียนกลุ่มของคุณถูกส่งกลับมาเพื่อตรวจสอบอีกครั้ง", "สถานะ: รอตรวจสอบการยืนยัน", ""},
		},
		"en": {
			RegistrationReceived:       {"Event registration received", "We received your group registration", "Status: pending review", "Manage registration"},
			RegistrationConfirmed:      {"Event registration confirmed", "Your group registration has been confirmed", "Status: confirmed", ""},
			RegistrationCancelled:      {"Event registration cancelled", "Your group registration has been cancelled", "Status: cancelled", ""},
			RegistrationReviewRequired: {"Event registration changed", "Your group registration needs review again", "Status: pending review", ""},
		},
		"de": {
			RegistrationReceived:       {"Anmeldung erhalten", "Wir haben Ihre Gruppenanmeldung erhalten", "Status: Prüfung ausstehend", "Anmeldung verwalten"},
			RegistrationConfirmed:      {"Anmeldung bestätigt", "Ihre Gruppenanmeldung wurde bestätigt", "Status: bestätigt", ""},
			RegistrationCancelled:      {"Anmeldung storniert", "Ihre Gruppenanmeldung wurde storniert", "Status: storniert", ""},
			RegistrationReviewRequired: {"Anmeldung geändert", "Ihre Gruppenanmeldung muss erneut geprüft werden", "Status: Prüfung ausstehend", ""},
		},
	}
	selected, ok := copies[locale]
	if !ok {
		selected = copies["th"]
	}
	copy, ok := selected[kind]
	if !ok {
		copy = selected[RegistrationReceived]
	}
	return copy.subject, copy.intro, copy.status, copy.action
}

func formatRegistrationSchedule(event *models.Event) string {
	location, err := time.LoadLocation("Europe/Berlin")
	if err != nil {
		location = time.UTC
	}
	start := event.StartDate.In(location)
	if event.StartTime != nil {
		clock := event.StartTime.In(location)
		start = time.Date(start.Year(), start.Month(), start.Day(), clock.Hour(), clock.Minute(), clock.Second(), 0, location)
	}
	return start.Format("02.01.2006 15:04") + " Europe/Berlin"
}

func safeRegistrationLocale(locale string) string {
	switch strings.ToLower(strings.TrimSpace(locale)) {
	case "en", "de":
		return strings.ToLower(strings.TrimSpace(locale))
	default:
		return "th"
	}
}
