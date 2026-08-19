package services

import (
	"testing"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func TestRoleService_SystemRoleProtections(t *testing.T) {
	db := testAdminAuthDB(t)

	roleService := NewRoleService(db)

	// Create system admin role
	adminRole := models.Role{
		ID:          uuid.New(),
		Name:        "admin",
		Description: "System administrator",
		IsActive:    true,
		AdminAccess: true,
		IsSystem:    true,
		Permissions: models.PermissionsMap{"*": "all"},
	}
	if err := db.Create(&adminRole).Error; err != nil {
		t.Fatalf("create admin role: %v", err)
	}
	defer db.Unscoped().Delete(&adminRole)

	// Test 1: Cannot rename system role
	t.Run("Cannot rename system role", func(t *testing.T) {
		modified := adminRole
		modified.Name = "super_admin_renamed"
		err := roleService.Update(&modified)
		if err == nil {
			t.Error("expected error when renaming system role, got nil")
		}
	})

	// Test 2: Cannot deactivate system role
	t.Run("Cannot deactivate system role", func(t *testing.T) {
		modified := adminRole
		modified.IsActive = false
		err := roleService.Update(&modified)
		if err == nil {
			t.Error("expected error when deactivating system role, got nil")
		}
	})

	// Test 3: Cannot revoke admin access from admin system role
	t.Run("Cannot revoke admin_access from system admin role", func(t *testing.T) {
		modified := adminRole
		modified.AdminAccess = false
		err := roleService.Update(&modified)
		if err == nil {
			t.Error("expected error when revoking admin_access from admin role, got nil")
		}
	})

	// Test 4: Cannot delete system role
	t.Run("Cannot delete system role", func(t *testing.T) {
		err := roleService.Delete(adminRole.ID)
		if err == nil {
			t.Error("expected error when deleting system role, got nil")
		}
	})

	// Test 5: Cannot bulk delete system role
	t.Run("Cannot bulk delete system role", func(t *testing.T) {
		err := roleService.BulkDelete([]uuid.UUID{adminRole.ID})
		if err == nil {
			t.Error("expected error when bulk deleting system role, got nil")
		}
	})

	// Test 6: Custom role creation cannot force is_system = true
	t.Run("Custom role creation cannot set is_system = true", func(t *testing.T) {
		customRole := models.Role{
			ID:          uuid.New(),
			Name:        "custom_role_test",
			Description: "Custom staff role",
			IsActive:    true,
			AdminAccess: true,
			IsSystem:    true, // attempting to create as system role
			Permissions: models.PermissionsMap{"events": "read"},
		}
		if err := roleService.Create(&customRole); err != nil {
			t.Fatalf("create custom role: %v", err)
		}
		defer db.Unscoped().Delete(&customRole)

		var fetched models.Role
		if err := db.First(&fetched, "id = ?", customRole.ID).Error; err != nil {
			t.Fatalf("fetch custom role: %v", err)
		}
		if fetched.IsSystem {
			t.Errorf("expected is_system = false for newly created custom role, got true")
		}
	})
}
