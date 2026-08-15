package registrations

import (
	"testing"
	"time"
)

func TestNormalizeAndValidateCreateRequiresOneToTenParticipants(t *testing.T) {
	valid := CreateRequest{
		Locale:               "de",
		Contact:              ContactInput{FirstName: " Ada ", LastName: " Lovelace ", Email: " ADA@Example.DE "},
		Participants:         []ParticipantInput{{FirstName: "Ada", LastName: "Lovelace"}},
		PrivacyNoticeVersion: "2026-08",
		PrivacyConsent:       true,
	}
	got, domainErr := NormalizeAndValidateCreate(valid)
	if domainErr != nil || got.Contact.Email != "ada@example.de" {
		t.Fatalf("normalize create = %#v, err=%v", got, domainErr)
	}

	valid.Participants = make([]ParticipantInput, 11)
	_, domainErr = NormalizeAndValidateCreate(valid)
	if domainErr == nil || domainErr.Code != CodeGroupLimitExceeded {
		t.Fatalf("expected group limit error, got %v", domainErr)
	}
}

func TestDeriveAvailabilityUsesDeadlineCapacityAndBerlinEventStart(t *testing.T) {
	location, err := time.LoadLocation("Europe/Berlin")
	if err != nil {
		t.Fatal(err)
	}
	start := time.Date(2026, 9, 12, 9, 0, 0, 0, location)
	deadline := start.Add(-24 * time.Hour)
	window := EventWindow{Enabled: true, Deadline: &deadline, StartsAt: start, MaxParticipants: intPtr(10)}
	if got := DeriveAvailability(window, deadline.Add(time.Second), 4); got.State != AvailabilityClosed {
		t.Fatalf("state=%s want closed", got.State)
	}
	if got := DeriveAvailability(window, deadline.Add(-time.Second), 10); got.State != AvailabilityFull {
		t.Fatalf("state=%s want full", got.State)
	}
}

func intPtr(value int) *int {
	return &value
}
