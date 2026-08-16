package handlers

import (
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestParseCommunityQuestionList(t *testing.T) {
	app := fiber.New()
	app.Get("/questions", func(c *fiber.Ctx) error {
		input, err := parseCommunityQuestionList(c)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).SendString(err.Error())
		}
		return c.SendString(input.Locale + ":" + input.Lifecycle)
	})
	resp, err := app.Test(httptest.NewRequest("GET", "/questions?locale=de&lifecycle=resolved", nil))
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("status = %d", resp.StatusCode)
	}
}
