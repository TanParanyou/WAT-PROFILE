package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Role represents a user role with permissions (RBAC)
type Role struct {
	ID          uuid.UUID              `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name        string                 `gorm:"size:50;uniqueIndex;not null" json:"name"` // 'admin', 'member', 'guest'
	Description string                 `gorm:"size:255" json:"description"`
	Permissions map[string]interface{} `gorm:"type:jsonb" json:"permissions"` // {"users": "crud", "posts": "read"}
	IsActive    bool                   `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

// BeforeCreate hook to generate UUID
func (r *Role) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

// HasPermission checks if role has specific permission
func (r *Role) HasPermission(resource, action string) bool {
	if r.Permissions == nil {
		return false
	}

	permission, ok := r.Permissions[resource]
	if !ok {
		return false
	}

	// Check if permission is "all" or contains the action
	switch v := permission.(type) {
	case string:
		return v == "all" || v == action || contains(v, action)
	case []interface{}:
		for _, p := range v {
			if p == action || p == "all" {
				return true
			}
		}
	}

	return false
}

func contains(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
