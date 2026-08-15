package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func TestUpdateMediaValidation(t *testing.T) {
	app := fiber.New()
	handler := &MediaHandler{}
	app.Put("/api/v1/admin/media/:id", handler.UpdateMedia)

	t.Run("rejects invalid UUID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPut, "/api/v1/admin/media/invalid-id", bytes.NewReader([]byte(`{"metadata":{}}`)))
		req.Header.Set("Content-Type", "application/json")
		res, err := app.Test(req)
		if err != nil {
			t.Fatal(err)
		}
		if res.StatusCode != fiber.StatusBadRequest {
			t.Fatalf("expected 400, got %d", res.StatusCode)
		}
	})

	t.Run("rejects missing metadata", func(t *testing.T) {
		id := uuid.New().String()
		req := httptest.NewRequest(http.MethodPut, "/api/v1/admin/media/"+id, bytes.NewReader([]byte(`{}`)))
		req.Header.Set("Content-Type", "application/json")
		res, err := app.Test(req)
		if err != nil {
			t.Fatal(err)
		}
		if res.StatusCode != fiber.StatusBadRequest {
			t.Fatalf("expected 400, got %d", res.StatusCode)
		}
	})
}

func TestMediaUpdateMetadataDB(t *testing.T) {
	db := testAdminHandlerDB(t)
	if err := db.AutoMigrate(&models.Media{}); err != nil {
		t.Fatalf("migrate media: %v", err)
	}

	media := models.Media{
		ID:       uuid.New(),
		Filename: "photo.jpg",
		URL:      "https://example.test/photo.jpg",
	}
	if err := db.Create(&media).Error; err != nil {
		t.Fatal(err)
	}

	handler := NewMediaHandler(db)
	app := fiber.New()
	app.Put("/api/v1/admin/media/:id", handler.UpdateMedia)

	payload := map[string]interface{}{
		"metadata": map[string]interface{}{
			"alt": map[string]interface{}{
				"th": "คำอธิบายภาพ",
				"en": "Description",
				"de": "Beschreibung",
			},
			"caption": "คำบรรยาย",
			"credit":  "ผู้ถ่ายภาพ",
		},
	}
	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		t.Fatal(err)
	}

	req := httptest.NewRequest(http.MethodPut, "/api/v1/admin/media/"+media.ID.String(), bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")

	res, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", res.StatusCode)
	}

	var response struct {
		Success bool         `json:"success"`
		Data    models.Media `json:"data"`
	}
	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		t.Fatal(err)
	}
	if !response.Success {
		t.Fatal("expected success true")
	}
	if response.Data.AltTexts["th"] != "คำอธิบายภาพ" {
		t.Fatalf("expected th alt 'คำอธิบายภาพ', got %q", response.Data.AltTexts["th"])
	}
	if response.Data.AltText != "คำอธิบายภาพ" {
		t.Fatalf("expected alt_text 'คำอธิบายภาพ', got %q", response.Data.AltText)
	}
	if response.Data.Metadata["caption"] != "คำบรรยาย" {
		t.Fatalf("expected caption 'คำบรรยาย', got %v", response.Data.Metadata["caption"])
	}
}
