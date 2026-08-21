package services

import (
	"fmt"
	"strings"
	"sync"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type SettingsService struct {
	db          *gorm.DB
	mu          sync.RWMutex
	cache       map[string]string
	cacheLoaded bool
}

func NewSettingsService(db *gorm.DB) *SettingsService {
	return &SettingsService{
		db:    db,
		cache: make(map[string]string),
	}
}

// InvalidateCache clears the in-memory settings cache
func (s *SettingsService) InvalidateCache() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.cache = make(map[string]string)
	s.cacheLoaded = false
}

// SetCacheForTesting sets an in-memory key-value pair directly for unit testing
func (s *SettingsService) SetCacheForTesting(key, value string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.cache[key] = value
	s.cacheLoaded = true
}

// ensureCacheLoaded loads settings into memory cache if not already loaded
func (s *SettingsService) ensureCacheLoaded() error {
	s.mu.RLock()
	if s.cacheLoaded {
		s.mu.RUnlock()
		return nil
	}
	s.mu.RUnlock()

	s.mu.Lock()
	defer s.mu.Unlock()
	if s.cacheLoaded {
		return nil
	}

	if s.db == nil {
		s.cacheLoaded = true
		return nil
	}

	var settings []models.Setting
	if err := s.db.Find(&settings).Error; err != nil {
		return err
	}

	s.cache = make(map[string]string, len(settings))
	for _, item := range settings {
		s.cache[item.Key] = item.Value
	}
	s.cacheLoaded = true
	return nil
}

// GetPublic returns all public settings as a key-value map
func (s *SettingsService) GetPublic() (map[string]string, error) {
	var settings []models.Setting
	if err := s.db.Where("is_public = ?", true).Find(&settings).Error; err != nil {
		return nil, err
	}

	result := make(map[string]string, len(settings))
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

// Get returns the value of a specific setting key using memory cache
func (s *SettingsService) Get(key string) (string, error) {
	if err := s.ensureCacheLoaded(); err != nil {
		// Fallback to direct DB query if cache loading fails
		var setting models.Setting
		if err := s.db.Where("key = ?", key).First(&setting).Error; err != nil {
			return "", err
		}
		return setting.Value, nil
	}

	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.cache[key], nil
}

// IsFeatureEnabled checks if a boolean feature flag is enabled (defaulting to false if missing or error)
func (s *SettingsService) IsFeatureEnabled(key string) bool {
	val, err := s.Get(key)
	if err != nil {
		return false
	}
	val = strings.TrimSpace(strings.ToLower(val))
	return val == "true" || val == "1" || val == "yes"
}

// UpdateBatch updates multiple settings at once (ใช้ transaction เพื่อความปลอดภัย)
func (s *SettingsService) UpdateBatch(items []struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}) error {
	defer s.InvalidateCache()

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
	defer s.InvalidateCache()

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
