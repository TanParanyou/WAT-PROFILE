package models

import "time"

// CalendarResource is a schedulable location, person, equipment item, or
// project-specific resource displayed by the reusable calendar.
type CalendarResource struct {
	ID           int           `gorm:"primaryKey;autoIncrement" json:"id"`
	Slug         string        `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	ResourceType string        `gorm:"size:50;not null;index" json:"resource_type"`
	Title        MultiLangText `gorm:"type:jsonb;not null" json:"title"`
	Color        string        `gorm:"size:16" json:"color"`
	Capacity     *int          `json:"capacity"`
	Metadata     JSONMap       `gorm:"type:jsonb;not null;default:'{}'" json:"metadata"`
	IsActive     bool          `gorm:"default:true;index" json:"is_active"`
	IsPublic     bool          `gorm:"default:false;index" json:"is_public"`
	DisplayOrder int           `gorm:"default:0;index" json:"display_order"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}

// EventResourceAssignment joins an event to one schedulable resource.
type EventResourceAssignment struct {
	EventID    int               `gorm:"primaryKey;not null" json:"event_id"`
	ResourceID int               `gorm:"primaryKey;not null" json:"resource_id"`
	Resource   *CalendarResource `gorm:"foreignKey:ResourceID" json:"resource,omitempty"`
}
