package models

import (
	"time"
)

// NewsCategory represents a category for grouping news and articles
type NewsCategory struct {
	ID           uint          `gorm:"primaryKey;autoIncrement" json:"id"`
	Slug         string        `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	Name         MultiLangText `gorm:"type:jsonb;not null" json:"name"`
	Description  MultiLangText `gorm:"type:jsonb" json:"description"`
	IsActive     bool          `gorm:"default:true;index" json:"is_active"`
	DisplayOrder int           `gorm:"default:0;index" json:"display_order"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}

// TableName specifies the table name for NewsCategory
func (NewsCategory) TableName() string {
	return "news_categories"
}
