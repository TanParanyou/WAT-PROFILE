package models

import "time"

// EventRegistrationParticipant is a named person within an event registration group.
type EventRegistrationParticipant struct {
	ID                  int64              `gorm:"primaryKey;autoIncrement" json:"id"`
	RegistrationID      int                `gorm:"not null;index" json:"registration_id"`
	Registration        *EventRegistration `gorm:"foreignKey:RegistrationID;constraint:OnDelete:CASCADE" json:"-"`
	FirstName           string             `gorm:"size:100;not null" json:"first_name"`
	LastName            string             `gorm:"size:100;not null" json:"last_name"`
	DietaryRestrictions string             `gorm:"type:text;not null;default:''" json:"dietary_restrictions"`
	SpecialNeeds        string             `gorm:"type:text;not null;default:''" json:"special_needs"`
	AdditionalNotes     string             `gorm:"type:text;not null;default:''" json:"additional_notes"`
	AttendanceStatus    string             `gorm:"size:20;not null;default:registered;index" json:"attendance_status"`
	AttendedAt          *time.Time         `json:"attended_at"`
	CancelledAt         *time.Time         `json:"cancelled_at"`
	CreatedAt           time.Time          `json:"created_at"`
	UpdatedAt           time.Time          `json:"updated_at"`
}

func (EventRegistrationParticipant) TableName() string {
	return "event_registration_participants"
}
