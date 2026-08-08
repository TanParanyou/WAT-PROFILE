package donations

import (
	"fmt"
	"net/mail"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"
)

var amountPattern = regexp.MustCompile(`^[0-9]+(?:\.[0-9]{1,2})?$`)
var phonePattern = regexp.MustCompile(`^[+0-9() -]{1,32}$`)

type StaffInput struct {
	Amount           string
	Currency         string
	DonationDate     string
	DonationMethod   string
	DonorEmail       string
	DonorPhone       string
	ReceiptRequested bool
}

type PublicInput struct {
	Amount              string
	Currency            string
	DonationDate        string
	DonationMethod      string
	DonorName           string
	DonorEmail          string
	DonorPhone          string
	Locale              string
	HasProof            bool
	ReceiptRequested    bool
	PrivacyAcknowledged bool
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
	if err := ValidatePhone(input.DonorPhone); err != nil {
		return err
	}
	return nil
}

// ValidatePhone accepts common international and local phone formatting while
// rejecting control characters, letters, and values that are too short/long.
// The field is optional for both public and staff-entered donations.
func ValidatePhone(phone string) error {
	phone = strings.TrimSpace(phone)
	if phone == "" {
		return nil
	}
	if strings.IndexFunc(phone, unicode.IsControl) >= 0 || !phonePattern.MatchString(phone) {
		return fmt.Errorf("donor phone is invalid")
	}
	digits := 0
	for _, r := range phone {
		if unicode.IsDigit(r) {
			digits++
		}
	}
	if digits < 7 || digits > 15 {
		return fmt.Errorf("donor phone is invalid")
	}
	return nil
}

func ValidatePublicInput(input PublicInput) error {
	if err := ValidateStaffInput(StaffInput{Amount: input.Amount, Currency: input.Currency, DonationDate: input.DonationDate, DonationMethod: input.DonationMethod, DonorEmail: input.DonorEmail, DonorPhone: input.DonorPhone, ReceiptRequested: input.ReceiptRequested}); err != nil {
		return err
	}
	method := strings.ToLower(strings.TrimSpace(input.DonationMethod))
	if method != "bank_transfer" && method != "paypal" {
		return fmt.Errorf("public donation method is unsupported")
	}
	if strings.TrimSpace(input.DonorName) == "" {
		return fmt.Errorf("donor name is required")
	}
	if strings.TrimSpace(input.DonorEmail) == "" {
		return fmt.Errorf("donor email is required")
	}
	if input.Locale != "th" && input.Locale != "en" && input.Locale != "de" {
		return fmt.Errorf("locale is unsupported")
	}
	if !input.HasProof {
		return fmt.Errorf("donation proof is required")
	}
	if !input.PrivacyAcknowledged {
		return fmt.Errorf("privacy acknowledgement is required")
	}
	return nil
}

func ValidateDonationCancellationReason(reason string) error {
	if strings.TrimSpace(reason) == "" {
		return fmt.Errorf("cancellation reason is required")
	}
	return nil
}
