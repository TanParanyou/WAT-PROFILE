package accountauth

import (
	"strings"
	"testing"
)

func TestValidatePasswordPolicy(t *testing.T) {
	tests := []struct {
		name    string
		value   string
		wantErr bool
	}{
		{name: "empty", value: "", wantErr: true},
		{name: "eleven characters", value: "Aa1!" + strings.Repeat("b", 7), wantErr: true},
		{name: "twelve with three groups", value: "abcdefghij1!", wantErr: false},
		{name: "twelve with lowercase uppercase number", value: "Abcdefghij1x", wantErr: false},
		{name: "twelve with lowercase uppercase special", value: "Abcdefghijk!", wantErr: false},
		{name: "twelve with lowercase number special", value: "abcdefghij1!", wantErr: false},
		{name: "thirteen with only two groups", value: "abcdefghijkl!", wantErr: true},
		{name: "128 characters", value: strings.Repeat("a", 126) + "1!", wantErr: false},
		{name: "129 characters", value: strings.Repeat("a", 127) + "1!", wantErr: true},
		{name: "spaces are allowed", value: "Abcdefghij 1!", wantErr: false},
		{name: "spaces do not count as special", value: "Abcdefghijk ", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePasswordPolicy(tt.value)
			if (err != nil) != tt.wantErr {
				t.Fatalf("ValidatePasswordPolicy() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestInspectPasswordCountsUnicodeCharacters(t *testing.T) {
	password := strings.Repeat("ก", 9) + "A1!"
	result := InspectPassword(password)

	if result.Length != 12 {
		t.Fatalf("Length = %d, want 12 Unicode characters", result.Length)
	}
	if !result.Valid {
		t.Fatal("expected a 12-character Unicode password with three groups to be valid")
	}
}

func TestValidatePasswordPolicyReturnsPasswordFieldError(t *testing.T) {
	err := ValidatePasswordPolicy("abcdefghijkl!")
	validationErr, ok := err.(*Error)
	if !ok {
		t.Fatalf("error type = %T, want *Error", err)
	}
	if validationErr.Code != CodeValidation || validationErr.Field != "password" {
		t.Fatalf("error = %#v, want password validation field error", validationErr)
	}
}
