package services

import (
	"testing"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/config"
)

func TestCommunityRetentionUsesConfiguredWindows(t *testing.T) {
	now := time.Date(2026, 8, 16, 12, 0, 0, 0, time.UTC)
	service := NewCommunityRetentionService(nil, config.CommunityConfig{NotificationRetention: 180 * 24 * time.Hour, ModerationAuditRetention: 730 * 24 * time.Hour}, func() time.Time { return now })
	if got := service.cfg.NotificationRetention; got != 180*24*time.Hour {
		t.Fatalf("notification retention = %s", got)
	}
	if got := service.cfg.ModerationAuditRetention; got != 730*24*time.Hour {
		t.Fatalf("audit retention = %s", got)
	}
}
