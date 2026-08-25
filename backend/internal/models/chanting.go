package models

import "time"

// Chanting represents a Buddhist chant with multi-language titles, dual Pali scripts, translations, and audio support.
type Chanting struct {
	ID              int           `gorm:"primaryKey;autoIncrement" json:"id"`
	Slug            string        `gorm:"size:120;uniqueIndex;not null" json:"slug"`
	Title           MultiLangText `gorm:"type:jsonb;not null" json:"title"`
	Subtitle        MultiLangText `gorm:"type:jsonb" json:"subtitle"`
	Category        string        `gorm:"size:50;not null;default:'general';index" json:"category"`
	PaliThai        string        `gorm:"type:text;not null" json:"pali_thai"`
	PaliRoman       string        `gorm:"type:text;not null" json:"pali_roman"`
	Translation     MultiLangText `gorm:"type:jsonb;not null" json:"translation"`
	AudioURL        string        `gorm:"size:255" json:"audio_url"`
	DurationSeconds int           `gorm:"default:0" json:"duration_seconds"`
	DisplayOrder    int           `gorm:"default:0;index" json:"display_order"`
	IsActive        bool          `gorm:"default:true;index" json:"is_active"`
	CreatedAt       time.Time     `json:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at"`
}
