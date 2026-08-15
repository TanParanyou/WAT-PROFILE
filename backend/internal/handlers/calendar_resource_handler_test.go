package handlers

import (
	"testing"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func TestValidateCalendarResourceInputRejectsIncompleteData(t *testing.T) {
	input := CalendarResourceInput{
		Title: models.MultiLangText{"th": "", "en": "", "de": ""},
	}
	if err := ValidateCalendarResourceInput(input); err == nil {
		t.Fatal("expected incomplete resource input to be rejected")
	}
}

func TestValidateCalendarResourceInputAcceptsProductionShape(t *testing.T) {
	capacity := 20
	input := CalendarResourceInput{
		Slug:         "main-hall",
		ResourceType: "location",
		Title:        models.MultiLangText{"th": "ศาลาหลัก", "en": "Main hall", "de": "Haupthalle"},
		Color:        "#123456",
		Capacity:     &capacity,
		IsActive:     true,
		IsPublic:     true,
	}
	if err := ValidateCalendarResourceInput(input); err != nil {
		t.Fatalf("expected valid resource input, got %v", err)
	}
}
