package models

import (
	"time"

	"github.com/google/uuid"
)

type PersonalDataRequest struct {
	ID                    uuid.UUID                 `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	SubjectEmail          string                    `gorm:"size:255;index" json:"subject_email"`
	SubjectMemberCode     string                    `gorm:"size:50;index" json:"subject_member_code"`
	RequestType           string                    `gorm:"size:20;not null" json:"request_type"` // access, erasure
	VerificationMethod    string                    `gorm:"size:20" json:"verification_method"`   // email, in_person
	VerificationStatus    string                    `gorm:"size:20;default:unverified;index" json:"verification_status"`
	EvidenceReference     string                    `gorm:"size:500" json:"evidence_reference"`
	VerificationTokenHash string                    `gorm:"size:128" json:"-"`
	VerificationExpiresAt *time.Time                `json:"verification_expires_at,omitempty"`
	Status                string                    `gorm:"size:20;default:open;index" json:"status"`
	Notes                 string                    `gorm:"type:text" json:"notes"`
	VerifiedByID          *uuid.UUID                `gorm:"type:uuid" json:"verified_by_id,omitempty"`
	VerifiedAt            *time.Time                `json:"verified_at,omitempty"`
	CompletedByID         *uuid.UUID                `gorm:"type:uuid" json:"completed_by_id,omitempty"`
	CompletedAt           *time.Time                `json:"completed_at,omitempty"`
	CreatedByID           *uuid.UUID                `gorm:"type:uuid" json:"created_by_id,omitempty"`
	CreatedAt             time.Time                 `json:"created_at"`
	UpdatedAt             time.Time                 `json:"updated_at"`
	Items                 []PersonalDataRequestItem `gorm:"foreignKey:RequestID;constraint:OnDelete:CASCADE" json:"items,omitempty"`
}

type PersonalDataRequestItem struct {
	ID             uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	RequestID      uuid.UUID `gorm:"type:uuid;not null;index" json:"request_id"`
	Domain         string    `gorm:"size:40;not null" json:"domain"`
	RecordID       string    `gorm:"size:120;not null" json:"record_id"`
	MatchBasis     string    `gorm:"size:40" json:"match_basis"`
	DisplayName    string    `gorm:"size:255" json:"display_name"`
	MaskedEmail    string    `gorm:"size:255" json:"masked_email"`
	SelectedAction string    `gorm:"size:20" json:"selected_action"` // export, anonymise
	Result         string    `gorm:"size:20" json:"result"`
	Reason         string    `gorm:"size:100" json:"reason"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
