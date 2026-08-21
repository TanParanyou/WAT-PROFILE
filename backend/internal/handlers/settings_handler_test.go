package handlers

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func TestSettingsHandler_FeatureFlagRBAC(t *testing.T) {
	db := testAdminHandlerDB(t)
	if err := db.AutoMigrate(&models.Setting{}); err != nil {
		t.Fatalf("failed to auto migrate settings: %v", err)
	}

	// Create a feature flag setting in DB
	featureSetting := models.Setting{
		ID:       uuid.New(),
		Key:      "feature_public_account_auth",
		Value:    "false",
		Type:     "boolean",
		Category: "features",
		IsPublic: true,
	}
	generalSetting := models.Setting{
		ID:       uuid.New(),
		Key:      "site_name",
		Value:    "Wat Thai",
		Type:     "string",
		Category: "general",
		IsPublic: true,
	}
	db.Where("key = ?", featureSetting.Key).Delete(&models.Setting{})
	db.Where("key = ?", generalSetting.Key).Delete(&models.Setting{})
	db.Create(&featureSetting)
	db.Create(&generalSetting)

	// Super Admin Role
	superAdminRole := models.Role{
		ID:          uuid.New(),
		Name:        "super_admin_" + uuid.New().String()[:8],
		AdminAccess: true,
		IsSystem:    true,
		IsActive:    true,
	}
	db.Create(&superAdminRole)
	superAdminUser := models.User{
		ID:       uuid.New(),
		Name:     "Super Admin",
		Email:    "superadmin_" + uuid.New().String()[:8] + "@example.com",
		RoleID:   &superAdminRole.ID,
		Role:     &superAdminRole,
		IsActive: true,
	}
	db.Create(&superAdminUser)

	// Regular Admin Role
	adminRole := models.Role{
		ID:          uuid.New(),
		Name:        "editor_" + uuid.New().String()[:8],
		AdminAccess: true,
		IsSystem:    false,
		IsActive:    true,
		Permissions: models.PermissionsMap{"settings": "all"},
	}
	db.Create(&adminRole)
	regularAdminUser := models.User{
		ID:       uuid.New(),
		Name:     "Regular Admin",
		Email:    "admin_" + uuid.New().String()[:8] + "@example.com",
		RoleID:   &adminRole.ID,
		Role:     &adminRole,
		IsActive: true,
	}
	db.Create(&regularAdminUser)

	handler := NewSettingsHandler(db)

	t.Run("Non-super_admin receives 403 when updating feature flags", func(t *testing.T) {
		app := fiber.New()
		app.Use(func(c *fiber.Ctx) error {
			c.Locals("user", &regularAdminUser)
			return c.Next()
		})
		app.Put("/api/v1/admin/settings", handler.UpdateSettings)

		payload := []map[string]string{
			{"key": "feature_public_account_auth", "value": "true"},
		}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("PUT", "/api/v1/admin/settings", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		res, err := app.Test(req)
		if err != nil {
			t.Fatalf("request failed: %v", err)
		}
		if res.StatusCode != fiber.StatusForbidden {
			t.Fatalf("expected status 403 Forbidden, got %d", res.StatusCode)
		}
	})

	t.Run("Super Admin can successfully update feature flags", func(t *testing.T) {
		app := fiber.New()
		app.Use(func(c *fiber.Ctx) error {
			c.Locals("user", &superAdminUser)
			return c.Next()
		})
		app.Put("/api/v1/admin/settings", handler.UpdateSettings)

		payload := []map[string]string{
			{"key": "feature_public_account_auth", "value": "true"},
		}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("PUT", "/api/v1/admin/settings", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		res, err := app.Test(req)
		if err != nil {
			t.Fatalf("request failed: %v", err)
		}
		if res.StatusCode != fiber.StatusOK {
			t.Fatalf("expected status 200 OK, got %d", res.StatusCode)
		}

		// Verify that feature flag was updated in DB
		var updated models.Setting
		db.First(&updated, "key = ?", "feature_public_account_auth")
		if updated.Value != "true" {
			t.Fatalf("expected setting value 'true', got '%s'", updated.Value)
		}
	})

	t.Run("Regular Admin can update non-feature settings", func(t *testing.T) {
		app := fiber.New()
		app.Use(func(c *fiber.Ctx) error {
			c.Locals("user", &regularAdminUser)
			return c.Next()
		})
		app.Put("/api/v1/admin/settings", handler.UpdateSettings)

		payload := []map[string]string{
			{"key": "site_name", "value": "Wat Phra That"},
		}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("PUT", "/api/v1/admin/settings", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		res, err := app.Test(req)
		if err != nil {
			t.Fatalf("request failed: %v", err)
		}
		if res.StatusCode != fiber.StatusOK {
			t.Fatalf("expected status 200 OK, got %d", res.StatusCode)
		}
	})
}
