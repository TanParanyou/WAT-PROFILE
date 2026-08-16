package services

import "testing"

func TestAdminListSortContractsAcceptCommonFrontendKeys(t *testing.T) {
	cases := map[string]map[string]string{
		"events":              eventSortColumns,
		"event_categories":    eventCategorySortColumns,
		"gallery":             gallerySortColumns,
		"gallery_categories":  galleryCategorySortColumns,
		"members":             memberSortColumns,
		"registrations":       registrationSortColumns,
		"schedules":           scheduleSortColumns,
		"contacts":            contactSortColumns,
		"roles":               roleSortColumns,
		"audit":               auditSortColumns,
		"donations":           donationSortColumns,
		"donation_categories": donationCategorySortColumns,
		"media":               mediaSortColumns,
		"users":               userSortColumns,
		"monks":               monkSortColumns,
		"calendar_resources":  calendarResourceSortColumns,
	}
	wants := map[string][]string{
		"events":              {"id", "title", "event_type", "start_date", "end_date", "created_at"},
		"event_categories":    {"id", "name", "display_order", "is_active", "created_at"},
		"gallery":             {"id", "caption", "display_order", "created_at"},
		"gallery_categories":  {"id", "name", "slug", "display_order", "created_at"},
		"members":             {"id", "member_code", "first_name_th", "membership_type", "membership_status", "membership_date", "created_at"},
		"registrations":       {"id", "name", "email", "event_title", "status", "created_at"},
		"schedules":           {"id", "schedule_type", "day_of_week", "start_time", "activity", "created_at"},
		"contacts":            {"id", "name", "email", "subject", "inquiry_type", "status", "created_at"},
		"roles":               {"id", "name", "created_at"},
		"audit":               {"id", "action", "entity_type", "created_at"},
		"donations":           {"id", "receipt_number", "donor_name", "amount", "donation_method", "donation_date", "status", "created_at"},
		"donation_categories": {"id", "name", "display_order", "is_active", "created_at"},
		"media":               {"id", "filename", "file_size", "created_at", "mime_type"},
		"users":               {"id", "name", "email", "created_at"},
		"monks":               {"id", "name", "position", "pansa", "ordination_date", "display_order", "status", "created_at"},
		"calendar_resources":  {"id", "slug", "resource_type", "display_order", "created_at"},
	}
	for resource, keys := range wants {
		for _, key := range keys {
			if cases[resource][key] == "" {
				t.Errorf("%s sort key %q is not mapped", resource, key)
			}
		}
	}
}

func TestMediaMissingAltFilterLocalesAreStable(t *testing.T) {
	got := (&MediaFilterOptions{AltMissingLocales: []string{"th", "en", "de"}}).AltMissingLocales
	if len(got) != 3 || got[0] != "th" || got[1] != "en" || got[2] != "de" {
		t.Fatalf("unexpected missing-alt locale contract: %#v", got)
	}
}
