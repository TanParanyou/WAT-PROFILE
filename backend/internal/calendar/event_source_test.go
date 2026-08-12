package calendar

import (
	"testing"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func mustDate(value string) time.Time {
	date, err := time.Parse("2006-01-02", value)
	if err != nil {
		panic(err)
	}
	return date
}

func TestEventSourceMaterializesLocalizedCalendarEntry(t *testing.T) {
	entry := MaterializeEntry(models.Event{
		ID:        42,
		Slug:      "merit",
		Title:     models.MultiLangText{"th": "งานบุญ", "en": "Merit", "de": "Verdienst"},
		StartDate: mustDate("2026-08-10"),
		EndDate:   mustDate("2026-08-12"),
		IsActive:  true,
	}, "de", true)
	if entry.Title != "Verdienst" || entry.Source != "event" || !entry.AllDay || !entry.Detail.CanEdit {
		t.Fatalf("unexpected entry: %#v", entry)
	}
}

func TestEventSourceUsesExclusiveEndForAllDayEntries(t *testing.T) {
	entry := MaterializeEntry(models.Event{
		ID:        43,
		StartDate: mustDate("2026-08-10"),
		EndDate:   mustDate("2026-08-12"),
	}, "th", false)
	if entry.End != "2026-08-13" {
		t.Fatalf("end = %s", entry.End)
	}
}
