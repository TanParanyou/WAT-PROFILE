package donations

import (
	"errors"
	"testing"
)

func TestValidateStaffInput(t *testing.T) {
	valid := StaffInput{Amount: "1.00", Currency: "EUR", DonationDate: "2026-08-07", DonationTime: "09:15", DonationMethod: "cash"}
	if err := ValidateStaffInput(valid); err != nil {
		t.Fatalf("expected valid cash donation, got %v", err)
	}

	for name, input := range map[string]StaffInput{
		"currency":      {Amount: "1.00", Currency: "THB", DonationDate: "2026-08-07", DonationTime: "09:15", DonationMethod: "cash"},
		"precision":     {Amount: "1.999", Currency: "EUR", DonationDate: "2026-08-07", DonationTime: "09:15", DonationMethod: "cash"},
		"date":          {Amount: "1.00", Currency: "EUR", DonationDate: "not-a-date", DonationTime: "09:15", DonationMethod: "cash"},
		"time required": {Amount: "1.00", Currency: "EUR", DonationDate: "2026-08-07", DonationMethod: "cash"},
		"time format":   {Amount: "1.00", Currency: "EUR", DonationDate: "2026-08-07", DonationTime: "9:15", DonationMethod: "cash"},
		"time hour":     {Amount: "1.00", Currency: "EUR", DonationDate: "2026-08-07", DonationTime: "24:00", DonationMethod: "cash"},
		"time minute":   {Amount: "1.00", Currency: "EUR", DonationDate: "2026-08-07", DonationTime: "09:60", DonationMethod: "cash"},
		"receipt email": {Amount: "1.00", Currency: "EUR", DonationDate: "2026-08-07", DonationTime: "09:15", DonationMethod: "cash", ReceiptRequested: true},
	} {
		t.Run(name, func(t *testing.T) {
			if err := ValidateStaffInput(input); err == nil {
				t.Fatal("expected validation error")
			}
		})
	}
}

func TestValidatePublicInput(t *testing.T) {
	valid := PublicInput{Amount: "1.00", Currency: "EUR", DonationDate: "2026-08-07", DonationTime: "09:15", DonationMethod: "bank_transfer", DonorName: "Donor", DonorEmail: "donor@example.com", Locale: "th", HasProof: true, PrivacyAcknowledged: true}
	if err := ValidatePublicInput(valid); err != nil {
		t.Fatalf("expected valid public input, got %v", err)
	}
	if err := ValidatePublicInput(PublicInput{Amount: "1.00", Currency: "EUR", DonationDate: "2026-08-07", DonationTime: "09:15", DonationMethod: "cash", DonorName: "Donor", DonorEmail: "donor@example.com", Locale: "th", HasProof: true, PrivacyAcknowledged: true}); err == nil {
		t.Fatal("expected cash rejection")
	}
}

func TestValidatePublicInputReturnsFieldError(t *testing.T) {
	err := ValidatePublicInput(PublicInput{Amount: "0", Currency: "EUR"})
	var validationErr *ValidationError
	if !errors.As(err, &validationErr) || validationErr.Field != "amount" {
		t.Fatalf("expected amount field error, got %v", err)
	}
}

func TestValidateDonationTimeReturnsFieldError(t *testing.T) {
	err := ValidateStaffInput(StaffInput{Amount: "1.00", Currency: "EUR", DonationDate: "2026-08-07", DonationTime: "9:15", DonationMethod: "cash"})
	var validationErr *ValidationError
	if !errors.As(err, &validationErr) || validationErr.Field != "donation_time" {
		t.Fatalf("expected donation_time field error, got %v", err)
	}
}

func TestValidatePhone(t *testing.T) {
	for _, phone := range []string{"", "+49 171 2345678", "081-234-5678", "+66 (81) 234 5678"} {
		if err := ValidatePhone(phone); err != nil {
			t.Errorf("expected phone %q to be valid, got %v", phone, err)
		}
	}
	for _, phone := range []string{"abc1234567", "123", "123456789012345678901", "081\n2345678"} {
		if err := ValidatePhone(phone); err == nil {
			t.Errorf("expected phone %q to be rejected", phone)
		}
	}
}
