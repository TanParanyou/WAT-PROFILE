package models

import (
	"time"
)

// Event represents a temple event/activity
type Event struct {
	ID                   int               `gorm:"primaryKey;autoIncrement" json:"id"`
	Slug                 string            `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	Title                MultiLangText     `gorm:"type:jsonb;not null" json:"title"`
	Description          LocalizedRichText `gorm:"type:jsonb" json:"description"`
	StartDate            time.Time         `gorm:"not null;index" json:"start_date"`
	EndDate              time.Time         `gorm:"not null;index" json:"end_date"`
	StartTime            *time.Time        `gorm:"type:time" json:"start_time"`
	EndTime              *time.Time        `gorm:"type:time" json:"end_time"`
	Location             MultiLangText     `gorm:"type:jsonb" json:"location"`
	ImageURL             string            `gorm:"size:255" json:"image_url"`
	MapURL               string            `gorm:"type:text" json:"map_url"`
	EventType            string            `gorm:"size:50;index" json:"event_type"` // 'meditation_course', 'ceremony', 'festival'
	IsRecurring          bool              `gorm:"default:false" json:"is_recurring"`
	RecurringPattern     string            `gorm:"size:50" json:"recurring_pattern"` // 'monthly', 'yearly'
	MaxParticipants      *int              `json:"max_participants"`                 // NULL = unlimited
	RegistrationEnabled  bool              `gorm:"default:false" json:"registration_enabled"`
	RegistrationDeadline *time.Time        `json:"registration_deadline"`
	IsActive             bool              `gorm:"default:true;index" json:"is_active"`
	DisplayOrder         int               `gorm:"default:0" json:"display_order"`
	GalleryURLs          StringSlice       `gorm:"type:jsonb;default:'[]'" json:"gallery_urls"`
	OnlineJoinURL        string            `gorm:"size:255" json:"online_join_url"`
	DressCode            MultiLangText     `gorm:"type:jsonb" json:"dress_code"`
	WhatToBring          MultiLangText     `gorm:"type:jsonb" json:"what_to_bring"`
	DonationEnabled      bool              `gorm:"default:false" json:"donation_enabled"`
	ContactPhone         string            `gorm:"size:50" json:"contact_phone"`
	ContactLine          string            `gorm:"size:50" json:"contact_line"`
	ContactEmail         string            `gorm:"size:100" json:"contact_email"`
	TransportInfo        MultiLangText     `gorm:"type:jsonb" json:"transport_info"`
	CreatedAt            time.Time         `json:"created_at"`
	UpdatedAt            time.Time         `json:"updated_at"`

	// Relations
	Schedules           []EventSchedule           `gorm:"foreignKey:EventID;constraint:OnDelete:CASCADE" json:"schedules,omitempty"`
	ResourceAssignments []EventResourceAssignment `gorm:"foreignKey:EventID;constraint:OnDelete:CASCADE" json:"resource_assignments,omitempty"`
}

// EventSchedule represents schedule items within an event
type EventSchedule struct {
	ID           int           `gorm:"primaryKey;autoIncrement" json:"id"`
	EventID      int           `gorm:"not null;index" json:"event_id"`
	Event        *Event        `gorm:"foreignKey:EventID;constraint:OnDelete:CASCADE" json:"-"`
	StartTime    time.Time     `gorm:"type:time;not null" json:"start_time"`
	EndTime      time.Time     `gorm:"type:time;not null" json:"end_time"`
	Activity     MultiLangText `gorm:"type:jsonb;not null" json:"activity"`
	DisplayOrder int           `gorm:"default:0" json:"display_order"`
	CreatedAt    time.Time     `json:"created_at"`
}
