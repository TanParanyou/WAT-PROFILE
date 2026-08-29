package models

import (
	"time"

	"gorm.io/gorm"
)

// NewsArticle represents a long-form news or temple story
type NewsArticle struct {
	ID            uint              `gorm:"primaryKey;autoIncrement" json:"id"`
	Slug          string            `gorm:"size:150;uniqueIndex;not null" json:"slug"`
	Title         MultiLangText     `gorm:"type:jsonb;not null" json:"title"`
	Excerpt       MultiLangText     `gorm:"type:jsonb" json:"excerpt"`
	Content       LocalizedRichText `gorm:"type:jsonb" json:"content"`
	CoverImageURL string            `gorm:"size:255" json:"cover_image_url"`
	GalleryURLs   StringSlice       `gorm:"type:jsonb;default:'[]'" json:"gallery_urls"`
	CategoryID    *uint             `gorm:"index" json:"category_id"`
	Category      *NewsCategory     `gorm:"foreignKey:CategoryID;constraint:OnDelete:SET NULL" json:"category,omitempty"`
	AuthorName    string            `gorm:"size:100" json:"author_name"`
	PublishStatus string            `gorm:"size:20;default:'published';index" json:"publish_status"` // 'draft', 'scheduled', 'published', 'archived'
	PublishedAt   *time.Time        `gorm:"index" json:"published_at"`
	ScheduledAt   *time.Time        `gorm:"index" json:"scheduled_at"`
	IsFeatured    bool              `gorm:"default:false;index" json:"is_featured"`
	IsPinned      bool              `gorm:"default:false;index" json:"is_pinned"`
	ViewCount     int               `gorm:"default:0" json:"view_count"`
	CreatedAt     time.Time         `json:"created_at"`
	UpdatedAt     time.Time         `json:"updated_at"`
	DeletedAt     gorm.DeletedAt    `gorm:"index" json:"-"`
}

// TableName specifies the table name for NewsArticle
func (NewsArticle) TableName() string {
	return "news_articles"
}
