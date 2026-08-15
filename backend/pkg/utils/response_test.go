package utils

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestFieldErrorResponseIncludesFieldsAndTraceID(t *testing.T) {
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error {
		c.Locals("trace_id", "trace-test")
		return FieldErrorResponse(c, fiber.StatusBadRequest, "Invalid donation", map[string]string{"donor_email": "Invalid email"})
	})

	response, err := app.Test(httptest.NewRequest(http.MethodGet, "/", nil))
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	var body struct {
		Success bool              `json:"success"`
		Error   string            `json:"error"`
		Fields  map[string]string `json:"fields"`
		TraceID string            `json:"trace_id"`
	}
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body.Success || body.Error != "Invalid donation" || body.TraceID != "trace-test" || body.Fields["donor_email"] != "Invalid email" {
		t.Fatalf("unexpected response: %+v", body)
	}
}

func TestCodedFieldErrorResponseIncludesCodeFieldsAndTraceID(t *testing.T) {
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error {
		c.Locals("trace_id", "trace-coded")
		return CodedFieldErrorResponse(c, fiber.StatusUnprocessableEntity, "VALIDATION_ERROR", "Invalid registration", map[string]string{"participants.0.first_name": "Required"})
	})

	response, err := app.Test(httptest.NewRequest(http.MethodGet, "/", nil))
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	var body struct {
		Success bool              `json:"success"`
		Error   string            `json:"error"`
		Code    string            `json:"code"`
		Fields  map[string]string `json:"fields"`
		TraceID string            `json:"trace_id"`
	}
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != fiber.StatusUnprocessableEntity || body.Success || body.Error != "Invalid registration" || body.Code != "VALIDATION_ERROR" || body.TraceID != "trace-coded" || body.Fields["participants.0.first_name"] != "Required" {
		t.Fatalf("unexpected response: status=%d body=%+v", response.StatusCode, body)
	}
}

func TestMessageResponseWithStatusUsesMessageEnvelope(t *testing.T) {
	app := fiber.New()
	app.Post("/", func(c *fiber.Ctx) error {
		return MessageResponseWithStatus(c, fiber.StatusCreated, "Message received.")
	})

	response, err := app.Test(httptest.NewRequest(http.MethodPost, "/", nil))
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	var body struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
	}
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != fiber.StatusCreated || !body.Success || body.Message != "Message received." {
		t.Fatalf("unexpected response: status=%d body=%+v", response.StatusCode, body)
	}
}
