package config

import "testing"

func TestCommunityWriteRequiresReadAndAccountAuth(t *testing.T) {
	t.Setenv("PUBLIC_COMMUNITY_READ_ENABLED", "false")
	t.Setenv("PUBLIC_COMMUNITY_WRITE_ENABLED", "true")
	if _, err := LoadCommunityConfig(AccountAuthConfig{Enabled: true}); err == nil {
		t.Fatal("expected invalid flag combination")
	}

	t.Setenv("PUBLIC_COMMUNITY_READ_ENABLED", "true")
	if _, err := LoadCommunityConfig(AccountAuthConfig{Enabled: false}); err == nil {
		t.Fatal("expected account-auth dependency error")
	}
}

func TestCommunityDefaultsMatchProductLimits(t *testing.T) {
	for _, key := range []string{
		"PUBLIC_COMMUNITY_READ_ENABLED",
		"PUBLIC_COMMUNITY_WRITE_ENABLED",
		"COMMUNITY_EMAIL_ENABLED",
		"COMMUNITY_QUESTION_LIMIT",
		"COMMUNITY_QUESTION_DAILY_LIMIT",
		"COMMUNITY_ANSWER_LIMIT",
		"COMMUNITY_COMMENT_LIMIT",
		"COMMUNITY_VOTE_LIMIT",
		"COMMUNITY_REPORT_LIMIT",
		"COMMUNITY_SEARCH_LIMIT",
	} {
		t.Setenv(key, "")
	}
	cfg, err := LoadCommunityConfig(AccountAuthConfig{})
	if err != nil {
		t.Fatal(err)
	}
	if cfg.ReadEnabled || cfg.WriteEnabled || cfg.EmailEnabled {
		t.Fatal("community flags must default to disabled")
	}
	if cfg.QuestionLimit.Limit != 5 || cfg.QuestionDailyLimit.Limit != 20 || cfg.SearchLimit.Limit != 60 {
		t.Fatalf("unexpected defaults: %#v", cfg)
	}
}
