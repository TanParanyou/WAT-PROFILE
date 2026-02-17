package services

import (
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type MonkService struct {
	db *gorm.DB
}

func NewMonkService(db *gorm.DB) *MonkService {
	return &MonkService{db: db}
}

// ListActive returns all active monks ordered by display_order
func (s *MonkService) ListActive() ([]models.Monk, error) {
	var monks []models.Monk
	err := s.db.Where("is_active = ?", true).
		Order("display_order ASC").
		Find(&monks).Error
	return monks, err
}

// GetBySlug returns a single active monk by slug
func (s *MonkService) GetBySlug(slug string) (*models.Monk, error) {
	var monk models.Monk
	err := s.db.Where("slug = ? AND is_active = ?", slug, true).First(&monk).Error
	if err != nil {
		return nil, err
	}
	return &monk, nil
}

// Create creates a new monk
func (s *MonkService) Create(monk *models.Monk) error {
	return s.db.Create(monk).Error
}

// GetByID returns a monk by ID
func (s *MonkService) GetByID(id int) (*models.Monk, error) {
	var monk models.Monk
	err := s.db.First(&monk, id).Error
	if err != nil {
		return nil, err
	}
	return &monk, nil
}

// Update saves changes to a monk
func (s *MonkService) Update(monk *models.Monk) error {
	return s.db.Save(monk).Error
}

// Delete removes a monk by ID
func (s *MonkService) Delete(id int) error {
	return s.db.Delete(&models.Monk{}, id).Error
}
