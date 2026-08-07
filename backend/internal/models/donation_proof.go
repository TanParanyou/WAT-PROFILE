package models

import (
	"time"

	"github.com/google/uuid"
)

// DonationProof is a private object uploaded to support a self-reported donation.
// The storage key is never exposed as a public Media URL.
type DonationProof struct {
	ID               uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	DonationID       int       `gorm:"not null;uniqueIndex" json:"donation_id"`
	Donation         *Donation `gorm:"foreignKey:DonationID;constraint:OnDelete:CASCADE" json:"-"`
	StorageKey       string    `gorm:"size:600;not null" json:"-"`
	OriginalFilename string    `gorm:"size:255;not null" json:"original_filename"`
	MimeType         string    `gorm:"size:100;not null" json:"mime_type"`
	Size             int64     `gorm:"not null" json:"size"`
	Checksum         string    `gorm:"size:128;not null" json:"checksum"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}
