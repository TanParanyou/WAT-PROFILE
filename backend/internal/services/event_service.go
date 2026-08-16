package services

import (
	"errors"
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

var eventCategorySortColumns = map[string]string{
	"id":            "event_categories.id",
	"name":          "event_categories.name->>'th'",
	"display_order": "event_categories.display_order",
	"is_active":     "event_categories.is_active",
	"created_at":    "event_categories.created_at",
}

type EventCategoryListOptions struct {
	Common   listquery.Common
	Statuses []string
}

var ErrInvalidEventResourceIDs = errors.New("invalid event resource IDs")

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
	err := query.Preload("Category").
		Preload("Schedules", preloadSchedules).
		Preload("ResourceAssignments.Resource").
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
		Preload("Category").
		Preload("Schedules", preloadSchedules).
		Preload("ResourceAssignments.Resource")
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
	query := s.db.Where("is_active = ?", true).
		Preload("Category").
		Preload("Schedules", preloadSchedules).
		Preload("ResourceAssignments.Resource")
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

// CreateWithResourceIDs creates an event and its resource links in one
// transaction. Resource IDs are validated against active resources before the
// join rows are written.
func (s *EventService) CreateWithResourceIDs(event *models.Event, resourceIDs []int) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(event).Error; err != nil {
			return err
		}
		return s.ReplaceResourceAssignments(tx, event.ID, resourceIDs)
	})
}

// GetByID returns an event by ID
func (s *EventService) GetByID(id int) (*models.Event, error) {
	var event models.Event
	err := s.db.Preload("Category").Preload("Schedules").Preload("ResourceAssignments.Resource").First(&event, id).Error
	if err != nil {
		return nil, err
	}
	return &event, nil
}

// Update saves changes to an event
func (s *EventService) Update(event *models.Event) error {
	return s.update(event, nil)
}

// UpdateWithResourceIDs updates an event and replaces its resource links in
// one transaction. An empty slice intentionally clears all links.
func (s *EventService) UpdateWithResourceIDs(event *models.Event, resourceIDs []int) error {
	return s.update(event, &resourceIDs)
}

func (s *EventService) update(event *models.Event, resourceIDs *[]int) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Session(&gorm.Session{FullSaveAssociations: true}).Save(event).Error; err != nil {
			return err
		}
		if err := tx.Model(event).Association("Schedules").Replace(event.Schedules); err != nil {
			return err
		}
		if resourceIDs != nil {
			if err := s.ReplaceResourceAssignments(tx, event.ID, *resourceIDs); err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *EventService) ReplaceResourceAssignments(tx *gorm.DB, eventID int, resourceIDs []int) error {
	normalized, err := NormalizeResourceIDs(resourceIDs)
	if err != nil {
		return ErrInvalidEventResourceIDs
	}
	if err := NewCalendarResourceService(tx).ValidateActiveIDs(tx, normalized); err != nil {
		return err
	}
	if err := tx.Where("event_id = ?", eventID).Delete(&models.EventResourceAssignment{}).Error; err != nil {
		return err
	}
	if len(normalized) == 0 {
		return nil
	}
	assignments := make([]models.EventResourceAssignment, len(normalized))
	for index, resourceID := range normalized {
		assignments[index] = models.EventResourceAssignment{EventID: eventID, ResourceID: resourceID}
	}
	return tx.Create(&assignments).Error
}

// Delete removes an event by ID
func (s *EventService) Delete(id int) error {
	return s.db.Delete(&models.Event{}, id).Error
}

// BulkDelete removes multiple events by their IDs
func (s *EventService) BulkDelete(ids []int) error {
	return s.db.Where("id IN ?", ids).Delete(&models.Event{}).Error
}

// ListCategories returns all active event categories for public / dropdown use
func (s *EventService) ListCategories() ([]models.EventCategory, error) {
	var categories []models.EventCategory
	err := s.db.Where("is_active = ?", true).
		Order("display_order ASC, id ASC").
		Find(&categories).Error
	return categories, err
}

// ListCategoriesAdmin returns paginated event categories for admin management
func (s *EventService) ListCategoriesAdmin(options EventCategoryListOptions) ([]models.EventCategory, int64, error) {
	var categories []models.EventCategory
	var total int64

	query := s.db.Model(&models.EventCategory{})

	if options.Common.Search != "" {
		searchTerm := "%" + options.Common.Search + "%"
		query = query.Where(
			"event_categories.name->>'th' ILIKE ? OR event_categories.name->>'en' ILIKE ? OR event_categories.name->>'de' ILIKE ? OR event_categories.description->>'th' ILIKE ? OR event_categories.description->>'en' ILIKE ? OR event_categories.description->>'de' ILIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
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
			query = query.Where("event_categories.is_active IN ?", activeFilter)
		}
	}

	if err := query.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortCol, ok := eventCategorySortColumns[options.Common.Sort]
	if !ok {
		sortCol = "event_categories.display_order"
	}
	orderDir := "ASC"
	if options.Common.Order == "desc" {
		orderDir = "DESC"
	}

	offset := (options.Common.Page - 1) * options.Common.Limit
	err := query.Order(sortCol + " " + orderDir + ", event_categories.id " + orderDir).
		Offset(offset).
		Limit(options.Common.Limit).
		Find(&categories).Error

	return categories, total, err
}

// GetCategoryByID returns an event category by ID
func (s *EventService) GetCategoryByID(id int) (*models.EventCategory, error) {
	var category models.EventCategory
	err := s.db.First(&category, id).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

// CreateCategory creates a new event category
func (s *EventService) CreateCategory(category *models.EventCategory) error {
	return s.db.Create(category).Error
}

// UpdateCategory saves changes to an event category
func (s *EventService) UpdateCategory(category *models.EventCategory) error {
	return s.db.Save(category).Error
}

// DeleteCategory removes an event category by ID
func (s *EventService) DeleteCategory(id int) error {
	return s.db.Delete(&models.EventCategory{}, id).Error
}

// BulkDeleteCategories removes multiple event categories by their IDs
func (s *EventService) BulkDeleteCategories(ids []int) error {
	return s.db.Where("id IN ?", ids).Delete(&models.EventCategory{}).Error
}

