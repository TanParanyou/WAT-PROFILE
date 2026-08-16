package handlers

import (
	"bytes"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestCreateAnswerRequiresIdempotencyKey(t *testing.T) {
	app := fiber.New()
	app.Post("/questions/:id/answers", (&CommunityAccountHandler{}).CreateAnswer)
	request := httptest.NewRequest("POST", "/questions/20000000-0000-4000-8000-000000000001/answers", bytes.NewBufferString(`{"body":{"type":"doc"}}`))
	request.Header.Set("Content-Type", "application/json")
	response, err := app.Test(request)
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != fiber.StatusBadRequest {
		t.Fatalf("status = %d", response.StatusCode)
	}
}
