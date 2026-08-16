package community

import (
	"fmt"
	"time"
)

type ErrorCode string

const (
	CodeAccountNotEligible  ErrorCode = "COMMUNITY_ACCOUNT_NOT_ELIGIBLE"
	CodeReviewRequired      ErrorCode = "COMMUNITY_REVIEW_REQUIRED"
	CodeContentPending      ErrorCode = "COMMUNITY_CONTENT_PENDING"
	CodeContentNotFound     ErrorCode = "COMMUNITY_CONTENT_NOT_FOUND"
	CodeQuestionLocked      ErrorCode = "COMMUNITY_QUESTION_LOCKED"
	CodeEditConflict        ErrorCode = "COMMUNITY_EDIT_CONFLICT"
	CodeAlreadyReported     ErrorCode = "COMMUNITY_ALREADY_REPORTED"
	CodeSelfVoteForbidden   ErrorCode = "COMMUNITY_SELF_VOTE_FORBIDDEN"
	CodeRateLimited         ErrorCode = "COMMUNITY_RATE_LIMITED"
	CodeIdempotencyConflict ErrorCode = "COMMUNITY_IDEMPOTENCY_CONFLICT"
	CodeValidation          ErrorCode = "COMMUNITY_VALIDATION"
	CodeForbidden           ErrorCode = "COMMUNITY_FORBIDDEN"
	CodeConflict            ErrorCode = "COMMUNITY_CONFLICT"
)

type DomainError struct {
	Code           ErrorCode
	Message        string
	Field          string
	Fields         map[string]string
	RetryAfter     time.Duration
	CurrentVersion int
}

func (e *DomainError) Error() string {
	if e == nil {
		return "<nil>"
	}
	if e.Message != "" {
		return e.Message
	}
	return string(e.Code)
}

func (e *DomainError) Unwrap() error { return nil }

func NewDomainError(code ErrorCode, message string) *DomainError {
	return &DomainError{Code: code, Message: message}
}

func (e *DomainError) WithField(field string) *DomainError {
	if e == nil {
		return e
	}
	if e.Fields == nil {
		e.Fields = make(map[string]string)
	}
	e.Fields[field] = e.Message
	e.Field = field
	return e
}

func (e *DomainError) WithVersion(version int) *DomainError {
	if e != nil {
		e.CurrentVersion = version
	}
	return e
}

func (e *DomainError) WithRetryAfter(after time.Duration) *DomainError {
	if e != nil {
		e.RetryAfter = after
	}
	return e
}

func (e *DomainError) String() string {
	if e == nil {
		return ""
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Error())
}
