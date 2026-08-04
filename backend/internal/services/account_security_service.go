package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/logger"
)

// securityEventAllowedKeys is the allow-list of metadata keys that may be
// stored on a security event. Everything else in a request body is dropped so
// credentials, raw tokens, and arbitrary fields are never persisted.
var securityEventAllowedKeys = map[string]struct{}{
	"provider":   {},
	"reason":     {},
	"event_type": {},
	"method":     {},
}

// BuildSecurityEvent assembles a pre-sanitized security event from coarse
// client context and a metadata map. Only allow-listed metadata keys survive;
// the IP is reduced to a coarse prefix and never stored in full.
func BuildSecurityEvent(info accountauth.ClientInfo, meta map[string]any) accountauth.SecurityEvent {
	metadata := make(map[string]string, len(meta))
	for key, value := range meta {
		if _, ok := securityEventAllowedKeys[key]; !ok {
			continue
		}
		if str, ok := value.(string); ok {
			metadata[key] = str
		}
	}
	event := accountauth.SecurityEvent{
		IPPrefix: accountauth.CoarseIPPrefix(info.IP),
		TraceID:  info.TraceID,
		Metadata: metadata,
	}
	if provider, ok := metadata["provider"]; ok {
		event.Provider = provider
	}
	if eventType, ok := metadata["event_type"]; ok {
		event.EventType = eventType
	}
	return event
}

// AccountSecurityService records allow-listed security events to the audit
// table. Persistence failures never fail the caller operation.
type AccountSecurityService struct {
	db    *gorm.DB
	clock accountauth.Clock
}

// NewAccountSecurityService builds the security event recorder.
func NewAccountSecurityService(db *gorm.DB, clock accountauth.Clock) *AccountSecurityService {
	return &AccountSecurityService{db: db, clock: clock}
}

// Record persists a security event. Errors are logged with the trace ID and
// event type but never returned, so auth operations cannot fail because of
// audit persistence.
func (s *AccountSecurityService) Record(ctx context.Context, event accountauth.SecurityEvent) {
	row := models.AuthSecurityEvent{
		EventType:      event.EventType,
		Outcome:        event.Outcome,
		Provider:       event.Provider,
		RequestTraceID: event.TraceID,
		IPPrefix:       event.IPPrefix,
		Metadata:       toJSONMap(event.Metadata),
	}
	if event.UserID != "" {
		if id, err := uuid.Parse(event.UserID); err == nil {
			row.UserID = &id
		}
	}

	if err := s.db.WithContext(ctx).Create(&row).Error; err != nil {
		logger.Log.Error().
			Err(err).
			Str("event_type", event.EventType).
			Str("trace_id", event.TraceID).
			Msg("failed to persist account security event")
	}
}

// TraceError is a structured, secret-free error that carries the trace ID and
// event type so operators can correlate audit failures.
type TraceError struct {
	TraceID   string
	EventType string
	Err       error
}

func (e *TraceError) Error() string {
	return fmt.Sprintf("security event %q for trace %q could not be persisted", e.EventType, e.TraceID)
}

func (e *TraceError) Unwrap() error { return e.Err }

// toJSONMap converts string metadata to the model's JSON map type.
func toJSONMap(meta map[string]string) models.JSONMap {
	out := make(models.JSONMap, len(meta))
	for k, v := range meta {
		out[k] = v
	}
	return out
}
