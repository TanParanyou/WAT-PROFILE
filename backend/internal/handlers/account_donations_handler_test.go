package handlers

import (
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestGetAccountDonationReceiptRequiresAuth(t *testing.T) {
	app := fiber.New()
	handler := &DonationHandler{}
	app.Get("/account/donations/:id/receipt", handler.GetAccountDonationReceipt)

	req := httptest.NewRequest("GET", "/account/donations/4/receipt", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized, got %d", resp.StatusCode)
	}
}

func TestGetMyDonationsRequiresAuth(t *testing.T) {
	app := fiber.New()
	handler := &DonationHandler{}
	app.Get("/account/donations", handler.GetMyDonations)

	req := httptest.NewRequest("GET", "/account/donations", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized, got %d", resp.StatusCode)
	}
}
