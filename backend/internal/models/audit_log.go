package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AuditLog represents an audit trail for important actions
type AuditLog struct {
	ID         uuid.UUID              `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID     *uuid.UUID             `gorm:"type:uuid;index" json:"user_id"`
	User       *User                  `gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL" json:"user,omitempty"`
	Action     string                 `gorm:"size:50;not null;index" json:"action"` // 'create', 'update', 'delete'
	EntityType string                 `gorm:"size:100;index" json:"entity_type"` // 'user', 'post', etc.
	EntityID   *uuid.UUID             `gorm:"type:uuid;index" json:"entity_id"`
	Changes    map[string]interface{} `gorm:"type:jsonb" json:"changes"` // Old/new values
	IPAddress  string                 `gorm:"size:45" json:"ip_address"`
	UserAgent  string                 `gorm:"type:text" json:"user_agent"`
	CreatedAt  time.Time              `gorm:"index:idx_audit_logs_created_desc" json:"created_at"`
}

// BeforeCreate hook to generate UUID
func (al *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if al.ID == uuid.Nil {
		al.ID = uuid.New()
	}
	return nil
}
