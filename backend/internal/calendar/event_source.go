package calendar

import (
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

const dateOnly = "2006-01-02"
const berlinDateTime = "2006-01-02T15:04:05-07:00"

var berlin, _ = time.LoadLocation("Europe/Berlin")

type EventSource struct {
	db *gorm.DB
}

func NewEventSource(db *gorm.DB) *EventSource {
	return &EventSource{db: db}
}

func (s *EventSource) Name() string { return "event" }

func (s *EventSource) List(ctx context.Context, request Request, canEdit bool) ([]Entry, error) {
	var events []models.Event
	query := s.db.WithContext(ctx).
		Where("events.end_date >= ?", request.From).
		Where("events.start_date <= ?", request.To).
		Order("events.start_date ASC, events.display_order ASC, events.id ASC")
	if !canEdit {
		query = query.Where("events.is_active = ?", true)
	}
	if len(request.ResourceIDs) > 0 {
		query = query.Where(
			"EXISTS (SELECT 1 FROM event_resource_assignments era JOIN calendar_resources cr ON cr.id = era.resource_id WHERE era.event_id = events.id AND cr.slug IN ?)",
			request.ResourceIDs,
		)
	}
	if err := query.Preload("ResourceAssignments.Resource").Find(&events).Error; err != nil {
		return nil, err
	}

	entries := make([]Entry, 0, len(events))
	for _, event := range events {
		entries = append(entries, MaterializeEntry(event, string(request.Locale), canEdit))
	}
	return entries, nil
}

func (s *EventSource) ListResources(ctx context.Context, locale Locale, canEdit bool) ([]Resource, error) {
	var resources []models.CalendarResource
	query := s.db.WithContext(ctx).
		Where("calendar_resources.is_active = ?", true).
		Order("calendar_resources.display_order ASC, calendar_resources.id ASC")
	if !canEdit {
		query = query.Where("calendar_resources.is_public = ?", true)
	}
	if err := query.Find(&resources).Error; err != nil {
		return nil, err
	}

	result := make([]Resource, 0, len(resources)+1)
	result = append(result, DefaultResource(locale))
	for _, resource := range resources {
		result = append(result, Resource{
			ID:    resource.Slug,
			Title: resource.Title.Get(string(locale)),
			Color: resource.Color,
			Group: resource.ResourceType,
		})
	}
	return result, nil
}

// Entry materializes an Event into the source-neutral calendar contract.
// Event dates are inclusive in persistence; all-day feed ends are exclusive.
func MaterializeEntry(event models.Event, locale string, canEdit bool) Entry {
	startDate := event.StartDate.In(berlin)
	endDate := event.EndDate.In(berlin)
	entry := Entry{
		ID:      fmt.Sprint(event.ID),
		Source:  "event",
		Title:   event.Title.Get(locale),
		Status:  "inactive",
		Display: Display{Tone: "muted"},
		Detail:  Detail{CanEdit: canEdit, Href: "/events/" + event.Slug, Location: event.Location.Get(locale)},
	}
	if event.IsActive {
		entry.Status = "active"
		entry.Display.Tone = "default"
	}
	if canEdit {
		entry.Detail.EditorHref = fmt.Sprintf("/admin/events/%d", event.ID)
	}
	resourceIDs := make([]string, 0, len(event.ResourceAssignments))
	for _, assignment := range event.ResourceAssignments {
		resource := assignment.Resource
		if resource == nil || !resource.IsActive || (!canEdit && !resource.IsPublic) {
			continue
		}
		if resource.Slug != "" {
			resourceIDs = append(resourceIDs, resource.Slug)
		}
	}
	sort.Strings(resourceIDs)
	if len(resourceIDs) > 0 {
		entry.ResourceIDs = resourceIDs
		entry.ResourceID = resourceIDs[0]
	}

	if event.StartTime == nil || event.EndTime == nil {
		entry.AllDay = true
		entry.Start = startDate.Format(dateOnly)
		entry.End = endDate.AddDate(0, 0, 1).Format(dateOnly)
		return entry
	}

	startTime := event.StartTime.In(berlin)
	endTime := event.EndTime.In(berlin)
	startYear, startMonth, startDay := startDate.Date()
	endYear, endMonth, endDay := endDate.Date()
	entry.Start = time.Date(startYear, startMonth, startDay, startTime.Hour(), startTime.Minute(), startTime.Second(), 0, berlin).Format(berlinDateTime)
	entry.End = time.Date(endYear, endMonth, endDay, endTime.Hour(), endTime.Minute(), endTime.Second(), 0, berlin).Format(berlinDateTime)
	return entry
}
