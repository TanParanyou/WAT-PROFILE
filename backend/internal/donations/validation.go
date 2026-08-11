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
var donationTimePattern = regexp.MustCompile(`^(?:[01][0-9]|2[0-3]):[0-5][0-9]$`)

type StaffInput struct {
	Amount           string
	Currency         string
	DonationDate     string
	DonationTime     string
	DonationMethod   string
	DonorEmail       string
	DonorPhone       string
	ReceiptRequested bool
}

type PublicInput struct {
	Amount              string
	Currency            string
	DonationDate        string
	DonationTime        string
	DonationMethod      string
	DonorName           string
	DonorEmail          string
	DonorPhone          string
	Locale              string
	HasProof            bool
	ReceiptRequested    bool
	PrivacyAcknowledged bool
}

// ValidationError identifies the input field that failed domain validation.
// Handlers can expose this in a structured response without coupling clients
// to the validation implementation.
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string { return e.Message }

func validationError(field, message string) error {
	return &ValidationError{Field: field, Message: message}
}

func ValidateStaffInput(input StaffInput) error {
	amountText := strings.TrimSpace(input.Amount)
	amount, amountErr := strconv.ParseFloat(amountText, 64)
	if !amountPattern.MatchString(amountText) || amountErr != nil || amount <= 0 {
		return validationError("amount", "amount must be positive with at most two decimal places")
	}
	if strings.ToUpper(strings.TrimSpace(input.Currency)) != "EUR" {
		return validationError("currency", "currency must be EUR")
	}
	if _, err := time.Parse("2006-01-02", strings.TrimSpace(input.DonationDate)); err != nil {
		return validationError("donation_date", "donation date is invalid")
	}
	if !donationTimePattern.MatchString(strings.TrimSpace(input.DonationTime)) {
		return validationError("donation_time", "donation time must use HH:mm")
	}
	method := strings.ToLower(strings.TrimSpace(input.DonationMethod))
	if method != "cash" && method != "bank_transfer" && method != "paypal" {
		return validationError("donation_method", "donation method is unsupported")
	}
	email := strings.TrimSpace(input.DonorEmail)
	if email != "" {
		if _, err := mail.ParseAddress(email); err != nil {
			return validationError("donor_email", "donor email is invalid")
		}
	}
	if input.ReceiptRequested && email == "" {
		return validationError("donor_email", "donor email is required for a receipt")
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
		return validationError("donor_phone", "donor phone is invalid")
	}
	digits := 0
	for _, r := range phone {
		if unicode.IsDigit(r) {
			digits++
		}
	}
	if digits < 7 || digits > 15 {
		return validationError("donor_phone", "donor phone is invalid")
	}
	return nil
}

func ValidatePublicInput(input PublicInput) error {
	if err := ValidateStaffInput(StaffInput{Amount: input.Amount, Currency: input.Currency, DonationDate: input.DonationDate, DonationTime: input.DonationTime, DonationMethod: input.DonationMethod, DonorEmail: input.DonorEmail, DonorPhone: input.DonorPhone, ReceiptRequested: input.ReceiptRequested}); err != nil {
		return err
	}
	method := strings.ToLower(strings.TrimSpace(input.DonationMethod))
	if method != "bank_transfer" && method != "paypal" {
		return validationError("donation_method", "public donation method is unsupported")
	}
	if strings.TrimSpace(input.DonorName) == "" {
		return validationError("donor_name", "donor name is required")
	}
	if strings.TrimSpace(input.DonorEmail) == "" {
		return validationError("donor_email", "donor email is required")
	}
	if input.Locale != "th" && input.Locale != "en" && input.Locale != "de" {
		return validationError("locale", "locale is unsupported")
	}
	if !input.HasProof {
		return validationError("proof", "donation proof is required")
	}
	if !input.PrivacyAcknowledged {
		return validationError("privacy_acknowledged", "privacy acknowledgement is required")
	}
	return nil
}

func ValidateDonationCancellationReason(reason string) error {
	if strings.TrimSpace(reason) == "" {
		return fmt.Errorf("cancellation reason is required")
	}
	return nil
}
