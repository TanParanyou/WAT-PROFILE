package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Setting represents application settings/configuration
type Setting struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Key       string    `gorm:"size:100;uniqueIndex;not null" json:"key"` // 'site_name', 'contact_email', etc.
	Value     string    `gorm:"type:text" json:"value"`
	Type      string    `gorm:"size:50" json:"type"`        // 'string', 'number', 'boolean', 'json'
	Category  string    `gorm:"size:50;index" json:"category"` // 'general', 'email', 'social', etc.
	IsPublic  bool      `gorm:"default:false;index" json:"is_public"` // Can be accessed without auth
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// BeforeCreate hook to generate UUID
func (s *Setting) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// GetBool returns value as boolean
func (s *Setting) GetBool() bool {
	return s.Value == "true" || s.Value == "1"
}

// GetString returns value as string
func (s *Setting) GetString() string {
	return s.Value
}
