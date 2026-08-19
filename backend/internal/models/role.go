package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
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

	// 1. Super Admin with admin_access or system admin role automatically has all permissions
	if (r.IsSystem && r.Name == "admin") || (r.AdminAccess && r.Name == "admin") {
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

	// 3. Check if permission is "all" or contains the action
	switch v := permission.(type) {
	case string:
		return v == "all" || v == "*" || v == action || contains(v, action)
	case []interface{}:
		for _, p := range v {
			if p == action || p == "all" || p == "*" {
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
