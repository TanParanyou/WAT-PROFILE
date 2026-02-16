package models

import "time"

// Monk represents a monk profile
type Monk struct {
	ID             int           `gorm:"primaryKey;autoIncrement" json:"id"`
	Slug           string        `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	ImageURL       string        `gorm:"size:255" json:"image_url"`
	Name           MultiLangText `gorm:"type:jsonb;not null" json:"name"`
	Title          MultiLangText `gorm:"type:jsonb" json:"title"` // ตำแหน่ง: "พระอาจารย์", "Venerable"
	Bio            MultiLangText `gorm:"type:jsonb" json:"bio"`   // ประวัติ
	OrdinationDate *time.Time    `gorm:"type:date" json:"ordination_date"`
	Position       string        `gorm:"size:100" json:"position"` // 'abbot', 'vice_abbot', 'monk'
	DisplayOrder   int           `gorm:"default:0" json:"display_order"`
	IsActive       bool          `gorm:"default:true;index" json:"is_active"`
	CreatedAt      time.Time     `json:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at"`
}
