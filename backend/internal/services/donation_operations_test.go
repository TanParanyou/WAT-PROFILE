package services

import (
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func TestDonationSelfReportedRequiresProof(t *testing.T) {
	svc := NewDonationService(nil)
	_, err := svc.CreateSelfReported(SelfReportedDonationInput{Donation: models.Donation{DonationMethod: "bank_transfer"}})
	if err == nil || !strings.Contains(err.Error(), "proof") {
		t.Fatalf("expected proof validation, got %v", err)
	}
}

func TestDonationReceiptContractUsesCurrentFields(t *testing.T) {
	typeOfDonation := reflect.TypeOf(models.Donation{})
	for _, field := range []string{"ReceiptRequested", "ReceiptDispatchedAt", "CancellationReason", "CancelledAt"} {
		if _, ok := typeOfDonation.FieldByName(field); !ok {
			t.Fatalf("donation contract is missing %s", field)
		}
	}
	for _, field := range []string{"TaxReceiptRequired", "TaxReceiptSent", "TaxReceiptSentAt"} {
		if _, ok := typeOfDonation.FieldByName(field); ok {
			t.Fatalf("legacy tax receipt field %s must not be exposed by the model", field)
		}
	}
}

func TestDonationReceiptIsDeterministicAndHasChecksum(t *testing.T) {
	donationTime := models.TimeOfDay("09:15")
	donation := &models.Donation{ReceiptNumber: "DON-2026-001", DonorName: "Test Donor", Amount: 25.5, Currency: "EUR", DonationDate: time.Date(2026, 8, 7, 0, 0, 0, 0, time.UTC), DonationTime: &donationTime}
	svc := NewDonationDocumentService()
	first, checksum, err := svc.RenderReceipt(donation)
	if err != nil {
		t.Fatal(err)
	}
	second, checksum2, err := svc.RenderReceipt(donation)
	if err != nil {
		t.Fatal(err)
	}
	if string(first) != string(second) || checksum != checksum2 {
		t.Fatal("receipt rendering must be deterministic")
	}
	for _, value := range []string{"DON-2026-001", "Test Donor", "25.50 EUR", "Time: 09:15"} {
		if !strings.Contains(string(first), value) {
			t.Fatalf("receipt missing %q", value)
		}
	}
}
