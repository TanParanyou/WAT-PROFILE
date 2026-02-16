package models

import "time"

// EventRegistration represents an event registration
type EventRegistration struct {
	ID                   int        `gorm:"primaryKey;autoIncrement" json:"id"`
	EventID              int        `gorm:"not null;index" json:"event_id"`
	Event                *Event     `gorm:"foreignKey:EventID;constraint:OnDelete:CASCADE" json:"event,omitempty"`
	RegistrationType     string     `gorm:"size:20;not null" json:"registration_type"` // 'member', 'guest'
	MemberID             *int       `gorm:"index" json:"member_id"`
	Member               *Member    `gorm:"foreignKey:MemberID;constraint:OnDelete:SET NULL" json:"member,omitempty"`
	FirstName            string     `gorm:"size:100;not null" json:"first_name"`
	LastName             string     `gorm:"size:100;not null" json:"last_name"`
	Email                string     `gorm:"size:255;not null" json:"email"`
	Phone                string     `gorm:"size:20" json:"phone"`
	DietaryRestrictions  string     `gorm:"type:text" json:"dietary_restrictions"`
	SpecialNeeds         string     `gorm:"type:text" json:"special_needs"`
	AdditionalNotes      string     `gorm:"type:text" json:"additional_notes"`
	RegistrationStatus   string     `gorm:"size:20;default:pending;index" json:"registration_status"` // 'pending', 'confirmed', 'cancelled', 'attended'
	ConfirmationCode     string     `gorm:"size:50;uniqueIndex" json:"confirmation_code"`
	ConfirmedAt          *time.Time `json:"confirmed_at"`
	Attended             bool       `gorm:"default:false" json:"attended"`
	AttendedAt           *time.Time `json:"attended_at"`
	CancellationReason   string     `gorm:"type:text" json:"cancellation_reason"`
	CancelledAt          *time.Time `json:"cancelled_at"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}
