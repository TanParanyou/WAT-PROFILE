package services

import (
	"strconv"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type EventService struct {
	db *gorm.DB
}

func NewEventService(db *gorm.DB) *EventService {
	return &EventService{db: db}
}

type EventListOptions struct {
	Common   listquery.Common
	Statuses []string
	Types    []string
}

// EventDateRangeOverlaps reports whether an inclusive event range intersects
// an inclusive calendar range.
func EventDateRangeOverlaps(eventStart, eventEnd, rangeStart, rangeEnd time.Time) bool {
	return !eventEnd.Before(rangeStart) && !eventStart.After(rangeEnd)
}

var eventSortColumns = map[string]string{
	"id":            "events.id",
	"start_date":    "events.start_date",
	"title":         "events.title->>'th'",
	"event_type":    "events.event_type",
	"end_date":      "events.end_date",
	"created_at":    "events.created_at",
	"display_order": "events.display_order",
}

// ListAdmin returns a paginated list of all events for admin management
func (s *EventService) ListAdmin(options EventListOptions) ([]models.Event, int64, error) {
	var events []models.Event
	var total int64

	query := s.db.Model(&models.Event{})

	if options.Common.Search != "" {
		searchTerm := "%" + options.Common.Search + "%"
		query = query.Where(
			"events.slug ILIKE ? OR events.title->>'th' ILIKE ? OR events.title->>'en' ILIKE ? OR events.title->>'de' ILIKE ? OR events.location->>'th' ILIKE ? OR events.location->>'en' ILIKE ? OR events.location->>'de' ILIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	if len(options.Statuses) > 0 {
		var activeFilter []bool
		for _, st := range options.Statuses {
			if st == "active" {
				activeFilter = append(activeFilter, true)
			} else if st == "inactive" {
				activeFilter = append(activeFilter, false)
			}
		}
		if len(activeFilter) > 0 {
			query = query.Where("events.is_active IN ?", activeFilter)
		}
	}

	if len(options.Types) > 0 {
		query = query.Where("events.event_type IN ?", options.Types)
	}

	if options.Common.From != nil {
		query = query.Where("events.end_date >= ?", *options.Common.From)
	}
	if options.Common.To != nil {
		query = query.Where("events.start_date <= ?", *options.Common.To)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortCol, ok := eventSortColumns[options.Common.Sort]
	if !ok {
		sortCol = "events.start_date"
	}
	orderDir := "DESC"
	if options.Common.Order == "asc" {
		orderDir = "ASC"
	}

	offset := (options.Common.Page - 1) * options.Common.Limit
	preloadSchedules := func(db *gorm.DB) *gorm.DB {
		return db.Order("display_order ASC")
	}
	err := query.Preload("Schedules", preloadSchedules).
		Order(sortCol + " " + orderDir + ", events.id " + orderDir).
		Offset(offset).
		Limit(options.Common.Limit).
		Find(&events).Error

	return events, total, err
}

// ListActive returns all active events with schedules
func (s *EventService) ListActive(limit int, from, to *time.Time) ([]models.Event, error) {
	var events []models.Event
	preloadSchedules := func(db *gorm.DB) *gorm.DB {
		return db.Order("display_order ASC")
	}
	query := s.db.Where("is_active = ?", true).
		Order("start_date ASC").
		Preload("Schedules", preloadSchedules)
	if from == nil {
		query = query.Where("end_date >= CURRENT_DATE")
	}
	if from != nil {
		query = query.Where("end_date >= ?", *from)
	}
	if to != nil {
		query = query.Where("start_date <= ?", *to)
	}
	if limit > 0 {
		query = query.Limit(limit)
	}
	err := query.Find(&events).Error
	return events, err
}

// GetBySlug returns a single active event by slug or ID
func (s *EventService) GetBySlug(slug string) (*models.Event, error) {
	var event models.Event
	preloadSchedules := func(db *gorm.DB) *gorm.DB {
		return db.Order("display_order ASC")
	}
	query := s.db.Where("is_active = ?", true).Preload("Schedules", preloadSchedules)
	if id, err := strconv.Atoi(slug); err == nil {
		query = query.Where("slug = ? OR id = ?", slug, id)
	} else {
		query = query.Where("slug = ?", slug)
	}
	err := query.First(&event).Error
	if err != nil {
		return nil, err
	}
	return &event, nil
}

// Create creates a new event
func (s *EventService) Create(event *models.Event) error {
	return s.db.Create(event).Error
}

// GetByID returns an event by ID
func (s *EventService) GetByID(id int) (*models.Event, error) {
	var event models.Event
	err := s.db.Preload("Schedules").First(&event, id).Error
	if err != nil {
		return nil, err
	}
	return &event, nil
}

// Update saves changes to an event
func (s *EventService) Update(event *models.Event) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Session(&gorm.Session{FullSaveAssociations: true}).Save(event).Error; err != nil {
			return err
		}
		if err := tx.Model(event).Association("Schedules").Replace(event.Schedules); err != nil {
			return err
		}
		return nil
	})
}

// Delete removes an event by ID
func (s *EventService) Delete(id int) error {
	return s.db.Delete(&models.Event{}, id).Error
}

// BulkDelete removes multiple events by their IDs
func (s *EventService) BulkDelete(ids []int) error {
	return s.db.Where("id IN ?", ids).Delete(&models.Event{}).Error
}
