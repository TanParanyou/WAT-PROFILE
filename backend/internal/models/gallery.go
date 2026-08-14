package models

import "time"

// GalleryCategory represents a gallery category
type GalleryCategory struct {
	ID           int           `gorm:"primaryKey;autoIncrement" json:"id"`
	Slug         string        `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	Name         MultiLangText `gorm:"type:jsonb;not null" json:"name"`
	DisplayOrder int           `gorm:"default:0" json:"display_order"`
	IsActive     bool          `gorm:"default:true;index" json:"is_active"`
	CreatedAt    time.Time     `json:"created_at"`
}

// Gallery represents a gallery image
type Gallery struct {
	ID           int              `gorm:"primaryKey;autoIncrement" json:"id"`
	ImageURL     string           `gorm:"size:255;not null" json:"image_url"`
	ThumbnailURL string           `gorm:"size:255" json:"thumbnail_url"`
	Caption      MultiLangText    `gorm:"type:jsonb" json:"caption"`
	CategoryID   *int             `gorm:"index" json:"category_id"`
	Category     *GalleryCategory `gorm:"foreignKey:CategoryID;constraint:OnDelete:SET NULL" json:"category,omitempty"`
	EventID      *int             `gorm:"index" json:"event_id"`
	Event        *Event           `gorm:"foreignKey:EventID;constraint:OnDelete:SET NULL" json:"event,omitempty"`
	DisplayOrder int              `gorm:"default:0" json:"display_order"`
	IsActive     bool             `gorm:"default:true;index" json:"is_active"`
	CreatedAt    time.Time        `json:"created_at"`
	UpdatedAt    time.Time        `json:"updated_at"`
}

// BulkGalleryStatusRequest represents request to update status for multiple gallery items
type BulkGalleryStatusRequest struct {
	IDs      []int `json:"ids"`
	IsActive bool  `json:"is_active"`
}

// BulkGalleryCategoryRequest represents request to update category for multiple gallery items
type BulkGalleryCategoryRequest struct {
	IDs        []int `json:"ids"`
	CategoryID *int  `json:"category_id"`
}

// BulkGalleryEventRequest represents request to update event for multiple gallery items
type BulkGalleryEventRequest struct {
	IDs     []int `json:"ids"`
	EventID *int  `json:"event_id"`
}

// BatchCreateGalleryRequest represents request to create multiple gallery items
type BatchCreateGalleryRequest struct {
	Items []Gallery `json:"items"`
}

// ReorderGalleryRequest represents request to reorder gallery items
type ReorderGalleryRequest struct {
	IDs []int `json:"ids"`
}

