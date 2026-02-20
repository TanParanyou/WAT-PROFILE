package services

import (
	"fmt"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type SettingsService struct {
	db *gorm.DB
}

func NewSettingsService(db *gorm.DB) *SettingsService {
	return &SettingsService{db: db}
}

// GetPublic returns all public settings as a key-value map
func (s *SettingsService) GetPublic() (map[string]string, error) {
	var settings []models.Setting
	if err := s.db.Where("is_public = ?", true).Find(&settings).Error; err != nil {
		return nil, err
	}

	result := make(map[string]string)
	for _, setting := range settings {
		result[setting.Key] = setting.Value
	}
	return result, nil
}

// GetAll returns all settings, optionally filtered by category
func (s *SettingsService) GetAll(category string) ([]models.Setting, error) {
	var settings []models.Setting
	query := s.db.Order("category ASC, key ASC")

	if category != "" {
		query = query.Where("category = ?", category)
	}

	err := query.Find(&settings).Error
	return settings, err
}

// UpdateBatch updates multiple settings at once (ใช้ transaction เพื่อความปลอดภัย)
func (s *SettingsService) UpdateBatch(items []struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		for _, item := range items {
			if err := tx.Model(&models.Setting{}).Where("key = ?", item.Key).
				Update("value", item.Value).Error; err != nil {
				return fmt.Errorf("failed to update setting %q: %w", item.Key, err)
			}
		}
		return nil
	})
}

// Upsert creates or updates a single setting
func (s *SettingsService) Upsert(setting *models.Setting) error {
	var existing models.Setting
	if err := s.db.Where("key = ?", setting.Key).First(&existing).Error; err == nil {
		existing.Value = setting.Value
		existing.Type = setting.Type
		existing.Category = setting.Category
		existing.IsPublic = setting.IsPublic
		*setting = existing
		return s.db.Save(&existing).Error
	}

	return s.db.Create(setting).Error
}
