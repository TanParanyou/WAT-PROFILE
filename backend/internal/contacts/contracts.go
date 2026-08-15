// Package contacts contains the public Contact submission boundary. It keeps
// request-only fields and validation separate from the persisted model.
package contacts

import (
	"strings"
	"unicode/utf8"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
)

const (
	MaxNameRunes    = 120
	MaxEmailRunes   = 254
	MaxSubjectRunes = 200
	MaxMessageRunes = 5000
)

type SubmitRequest struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Subject string `json:"subject"`
	Message string `json:"message"`
	Locale  string `json:"locale"`
	Website string `json:"website"`
}

type Submission struct {
	Name    string
	Email   string
	Subject string
	Message string
	Locale  string
}

type ValidationError struct {
	Fields map[string]string
}

func (e *ValidationError) Error() string {
	return "contact submission is invalid"
}

func NormalizeAndValidate(request SubmitRequest) (Submission, *ValidationError) {
	submission := Submission{
		Name:    strings.TrimSpace(request.Name),
		Email:   accountauth.NormalizeEmail(request.Email),
		Subject: strings.TrimSpace(request.Subject),
		Message: strings.TrimSpace(request.Message),
		Locale:  strings.ToLower(strings.TrimSpace(request.Locale)),
	}

	fields := make(map[string]string)
	if submission.Name == "" {
		fields["name"] = "name is required"
	} else if runeCount(submission.Name) > MaxNameRunes {
		fields["name"] = "name must be 120 characters or fewer"
	}
	if submission.Email == "" {
		fields["email"] = "email is required"
	} else if runeCount(submission.Email) > MaxEmailRunes || !accountauth.ValidEmail(submission.Email) {
		fields["email"] = "email must be valid"
	}
	if submission.Subject == "" {
		fields["subject"] = "subject is required"
	} else if runeCount(submission.Subject) > MaxSubjectRunes {
		fields["subject"] = "subject must be 200 characters or fewer"
	}
	if submission.Message == "" {
		fields["message"] = "message is required"
	} else if runeCount(submission.Message) > MaxMessageRunes {
		fields["message"] = "message must be 5000 characters or fewer"
	}
	if submission.Locale != "th" && submission.Locale != "en" && submission.Locale != "de" {
		fields["locale"] = "locale must be th, en, or de"
	}

	if len(fields) > 0 {
		return Submission{}, &ValidationError{Fields: fields}
	}
	return submission, nil
}

func runeCount(value string) int {
	return utf8.RuneCountInString(value)
}
