package models

import (
	"testing"
)

func TestRole_HasPermission(t *testing.T) {
	tests := []struct {
		name     string
		role     Role
		resource string
		action   string
		expected bool
	}{
		{
			name: "Super admin role with is_system and admin_access has all permissions",
			role: Role{
				Name:        "custom_super_admin",
				IsActive:    true,
				IsSystem:    true,
				AdminAccess: true,
			},
			resource: "events",
			action:   "delete",
			expected: true,
		},
		{
			name: "System admin role has all permissions on future resources",
			role: Role{
				Name:        "super_admin",
				IsActive:    true,
				IsSystem:    true,
				AdminAccess: true,
			},
			resource: "any_future_resource",
			action:   "any_action",
			expected: true,
		},
		{
			name: "Inactive system admin role has no permissions",
			role: Role{
				Name:        "super_admin",
				IsActive:    false,
				IsSystem:    true,
				AdminAccess: true,
			},
			resource: "events",
			action:   "read",
			expected: false,
		},
		{
			name: "Global wildcard permission {'*': 'all'}",
			role: Role{
				Name:     "custom_super",
				IsActive: true,
				Permissions: PermissionsMap{
					"*": "all",
				},
			},
			resource: "settings",
			action:   "update",
			expected: true,
		},
		{
			name: "Resource with 'all' permission",
			role: Role{
				Name:     "editor",
				IsActive: true,
				Permissions: PermissionsMap{
					"events": "all",
				},
			},
			resource: "events",
			action:   "delete",
			expected: true,
		},
		{
			name: "Resource with exact action match",
			role: Role{
				Name:     "viewer",
				IsActive: true,
				Permissions: PermissionsMap{
					"events": "read",
				},
			},
			resource: "events",
			action:   "read",
			expected: true,
		},
		{
			name: "Resource with action not matching",
			role: Role{
				Name:     "viewer",
				IsActive: true,
				Permissions: PermissionsMap{
					"events": "read",
				},
			},
			resource: "events",
			action:   "delete",
			expected: false,
		},
		{
			name: "Resource with array of actions",
			role: Role{
				Name:     "staff",
				IsActive: true,
				Permissions: PermissionsMap{
					"monks": []interface{}{"read", "update"},
				},
			},
			resource: "monks",
			action:   "update",
			expected: true,
		},
		{
			name: "Resource with array of actions not matched",
			role: Role{
				Name:     "staff",
				IsActive: true,
				Permissions: PermissionsMap{
					"monks": []interface{}{"read", "update"},
				},
			},
			resource: "monks",
			action:   "delete",
			expected: false,
		},
		{
			name: "Comma-separated action string",
			role: Role{
				Name:     "staff",
				IsActive: true,
				Permissions: PermissionsMap{
					"gallery": "read,create",
				},
			},
			resource: "gallery",
			action:   "create",
			expected: true,
		},
		{
			name: "CRUD shorthand string",
			role: Role{
				Name:     "staff",
				IsActive: true,
				Permissions: PermissionsMap{
					"donations": "crud",
				},
			},
			resource: "donations",
			action:   "delete",
			expected: true,
		},
		{
			name: "No false-positive substring matching",
			role: Role{
				Name:     "staff",
				IsActive: true,
				Permissions: PermissionsMap{
					"events": "thread",
				},
			},
			resource: "events",
			action:   "read",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actual := tt.role.HasPermission(tt.resource, tt.action)
			if actual != tt.expected {
				t.Errorf("%s: expected HasPermission(%q, %q) = %v, got %v", tt.name, tt.resource, tt.action, tt.expected, actual)
			}
		})
	}
}
