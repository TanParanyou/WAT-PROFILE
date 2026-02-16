package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Media represents uploaded files/images
type Media struct {
	ID               uuid.UUID              `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Filename         string                 `gorm:"size:255;not null" json:"filename"`
	OriginalFilename string                 `gorm:"size:255" json:"original_filename"`
	MimeType         string                 `gorm:"size:100" json:"mime_type"`
	Size             int64                  `json:"size"` // bytes
	URL              string                 `gorm:"type:text;not null" json:"url"` // R2 URL
	Path             string                 `gorm:"type:text" json:"path"` // R2 path/key
	UploadedByID     *uuid.UUID             `gorm:"type:uuid" json:"uploaded_by_id"`
	UploadedBy       *User                  `gorm:"foreignKey:UploadedByID" json:"uploaded_by,omitempty"`
	AltText          string                 `gorm:"size:255" json:"alt_text"` // For images (SEO)
	Category         string                 `gorm:"size:50;index" json:"category"` // 'avatar', 'post', 'gallery', etc.
	Metadata         map[string]interface{} `gorm:"type:jsonb" json:"metadata"` // Additional data (width, height, etc.)
	CreatedAt        time.Time              `json:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at"`
}

// BeforeCreate hook to generate UUID
func (m *Media) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

// IsImage checks if media is an image
func (m *Media) IsImage() bool {
	return m.MimeType == "image/jpeg" ||
		m.MimeType == "image/png" ||
		m.MimeType == "image/gif" ||
		m.MimeType == "image/webp"
}

// IsVideo checks if media is a video
func (m *Media) IsVideo() bool {
	return m.MimeType == "video/mp4" ||
		m.MimeType == "video/webm" ||
		m.MimeType == "video/ogg"
}

// IsPDF checks if media is a PDF
func (m *Media) IsPDF() bool {
	return m.MimeType == "application/pdf"
}
