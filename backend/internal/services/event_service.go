package services

import (
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type EventService struct {
	db *gorm.DB
}

func NewEventService(db *gorm.DB) *EventService {
	return &EventService{db: db}
}

// ListActive returns all active events with schedules
func (s *EventService) ListActive() ([]models.Event, error) {
	var events []models.Event
	err := s.db.Where("is_active = ?", true).
		Order("start_date DESC").
		Preload("Schedules").
		Find(&events).Error
	return events, err
}

// GetBySlug returns a single active event by slug
func (s *EventService) GetBySlug(slug string) (*models.Event, error) {
	var event models.Event
	err := s.db.Where("slug = ? AND is_active = ?", slug, true).
		Preload("Schedules").
		First(&event).Error
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
