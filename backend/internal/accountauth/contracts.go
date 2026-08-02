// Package accountauth contains the domain contracts, error codes, clock, and
// token abstractions shared by the public account auth services. It must not
// import HTTP or GORM packages so services stay deterministic and testable.
package accountauth

import (
	"context"
	"errors"
	"net/mail"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Code is a stable machine-readable error code returned to clients. The
// frontend maps these codes to complete th/en/de messages.
type Code string

const (
	CodeInvalidCredentials       Code = "AUTH_INVALID_CREDENTIALS"
	CodeVerificationRequired     Code = "AUTH_EMAIL_VERIFICATION_REQUIRED"
	CodeTokenInvalid             Code = "AUTH_TOKEN_INVALID_OR_EXPIRED"
	CodeRateLimited              Code = "AUTH_RATE_LIMITED"
	CodeAccountDisabled          Code = "AUTH_ACCOUNT_DISABLED"
	CodeReauthRequired           Code = "AUTH_REAUTH_REQUIRED"
	CodeEmailAlreadyRegistered   Code = "AUTH_EMAIL_ALREADY_REGISTERED"
	CodeValidation               Code = "AUTH_VALIDATION"
	CodeInternal                 Code = "AUTH_INTERNAL"
	CodeUnknown                  Code = "AUTH_UNKNOWN"
)

// Error is a typed domain error carrying a stable code and an optional field
// map for form-level validation errors. Error() text is a safe English
// fallback and never exposes secrets or account existence details.
type Error struct {
	Code    Code
	Message string
	Field   string // optional field name for form-level errors
	RetryAfter time.Duration // optional rate-limit retry hint
}

func (e *Error) Error() string {
	if e.Field != "" {
		return e.Message + " (" + e.Field + ")"
	}
	return e.Message
}

func (e *Error) Unwrap() error { return nil }

// NewError builds a typed domain error with a stable code and message.
func NewError(code Code, message string) *Error {
	return &Error{Code: code, Message: message}
}

// NewFieldError builds a typed domain error scoped to one form field.
func NewFieldError(code Code, field, message string) *Error {
	return &Error{Code: code, Message: message, Field: field}
}

// Sentinel errors for internal comparison without leaking typed details.
var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrRateLimited        = errors.New("rate limited")
	ErrTokenInvalid       = errors.New("token invalid or expired")
	ErrAccountDisabled    = errors.New("account disabled")
	ErrEmailVerificationRequired = errors.New("email verification required")
	ErrReauthRequired     = errors.New("reauthentication required")
)

// Clock is an injectable time source so services are deterministic in tests.
type Clock interface {
	Now() time.Time
}

// SystemClock returns the real wall-clock time.
type SystemClock struct{}

func (SystemClock) Now() time.Time { return time.Now() }

// TokenGenerator produces opaque single-use tokens and their at-rest hashes.
type TokenGenerator func() (plain string, hash string, err error)

// EmailMessage is a fully rendered, localized transactional message. It never
// carries credentials or raw action tokens beyond the action URL itself.
type EmailMessage struct {
	To      string
	Locale  string
	Subject string
	Body    string // plain-text body
	HTML    string
	ActionURL string
}

// EmailSender delivers a localized transactional message.
type EmailSender interface {
	Send(ctx context.Context, message EmailMessage) error
}

// GoogleIdentity is the minimal verified identity extracted from a validated
// Google ID token. It deliberately excludes Google access/refresh tokens.
type GoogleIdentity struct {
	Subject      string
	Email        string
	EmailVerified bool
	DisplayName  string
	AvatarURL    string
	Locale       string
}

// GoogleVerifier validates Google authorization responses. Implementations are
// backed by golang.org/x/oauth2 and google.golang.org/api/idtoken.
type GoogleVerifier interface {
	// AuthorizationURL builds the Google authorization URL with PKCE and the
	// given state/nonce.
	AuthorizationURL(state, nonce, challenge string) string
	// VerifyCallback exchanges the code with PKCE and validates the ID token.
	VerifyCallback(ctx context.Context, code, verifier, nonce string) (GoogleIdentity, error)
}

// SecurityRecorder records allow-listed security events. Persistence failure
// must not fail the user operation.
type SecurityRecorder interface {
	Record(ctx context.Context, event SecurityEvent)
}

// SecurityEvent is an allow-listed, pre-sanitized event.
type SecurityEvent struct {
	UserID   string
	EventType string
	Outcome  string // success | failure
	Provider string
	TraceID  string
	IPPrefix string
	Metadata map[string]string
}

// NormalizeEmail lowercases and trims an email address for comparison.
func NormalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

// ValidEmail reports whether a normalized email parses as a valid address.
func ValidEmail(email string) bool {
	if email == "" || len(email) > 255 {
		return false
	}
	addr, err := mail.ParseAddress(email)
	if err != nil {
		return false
	}
	return addr.Address == email
}

// SafeLocale returns the locale only when it is one of the supported values.
func SafeLocale(locale string) string {
	switch locale {
	case "th", "en", "de":
		return locale
	default:
		return "en"
	}
}

// IsSafeRedirectHost reports whether host matches one of the allow-listed
// frontend hosts. Only exact host matches are accepted.
func IsSafeRedirectHost(host string, allowedHosts []string) bool {
	for _, allowed := range allowedHosts {
		if host == allowed {
			return true
		}
	}
	return false
}

// ErrorCode extracts the stable machine-readable code from an error. Unknown
// or non-account errors map to CodeUnknown so handlers always return a stable
// envelope code.
func ErrorCode(err error) Code {
	if err == nil {
		return CodeUnknown
	}
	var accountErr *Error
	if errors.As(err, &accountErr) {
		return accountErr.Code
	}
	return CodeUnknown
}

// ClientInfo is coarse client context captured from the HTTP request. It is
// used for session metadata and security events; the full IP is never stored.
type ClientInfo struct {
	IP        string
	UserAgent string
}

// LoginPasswordInput carries the credentials and client context for a password
// sign-in attempt.
type LoginPasswordInput struct {
	Email    string
	Password string
	Client   ClientInfo
}

// SessionResult is the result of creating or rotating a session. Token hashes
// are never included; only the one-time raw values are returned.
type SessionResult struct {
	AccessToken  string
	RefreshToken string
	ExpiresIn    time.Duration
}

// SessionSummary is the public, redacted view of one session for the session
// list. The token hash is never serialized.
type SessionSummary struct {
	ID               uuid.UUID `json:"id"`
	Current          bool      `json:"current"`
	UserAgentSummary string    `json:"user_agent_summary,omitempty"`
	IPPrefix         string    `json:"ip_prefix,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	LastUsedAt       time.Time `json:"last_used_at"`
	ExpiresAt        time.Time `json:"expires_at"`
	TokenHash        string    `json:"-"` // Never serialize the refresh-token hash
}
