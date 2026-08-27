package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PermissionsMap is a custom type for JSONB permissions
type PermissionsMap map[string]interface{}

// Value implements the driver.Valuer interface for database storage
func (p PermissionsMap) Value() (driver.Value, error) {
	if p == nil {
		return nil, nil
	}
	bytes, err := json.Marshal(p)
	if err != nil {
		return nil, err
	}
	return string(bytes), nil
}

// Scan implements the sql.Scanner interface for database retrieval
func (p *PermissionsMap) Scan(value interface{}) error {
	if value == nil {
		*p = nil
		return nil
	}

	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return fmt.Errorf("unsupported type for PermissionsMap: %T", value)
	}

	return json.Unmarshal(bytes, p)
}

// Role represents a user role with permissions (RBAC)
type Role struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name        string         `gorm:"size:50;uniqueIndex;not null" json:"name"` // 'admin', 'member', 'guest'
	Description string         `gorm:"size:255" json:"description"`
	Permissions PermissionsMap `gorm:"type:jsonb" json:"permissions"` // {"users": "crud", "posts": "read"}
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	AdminAccess bool           `gorm:"default:false;not null" json:"admin_access"` // grants Admin login eligibility
	IsSystem    bool           `gorm:"default:false;not null" json:"is_system"`    // protected system role (cannot be deleted/renamed)
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
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
	if !r.IsActive {
		return false
	}

	// 1. Super Admin with system role and admin_access automatically has all permissions
	if r.IsSystem && r.AdminAccess {
		return true
	}

	// 2. Any active admin role always has access to self-profile and security settings
	if resource == "profile" && r.AdminAccess {
		return true
	}

	// 3. Any active admin role always has read access to dashboard and notifications
	if resource == "dashboard" && action == "read" && r.AdminAccess {
		return true
	}

	if r.Permissions == nil {
		return false
	}

	// 2. Global wildcard permission check (e.g. {"*": "all"} or {"*": "*"})
	if globalPerm, ok := r.Permissions["*"]; ok {
		if v, ok := globalPerm.(string); ok && (v == "all" || v == "*" || v == action) {
			return true
		}
	}

	permission, ok := r.Permissions[resource]
	if !ok {
		return false
	}

	// 3. Check if permission is "all", "*", exact match, or in array
	switch v := permission.(type) {
	case string:
		if v == "all" || v == "*" || v == action {
			return true
		}
		// Handle comma-separated action lists like "read,create" or "crud"
		for _, part := range strings.Split(v, ",") {
			trimmed := strings.TrimSpace(part)
			if trimmed == action || trimmed == "all" || trimmed == "*" {
				return true
			}
		}
		if v == "crud" && (action == "create" || action == "read" || action == "update" || action == "delete") {
			return true
		}
	case []interface{}:
		for _, p := range v {
			if strVal, ok := p.(string); ok {
				if strVal == action || strVal == "all" || strVal == "*" {
					return true
				}
			}
		}
	}

	return false
}
