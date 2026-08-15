package models

import (
	"time"

	"github.com/google/uuid"
)

// EventRegistration represents an event registration
type EventRegistration struct {
	ID                   int                            `gorm:"primaryKey;autoIncrement" json:"id"`
	EventID              int                            `gorm:"not null;index" json:"event_id"`
	Event                *Event                         `gorm:"foreignKey:EventID;constraint:OnDelete:CASCADE" json:"event,omitempty"`
	RegistrationType     string                         `gorm:"size:20;not null" json:"registration_type"` // 'member', 'account', 'guest'
	UserID               *uuid.UUID                     `gorm:"type:uuid;index" json:"user_id,omitempty"`
	User                 *User                          `gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL" json:"user,omitempty"`
	MemberID             *int                           `gorm:"index" json:"member_id"`
	Member               *Member                        `gorm:"foreignKey:MemberID;constraint:OnDelete:SET NULL" json:"member,omitempty"`
	Locale               string                         `gorm:"size:5;not null;default:th" json:"locale"`
	PrivacyNoticeVersion string                         `gorm:"size:50" json:"privacy_notice_version,omitempty"`
	PrivacyConsentAt     *time.Time                     `json:"privacy_consent_at,omitempty"`
	ManageTokenHash      string                         `gorm:"size:64;uniqueIndex" json:"-"`
	ManageTokenExpiresAt *time.Time                     `json:"-"`
	CancellationOrigin   string                         `gorm:"size:20" json:"cancellation_origin,omitempty"`
	FirstName            string                         `gorm:"size:100;not null" json:"first_name"`
	LastName             string                         `gorm:"size:100;not null" json:"last_name"`
	Email                string                         `gorm:"size:255;not null" json:"email"`
	Phone                string                         `gorm:"size:20" json:"phone"`
	DietaryRestrictions  string                         `gorm:"type:text" json:"dietary_restrictions"`
	SpecialNeeds         string                         `gorm:"type:text" json:"special_needs"`
	AdditionalNotes      string                         `gorm:"type:text" json:"additional_notes"`
	RegistrationStatus   string                         `gorm:"size:20;default:pending;index" json:"registration_status"` // 'pending', 'confirmed', 'cancelled', 'attended'
	ConfirmationCode     string                         `gorm:"size:50;uniqueIndex" json:"confirmation_code"`
	ConfirmedAt          *time.Time                     `json:"confirmed_at"`
	Attended             bool                           `gorm:"default:false" json:"attended"`
	AttendedAt           *time.Time                     `json:"attended_at"`
	CancellationReason   string                         `gorm:"type:text" json:"cancellation_reason"`
	CancelledAt          *time.Time                     `json:"cancelled_at"`
	Participants         []EventRegistrationParticipant `gorm:"foreignKey:RegistrationID" json:"participants,omitempty"`
	CreatedAt            time.Time                      `json:"created_at"`
	UpdatedAt            time.Time                      `json:"updated_at"`
}
