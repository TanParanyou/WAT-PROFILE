package services

import (
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type MediaService struct {
	db *gorm.DB
}

func NewMediaService(db *gorm.DB) *MediaService {
	return &MediaService{db: db}
}

func (s *MediaService) List() ([]models.Media, error) {
	var media []models.Media
	err := s.db.Order("created_at DESC").Find(&media).Error
	return media, err
}

func (s *MediaService) GetByID(id uuid.UUID) (*models.Media, error) {
	var media models.Media
	if err := s.db.First(&media, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &media, nil
}

func (s *MediaService) UpdateMetadata(id uuid.UUID, metadata map[string]interface{}) (*models.Media, error) {
	media, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	media.Metadata = metadata
	if err := s.db.Save(media).Error; err != nil {
		return nil, err
	}

	return media, nil
}

func (s *MediaService) Delete(id uuid.UUID) error {
	result := s.db.Delete(&models.Media{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
