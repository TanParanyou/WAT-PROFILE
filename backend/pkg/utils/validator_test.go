package utils

import (
	"testing"
)

func TestValidateEmail(t *testing.T) {
	tests := []struct {
		email string
		valid bool
	}{
		{"test@example.com", true},
		{"invalid-email", false},
		{"@example.com", false},
		{"test@", false},
		{"test@.com", false},
		{"test@example.", false},
	}

	for _, tt := range tests {
		if val := ValidateEmail(tt.email); val != tt.valid {
			t.Errorf("ValidateEmail(%q) = %v; want %v", tt.email, val, tt.valid)
		}
	}
}

func TestValidateRequired(t *testing.T) {
	fields := map[string]string{
		"username": "admin",
		"password": "",
		"email":    "   ",
	}

	missing := ValidateRequired(fields)
	if len(missing) != 2 {
		t.Fatalf("Expected 2 missing fields, got %d", len(missing))
	}

	hasPassword := false
	hasEmail := false
	for _, m := range missing {
		if m == "password" {
			hasPassword = true
		}
		if m == "email" {
			hasEmail = true
		}
	}

	if !hasPassword || !hasEmail {
		t.Errorf("Expected password and email to be missing. Got missing: %v", missing)
	}
}

func TestValidateMinLength(t *testing.T) {
	err := ValidateMinLength("abc", 5, "field")
	if err == nil {
		t.Errorf("Expected error for string too short")
	}

	err = ValidateMinLength("abcde", 5, "field")
	if err != nil {
		t.Errorf("Expected no error for exact minimum length, got: %v", err)
	}
}

func TestClampPagination(t *testing.T) {
	tests := []struct {
		page      int
		limit     int
		wantPage  int
		wantLimit int
	}{
		{0, 0, 1, 20},
		{5, 10, 5, 10},
		{-1, 150, 1, 100},
	}

	for _, tt := range tests {
		gotPage, gotLimit := ClampPagination(tt.page, tt.limit)
		if gotPage != tt.wantPage || gotLimit != tt.wantLimit {
			t.Errorf("ClampPagination(%d, %d) = (%d, %d); want (%d, %d)",
				tt.page, tt.limit, gotPage, gotLimit, tt.wantPage, tt.wantLimit)
		}
	}
}
