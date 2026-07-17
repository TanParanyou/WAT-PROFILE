package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/richtext"
	"gorm.io/gorm"
)

var ErrMigrationConflict = errors.New("migration conflict: record has been updated since read")

type MigrationRequest struct {
	Resource  string          `json:"resource"`   // "event", "monk", or "content_page" (or "content_section" based on needs)
	ID        string          `json:"id"`
	UpdatedAt time.Time       `json:"updated_at"`
	Field     string          `json:"field"`      // "description", "bio", or "body" (for page/section)
	Value     json.RawMessage `json:"value"`
}

type RichTextMigrationService struct {
	db *gorm.DB
}

func NewRichTextMigrationService(db *gorm.DB) *RichTextMigrationService {
	return &RichTextMigrationService{db: db}
}

func (s *RichTextMigrationService) Migrate(req MigrationRequest) error {
	// First, parse Value as LocalizedRichText and validate it
	var lrt models.LocalizedRichText
	if err := json.Unmarshal(req.Value, &lrt); err != nil {
		return fmt.Errorf("invalid rich text JSON: %w", err)
	}

	if err := richtext.ValidateLocalized(lrt); err != nil {
		return fmt.Errorf("validation failed: %w", err)
	}

	switch req.Resource {
	case "event":
		if req.Field != "description" {
			return fmt.Errorf("unsupported field %q for event", req.Field)
		}
		var event models.Event
		res := s.db.Where("id = ? AND updated_at = ?", req.ID, req.UpdatedAt).First(&event)
		if res.Error != nil {
			if errors.Is(res.Error, gorm.ErrRecordNotFound) {
				return ErrMigrationConflict
			}
			return res.Error
		}
		event.Description = lrt
		event.UpdatedAt = time.Now()
		if err := s.db.Save(&event).Error; err != nil {
			return err
		}
		return nil

	case "monk":
		if req.Field != "bio" {
			return fmt.Errorf("unsupported field %q for monk", req.Field)
		}
		var monk models.Monk
		res := s.db.Where("id = ? AND updated_at = ?", req.ID, req.UpdatedAt).First(&monk)
		if res.Error != nil {
			if errors.Is(res.Error, gorm.ErrRecordNotFound) {
				return ErrMigrationConflict
			}
			return res.Error
		}
		monk.Bio = lrt
		monk.UpdatedAt = time.Now()
		if err := s.db.Save(&monk).Error; err != nil {
			return err
		}
		return nil

	case "content_page":
		// Allowed content_page or content_section
		if req.Field != "body" {
			return fmt.Errorf("unsupported field %q for content_page", req.Field)
		}
		var page models.ContentPage
		res := s.db.Where("id = ? AND updated_at = ?", req.ID, req.UpdatedAt).First(&page)
		if res.Error != nil {
			if errors.Is(res.Error, gorm.ErrRecordNotFound) {
				return ErrMigrationConflict
			}
			return res.Error
		}
		
		// Body is models.JSONMap. We need to unmarshal req.Value into a JSONMap
		var jsonMap map[string]interface{}
		if err := json.Unmarshal(req.Value, &jsonMap); err != nil {
			return fmt.Errorf("failed to unmarshal value to JSONMap: %w", err)
		}
		page.Body = models.JSONMap(jsonMap)
		page.UpdatedAt = time.Now()
		if err := s.db.Save(&page).Error; err != nil {
			return err
		}
		return nil

	case "content_section":
		if req.Field != "body" {
			return fmt.Errorf("unsupported field %q for content_section", req.Field)
		}
		var section models.ContentSection
		res := s.db.Where("id = ? AND updated_at = ?", req.ID, req.UpdatedAt).First(&section)
		if res.Error != nil {
			if errors.Is(res.Error, gorm.ErrRecordNotFound) {
				return ErrMigrationConflict
			}
			return res.Error
		}

		var jsonMap map[string]interface{}
		if err := json.Unmarshal(req.Value, &jsonMap); err != nil {
			return fmt.Errorf("failed to unmarshal value to JSONMap: %w", err)
		}
		section.Body = models.JSONMap(jsonMap)
		section.UpdatedAt = time.Now()
		if err := s.db.Save(&section).Error; err != nil {
			return err
		}
		return nil

	default:
		return fmt.Errorf("unsupported resource %q", req.Resource)
	}
}
