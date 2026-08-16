package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents an authenticated user
type User struct {
	ID            uuid.UUID     `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Email         string        `gorm:"size:255;uniqueIndex;not null" json:"email"`
	PasswordHash  *string       `gorm:"size:255" json:"-"` // Never return password in JSON; nil for Google-only accounts
	Name          string        `gorm:"size:255;not null" json:"name"`
	AvatarURL     string        `gorm:"size:500" json:"avatar_url,omitempty"`
	RoleID        *uuid.UUID    `gorm:"type:uuid" json:"role_id"`
	Role          *Role         `gorm:"foreignKey:RoleID" json:"role,omitempty"`
	EmailVerified bool          `gorm:"default:false" json:"email_verified"`
	IsActive      bool          `gorm:"default:true" json:"is_active"`
	AccountStatus AccountStatus `gorm:"size:32;not null;default:active" json:"account_status"`
	ClosedAt      *time.Time    `json:"closed_at,omitempty"`
	PurgeAfter    *time.Time    `gorm:"index" json:"purge_after,omitempty"`
	TOTPSecret          *string             `gorm:"type:text" json:"-"`
	TOTPEnabled         bool                `gorm:"default:false;not null" json:"totp_enabled"`
	TOTPVerifiedAt      *time.Time          `json:"totp_verified_at,omitempty"`
	SecurityPreferences SecurityPreferences `gorm:"type:jsonb" json:"security_preferences"`
	FailedLoginAttempts int                 `gorm:"default:0;not null" json:"-"`
	LockedUntil         *time.Time          `json:"-"`
	LastLoginAt         *time.Time          `json:"last_login_at"`
	CreatedAt           time.Time           `json:"created_at"`
	UpdatedAt           time.Time           `json:"updated_at"`
}

// SecurityPreferences defines per-user security notification preferences
type SecurityPreferences struct {
	EmailOnNewDevice      bool `json:"email_on_new_device"`
	EmailOnFailedLogin    bool `json:"email_on_failed_login"`
	EmailOnSecurityChange bool `json:"email_on_security_change"`
}

// DefaultSecurityPreferences returns default security notification preferences
func DefaultSecurityPreferences() SecurityPreferences {
	return SecurityPreferences{
		EmailOnNewDevice:      true,
		EmailOnFailedLogin:    true,
		EmailOnSecurityChange: true,
	}
}

// Value implements the driver.Valuer interface
func (sp SecurityPreferences) Value() (driver.Value, error) {
	bytes, err := json.Marshal(sp)
	if err != nil {
		return nil, err
	}
	return string(bytes), nil
}

// Scan implements the sql.Scanner interface
func (sp *SecurityPreferences) Scan(value interface{}) error {
	if value == nil {
		*sp = DefaultSecurityPreferences()
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return fmt.Errorf("unsupported type for SecurityPreferences: %T", value)
	}
	if len(bytes) == 0 {
		*sp = DefaultSecurityPreferences()
		return nil
	}
	return json.Unmarshal(bytes, sp)
}

// IsLockedOut checks if the user is currently locked out due to failed login attempts
func (u *User) IsLockedOut() bool {
	if u.LockedUntil == nil {
		return false
	}
	return time.Now().Before(*u.LockedUntil)
}

// BeforeCreate hook to generate UUID
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// IsAdmin checks if user is an admin
func (u *User) IsAdmin() bool {
	if u.Role == nil {
		return false
	}
	return u.Role.Name == "admin"
}

// RefreshToken represents a refresh token for JWT authentication
type RefreshToken struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	Token     string    `gorm:"size:500;uniqueIndex;not null" json:"token"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

// BeforeCreate hook for RefreshToken
func (rt *RefreshToken) BeforeCreate(tx *gorm.DB) error {
	if rt.ID == uuid.Nil {
		rt.ID = uuid.New()
	}
	return nil
}

// IsExpired checks if refresh token is expired
func (rt *RefreshToken) IsExpired() bool {
	return time.Now().After(rt.ExpiresAt)
}

// PasswordReset represents a password reset token
type PasswordReset struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	Token     string    `gorm:"size:500;uniqueIndex;not null" json:"token"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	Used      bool      `gorm:"default:false" json:"used"`
	CreatedAt time.Time `json:"created_at"`
}

// BeforeCreate hook for PasswordReset
func (pr *PasswordReset) BeforeCreate(tx *gorm.DB) error {
	if pr.ID == uuid.Nil {
		pr.ID = uuid.New()
	}
	return nil
}

// IsExpired checks if password reset token is expired
func (pr *PasswordReset) IsExpired() bool {
	return time.Now().After(pr.ExpiresAt)
}

// IsValid checks if password reset token is valid (not used and not expired)
func (pr *PasswordReset) IsValid() bool {
	return !pr.Used && !pr.IsExpired()
}
