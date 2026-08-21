package middleware

import (
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
)

func TestFeatureRequiredMiddleware(t *testing.T) {
	svc := services.NewSettingsService(nil)

	app := fiber.New()
	app.Get("/community", FeatureRequired(svc, "feature_public_community_read"), func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	// 1. When feature is disabled / not set -> returns 404
	req := httptest.NewRequest("GET", "/community", nil)
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if res.StatusCode != fiber.StatusNotFound {
		t.Fatalf("expected status 404, got %d", res.StatusCode)
	}

	// 2. When feature is enabled in cache -> returns 200
	svc.SetCacheForTesting("feature_public_community_read", "true")
	req = httptest.NewRequest("GET", "/community", nil)
	res, err = app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("expected status 200, got %d", res.StatusCode)
	}
}
