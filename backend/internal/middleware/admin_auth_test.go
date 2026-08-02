package middleware

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const adminAuthTestPassword = "Password123!"

func adminAuthTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := os.Getenv("DATABASE_URL_TEST")
	if dsn == "" {
		t.Skip("DATABASE_URL_TEST not set; skipping admin auth middleware test")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open test database: %v", err)
	}
	if err := db.AutoMigrate(&models.Role{}, &models.User{}); err != nil {
		t.Fatalf("failed to migrate test database: %v", err)
	}
	return db
}

func createAdminAuthTestRole(t *testing.T, db *gorm.DB, adminAccess, active bool, permissions models.PermissionsMap) *models.Role {
	t.Helper()
	role := &models.Role{
		Name:        "test-admin-" + uuid.NewString(),
		Permissions: permissions,
		IsActive:    true,
		AdminAccess: adminAccess,
	}
	if err := db.Create(role).Error; err != nil {
		t.Fatalf("failed to create role: %v", err)
	}
	if !active {
		if err := db.Model(role).Update("is_active", false).Error; err != nil {
			t.Fatalf("failed to deactivate role: %v", err)
		}
	}
	return role
}

func createAdminAuthTestUser(t *testing.T, db *gorm.DB, role *models.Role, active bool) *models.User {
	t.Helper()
	user := &models.User{
		Email:         "admin-" + uuid.NewString() + "@wat.local",
		Name:          "Test Admin",
		RoleID:        &role.ID,
		IsActive:      true,
		EmailVerified: true,
	}
	if err := db.Create(user).Error; err != nil {
		t.Fatalf("failed to create user: %v", err)
	}
	if !active {
		if err := db.Model(user).Update("is_active", false).Error; err != nil {
			t.Fatalf("failed to deactivate user: %v", err)
		}
	}
	return user
}

func newAdminAuthTestApp(db *gorm.DB) *fiber.App {
	app := fiber.New()
	admin := app.Group("/admin", AdminAuthRequired(db))
	admin.Get("/dashboard/stats", PermissionRequired("dashboard", "read"), func(c *fiber.Ctx) error {
		return c.SendString("ok")
	})
	return app
}

func performAdminRequest(t *testing.T, app *fiber.App, token string) *http.Response {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/admin/dashboard/stats", nil)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	return resp
}

func TestAdminAuthRequiredMissingToken(t *testing.T) {
	app := newAdminAuthTestApp(&gorm.DB{})
	resp := performAdminRequest(t, app, "")
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401 for missing token, got %d", resp.StatusCode)
	}
}

func TestAdminAuthRequiredInvalidToken(t *testing.T) {
	app := newAdminAuthTestApp(&gorm.DB{})
	resp := performAdminRequest(t, app, "not-a-valid-token")
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401 for invalid token, got %d", resp.StatusCode)
	}
}

func TestAdminAuthRequiredRejectsMemberToken(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-for-member-rejection")
	db := adminAuthTestDB(t)
	role := createAdminAuthTestRole(t, db, true, true, models.PermissionsMap{"dashboard": "read"})
	user := createAdminAuthTestUser(t, db, role, true)

	memberToken, err := utils.GenerateAccessToken(user.ID, user.Email, role.Name)
	if err != nil {
		t.Fatalf("failed to generate member token: %v", err)
	}

	app := newAdminAuthTestApp(db)
	resp := performAdminRequest(t, app, memberToken)
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401 for member token, got %d", resp.StatusCode)
	}
}

func TestAdminAuthRequiredAcceptsAdminToken(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-for-admin-acceptance")
	db := adminAuthTestDB(t)
	role := createAdminAuthTestRole(t, db, true, true, models.PermissionsMap{"dashboard": "read"})
	user := createAdminAuthTestUser(t, db, role, true)

	adminToken, err := utils.GenerateAdminAccessToken(user.ID)
	if err != nil {
		t.Fatalf("failed to generate admin token: %v", err)
	}

	app := newAdminAuthTestApp(db)
	resp := performAdminRequest(t, app, adminToken)
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200 for valid admin token, got %d", resp.StatusCode)
	}
}

func TestAdminAuthRequiredRejectsInactiveUser(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-for-inactive-user")
	db := adminAuthTestDB(t)
	role := createAdminAuthTestRole(t, db, true, true, models.PermissionsMap{"dashboard": "read"})
	user := createAdminAuthTestUser(t, db, role, false)

	adminToken, err := utils.GenerateAdminAccessToken(user.ID)
	if err != nil {
		t.Fatalf("failed to generate admin token: %v", err)
	}

	app := newAdminAuthTestApp(db)
	resp := performAdminRequest(t, app, adminToken)
	if resp.StatusCode != fiber.StatusForbidden {
		t.Fatalf("expected 403 for inactive user, got %d", resp.StatusCode)
	}
}

func TestAdminAuthRequiredRejectsInactiveRole(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-for-inactive-role")
	db := adminAuthTestDB(t)
	role := createAdminAuthTestRole(t, db, true, false, models.PermissionsMap{"dashboard": "read"})
	user := createAdminAuthTestUser(t, db, role, true)

	adminToken, err := utils.GenerateAdminAccessToken(user.ID)
	if err != nil {
		t.Fatalf("failed to generate admin token: %v", err)
	}

	app := newAdminAuthTestApp(db)
	resp := performAdminRequest(t, app, adminToken)
	if resp.StatusCode != fiber.StatusForbidden {
		t.Fatalf("expected 403 for inactive role, got %d", resp.StatusCode)
	}
}

func TestAdminAuthRequiredRejectsNonAdminRole(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-for-non-admin-role")
	db := adminAuthTestDB(t)
	role := createAdminAuthTestRole(t, db, false, true, models.PermissionsMap{"events": "read"})
	user := createAdminAuthTestUser(t, db, role, true)

	adminToken, err := utils.GenerateAdminAccessToken(user.ID)
	if err != nil {
		t.Fatalf("failed to generate admin token: %v", err)
	}

	app := newAdminAuthTestApp(db)
	resp := performAdminRequest(t, app, adminToken)
	if resp.StatusCode != fiber.StatusForbidden {
		t.Fatalf("expected 403 for non-admin role, got %d", resp.StatusCode)
	}
}

func TestAdminAuthRequiredHonorsPermissionChangesAfterTokenIssue(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-for-permission-changes")
	db := adminAuthTestDB(t)
	role := createAdminAuthTestRole(t, db, true, true, models.PermissionsMap{"dashboard": "read"})
	user := createAdminAuthTestUser(t, db, role, true)

	adminToken, err := utils.GenerateAdminAccessToken(user.ID)
	if err != nil {
		t.Fatalf("failed to generate admin token: %v", err)
	}

	app := newAdminAuthTestApp(db)
	if resp := performAdminRequest(t, app, adminToken); resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200 before permission change, got %d", resp.StatusCode)
	}

	if err := db.Model(role).Update("permissions", models.PermissionsMap{}).Error; err != nil {
		t.Fatalf("failed to clear role permissions: %v", err)
	}

	resp := performAdminRequest(t, app, adminToken)
	if resp.StatusCode != fiber.StatusForbidden {
		t.Fatalf("expected 403 after permission change, got %d", resp.StatusCode)
	}
}
