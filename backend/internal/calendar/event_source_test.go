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

func TestEventSourceMaterializesBerlinWallTime(t *testing.T) {
	startDate := time.Date(2026, time.August, 13, 22, 0, 0, 0, time.UTC)
	startTime := time.Date(2026, time.August, 13, 22, 0, 0, 0, time.UTC)
	endTime := time.Date(2026, time.August, 14, 21, 45, 0, 0, time.UTC)

	entry := MaterializeEntry(models.Event{
		ID:        44,
		Slug:      "late-meditation",
		Title:     models.MultiLangText{"th": "ปฏิบัติธรรม"},
		StartDate: startDate,
		EndDate:   startDate,
		StartTime: &startTime,
		EndTime:   &endTime,
	}, "th", false)

	if entry.Start != "2026-08-14T00:00:00+02:00" {
		t.Fatalf("start = %s", entry.Start)
	}
	if entry.End != "2026-08-14T23:45:00+02:00" {
		t.Fatalf("end = %s", entry.End)
	}
}

func TestEventSourceMaterializesCalendarPresentationFields(t *testing.T) {
	startTime := time.Date(2026, time.August, 14, 23, 30, 0, 0, berlin)
	endTime := time.Date(2026, time.August, 15, 1, 15, 0, 0, berlin)
	entry := MaterializeEntry(models.Event{
		ID:        45,
		Slug:      "night-chanting",
		Title:     models.MultiLangText{"en": "Night chanting"},
		Location:  models.MultiLangText{"en": "Main hall"},
		StartDate: mustDate("2026-08-14"),
		EndDate:   mustDate("2026-08-15"),
		StartTime: &startTime,
		EndTime:   &endTime,
		IsActive:  false,
	}, "de", true)

	if entry.Start != "2026-08-14T23:30:00+02:00" || entry.End != "2026-08-15T01:15:00+02:00" {
		t.Fatalf("unexpected timed range: %#v", entry)
	}
	if entry.Title != "Night chanting" || entry.Detail.Location != "Main hall" || entry.Status != "inactive" || entry.Display.Tone != "muted" {
		t.Fatalf("unexpected localized presentation: %#v", entry)
	}
	if entry.Detail.Href != "/events/night-chanting" || entry.Detail.EditorHref != "/admin/events/45" || !entry.Detail.CanEdit {
		t.Fatalf("unexpected navigation metadata: %#v", entry.Detail)
	}
}

func TestEventSourceKeepsOverlappingEntriesIndependent(t *testing.T) {
	first := MaterializeEntry(models.Event{
		ID: 46, Slug: "overlap-a", StartDate: mustDate("2026-08-14"), EndDate: mustDate("2026-08-14"), IsActive: true,
	}, "th", false)
	second := MaterializeEntry(models.Event{
		ID: 47, Slug: "overlap-b", StartDate: mustDate("2026-08-14"), EndDate: mustDate("2026-08-14"), IsActive: true,
	}, "th", false)

	if first.ID == second.ID || first.Start != second.Start || first.End != second.End {
		t.Fatalf("overlapping entries were not materialized independently: %#v %#v", first, second)
	}
}

func TestEventSourceMaterializesMultipleVisibleResources(t *testing.T) {
	entry := MaterializeEntry(models.Event{
		ID: 48,
		ResourceAssignments: []models.EventResourceAssignment{
			{Resource: &models.CalendarResource{Slug: "projector", IsActive: true, IsPublic: true}},
			{Resource: &models.CalendarResource{Slug: "main-hall", IsActive: true, IsPublic: true}},
		},
		StartDate: mustDate("2026-08-14"),
		EndDate:   mustDate("2026-08-14"),
	}, "en", false)
	if len(entry.ResourceIDs) != 2 || entry.ResourceIDs[0] != "main-hall" || entry.ResourceIDs[1] != "projector" || entry.ResourceID != "main-hall" {
		t.Fatalf("unexpected resource IDs: %#v", entry)
	}
}

func TestEventSourceHidesPrivateResourceFromPublicEntry(t *testing.T) {
	entry := MaterializeEntry(models.Event{
		ID: 49,
		ResourceAssignments: []models.EventResourceAssignment{
			{Resource: &models.CalendarResource{Slug: "staff-room", IsActive: true, IsPublic: false}},
		},
		StartDate: mustDate("2026-08-14"),
		EndDate:   mustDate("2026-08-14"),
	}, "en", false)
	if len(entry.ResourceIDs) != 0 || entry.ResourceID != "" {
		t.Fatalf("private resource leaked into public entry: %#v", entry)
	}
}
