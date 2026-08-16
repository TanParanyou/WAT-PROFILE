package services

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestNotificationCursorRoundTrip(t *testing.T) {
	want := notificationCursor{CreatedAt: time.Date(2026, 8, 16, 12, 0, 0, 0, time.UTC), ID: uuid.New()}
	got, err := decodeNotificationCursor(encodeNotificationCursor(want))
	if err != nil {
		t.Fatalf("decodeNotificationCursor: %v", err)
	}
	if !got.CreatedAt.Equal(want.CreatedAt) || got.ID != want.ID {
		t.Fatalf("cursor = %#v, want %#v", got, want)
	}
}

func TestNotificationCursorRejectsMalformedInput(t *testing.T) {
	if _, err := decodeNotificationCursor("not-a-cursor"); err == nil {
		t.Fatal("expected malformed cursor error")
	}
}

func TestNotificationPreferenceDefaultsAreComplete(t *testing.T) {
	preferences := notificationPreferenceDefaults()
	for _, key := range []string{"answer_created", "comment_created", "accepted_answer", "helpful_vote", "official_answer", "first_contribution", "revision_decision", "moderation_decision"} {
		if enabled, ok := preferences[key]; !ok || !enabled {
			t.Fatalf("default preference %q = %v, %v", key, enabled, ok)
		}
	}
}
