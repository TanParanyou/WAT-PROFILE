package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func TestAdminChatbotHandler_CRUD(t *testing.T) {
	db := testAdminHandlerDB(t)
	if err := db.AutoMigrate(&models.ChatbotKnowledgeBase{}, &models.AuditLog{}); err != nil {
		t.Fatalf("failed to auto migrate models: %v", err)
	}

	handler := NewAdminChatbotHandler(db)
	app := fiber.New()

	app.Get("/admin/chatbot/knowledge-base", handler.GetAllKnowledgeBase)
	app.Get("/admin/chatbot/knowledge-base/:id", handler.GetKnowledgeBaseByID)
	app.Post("/admin/chatbot/knowledge-base", handler.CreateKnowledgeBase)
	app.Put("/admin/chatbot/knowledge-base/:id", handler.UpdateKnowledgeBase)
	app.Patch("/admin/chatbot/knowledge-base/:id/toggle-active", handler.ToggleActiveKnowledgeBase)
	app.Delete("/admin/chatbot/knowledge-base/:id", handler.DeleteKnowledgeBase)

	// 1. Test Create
	createPayload := models.ChatbotKnowledgeBase{
		Category: "practice",
		Question: models.MultiLangText{
			"th": "เวลาทำวัตรเช้าเย็น",
			"en": "Morning and evening chanting times",
			"de": "Morgen- und Abendgesänge Zeiten",
		},
		Answer: models.MultiLangText{
			"th": "ทำวัตรเช้าเวลา 06:30 น. และทำวัตรเย็นเวลา 18:00 น.",
			"en": "Morning chanting at 06:30 and evening chanting at 18:00.",
			"de": "Morgengesang um 06:30 Uhr und Abendgesang um 18:00 Uhr.",
		},
		Keywords: models.StringSlice{"สวดมนต์", "ทำวัตร", "chanting"},
		Priority: 5,
		IsActive: true,
	}

	createBody, _ := json.Marshal(createPayload)
	reqCreate := httptest.NewRequest(http.MethodPost, "/admin/chatbot/knowledge-base", bytes.NewBuffer(createBody))
	reqCreate.Header.Set("Content-Type", "application/json")

	respCreate, err := app.Test(reqCreate)
	if err != nil {
		t.Fatalf("create request failed: %v", err)
	}
	if respCreate.StatusCode != http.StatusCreated {
		t.Fatalf("expected status 201 Created, got %d", respCreate.StatusCode)
	}

	// 2. Test Get List
	reqList := httptest.NewRequest(http.MethodGet, "/admin/chatbot/knowledge-base?page=1&limit=10", nil)
	respList, err := app.Test(reqList)
	if err != nil {
		t.Fatalf("list request failed: %v", err)
	}
	if respList.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", respList.StatusCode)
	}

	// 3. Test Invalid Create (Empty Question/Answer)
	invalidPayload := map[string]interface{}{
		"category": "practice",
	}
	invBody, _ := json.Marshal(invalidPayload)
	reqInv := httptest.NewRequest(http.MethodPost, "/admin/chatbot/knowledge-base", bytes.NewBuffer(invBody))
	reqInv.Header.Set("Content-Type", "application/json")

	respInv, err := app.Test(reqInv)
	if err != nil {
		t.Fatalf("invalid create request failed: %v", err)
	}
	if respInv.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected status 400 Bad Request, got %d", respInv.StatusCode)
	}
}
