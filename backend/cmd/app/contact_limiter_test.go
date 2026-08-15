package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/requestid"
)

func TestContactRateLimitResponse(t *testing.T) {
	app := fiber.New()
	app.Use(requestid.New(requestid.Config{Header: "X-Trace-Id", ContextKey: "trace_id"}))
	app.Use("/api/v1/public/contact", contactLimiter())
	app.Post("/api/v1/public/contact", func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusCreated) })

	for i := 0; i < 5; i++ {
		response, err := app.Test(httptest.NewRequest(http.MethodPost, "/api/v1/public/contact", nil))
		if err != nil {
			t.Fatal(err)
		}
		if response.StatusCode != fiber.StatusCreated {
			t.Fatalf("request %d = %d", i, response.StatusCode)
		}
	}

	response, err := app.Test(httptest.NewRequest(http.MethodPost, "/api/v1/public/contact", nil))
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != fiber.StatusTooManyRequests || response.Header.Get("Retry-After") != "60" {
		t.Fatalf("unexpected limiter response: status=%d retry-after=%q", response.StatusCode, response.Header.Get("Retry-After"))
	}
	var body struct {
		Code    string `json:"code"`
		TraceID string `json:"trace_id"`
	}
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body.Code != "CONTACT_RATE_LIMITED" || body.TraceID == "" {
		t.Fatalf("unexpected body: %+v", body)
	}
}
