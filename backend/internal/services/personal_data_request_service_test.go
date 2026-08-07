package services

import (
	"strings"
	"testing"
)

func TestPersonalDataRequestInputValidation(t *testing.T) {
	svc := NewPersonalDataRequestService(nil)
	_, err := svc.Create(t.Context(), PersonalDataRequestInput{RequestType: "unknown"}, [16]byte{})
	if err == nil || !strings.Contains(err.Error(), "request type") {
		t.Fatalf("expected request type validation, got %v", err)
	}
}

func TestMaskEmailMinimisesIdentity(t *testing.T) {
	if got := maskEmail("person@example.com"); got != "p***@example.com" {
		t.Fatalf("unexpected mask: %s", got)
	}
}
