package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AdminSession represents an authenticated Admin session with a rotating
// opaque refresh credential. Only the SHA-256 hash of the current secret is
// stored; the raw credential is delivered to the browser via HttpOnly cookie.
type AdminSession struct {
	ID                uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID            uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	User              User       `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	CurrentSecretHash string     `gorm:"size:64;uniqueIndex;not null" json:"-"`
	ExpiresAt         time.Time  `gorm:"not null" json:"expires_at"`
	RevokedAt         *time.Time `json:"revoked_at"`
	RevocationReason  string     `gorm:"size:100" json:"revocation_reason,omitempty"`
	LastUsedAt        time.Time  `gorm:"not null" json:"last_used_at"`
	IPAddress         string     `gorm:"size:45" json:"ip_address,omitempty"`
	UserAgent         string     `gorm:"size:512" json:"user_agent,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// BeforeCreate hook to generate UUID
func (s *AdminSession) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// AdminSessionRefreshHistory tracks previously valid secret hashes during the
// grace window so a slow second tab can still refresh while a reuse outside the
// window is detected and the session revoked.
type AdminSessionRefreshHistory struct {
	ID             uuid.UUID     `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	SessionID      uuid.UUID     `gorm:"type:uuid;not null;uniqueIndex:uq_admin_session_history" json:"session_id"`
	Session        AdminSession  `gorm:"foreignKey:SessionID;constraint:OnDelete:CASCADE" json:"-"`
	SecretHash     string        `gorm:"size:64;not null;uniqueIndex:uq_admin_session_history" json:"-"`
	GraceExpiresAt time.Time     `gorm:"not null" json:"grace_expires_at"`
	CreatedAt      time.Time     `json:"created_at"`
}

// BeforeCreate hook to generate UUID
func (h *AdminSessionRefreshHistory) BeforeCreate(tx *gorm.DB) error {
	if h.ID == uuid.Nil {
		h.ID = uuid.New()
	}
	return nil
}

func (h *AdminSessionRefreshHistory) TableName() string {
	return "admin_session_refresh_history"
}
