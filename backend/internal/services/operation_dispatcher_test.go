package services

import (
	"context"
	"strings"
	"testing"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func TestOperationDispatcherRejectsUnknownJobKind(t *testing.T) {
	err := (&OperationDispatcher{}).Dispatch(context.Background(), models.OperationOutbox{Kind: "unknown"})
	if err == nil || !strings.Contains(err.Error(), "unsupported outbox job kind") {
		t.Fatalf("expected unsupported kind error, got %v", err)
	}
}

func TestOperationDispatcherRequiresMediaRetentionForPurge(t *testing.T) {
	err := (&OperationDispatcher{}).Dispatch(context.Background(), models.OperationOutbox{Kind: "media.purge_due"})
	if err == nil || !strings.Contains(err.Error(), "media retention service") {
		t.Fatalf("expected missing retention dependency error, got %v", err)
	}
}
