package handlers

import (
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestParsePublicEventRange(t *testing.T) {
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error {
		from, to, err := parsePublicEventRange(c)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		if from == nil || to == nil {
			return c.SendStatus(fiber.StatusNoContent)
		}
		return c.SendString(from.Format("2006-01-02") + "/" + to.Format("2006-01-02"))
	})

	tests := []struct {
		name       string
		path       string
		wantStatus int
		wantBody   string
	}{
		{
			name:       "accepts inclusive paired range",
			path:       "/?from=2026-08-01&to=2026-08-31",
			wantStatus: fiber.StatusOK,
			wantBody:   "2026-08-01/2026-08-31",
		},
		{
			name:       "requires both range boundaries",
			path:       "/?from=2026-08-01",
			wantStatus: fiber.StatusBadRequest,
		},
		{
			name:       "rejects reversed range",
			path:       "/?from=2026-08-31&to=2026-08-01",
			wantStatus: fiber.StatusBadRequest,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			response, err := app.Test(httptest.NewRequest("GET", tc.path, nil))
			if err != nil {
				t.Fatalf("request failed: %v", err)
			}
			if response.StatusCode != tc.wantStatus {
				t.Fatalf("status = %d, want %d", response.StatusCode, tc.wantStatus)
			}
			if tc.wantBody != "" {
				defer response.Body.Close()
				body, err := io.ReadAll(response.Body)
				if err != nil {
					t.Fatalf("failed to read response body: %v", err)
				}
				if string(body) != tc.wantBody {
					t.Fatalf("body = %q, want %q", body, tc.wantBody)
				}
			}
		})
	}
}
