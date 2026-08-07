package donations

import (
	"fmt"
	"net/mail"
	"regexp"
	"strconv"
	"strings"
	"time"
)

var amountPattern = regexp.MustCompile(`^[0-9]+(?:\.[0-9]{1,2})?$`)

type StaffInput struct {
	Amount           string
	Currency         string
	DonationDate     string
	DonationMethod   string
	DonorEmail       string
	ReceiptRequested bool
}

type PublicInput struct {
	Amount           string
	Currency         string
	DonationDate     string
	DonationMethod   string
	DonorName        string
	DonorEmail       string
	Locale           string
	HasProof         bool
	ReceiptRequested bool
}

func ValidateStaffInput(input StaffInput) error {
	amountText := strings.TrimSpace(input.Amount)
	amount, amountErr := strconv.ParseFloat(amountText, 64)
	if !amountPattern.MatchString(amountText) || amountErr != nil || amount <= 0 {
		return fmt.Errorf("amount must be positive with at most two decimal places")
	}
	if strings.ToUpper(strings.TrimSpace(input.Currency)) != "EUR" {
		return fmt.Errorf("currency must be EUR")
	}
	if _, err := time.Parse("2006-01-02", strings.TrimSpace(input.DonationDate)); err != nil {
		return fmt.Errorf("donation date is invalid")
	}
	method := strings.ToLower(strings.TrimSpace(input.DonationMethod))
	if method != "cash" && method != "bank_transfer" && method != "paypal" {
		return fmt.Errorf("donation method is unsupported")
	}
	email := strings.TrimSpace(input.DonorEmail)
	if email != "" {
		if _, err := mail.ParseAddress(email); err != nil {
			return fmt.Errorf("donor email is invalid")
		}
	}
	if input.ReceiptRequested && email == "" {
		return fmt.Errorf("donor email is required for a receipt")
	}
	return nil
}

func ValidatePublicInput(input PublicInput) error {
	if err := ValidateStaffInput(StaffInput{Amount: input.Amount, Currency: input.Currency, DonationDate: input.DonationDate, DonationMethod: input.DonationMethod, DonorEmail: input.DonorEmail, ReceiptRequested: input.ReceiptRequested}); err != nil {
		return err
	}
	method := strings.ToLower(strings.TrimSpace(input.DonationMethod))
	if method != "bank_transfer" && method != "paypal" {
		return fmt.Errorf("public donation method is unsupported")
	}
	if strings.TrimSpace(input.DonorName) == "" {
		return fmt.Errorf("donor name is required")
	}
	if input.Locale != "th" && input.Locale != "en" && input.Locale != "de" {
		return fmt.Errorf("locale is unsupported")
	}
	if !input.HasProof {
		return fmt.Errorf("donation proof is required")
	}
	return nil
}

func ValidateDonationCancellationReason(reason string) error {
	if strings.TrimSpace(reason) == "" {
		return fmt.Errorf("cancellation reason is required")
	}
	return nil
}
