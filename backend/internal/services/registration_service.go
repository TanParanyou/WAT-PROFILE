package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type RegistrationService struct {
	db *gorm.DB
}

func NewRegistrationService(db *gorm.DB) *RegistrationService {
	return &RegistrationService{db: db}
}

type RegistrationListOptions struct {
	Common   listquery.Common
	Statuses []string
	EventIDs []int
}

var registrationSortColumns = map[string]string{
	"first_name":          "event_registrations.first_name",
	"last_name":           "event_registrations.last_name",
	"email":               "event_registrations.email",
	"registration_status": "event_registrations.registration_status",
	"status":              "event_registrations.registration_status",
	"created_at":          "event_registrations.created_at",
	"event_id":            "event_registrations.event_id",
}

// ListOptions returns paginated registrations with full search, filter, and sorting
func (s *RegistrationService) ListOptions(options RegistrationListOptions) ([]models.EventRegistration, int64, error) {
	var registrations []models.EventRegistration
	var total int64

	query := s.db.Model(&models.EventRegistration{})

	if options.Common.Search != "" {
		searchTerm := "%" + options.Common.Search + "%"
		query = query.Where(
			"event_registrations.first_name ILIKE ? OR event_registrations.last_name ILIKE ? OR event_registrations.email ILIKE ? OR event_registrations.phone ILIKE ? OR event_registrations.confirmation_code ILIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	if len(options.Statuses) > 0 {
		query = query.Where("event_registrations.registration_status IN ?", options.Statuses)
	}

	if len(options.EventIDs) > 0 {
		query = query.Where("event_registrations.event_id IN ?", options.EventIDs)
	}

	if options.Common.From != nil {
		query = query.Where("event_registrations.created_at >= ?", *options.Common.From)
	}

	if options.Common.To != nil {
		query = query.Where("event_registrations.created_at <= ?", *options.Common.To)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortCol, ok := registrationSortColumns[options.Common.Sort]
	if !ok {
		sortCol = "event_registrations.created_at"
	}
	orderDir := "DESC"
	if options.Common.Order == "asc" {
		orderDir = "ASC"
	}

	offset := (options.Common.Page - 1) * options.Common.Limit
	err := query.Preload("Event").Preload("Member").
		Order(sortCol + " " + orderDir + ", event_registrations.id " + orderDir).
		Offset(offset).
		Limit(options.Common.Limit).
		Find(&registrations).Error

	return registrations, total, err
}

// RegisterForEvent handles public event registration with capacity check and duplicate detection
func (s *RegistrationService) RegisterForEvent(eventID int, registration *models.EventRegistration) error {
	// Check event exists and registration is enabled
	var event models.Event
	if err := s.db.First(&event, eventID).Error; err != nil {
		return errors.New("event not found")
	}
	if !event.RegistrationEnabled {
		return errors.New("registration is not enabled for this event")
	}

	// Check max participants
	if event.MaxParticipants != nil {
		var count int64
		s.db.Model(&models.EventRegistration{}).
			Where("event_id = ? AND registration_status NOT IN (?)", eventID, []string{"cancelled"}).
			Count(&count)
		if int(count) >= *event.MaxParticipants {
			return errors.New("event is full")
		}
	}

	// Check duplicate registration by email
	var existing models.EventRegistration
	if err := s.db.Where("event_id = ? AND email = ? AND registration_status != ?",
		eventID, registration.Email, "cancelled").First(&existing).Error; err == nil {
		return errors.New("already registered for this event")
	}

	registration.EventID = eventID
	registration.ConfirmationCode = generateConfirmationCode()
	registration.RegistrationStatus = "pending"

	return s.db.Create(registration).Error
}

// GetMyRegistrations returns registrations for a user's member profile
func (s *RegistrationService) GetMyRegistrations(userID uuid.UUID) ([]models.EventRegistration, error) {
	var member models.Member
	if err := s.db.Where("user_id = ?", userID).First(&member).Error; err != nil {
		return nil, errors.New("member profile not found")
	}

	var registrations []models.EventRegistration
	err := s.db.Preload("Event").Where("member_id = ?", member.ID).
		Order("created_at DESC").Find(&registrations).Error
	return registrations, err
}

// List returns paginated registrations with filters
func (s *RegistrationService) List(page, limit int, eventID, status string) ([]models.EventRegistration, int64, error) {
	var registrations []models.EventRegistration
	query := s.db.Order("created_at DESC")

	if eventID != "" {
		query = query.Where("event_id = ?", eventID)
	}
	if status != "" {
		query = query.Where("registration_status = ?", status)
	}

	var total int64
	query.Model(&models.EventRegistration{}).Count(&total)

	offset := (page - 1) * limit
	err := query.Preload("Event").Preload("Member").
		Offset(offset).Limit(limit).Find(&registrations).Error

	return registrations, total, err
}

// GetByID returns a registration by ID
func (s *RegistrationService) GetByID(id int) (*models.EventRegistration, error) {
	var registration models.EventRegistration
	err := s.db.First(&registration, id).Error
	if err != nil {
		return nil, err
	}
	return &registration, nil
}

// UpdateStatus updates registration status
func (s *RegistrationService) UpdateStatus(registration *models.EventRegistration, status, reason string) error {
	registration.RegistrationStatus = status
	if status == "cancelled" {
		registration.CancellationReason = reason
	}
	return s.db.Save(registration).Error
}

// generateConfirmationCode creates a random confirmation code
func generateConfirmationCode() string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// BulkDelete removes multiple event registrations by their IDs
func (s *RegistrationService) BulkDelete(ids []int) error {
	return s.db.Where("id IN ?", ids).Delete(&models.EventRegistration{}).Error
}
