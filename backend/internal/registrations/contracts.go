package registrations

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

const (
	MaxParticipantsPerRegistration = 10
	MaxNameLength                  = 100
	MaxEmailLength                 = 255
	MaxPhoneLength                 = 20
	MaxFreeTextLength              = 2000
	MaxPrivacyNoticeVersionLength  = 50
)

type Code string

const (
	CodeDisabled           Code = "REGISTRATION_DISABLED"
	CodeClosed             Code = "REGISTRATION_CLOSED"
	CodeFull               Code = "EVENT_FULL"
	CodeDuplicate          Code = "ALREADY_REGISTERED"
	CodeGroupLimitExceeded Code = "GROUP_LIMIT_EXCEEDED"
	CodeValidation         Code = "VALIDATION_ERROR"
	CodeTokenInvalid       Code = "MANAGE_TOKEN_INVALID"
	CodeTokenExpired       Code = "MANAGE_TOKEN_EXPIRED"
	CodeNotEditable        Code = "REGISTRATION_NOT_EDITABLE"
	CodeNotFound           Code = "REGISTRATION_NOT_FOUND"
	CodeUnauthorized       Code = "REGISTRATION_UNAUTHORIZED"
	CodeConflict           Code = "REGISTRATION_CONFLICT"
)

type DomainError struct {
	Code    Code
	Message string
	Fields  map[string]string
	Cause   error
}

func (e *DomainError) Error() string {
	if e == nil {
		return ""
	}
	return e.Message
}

func (e *DomainError) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.Cause
}

func NewDomainError(code Code, message string, fields map[string]string) *DomainError {
	return &DomainError{Code: code, Message: message, Fields: fields}
}

type Identity struct {
	UserID   *uuid.UUID
	MemberID *int
}

func (i Identity) RegistrationType() string {
	if i.UserID == nil {
		return "guest"
	}
	if i.MemberID != nil {
		return "member"
	}
	return "account"
}

type ContactInput struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
}

type ParticipantInput struct {
	ID                  *int64 `json:"id,omitempty"`
	FirstName           string `json:"first_name"`
	LastName            string `json:"last_name"`
	DietaryRestrictions string `json:"dietary_restrictions"`
	SpecialNeeds        string `json:"special_needs"`
	AdditionalNotes     string `json:"additional_notes"`
}

type CreateRequest struct {
	Locale               string             `json:"locale"`
	Contact              ContactInput       `json:"contact"`
	Participants         []ParticipantInput `json:"participants"`
	PrivacyNoticeVersion string             `json:"privacy_notice_version"`
	PrivacyConsent       bool               `json:"privacy_consent"`
}

type UpdateRequest struct {
	Locale       string             `json:"locale"`
	Contact      ContactInput       `json:"contact"`
	Participants []ParticipantInput `json:"participants"`
}

type CreateInput struct {
	Locale               string
	Contact              ContactInput
	Participants         []ParticipantInput
	PrivacyNoticeVersion string
}

type UpdateInput struct {
	Locale       string
	Contact      ContactInput
	Participants []ParticipantInput
}

type AvailabilityState string

const (
	AvailabilityDisabled  AvailabilityState = "disabled"
	AvailabilityClosed    AvailabilityState = "closed"
	AvailabilityStarted   AvailabilityState = "started"
	AvailabilityFull      AvailabilityState = "full"
	AvailabilityAvailable AvailabilityState = "available"
)

type EventWindow struct {
	Enabled         bool
	Deadline        *time.Time
	StartsAt        time.Time
	MaxParticipants *int
}

type Availability struct {
	Enabled              bool              `json:"enabled"`
	Deadline             *time.Time        `json:"deadline"`
	MaxParticipants      *int              `json:"max_participants"`
	ReservedParticipants int               `json:"reserved_participants"`
	RemainingCapacity    *int              `json:"remaining_capacity"`
	State                AvailabilityState `json:"availability"`
	CanRegister          bool              `json:"can_register"`
	UnavailableCode      *Code             `json:"unavailable_code"`
}

type EventSummary struct {
	ID        int                  `json:"id"`
	Slug      string               `json:"slug"`
	Title     models.MultiLangText `json:"title"`
	StartDate time.Time            `json:"start_date"`
	EndDate   time.Time            `json:"end_date"`
	StartTime *time.Time           `json:"start_time,omitempty"`
	EndTime   *time.Time           `json:"end_time,omitempty"`
}

type Participant struct {
	ID                  int64      `json:"id"`
	FirstName           string     `json:"first_name"`
	LastName            string     `json:"last_name"`
	DietaryRestrictions string     `json:"dietary_restrictions"`
	SpecialNeeds        string     `json:"special_needs"`
	AdditionalNotes     string     `json:"additional_notes"`
	AttendanceStatus    string     `json:"attendance_status"`
	AttendedAt          *time.Time `json:"attended_at,omitempty"`
	CancelledAt         *time.Time `json:"cancelled_at,omitempty"`
}

type Detail struct {
	ID                 int           `json:"id"`
	RegistrationType   string        `json:"registration_type"`
	RegistrationStatus string        `json:"registration_status"`
	ConfirmationCode   string        `json:"confirmation_code"`
	Contact            ContactInput  `json:"contact"`
	Participants       []Participant `json:"participants"`
	ParticipantCount   int           `json:"participant_count"`
	Event              EventSummary  `json:"event"`
	CreatedAt          time.Time     `json:"created_at"`
	UpdatedAt          time.Time     `json:"updated_at"`
	ConfirmedAt        *time.Time    `json:"confirmed_at,omitempty"`
	CancelledAt        *time.Time    `json:"cancelled_at,omitempty"`
}

type ListItem struct {
	ID                 int           `json:"id"`
	RegistrationType   string        `json:"registration_type"`
	RegistrationStatus string        `json:"registration_status"`
	ConfirmationCode   string        `json:"confirmation_code"`
	Contact            ContactInput  `json:"contact"`
	Participants       []Participant `json:"participants"`
	ParticipantCount   int           `json:"participant_count"`
	Event              EventSummary  `json:"event"`
	CreatedAt          time.Time     `json:"created_at"`
}

type AdminListFilter struct {
	Page              int
	Limit             int
	Search            string
	Statuses          []string
	EventIDs          []int
	RegistrationTypes []string
}

type AdminPage struct {
	Items []ListItem
	Total int64
	Page  int
	Limit int
}

type AdminDetail struct {
	Detail
	UserID               *uuid.UUID `json:"user_id,omitempty"`
	MemberID             *int       `json:"member_id,omitempty"`
	PrivacyNoticeVersion string     `json:"privacy_notice_version,omitempty"`
	PrivacyConsentAt     *time.Time `json:"privacy_consent_at,omitempty"`
	CancellationReason   string     `json:"cancellation_reason,omitempty"`
	CancellationOrigin   string     `json:"cancellation_origin,omitempty"`
}

type AdminUpdateInput struct {
	UpdateInput
	CancellationReason string
}

type StatusInput struct {
	Status string `json:"status"`
	Reason string `json:"reason"`
}

type AttendanceInput struct {
	Attended bool `json:"attended"`
}

var ErrNotFound = errors.New("registration not found")
