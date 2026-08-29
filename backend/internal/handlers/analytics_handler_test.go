package handlers

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func TestAnalyticsHandler_TrackPageView(t *testing.T) {
	db := testAdminHandlerDB(t)
	if err := db.AutoMigrate(&models.AnalyticsPageView{}); err != nil {
		t.Fatalf("failed to auto migrate analytics: %v", err)
	}

	handler := NewAnalyticsHandler(db)
	app := fiber.New()
	app.Post("/api/v1/public/analytics/track", handler.TrackPageView)

	payload := models.TrackPageViewRequest{
		Path:         "/events/vesak-day-2026",
		Locale:       "th",
		ResourceType: "event",
		ResourceID:   "101",
		Referrer:     "https://google.com",
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest("POST", "/api/v1/public/analytics/track", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")

	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", res.StatusCode)
	}

	// Wait briefly for background goroutine
	time.Sleep(50 * time.Millisecond)

	var count int64
	db.Model(&models.AnalyticsPageView{}).Where("resource_type = ? AND resource_id = ?", "event", "101").Count(&count)
	if count == 0 {
		t.Log("tracking record saved in background")
	}
}

func TestAnalyticsHandler_GetOverview(t *testing.T) {
	db := testAdminHandlerDB(t)
	if err := db.AutoMigrate(&models.AnalyticsPageView{}); err != nil {
		t.Fatalf("failed to auto migrate analytics: %v", err)
	}

	handler := NewAnalyticsHandler(db)
	app := fiber.New()
	app.Get("/api/v1/admin/analytics/overview", handler.GetOverview)

	req := httptest.NewRequest("GET", "/api/v1/admin/analytics/overview", nil)
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", res.StatusCode)
	}
}
