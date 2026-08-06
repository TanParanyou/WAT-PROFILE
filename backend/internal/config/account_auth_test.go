package config

import (
	"strings"
	"testing"
	"time"
)

// TestLoadAccountAuthConfigRejectsCaptureInProduction ensures the capture email
// adapter can never be enabled against a production environment.
func TestLoadAccountAuthConfigRejectsCaptureInProduction(t *testing.T) {
	t.Setenv("ENV", "production")
	t.Setenv("PUBLIC_ACCOUNT_AUTH_ENABLED", "true")
	t.Setenv("PUBLIC_ACCOUNT_FRONTEND_URL", "https://watloungporsai.de")
	t.Setenv("GOOGLE_CLIENT_ID", "test-client-id")
	t.Setenv("GOOGLE_CLIENT_SECRET", "test-secret")
	t.Setenv("GOOGLE_REDIRECT_URL", "https://api.watloungporsai.de/api/v1/accounts/google/callback")
	t.Setenv("GOOGLE_FLOW_SECRET", "test-secret")
	t.Setenv("AUTH_EMAIL_DELIVERY_MODE", "capture")
	_, err := LoadAccountAuthConfig()
	if err == nil || !strings.Contains(err.Error(), "resend") {
		t.Fatalf("expected production capture mode rejection, got %v", err)
	}
}

// TestLoadAccountAuthConfigDisabledAllowsIncompleteEnv ensures the feature can
// be disabled without requiring any account-auth configuration values.
func TestLoadAccountAuthConfigDisabledAllowsIncompleteEnv(t *testing.T) {
	t.Setenv("PUBLIC_ACCOUNT_AUTH_ENABLED", "false")
	t.Setenv("ENV", "development")
	cfg, err := LoadAccountAuthConfig()
	if err != nil {
		t.Fatalf("disabled config must load without required values: %v", err)
	}
	if cfg.Enabled {
		t.Fatal("expected feature to be disabled")
	}
}

// TestLoadAccountAuthConfigDefaults verifies the documented default TTL and
// limiter windows are applied when env vars are absent.
func TestLoadAccountAuthConfigDefaults(t *testing.T) {
	t.Setenv("ENV", "development")
	t.Setenv("PUBLIC_ACCOUNT_AUTH_ENABLED", "true")
	t.Setenv("PUBLIC_ACCOUNT_FRONTEND_URL", "http://localhost:3000")
	t.Setenv("GOOGLE_CLIENT_ID", "test-client-id")
	t.Setenv("GOOGLE_CLIENT_SECRET", "test-secret")
	t.Setenv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/v1/accounts/google/callback")
	t.Setenv("GOOGLE_FLOW_SECRET", "test-secret")
	t.Setenv("AUTH_EMAIL_DELIVERY_MODE", "capture")
	t.Setenv("ALLOWED_ORIGINS", "http://localhost:3000")
	t.Setenv("PUBLIC_ACCOUNT_ALLOWED_ORIGINS", "http://localhost:3000")
	cfg, err := LoadAccountAuthConfig()
	if err != nil {
		t.Fatalf("expected dev config to load with capture mode: %v", err)
	}
	if cfg.AccessTTL != 15*time.Minute {
		t.Fatalf("expected default access TTL of 15 minutes, got %s", cfg.AccessTTL)
	}
	if cfg.RefreshTTL != 30*24*time.Hour {
		t.Fatalf("expected default refresh TTL of 30 days, got %s", cfg.RefreshTTL)
	}
	if cfg.EmailMode != "capture" {
		t.Fatalf("expected capture email mode in dev, got %q", cfg.EmailMode)
	}
	if cfg.CookieSecure {
		t.Fatal("expected non-secure cookies in development")
	}
	if cfg.RegisterLimit.Limit != 5 || cfg.LoginLimit.Limit != 10 || cfg.ResendLimit.Limit != 3 ||
		cfg.ForgotLimit.Limit != 5 || cfg.RefreshLimit.Limit != 60 || cfg.GoogleLimit.Limit != 20 || cfg.AvatarLimit.Limit != 12 {
		t.Fatalf("unexpected default limiter windows: %+v", cfg)
	}
}

// TestLoadAccountAuthConfigRejectsHttpProductionURLs ensures HTTPS is required
// for frontend and callback URLs in production.
func TestLoadAccountAuthConfigRejectsHttpProductionURLs(t *testing.T) {
	t.Setenv("ENV", "production")
	t.Setenv("PUBLIC_ACCOUNT_AUTH_ENABLED", "true")
	t.Setenv("PUBLIC_ACCOUNT_FRONTEND_URL", "http://watloungporsai.de")
	t.Setenv("GOOGLE_CLIENT_ID", "test-client-id")
	t.Setenv("GOOGLE_CLIENT_SECRET", "test-secret")
	t.Setenv("GOOGLE_REDIRECT_URL", "https://api.watloungporsai.de/api/v1/accounts/google/callback")
	t.Setenv("GOOGLE_FLOW_SECRET", "test-secret")
	t.Setenv("AUTH_EMAIL_DELIVERY_MODE", "resend")
	t.Setenv("RESEND_API_KEY", "re_test")
	t.Setenv("ACCOUNT_EMAIL_FROM", "no-reply@watloungporsai.de")
	_, err := LoadAccountAuthConfig()
	if err == nil || !strings.Contains(err.Error(), "https") {
		t.Fatalf("expected HTTPS requirement in production, got %v", err)
	}
}
