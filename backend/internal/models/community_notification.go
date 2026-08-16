package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommunityNotification struct {
	ID              uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	RecipientUserID uuid.UUID  `gorm:"type:uuid;not null;index" json:"recipient_user_id"`
	EventType       string     `gorm:"size:40;not null;index" json:"event_type"`
	ActorUserID     *uuid.UUID `gorm:"type:uuid" json:"actor_user_id,omitempty"`
	ActorAdminID    *uuid.UUID `gorm:"type:uuid" json:"-"`
	TargetType      string     `gorm:"size:24;not null" json:"target_type"`
	TargetID        *uuid.UUID `gorm:"type:uuid" json:"target_id,omitempty"`
	DedupeKey       string     `gorm:"size:255;not null;uniqueIndex" json:"-"`
	ReadAt          *time.Time `json:"read_at,omitempty"`
	CreatedAt       time.Time  `gorm:"index" json:"created_at"`
}

func (n *CommunityNotification) BeforeCreate(_ *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}

func (CommunityNotification) TableName() string { return "community_notifications" }

type CommunityNotificationPreference struct {
	UserID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"user_id"`
	EmailPreferences JSONMap   `gorm:"type:jsonb;not null;default:'{}'" json:"email_preferences"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

func (CommunityNotificationPreference) TableName() string {
	return "community_notification_preferences"
}
