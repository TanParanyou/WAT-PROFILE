package models

import (
	"reflect"
	"testing"
)

func TestEventRegistrationGroupContract(t *testing.T) {
	typeOf := reflect.TypeOf(EventRegistration{})
	for _, name := range []string{
		"UserID",
		"Locale",
		"PrivacyNoticeVersion",
		"PrivacyConsentAt",
		"ManageTokenHash",
		"ManageTokenExpiresAt",
		"CancellationOrigin",
		"Participants",
	} {
		if _, ok := typeOf.FieldByName(name); !ok {
			t.Fatalf("EventRegistration is missing %s", name)
		}
	}

	participant := EventRegistrationParticipant{}
	if participant.TableName() != "event_registration_participants" {
		t.Fatalf("unexpected participant table %q", participant.TableName())
	}
}
