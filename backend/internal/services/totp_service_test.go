package services

import (
	"testing"
	"time"
)

func TestTOTPGenerationAndValidation(t *testing.T) {
	totp := NewTOTPService(nil)

	secret, err := totp.GenerateSecret()
	if err != nil {
		t.Fatalf("failed to generate secret: %v", err)
	}
	if len(secret) == 0 {
		t.Fatal("secret is empty")
	}

	uri := totp.GenerateOTPAuthURI(secret, "admin@example.com")
	if uri == "" {
		t.Fatal("uri is empty")
	}

	code, err := ComputeCode(secret, time.Now())
	if err != nil {
		t.Fatalf("failed to compute code: %v", err)
	}
	if len(code) != 6 {
		t.Fatalf("expected 6-digit code, got %q", code)
	}

	if !totp.ValidateCode(secret, code) {
		t.Fatalf("expected code %s to be valid", code)
	}

	// Invalid code
	if totp.ValidateCode(secret, "000000") && code != "000000" {
		t.Fatal("expected invalid code to fail")
	}

	if totp.ValidateCode(secret, "123") {
		t.Fatal("expected short code to fail")
	}
}
