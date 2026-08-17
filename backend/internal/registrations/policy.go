package registrations

import (
	"net/mail"
	"os"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

func NormalizeAndValidateCreate(request CreateRequest) (CreateInput, *DomainError) {
	locale, fields := normalizeLocale(request.Locale)
	contact, contactFields := normalizeContact(request.Contact)
	mergeFields(fields, contactFields)
	participants, participantFields := normalizeParticipants(request.Participants)
	mergeFields(fields, participantFields)

	if strings.TrimSpace(request.PrivacyNoticeVersion) == "" {
		fields["privacy_notice_version"] = "Privacy notice version is required"
	} else if runeLength(request.PrivacyNoticeVersion) > MaxPrivacyNoticeVersionLength {
		fields["privacy_notice_version"] = "Privacy notice version is too long"
	} else if strings.TrimSpace(request.PrivacyNoticeVersion) != CurrentPrivacyNoticeVersion() {
		fields["privacy_notice_version"] = "Privacy notice version is not current"
	}
	if !request.PrivacyConsent {
		fields["privacy_consent"] = "Privacy consent is required"
	}
	if len(participants) < 1 {
		fields["participants"] = "At least one participant is required"
	} else if len(participants) > MaxParticipantsPerRegistration {
		return CreateInput{}, NewDomainError(CodeGroupLimitExceeded, "A registration cannot contain more than "+strconv.Itoa(MaxParticipantsPerRegistration)+" participants", map[string]string{"participants": "Too many participants"})
	}
	if len(fields) > 0 {
		return CreateInput{}, NewDomainError(CodeValidation, "Registration details are invalid", fields)
	}

	return CreateInput{
		Locale:               locale,
		Contact:              contact,
		Participants:         participants,
		PrivacyNoticeVersion: strings.TrimSpace(request.PrivacyNoticeVersion),
	}, nil
}

// CurrentPrivacyNoticeVersion is server-controlled so clients cannot choose an
// arbitrary notice version while still allowing an explicit deployment change.
func CurrentPrivacyNoticeVersion() string {
	version := strings.TrimSpace(os.Getenv("EVENT_REGISTRATION_PRIVACY_NOTICE_VERSION"))
	if version == "" {
		return DefaultPrivacyNoticeVersion
	}
	return version
}

func NormalizeAndValidateAdminCreate(request AdminCreateRequest) (AdminCreateInput, *DomainError) {
	fields := make(map[string]string)
	if request.EventID <= 0 {
		fields["event_id"] = "Event ID is required"
	}
	locale, localeFields := normalizeLocale(request.Locale)
	mergeFields(fields, localeFields)
	contact, contactFields := normalizeContact(request.Contact)
	mergeFields(fields, contactFields)
	participants, participantFields := normalizeParticipants(request.Participants)
	mergeFields(fields, participantFields)

	status := strings.ToLower(strings.TrimSpace(request.Status))
	if status == "" {
		status = "confirmed"
	}
	if status != "pending" && status != "confirmed" && status != "attended" && status != "cancelled" {
		fields["status"] = "Status must be pending, confirmed, attended, or cancelled"
	}

	dietary := strings.TrimSpace(request.DietaryRestrictions)
	if runeLength(dietary) > MaxFreeTextLength {
		fields["dietary_restrictions"] = "Dietary restrictions is too long"
	}
	specialNeeds := strings.TrimSpace(request.SpecialNeeds)
	if runeLength(specialNeeds) > MaxFreeTextLength {
		fields["special_needs"] = "Special needs is too long"
	}
	notes := strings.TrimSpace(request.AdditionalNotes)
	if runeLength(notes) > MaxFreeTextLength {
		fields["additional_notes"] = "Additional notes is too long"
	}

	if request.SendEmail && contact.Email == "" {
		fields["send_email"] = "Email is required when sending email notification"
	}

	if len(participants) < 1 {
		fields["participants"] = "At least one participant is required"
	} else if len(participants) > MaxParticipantsPerRegistration {
		return AdminCreateInput{}, NewDomainError(CodeGroupLimitExceeded, "A registration cannot contain more than "+strconv.Itoa(MaxParticipantsPerRegistration)+" participants", map[string]string{"participants": "Too many participants"})
	}
	if len(fields) > 0 {
		return AdminCreateInput{}, NewDomainError(CodeValidation, "Registration details are invalid", fields)
	}

	return AdminCreateInput{
		EventID:              request.EventID,
		Locale:               locale,
		Status:               status,
		Contact:              contact,
		Participants:         participants,
		DietaryRestrictions: dietary,
		SpecialNeeds:        specialNeeds,
		AdditionalNotes:      notes,
		SendEmail:            request.SendEmail,
	}, nil
}

func NormalizeAndValidateUpdate(request UpdateRequest) (UpdateInput, *DomainError) {
	locale, fields := normalizeLocale(request.Locale)
	contact, contactFields := normalizeContact(request.Contact)
	mergeFields(fields, contactFields)
	participants, participantFields := normalizeParticipants(request.Participants)
	mergeFields(fields, participantFields)
	if len(participants) < 1 {
		fields["participants"] = "At least one participant is required"
	} else if len(participants) > MaxParticipantsPerRegistration {
		return UpdateInput{}, NewDomainError(CodeGroupLimitExceeded, "A registration cannot contain more than "+strconv.Itoa(MaxParticipantsPerRegistration)+" participants", map[string]string{"participants": "Too many participants"})
	}
	if len(fields) > 0 {
		return UpdateInput{}, NewDomainError(CodeValidation, "Registration details are invalid", fields)
	}
	return UpdateInput{Locale: locale, Contact: contact, Participants: participants}, nil
}

func DeriveAvailability(window EventWindow, now time.Time, activeCount int) Availability {
	availability := Availability{
		Enabled:         window.Enabled,
		Deadline:        window.Deadline,
		MaxParticipants: window.MaxParticipants,
		RegisteredCount: activeCount,
		State:           AvailabilityAvailable,
		CanRegister:     true,
	}
	if !window.Enabled {
		availability.State = AvailabilityDisabled
		availability.CanRegister = false
		availability.UnavailableCode = codePtr(CodeDisabled)
		return availability
	}
	if !window.StartsAt.IsZero() && !now.Before(window.StartsAt) {
		availability.State = AvailabilityClosed
		availability.CanRegister = false
		availability.UnavailableCode = codePtr(CodeClosed)
		return availability
	}
	if window.Deadline != nil && !now.Before(*window.Deadline) {
		availability.State = AvailabilityClosed
		availability.CanRegister = false
		availability.UnavailableCode = codePtr(CodeClosed)
		return availability
	}
	if window.MaxParticipants != nil {
		remaining := *window.MaxParticipants - activeCount
		if remaining < 0 {
			remaining = 0
		}
		availability.Remaining = &remaining
		if activeCount >= *window.MaxParticipants {
			availability.State = AvailabilityFull
			availability.CanRegister = false
			availability.UnavailableCode = codePtr(CodeFull)
		}
	}
	return availability
}

func normalizeLocale(value string) (string, map[string]string) {
	locale := strings.ToLower(strings.TrimSpace(value))
	if locale == "" {
		locale = "th"
	}
	if locale != "th" && locale != "en" && locale != "de" {
		return locale, map[string]string{"locale": "Locale must be th, en, or de"}
	}
	return locale, map[string]string{}
}

func normalizeContact(input ContactInput) (ContactInput, map[string]string) {
	contact := ContactInput{
		FirstName: strings.TrimSpace(input.FirstName),
		LastName:  strings.TrimSpace(input.LastName),
		Email:     strings.ToLower(strings.TrimSpace(input.Email)),
		Phone:     strings.TrimSpace(input.Phone),
	}
	fields := make(map[string]string)
	validateText(fields, "contact.first_name", contact.FirstName, MaxNameLength, "First name")
	validateText(fields, "contact.last_name", contact.LastName, MaxNameLength, "Last name")
	if contact.Email == "" {
		fields["contact.email"] = "Email is required"
	} else if runeLength(contact.Email) > MaxEmailLength {
		fields["contact.email"] = "Email is too long"
	} else if _, err := mail.ParseAddress(contact.Email); err != nil {
		fields["contact.email"] = "Email is invalid"
	}
	if runeLength(contact.Phone) > MaxPhoneLength {
		fields["contact.phone"] = "Phone is too long"
	}
	return contact, fields
}

func normalizeParticipants(inputs []ParticipantInput) ([]ParticipantInput, map[string]string) {
	participants := make([]ParticipantInput, 0, len(inputs))
	fields := make(map[string]string)
	for index, input := range inputs {
		participant := ParticipantInput{
			ID:                  input.ID,
			FirstName:           strings.TrimSpace(input.FirstName),
			LastName:            strings.TrimSpace(input.LastName),
			DietaryRestrictions: strings.TrimSpace(input.DietaryRestrictions),
			SpecialNeeds:        strings.TrimSpace(input.SpecialNeeds),
			AdditionalNotes:     strings.TrimSpace(input.AdditionalNotes),
		}
		validateText(fields, fieldPath(index, "first_name"), participant.FirstName, MaxNameLength, "First name")
		validateText(fields, fieldPath(index, "last_name"), participant.LastName, MaxNameLength, "Last name")
		validateText(fields, fieldPath(index, "dietary_restrictions"), participant.DietaryRestrictions, MaxFreeTextLength, "Dietary restrictions")
		validateText(fields, fieldPath(index, "special_needs"), participant.SpecialNeeds, MaxFreeTextLength, "Special needs")
		validateText(fields, fieldPath(index, "additional_notes"), participant.AdditionalNotes, MaxFreeTextLength, "Additional notes")
		participants = append(participants, participant)
	}
	return participants, fields
}

func validateText(fields map[string]string, path, value string, maxLength int, label string) {
	if value == "" && (strings.HasSuffix(path, "first_name") || strings.HasSuffix(path, "last_name")) {
		fields[path] = label + " is required"
		return
	}
	if runeLength(value) > maxLength {
		fields[path] = label + " is too long"
	}
}

func fieldPath(index int, field string) string {
	return "participants." + formatIndex(index) + "." + field
}

func formatIndex(index int) string {
	return strconv.Itoa(index)
}

func mergeFields(target, source map[string]string) {
	for key, value := range source {
		target[key] = value
	}
}

func runeLength(value string) int {
	return utf8.RuneCountInString(value)
}

func codePtr(code Code) *Code {
	return &code
}
