package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func TestGlobalCORSAllowsProfilePatchPreflight(t *testing.T) {
	const frontendOrigin = "http://localhost:3002"

	app := fiber.New()
	app.Use(cors.New(globalCORSConfig(frontendOrigin)))
	app.Patch("/api/v1/account/profile", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusNoContent)
	})

	req := httptest.NewRequest(http.MethodOptions, "/api/v1/account/profile", nil)
	req.Header.Set("Origin", frontendOrigin)
	req.Header.Set("Access-Control-Request-Method", http.MethodPatch)
	req.Header.Set("Access-Control-Request-Headers", "authorization,content-type")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("preflight request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != fiber.StatusNoContent {
		t.Fatalf("preflight status = %d, want %d", resp.StatusCode, fiber.StatusNoContent)
	}
	if got := resp.Header.Get("Access-Control-Allow-Origin"); got != frontendOrigin {
		t.Fatalf("Access-Control-Allow-Origin = %q, want %q", got, frontendOrigin)
	}

	methods := strings.Split(resp.Header.Get("Access-Control-Allow-Methods"), ",")
	for _, method := range methods {
		if strings.TrimSpace(method) == http.MethodPatch {
			return
		}
	}
	t.Fatalf("Access-Control-Allow-Methods = %q, want PATCH", resp.Header.Get("Access-Control-Allow-Methods"))
}
