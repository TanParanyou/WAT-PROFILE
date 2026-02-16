package models

import (
	"time"

	"github.com/google/uuid"
)

// Member represents a temple member (extends User)
type Member struct {
	ID                     int        `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID                 *uuid.UUID `gorm:"type:uuid;uniqueIndex" json:"user_id"`
	User                   *User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	MemberCode             string     `gorm:"size:20;uniqueIndex;not null" json:"member_code"` // Auto: WLP-2024-001
	FirstNameTH            string     `gorm:"size:100" json:"first_name_th"`
	LastNameTH             string     `gorm:"size:100" json:"last_name_th"`
	FirstNameEN            string     `gorm:"size:100" json:"first_name_en"`
	LastNameEN             string     `gorm:"size:100" json:"last_name_en"`
	BirthDate              *time.Time `gorm:"type:date" json:"birth_date"`
	Gender                 string     `gorm:"size:10" json:"gender"` // 'male', 'female', 'other'
	Nationality            string     `gorm:"size:100" json:"nationality"`
	AddressTH              string     `gorm:"type:text" json:"address_th"`
	AddressEN              string     `gorm:"type:text" json:"address_en"`
	Phone                  string     `gorm:"size:20" json:"phone"`
	LineID                 string     `gorm:"size:100" json:"line_id"`
	EmergencyContactName   string     `gorm:"size:255" json:"emergency_contact_name"`
	EmergencyContactPhone  string     `gorm:"size:20" json:"emergency_contact_phone"`
	MembershipType         string     `gorm:"size:50;default:regular" json:"membership_type"`   // 'regular', 'lifetime'
	MembershipStatus       string     `gorm:"size:20;default:active;index" json:"membership_status"` // 'active', 'inactive'
	MembershipDate         time.Time  `gorm:"type:date;default:CURRENT_DATE" json:"membership_date"`
	ProfileImageURL        string     `gorm:"size:255" json:"profile_image_url"`
	Notes                  string     `gorm:"type:text" json:"notes"`
	CreatedAt              time.Time  `json:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at"`
}
