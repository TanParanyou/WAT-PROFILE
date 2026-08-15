package services

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/registrations"
)

func TestAdminSetStatusRejectsUnknownStatus(t *testing.T) {
	service := &RegistrationService{}
	_, err := service.AdminSetStatus(context.Background(), uuid.New(), 1, registrations.StatusInput{Status: "unknown"})
	var domainErr *registrations.DomainError
	if !errors.As(err, &domainErr) || domainErr.Code != registrations.CodeValidation {
		t.Fatalf("error=%v want validation domain error", err)
	}
}

func TestAdminDetailDoesNotExposeManagementToken(t *testing.T) {
	row := &models.EventRegistration{ID: 1, RegistrationType: "guest", RegistrationStatus: "pending", ConfirmationCode: "ABC", ManageTokenHash: "secret-hash", FirstName: "A", LastName: "B", Email: "a@example.com", Participants: []models.EventRegistrationParticipant{{ID: 1, FirstName: "A", LastName: "B", AttendanceStatus: "registered"}}}
	detail := adminRegistrationDetail(row)
	encoded, err := json.Marshal(detail)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(encoded), "secret-hash") {
		t.Fatalf("admin response exposed token hash: %s", encoded)
	}
}
