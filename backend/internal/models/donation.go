package models

import (
	"time"

	"github.com/google/uuid"
)

// DonationCategory represents a donation category
type DonationCategory struct {
	ID           int           `gorm:"primaryKey;autoIncrement" json:"id"`
	Name         MultiLangText `gorm:"type:jsonb;not null" json:"name"`
	Description  MultiLangText `gorm:"type:jsonb" json:"description"`
	IsActive     bool          `gorm:"default:true;index" json:"is_active"`
	DisplayOrder int           `gorm:"default:0" json:"display_order"`
	CreatedAt    time.Time     `json:"created_at"`
}

// Donation represents a donation record
type Donation struct {
	ID                    int               `gorm:"primaryKey;autoIncrement" json:"id"`
	ReceiptNumber         string            `gorm:"size:50;uniqueIndex;not null" json:"receipt_number"` // Auto: DON-2024-001
	DonorType             string            `gorm:"size:20;not null" json:"donor_type"`                 // 'member', 'guest', 'anonymous'
	MemberID              *int              `gorm:"index" json:"member_id"`
	Member                *Member           `gorm:"foreignKey:MemberID;constraint:OnDelete:SET NULL" json:"member,omitempty"`
	DonorName             string            `gorm:"size:255" json:"donor_name"`
	DonorEmail            string            `gorm:"size:255" json:"donor_email"`
	DonorPhone            string            `gorm:"size:20" json:"donor_phone"`
	DonorAddress          string            `gorm:"type:text" json:"donor_address"`
	Amount                float64           `gorm:"type:decimal(10,2);not null" json:"amount"`
	Currency              string            `gorm:"size:3;default:EUR" json:"currency"`
	DonationDate          time.Time         `gorm:"type:date;default:CURRENT_DATE;index" json:"donation_date"`
	DonationMethod        string            `gorm:"size:50" json:"donation_method"` // 'bank_transfer', 'cash', 'paypal'
	CategoryID            *int              `gorm:"index" json:"category_id"`
	Category              *DonationCategory `gorm:"foreignKey:CategoryID;constraint:OnDelete:SET NULL" json:"category,omitempty"`
	Purpose               MultiLangText     `gorm:"type:jsonb" json:"purpose"`
	IsAnonymous           bool              `gorm:"default:false" json:"is_anonymous"`
	TaxReceiptRequired    bool              `gorm:"default:false" json:"tax_receipt_required"`
	TaxReceiptSent        bool              `gorm:"default:false" json:"tax_receipt_sent"`
	TaxReceiptSentAt      *time.Time        `json:"tax_receipt_sent_at"`
	Notes                 string            `gorm:"type:text" json:"notes"`
	Status                string            `gorm:"size:20;default:confirmed;index" json:"status"`      // 'pending', 'confirmed', 'cancelled'
	Source                string            `gorm:"size:30;default:staff_recorded;index" json:"source"` // 'self_reported', 'staff_recorded'
	CommunicationLocale   string            `gorm:"size:5;default:th" json:"communication_locale"`
	ConfirmedByID         *uuid.UUID        `gorm:"type:uuid" json:"confirmed_by_id,omitempty"`
	ConfirmedBy           *User             `gorm:"foreignKey:ConfirmedByID;constraint:OnDelete:SET NULL" json:"confirmed_by,omitempty"`
	ConfirmedAt           *time.Time        `json:"confirmed_at,omitempty"`
	ReceiptObjectKey      string            `gorm:"size:600" json:"receipt_object_key,omitempty"`
	ReceiptChecksum       string            `gorm:"size:128" json:"receipt_checksum,omitempty"`
	ReceiptDispatchedByID *uuid.UUID        `gorm:"type:uuid" json:"receipt_dispatched_by_id,omitempty"`
	ReceiptDispatchedAt   *time.Time        `json:"receipt_dispatched_at,omitempty"`
	CreatedByID           *uuid.UUID        `gorm:"type:uuid" json:"created_by_id"`
	CreatedBy             *User             `gorm:"foreignKey:CreatedByID;constraint:OnDelete:SET NULL" json:"created_by,omitempty"`
	CreatedAt             time.Time         `json:"created_at"`
	UpdatedAt             time.Time         `json:"updated_at"`
}
