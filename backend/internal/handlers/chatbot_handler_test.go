package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
)

func TestChatbotHandler_SendMessageValidation(t *testing.T) {
	app := fiber.New()
	handler := &ChatbotHandler{
		chatbotService: services.NewChatbotService(nil),
	}

	app.Post("/chatbot/message", handler.SendMessage)

	// Test 1: Empty message should return 400 Bad Request
	reqBody, _ := json.Marshal(map[string]string{
		"message": "",
		"locale":  "th",
	})
	req := httptest.NewRequest(http.MethodPost, "/chatbot/message", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("failed to execute request: %v", err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected status 400 for empty message, got %d", resp.StatusCode)
	}

	// Test 2: Valid fallback response when no API key configured
	reqBodyValid, _ := json.Marshal(map[string]string{
		"message": "สอบถามเวลาเปิดปิดวัด",
		"locale":  "th",
	})
	reqValid := httptest.NewRequest(http.MethodPost, "/chatbot/message", bytes.NewBuffer(reqBodyValid))
	reqValid.Header.Set("Content-Type", "application/json")

	respValid, err := app.Test(reqValid)
	if err != nil {
		t.Fatalf("failed to execute request: %v", err)
	}
	if respValid.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200 for valid chat message, got %d", respValid.StatusCode)
	}
}

func TestChatbotHandler_GetQuickQuestions(t *testing.T) {
	app := fiber.New()
	handler := &ChatbotHandler{
		chatbotService: services.NewChatbotService(nil),
	}

	app.Get("/chatbot/quick-questions", handler.GetQuickQuestions)

	req := httptest.NewRequest(http.MethodGet, "/chatbot/quick-questions?locale=en", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("failed to execute request: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200 for quick questions, got %d", resp.StatusCode)
	}
}
