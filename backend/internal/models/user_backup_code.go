package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserBackupCode represents a hashed single-use recovery code for 2FA
type UserBackupCode struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	User      User       `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	CodeHash  string     `gorm:"size:255;not null" json:"-"`
	UsedAt    *time.Time `json:"used_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

// BeforeCreate hook to generate UUID
func (b *UserBackupCode) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}

func (b *UserBackupCode) TableName() string {
	return "user_backup_codes"
}
