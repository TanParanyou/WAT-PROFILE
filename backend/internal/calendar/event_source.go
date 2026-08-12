package calendar

import (
	"context"
	"fmt"
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
	if err := query.Find(&events).Error; err != nil {
		return nil, err
	}

	entries := make([]Entry, 0, len(events))
	for _, event := range events {
		entries = append(entries, MaterializeEntry(event, string(request.Locale), canEdit))
	}
	return entries, nil
}

// Entry materializes an Event into the source-neutral calendar contract.
// Event dates are inclusive in persistence; all-day feed ends are exclusive.
func MaterializeEntry(event models.Event, locale string, canEdit bool) Entry {
	startDate := event.StartDate.Format(dateOnly)
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

	if event.StartTime == nil || event.EndTime == nil {
		entry.AllDay = true
		entry.Start = startDate
		entry.End = event.EndDate.AddDate(0, 0, 1).Format(dateOnly)
		return entry
	}

	startYear, startMonth, startDay := event.StartDate.Date()
	endYear, endMonth, endDay := event.EndDate.Date()
	entry.Start = time.Date(startYear, startMonth, startDay, event.StartTime.Hour(), event.StartTime.Minute(), event.StartTime.Second(), 0, berlin).Format(berlinDateTime)
	entry.End = time.Date(endYear, endMonth, endDay, event.EndTime.Hour(), event.EndTime.Minute(), event.EndTime.Second(), 0, berlin).Format(berlinDateTime)
	return entry
}
