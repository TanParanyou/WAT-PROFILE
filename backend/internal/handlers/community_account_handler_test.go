package handlers

import (
	"bytes"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestCreateQuestionRequiresIdempotencyKey(t *testing.T) {
	app := fiber.New()
	app.Post("/questions", (&CommunityAccountHandler{}).CreateQuestion)
	request := httptest.NewRequest("POST", "/questions", bytes.NewBufferString(`{"title":"A valid question title"}`))
	request.Header.Set("Content-Type", "application/json")
	response, err := app.Test(request)
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != fiber.StatusBadRequest {
		t.Fatalf("status = %d", response.StatusCode)
	}
}

func TestParseCommunityIDRejectsInvalidUUID(t *testing.T) {
	if _, err := parseCommunityID("not-a-uuid"); err == nil {
		t.Fatal("expected invalid UUID error")
	}
}
