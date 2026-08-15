package models

import "testing"

func TestCalendarResourceAssignmentUsesEventAndResourceIDs(t *testing.T) {
	assignment := EventResourceAssignment{EventID: 12, ResourceID: 7}
	if assignment.EventID != 12 || assignment.ResourceID != 7 {
		t.Fatalf("unexpected assignment: %#v", assignment)
	}
}

func TestCalendarResourceStoresLocalizedTitleAndVisibility(t *testing.T) {
	resource := CalendarResource{
		Slug:     "main-hall",
		Title:    MultiLangText{"th": "ศาลาหลัก", "en": "Main hall", "de": "Haupthalle"},
		Metadata: JSONMap{"kind": "location"},
		IsActive: true,
		IsPublic: true,
	}
	if resource.Title.Get("de") != "Haupthalle" || !resource.IsPublic {
		t.Fatalf("unexpected resource: %#v", resource)
	}
}
