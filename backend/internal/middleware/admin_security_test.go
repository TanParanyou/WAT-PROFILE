package middleware

import (
	"io"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestAdminOriginGuardRejectsDisallowedOrigin(t *testing.T) {
	app := fiber.New()
	app.Post("/", AdminOriginGuard([]string{"https://admin.example"}), func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	req := httptest.NewRequest("POST", "/", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "https://evil.example")
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if res.StatusCode != fiber.StatusForbidden {
		t.Fatalf("status = %d, want %d", res.StatusCode, fiber.StatusForbidden)
	}
}

func TestAdminOriginGuardAllowsConfiguredOrigin(t *testing.T) {
	app := fiber.New()
	app.Post("/", AdminOriginGuard([]string{"https://admin.example"}), func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	req := httptest.NewRequest("POST", "/", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "https://admin.example")
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("status = %d, want %d", res.StatusCode, fiber.StatusOK)
	}
}

func TestAdminOriginGuardAllowsSameOrigin(t *testing.T) {
	app := fiber.New()
	app.Post("/", AdminOriginGuard([]string{"https://admin.example"}), func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	req := httptest.NewRequest("POST", "/", strings.NewReader(`{}`))
	req.Host = "localhost:8082"
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "http://localhost:8082")
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("status = %d, want %d", res.StatusCode, fiber.StatusOK)
	}
}

func TestAdminOriginGuardAllowsMissingOrigin(t *testing.T) {
	app := fiber.New()
	app.Post("/", AdminOriginGuard([]string{"https://admin.example"}), func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	req := httptest.NewRequest("POST", "/", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("status = %d, want %d", res.StatusCode, fiber.StatusOK)
	}
}

func TestParseAdminAllowedOriginsRejectsWildcard(t *testing.T) {
	_, err := ParseAdminAllowedOrigins("https://*.example.com,http://localhost:3000")
	if err == nil {
		t.Fatal("expected error for wildcard origin with credentials")
	}
}

func TestParseAdminAllowedOriginsParsesList(t *testing.T) {
	origins, err := ParseAdminAllowedOrigins("https://admin.example, http://localhost:3000")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(origins) != 2 {
		t.Fatalf("len = %d, want 2", len(origins))
	}
	if origins[0] != "https://admin.example" {
		t.Fatalf("origins[0] = %q", origins[0])
	}
	if origins[1] != "http://localhost:3000" {
		t.Fatalf("origins[1] = %q", origins[1])
	}
}

func TestParseAdminAllowedOriginsEmpty(t *testing.T) {
	origins, err := ParseAdminAllowedOrigins("")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(origins) != 0 {
		t.Fatalf("len = %d, want 0", len(origins))
	}
}

var _ = io.Discard
