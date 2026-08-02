package handlers

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

func TestAdminProfileHandler(t *testing.T) {
	db := testAdminHandlerDB(t)
	t.Setenv("JWT_SECRET", "test-secret")

	user := createAdminProfileUser(t, db, true)

	app := fiber.New(fiber.Config{ErrorHandler: func(c *fiber.Ctx, err error) error {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "error": err.Error()})
	}})
	app.Use(recover.New())
	handler := NewUserHandler(db)
	admin := app.Group("/api/v1/admin", middleware.AdminAuthRequired(db))
	admin.Put("/me", middleware.PermissionRequired("profile", "update"), handler.UpdateAdminProfile)

	token, err := utils.GenerateAdminAccessToken(user.ID)
	if err != nil {
		t.Fatalf("generate admin token: %v", err)
	}

	t.Run("updates own profile", func(t *testing.T) {
		req := httptest.NewRequest(fiber.MethodPut, "/api/v1/admin/me", jsonBody(t, fiber.Map{
			"name":  "Updated Admin Name",
			"email": user.Email,
		}))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")

		res, err := app.Test(req)
		if err != nil {
			t.Fatalf("request: %v", err)
		}
		defer res.Body.Close()
		if res.StatusCode != fiber.StatusOK {
			t.Fatalf("expected 200, got %d", res.StatusCode)
		}

		var body struct {
			Success bool        `json:"success"`
			Data    models.User `json:"data"`
		}
		if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if body.Data.Name != "Updated Admin Name" {
			t.Errorf("expected updated name, got %q", body.Data.Name)
		}
	})

	t.Run("rejects update without profile permission", func(t *testing.T) {
		noPermUser := createAdminProfileUser(t, db, false)
		noPermToken, err := utils.GenerateAdminAccessToken(noPermUser.ID)
		if err != nil {
			t.Fatalf("generate admin token: %v", err)
		}

		req := httptest.NewRequest(fiber.MethodPut, "/api/v1/admin/me", jsonBody(t, fiber.Map{"name": "Nope"}))
		req.Header.Set("Authorization", "Bearer "+noPermToken)
		req.Header.Set("Content-Type", "application/json")

		res, err := app.Test(req)
		if err != nil {
			t.Fatalf("request: %v", err)
		}
		defer res.Body.Close()
		if res.StatusCode != fiber.StatusForbidden {
			t.Errorf("expected 403, got %d", res.StatusCode)
		}
	})

	t.Run("rejects wrong current password", func(t *testing.T) {
		req := httptest.NewRequest(fiber.MethodPut, "/api/v1/admin/me", jsonBody(t, fiber.Map{
			"name":             "Should Not Apply",
			"current_password": "WrongPassword123",
			"new_password":     "NewPassword123",
		}))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")

		res, err := app.Test(req)
		if err != nil {
			t.Fatalf("request: %v", err)
		}
		defer res.Body.Close()
		if res.StatusCode != fiber.StatusBadRequest {
			t.Errorf("expected 400, got %d", res.StatusCode)
		}
	})

	t.Run("password change revokes admin sessions", func(t *testing.T) {
		svc := services.NewAdminAuthService(db, time.Now)
		loginResult, err := svc.LoginAdmin(user.Email, testAdminPassword, "127.0.0.1", "test-agent")
		if err != nil {
			t.Fatalf("login: %v", err)
		}

		req := httptest.NewRequest(fiber.MethodPut, "/api/v1/admin/me", jsonBody(t, fiber.Map{
			"name":             "Name After Password Change",
			"current_password": testAdminPassword,
			"new_password":     "RotatedPassword123",
		}))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")

		res, err := app.Test(req)
		if err != nil {
			t.Fatalf("request: %v", err)
		}
		defer res.Body.Close()
		if res.StatusCode != fiber.StatusOK {
			t.Fatalf("expected 200, got %d", res.StatusCode)
		}

		if _, err := svc.RefreshAdmin(loginResult.RefreshCredential); err != services.ErrAdminSessionInvalid {
			t.Errorf("expected ErrAdminSessionInvalid after password change, got %v", err)
		}
	})
}

func jsonBody(t *testing.T, payload fiber.Map) *bytes.Reader {
	t.Helper()
	raw, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}
	return bytes.NewReader(raw)
}

func createAdminProfileUser(t *testing.T, db *gorm.DB, withProfileUpdate bool) *models.User {
	t.Helper()

	permissions := models.PermissionsMap{"dashboard": "read"}
	if withProfileUpdate {
		permissions["profile"] = "update"
	}
	role := models.Role{
		Name:        "profile-test-" + uuid.NewString()[:8],
		Permissions: permissions,
		AdminAccess: true,
		IsActive:    true,
	}
	if err := db.Create(&role).Error; err != nil {
		t.Fatalf("create role: %v", err)
	}
	t.Cleanup(func() { _ = db.Unscoped().Delete(&role).Error })

	hash, err := utils.HashPassword(testAdminPassword)
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}
	user := models.User{
		Email:        "admin-profile-" + uuid.NewString() + "@wat.local",
		PasswordHash: &hash,
		Name:         "Admin Profile User",
		RoleID:       &role.ID,
		IsActive:     true,
	}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}
	t.Cleanup(func() { _ = db.Unscoped().Delete(&user).Error })

	return &user
}
