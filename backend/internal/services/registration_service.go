package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type RegistrationService struct {
	db *gorm.DB
}

func NewRegistrationService(db *gorm.DB) *RegistrationService {
	return &RegistrationService{db: db}
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
