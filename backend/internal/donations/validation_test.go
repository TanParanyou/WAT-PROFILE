package donations

import "testing"

func TestValidateStaffInput(t *testing.T) {
	valid := StaffInput{Amount: "1.00", Currency: "EUR", DonationDate: "2026-08-07", DonationMethod: "cash"}
	if err := ValidateStaffInput(valid); err != nil {
		t.Fatalf("expected valid cash donation, got %v", err)
	}

	for name, input := range map[string]StaffInput{
		"currency":      {Amount: "1.00", Currency: "THB", DonationDate: "2026-08-07", DonationMethod: "cash"},
		"precision":     {Amount: "1.999", Currency: "EUR", DonationDate: "2026-08-07", DonationMethod: "cash"},
		"date":          {Amount: "1.00", Currency: "EUR", DonationDate: "not-a-date", DonationMethod: "cash"},
		"receipt email": {Amount: "1.00", Currency: "EUR", DonationDate: "2026-08-07", DonationMethod: "cash", ReceiptRequested: true},
	} {
		t.Run(name, func(t *testing.T) {
			if err := ValidateStaffInput(input); err == nil {
				t.Fatal("expected validation error")
			}
		})
	}
}

func TestValidatePublicInput(t *testing.T) {
	valid := PublicInput{Amount: "1.00", Currency: "EUR", DonationDate: "2026-08-07", DonationMethod: "bank_transfer", DonorName: "Donor", DonorEmail: "donor@example.com", Locale: "th", HasProof: true, PrivacyAcknowledged: true}
	if err := ValidatePublicInput(valid); err != nil {
		t.Fatalf("expected valid public input, got %v", err)
	}
	if err := ValidatePublicInput(PublicInput{Amount: "1.00", Currency: "EUR", DonationDate: "2026-08-07", DonationMethod: "cash", DonorName: "Donor", DonorEmail: "donor@example.com", Locale: "th", HasProof: true, PrivacyAcknowledged: true}); err == nil {
		t.Fatal("expected cash rejection")
	}
}
