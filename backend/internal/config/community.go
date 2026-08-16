package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// CommunityConfig contains server-only rollout, abuse-control, and retention
// settings. Public read and member write are deliberately independent flags.
type CommunityConfig struct {
	ReadEnabled  bool
	WriteEnabled bool
	EmailEnabled bool

	QuestionLimit      RateLimit
	QuestionDailyLimit RateLimit
	AnswerLimit        RateLimit
	CommentLimit       RateLimit
	VoteLimit          RateLimit
	ReportLimit        RateLimit
	SearchLimit        RateLimit

	AuthorLinkRetention      time.Duration
	SoftDeleteRetention      time.Duration
	NotificationRetention    time.Duration
	ModerationAuditRetention time.Duration
}

func LoadCommunityConfig(accountCfg AccountAuthConfig) (CommunityConfig, error) {
	cfg := CommunityConfig{
		ReadEnabled:              os.Getenv("PUBLIC_COMMUNITY_READ_ENABLED") == "true",
		WriteEnabled:             os.Getenv("PUBLIC_COMMUNITY_WRITE_ENABLED") == "true",
		EmailEnabled:             os.Getenv("COMMUNITY_EMAIL_ENABLED") == "true",
		QuestionLimit:            RateLimit{Limit: 5, Window: time.Hour},
		QuestionDailyLimit:       RateLimit{Limit: 20, Window: 24 * time.Hour},
		AnswerLimit:              RateLimit{Limit: 20, Window: time.Hour},
		CommentLimit:             RateLimit{Limit: 30, Window: time.Hour},
		VoteLimit:                RateLimit{Limit: 120, Window: time.Hour},
		ReportLimit:              RateLimit{Limit: 10, Window: time.Hour},
		SearchLimit:              RateLimit{Limit: 60, Window: time.Minute},
		AuthorLinkRetention:      90 * 24 * time.Hour,
		SoftDeleteRetention:      90 * 24 * time.Hour,
		NotificationRetention:    180 * 24 * time.Hour,
		ModerationAuditRetention: 730 * 24 * time.Hour,
	}

	if cfg.WriteEnabled && !cfg.ReadEnabled {
		return cfg, fmt.Errorf("PUBLIC_COMMUNITY_WRITE_ENABLED requires PUBLIC_COMMUNITY_READ_ENABLED=true")
	}
	if cfg.WriteEnabled && !accountCfg.Enabled {
		return cfg, fmt.Errorf("PUBLIC_COMMUNITY_WRITE_ENABLED requires PUBLIC_ACCOUNT_AUTH_ENABLED=true")
	}
	if cfg.EmailEnabled && !cfg.WriteEnabled {
		return cfg, fmt.Errorf("COMMUNITY_EMAIL_ENABLED requires PUBLIC_COMMUNITY_WRITE_ENABLED=true")
	}
	if cfg.EmailEnabled && (accountCfg.EmailMode != "resend" || accountCfg.ResendAPIKey == "" || accountCfg.EmailFrom == "") {
		return cfg, fmt.Errorf("COMMUNITY_EMAIL_ENABLED requires the configured Resend account sender")
	}

	limits := []struct {
		name string
		to   *RateLimit
	}{
		{"COMMUNITY_QUESTION_LIMIT", &cfg.QuestionLimit},
		{"COMMUNITY_QUESTION_DAILY_LIMIT", &cfg.QuestionDailyLimit},
		{"COMMUNITY_ANSWER_LIMIT", &cfg.AnswerLimit},
		{"COMMUNITY_COMMENT_LIMIT", &cfg.CommentLimit},
		{"COMMUNITY_VOTE_LIMIT", &cfg.VoteLimit},
		{"COMMUNITY_REPORT_LIMIT", &cfg.ReportLimit},
		{"COMMUNITY_SEARCH_LIMIT", &cfg.SearchLimit},
	}
	for _, item := range limits {
		if err := applyCommunityLimit(item.to, item.name); err != nil {
			return cfg, err
		}
	}
	return cfg, nil
}

func applyCommunityLimit(limit *RateLimit, envVar string) error {
	raw := os.Getenv(envVar)
	if raw == "" {
		return nil
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n <= 0 {
		return fmt.Errorf("invalid %s %q: want a positive integer", envVar, raw)
	}
	limit.Limit = n
	return nil
}
