package accountauth

import (
	"unicode"
	"unicode/utf8"
)

const (
	MinPasswordLength = 12
	MaxPasswordLength = 128
)

// PasswordPolicyResult describes the password requirements without exposing
// the password value or any derived secret.
type PasswordPolicyResult struct {
	Length          int
	HasMinLength    bool
	HasMaxLength    bool
	HasLowercase    bool
	HasUppercase    bool
	HasNumber       bool
	HasSpecial      bool
	CharacterGroups int
	Valid           bool
}

// InspectPassword evaluates the public account password policy using Unicode
// characters. Whitespace is allowed but does not count as a special character.
func InspectPassword(password string) PasswordPolicyResult {
	result := PasswordPolicyResult{
		Length:       utf8.RuneCountInString(password),
		HasLowercase: false,
		HasUppercase: false,
		HasNumber:    false,
		HasSpecial:   false,
	}
	result.HasMinLength = result.Length >= MinPasswordLength
	result.HasMaxLength = result.Length <= MaxPasswordLength

	for _, character := range password {
		switch {
		case unicode.IsLower(character):
			result.HasLowercase = true
		case unicode.IsUpper(character):
			result.HasUppercase = true
		case unicode.IsNumber(character):
			result.HasNumber = true
		case !unicode.IsLetter(character) && !unicode.IsNumber(character) && !unicode.IsSpace(character):
			result.HasSpecial = true
		}
	}

	if result.HasLowercase {
		result.CharacterGroups++
	}
	if result.HasUppercase {
		result.CharacterGroups++
	}
	if result.HasNumber {
		result.CharacterGroups++
	}
	if result.HasSpecial {
		result.CharacterGroups++
	}
	result.Valid = result.HasMinLength && result.HasMaxLength && result.CharacterGroups >= 3
	return result
}

// ValidatePasswordPolicy returns the stable field error used by registration
// and password reset when a new password does not meet the policy.
func ValidatePasswordPolicy(password string) error {
	if InspectPassword(password).Valid {
		return nil
	}
	return NewFieldError(
		CodeValidation,
		"password",
		"Password must be 12–128 characters and meet at least 3 of 4 character requirements.",
	)
}
