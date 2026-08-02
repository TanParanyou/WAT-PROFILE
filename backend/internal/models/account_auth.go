package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AccountStatus is the explicit lifecycle status of a public account. It is
// stored as an explicit field rather than inferred from email_verified and
// is_active so the auth module can distinguish pending, active, disabled, and
// closed accounts deterministically.
type AccountStatus string

const (
	AccountStatusPendingVerification AccountStatus = "pending_verification"
	AccountStatusActive              AccountStatus = "active"
	AccountStatusDisabled            AccountStatus = "disabled"
	AccountStatusClosed              AccountStatus = "closed"
)

// Valid reports whether the status is a known lifecycle value.
func (s AccountStatus) Valid() bool {
	switch s {
	case AccountStatusPendingVerification, AccountStatusActive, AccountStatusDisabled, AccountStatusClosed:
		return true
	default:
		return false
	}
}

// AccountProfile is the public-facing profile of a public account. It contains
// only community-safe fields and deliberately never duplicates temple-member
// private data such as birth date, address, phone, or member code.
type AccountProfile struct {
	ID              uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID          uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	DisplayName     string    `gorm:"size:80;not null" json:"display_name"`
	AvatarURL       string    `gorm:"size:500" json:"avatar_url,omitempty"`
	PreferredLocale string    `gorm:"size:2;not null" json:"preferred_locale"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// BeforeCreate hook to generate UUID
func (p *AccountProfile) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// AuthIdentity is one sign-in method attached to an account. A password
// identity carries the bcrypt hash; a Google identity stores Google's stable
// subject and verified email instead. The credential hash is never serialized.
type AuthIdentity struct {
	ID              uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID          uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_auth_identities_user_provider,priority:1" json:"user_id"`
	Provider        string    `gorm:"size:16;not null;uniqueIndex:idx_auth_identities_provider_subject,priority:1;uniqueIndex:idx_auth_identities_user_provider,priority:2" json:"provider"`
	ProviderSubject string    `gorm:"size:255;not null;uniqueIndex:idx_auth_identities_provider_subject,priority:2" json:"provider_subject"`
	ProviderEmail   string    `gorm:"size:255;not null" json:"provider_email"`
	CredentialHash  *string   `gorm:"size:255" json:"-"` // Never return password in JSON
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// BeforeCreate hook to generate UUID
func (i *AuthIdentity) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}

// AuthSession is one refresh-token family associated with a browser/device.
// Only the SHA-256 hash of the opaque refresh token is stored; the raw token
// is returned to the client exactly once as an HttpOnly cookie value.
type AuthSession struct {
	ID               uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID           uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	FamilyID         uuid.UUID  `gorm:"type:uuid;not null;index" json:"family_id"`
	TokenHash        string     `gorm:"size:64;uniqueIndex;not null" json:"-"` // Never return token hash in JSON
	ExpiresAt        time.Time  `gorm:"not null;index" json:"expires_at"`
	LastUsedAt       time.Time  `gorm:"not null" json:"last_used_at"`
	RevokedAt        *time.Time `json:"revoked_at"`
	RevokedReason    string     `gorm:"size:64" json:"revoked_reason,omitempty"`
	UserAgentSummary string     `gorm:"size:255" json:"user_agent_summary,omitempty"`
	IPPrefix         string     `gorm:"size:64" json:"-"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// BeforeCreate hook to generate UUID
func (s *AuthSession) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// AuthActionToken is a single-use action token (email verification, password
// reset, identity link approval). Only the hash is stored; the raw token is
// delivered to the user out-of-band.
type AuthActionToken struct {
	ID         uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	Purpose    string     `gorm:"size:32;not null" json:"purpose"`
	TokenHash  string     `gorm:"size:64;uniqueIndex;not null" json:"-"` // Never return token hash in JSON
	Payload    JSONMap    `gorm:"type:jsonb;not null;default:'{}'" json:"-"`
	ExpiresAt  time.Time  `gorm:"not null;index" json:"expires_at"`
	ConsumedAt *time.Time `json:"consumed_at"`
	CreatedAt  time.Time  `json:"created_at"`
}

// BeforeCreate hook to generate UUID
func (t *AuthActionToken) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

// AuthSecurityEvent is an allow-listed security audit record. Metadata is
// sanitized by the security service and never stores credentials, raw tokens,
// or complete request bodies.
type AuthSecurityEvent struct {
	ID             uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID         *uuid.UUID `gorm:"type:uuid;index" json:"user_id,omitempty"`
	EventType      string     `gorm:"size:64;not null" json:"event_type"`
	Outcome        string     `gorm:"size:16;not null" json:"outcome"`
	Provider       string     `gorm:"size:16" json:"provider,omitempty"`
	RequestTraceID string     `gorm:"size:64" json:"request_trace_id,omitempty"`
	IPPrefix       string     `gorm:"size:64" json:"-"`
	Metadata       JSONMap    `gorm:"type:jsonb;not null;default:'{}'" json:"metadata,omitempty"`
	CreatedAt      time.Time  `gorm:"index" json:"created_at"`
}

// BeforeCreate hook to generate UUID
func (e *AuthSecurityEvent) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}
