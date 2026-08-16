package services

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/community"
	"gorm.io/gorm"
)

type RateLimitRequest struct {
	SubjectType string
	Subject     string
	Surface     string
	Limit       int
	Window      time.Duration
}

type CommunityRateLimitService struct {
	db  *gorm.DB
	now func() time.Time
}

func NewCommunityRateLimitService(db *gorm.DB) *CommunityRateLimitService {
	return &CommunityRateLimitService{db: db, now: time.Now}
}

func (s *CommunityRateLimitService) Consume(ctx context.Context, input RateLimitRequest) error {
	if s == nil || s.db == nil {
		return fmt.Errorf("community rate-limit database is not configured")
	}
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return s.ConsumeTx(ctx, tx, input)
	})
}

func (s *CommunityRateLimitService) ConsumeTx(ctx context.Context, tx *gorm.DB, input RateLimitRequest) error {
	if input.Limit <= 0 || input.Window <= 0 {
		return fmt.Errorf("invalid community rate-limit request")
	}
	subjectType := strings.ToLower(strings.TrimSpace(input.SubjectType))
	surface := strings.ToLower(strings.TrimSpace(input.Surface))
	if subjectType == "" || surface == "" || strings.TrimSpace(input.Subject) == "" {
		return fmt.Errorf("community rate-limit subject and surface are required")
	}
	now := s.now().UTC()
	windowStartedAt := now.Truncate(input.Window)
	expiresAt := windowStartedAt.Add(input.Window)
	var count int
	result := tx.WithContext(ctx).Raw(`
		INSERT INTO community_rate_limit_buckets
		  (subject_hash, subject_type, surface, window_started_at, count, expires_at)
		VALUES (?, ?, ?, ?, 1, ?)
		ON CONFLICT (subject_hash, subject_type, surface, window_started_at)
		DO UPDATE SET count = community_rate_limit_buckets.count + 1,
		              expires_at = EXCLUDED.expires_at
		RETURNING count
	`, hashRateLimitSubject(subjectType, input.Subject), subjectType, surface, windowStartedAt, expiresAt).Scan(&count)
	if result.Error != nil {
		return result.Error
	}
	if count <= input.Limit {
		return nil
	}
	return community.NewDomainError(community.CodeRateLimited, "Too many Community requests").WithRetryAfter(expiresAt.Sub(now).Round(time.Second))
}

func hashRateLimitSubject(subjectType, subject string) string {
	normalized := strings.ToLower(strings.TrimSpace(subjectType)) + ":" + strings.ToLower(strings.TrimSpace(subject))
	digest := sha256.Sum256([]byte(normalized))
	return hex.EncodeToString(digest[:])
}
