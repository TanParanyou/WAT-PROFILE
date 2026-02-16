package models

import (
	"time"

	"github.com/google/uuid"
)

// ContactInquiry represents a contact form submission
type ContactInquiry struct {
	ID           int        `gorm:"primaryKey;autoIncrement" json:"id"`
	Name         string     `gorm:"size:255;not null" json:"name"`
	Email        string     `gorm:"size:255;not null" json:"email"`
	Phone        string     `gorm:"size:20" json:"phone"`
	Subject      string     `gorm:"size:500" json:"subject"`
	Message      string     `gorm:"type:text;not null" json:"message"`
	InquiryType  string     `gorm:"size:50" json:"inquiry_type"` // 'general', 'event', 'donation', 'volunteer'
	Status       string     `gorm:"size:20;default:new;index" json:"status"` // 'new', 'read', 'replied', 'archived'
	RepliedByID  *uuid.UUID `gorm:"type:uuid" json:"replied_by_id"`
	RepliedBy    *User      `gorm:"foreignKey:RepliedByID;constraint:OnDelete:SET NULL" json:"replied_by,omitempty"`
	RepliedAt    *time.Time `json:"replied_at"`
	ReplyMessage string     `gorm:"type:text" json:"reply_message"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}
