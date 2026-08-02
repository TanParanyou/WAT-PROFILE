package config

import (
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

// RateLimit describes a per-window request allowance for one account-auth
// surface. Defaults are conservative production values.
type RateLimit struct {
	Limit  int
	Window time.Duration
}

// AccountAuthConfig is the validated server-only configuration for the public
// account auth module. When Enabled is false the module mounts no routes and
// no secrets are required.
type AccountAuthConfig struct {
	Enabled           bool
	Environment       string
	FrontendURL       string
	GoogleClientID    string
	GoogleSecret      string
	GoogleRedirectURL string
	GoogleFlowSecret  string
	AccessTTL         time.Duration
	RefreshTTL        time.Duration
	EmailMode         string
	CookieSecure      bool
	ResendAPIKey      string
	EmailFrom         string

	RegisterLimit RateLimit
	LoginLimit    RateLimit
	ResendLimit   RateLimit
	ForgotLimit   RateLimit
	RefreshLimit  RateLimit
	GoogleLimit   RateLimit
}

const (
	defaultAccessTTL = 15 * time.Minute
	defaultRefreshTTL = 30 * 24 * time.Hour
)

// LoadAccountAuthConfig reads and validates the public account auth module
// configuration from the environment. When the module is disabled it returns a
// zero-value config with no validation failures, so deployments that have not
// adopted the module keep working.
func LoadAccountAuthConfig() (AccountAuthConfig, error) {
	cfg := AccountAuthConfig{
		Enabled:     os.Getenv("PUBLIC_ACCOUNT_AUTH_ENABLED") == "true",
		Environment: os.Getenv("ENV"),
		FrontendURL: strings.TrimRight(os.Getenv("PUBLIC_ACCOUNT_FRONTEND_URL"), "/"),
		EmailMode:   os.Getenv("AUTH_EMAIL_DELIVERY_MODE"),
		AccessTTL:   defaultAccessTTL,
		RefreshTTL:  defaultRefreshTTL,
		RegisterLimit: RateLimit{5, 15 * time.Minute},
		LoginLimit:    RateLimit{10, 15 * time.Minute},
		ResendLimit:   RateLimit{3, time.Hour},
		ForgotLimit:   RateLimit{5, time.Hour},
		RefreshLimit:  RateLimit{60, time.Minute},
		GoogleLimit:   RateLimit{20, 15 * time.Minute},
	}
	if cfg.AccessTTL == 0 {
		cfg.AccessTTL = defaultAccessTTL
	}
	if cfg.RefreshTTL == 0 {
		cfg.RefreshTTL = defaultRefreshTTL
	}

	if !cfg.Enabled {
		return cfg, nil
	}

	env := os.Getenv("ENV")

	if cfg.FrontendURL == "" {
		return cfg, fmt.Errorf("PUBLIC_ACCOUNT_FRONTEND_URL is required when PUBLIC_ACCOUNT_AUTH_ENABLED=true")
	}

	if cfg.EmailMode == "" {
		cfg.EmailMode = "capture"
	}
	if env == "production" && cfg.EmailMode == "capture" {
		return cfg, fmt.Errorf("AUTH_EMAIL_DELIVERY_MODE=capture is not allowed when ENV=production")
	}
	if cfg.EmailMode == "resend" {
		cfg.ResendAPIKey = os.Getenv("RESEND_API_KEY")
		cfg.EmailFrom = os.Getenv("ACCOUNT_EMAIL_FROM")
		if cfg.ResendAPIKey == "" || cfg.EmailFrom == "" {
			return cfg, fmt.Errorf("RESEND_API_KEY and ACCOUNT_EMAIL_FROM are required when AUTH_EMAIL_DELIVERY_MODE=resend")
		}
	} else if cfg.EmailMode != "capture" {
		return cfg, fmt.Errorf("unsupported AUTH_EMAIL_DELIVERY_MODE %q (want resend or capture)", cfg.EmailMode)
	}

	cfg.GoogleClientID = os.Getenv("GOOGLE_CLIENT_ID")
	cfg.GoogleSecret = os.Getenv("GOOGLE_CLIENT_SECRET")
	cfg.GoogleRedirectURL = os.Getenv("GOOGLE_REDIRECT_URL")
	if cfg.GoogleClientID == "" || cfg.GoogleSecret == "" || cfg.GoogleRedirectURL == "" {
		return cfg, fmt.Errorf("GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URL are required when PUBLIC_ACCOUNT_AUTH_ENABLED=true")
	}
	cfg.GoogleFlowSecret = os.Getenv("GOOGLE_FLOW_SECRET")
	if cfg.GoogleFlowSecret == "" {
		return cfg, fmt.Errorf("GOOGLE_FLOW_SECRET is required when PUBLIC_ACCOUNT_AUTH_ENABLED=true")
	}

	// Access TTL: 15-minute default, must be parseable duration.
	if raw := os.Getenv("AUTH_ACCESS_TOKEN_EXPIRY"); raw != "" {
		d, err := time.ParseDuration(raw)
		if err != nil {
			return cfg, fmt.Errorf("invalid AUTH_ACCESS_TOKEN_EXPIRY %q: %w", raw, err)
		}
		cfg.AccessTTL = d
	}
	// Refresh TTL: 30-day default, must be parseable duration.
	if raw := os.Getenv("AUTH_REFRESH_TOKEN_EXPIRY"); raw != "" {
		d, err := time.ParseDuration(raw)
		if err != nil {
			return cfg, fmt.Errorf("invalid AUTH_REFRESH_TOKEN_EXPIRY %q: %w", raw, err)
		}
		cfg.RefreshTTL = d
	}

	// Production HTTPS invariants: frontend and Google callback URLs.
	if env == "production" {
		for name, raw := range map[string]string{
			"PUBLIC_ACCOUNT_FRONTEND_URL": cfg.FrontendURL,
			"GOOGLE_REDIRECT_URL":         cfg.GoogleRedirectURL,
		} {
			u, err := url.Parse(raw)
			if err != nil || u.Scheme != "https" {
				return cfg, fmt.Errorf("%s must be an https URL in production", name)
			}
		}
		cfg.CookieSecure = true
	}

	// Rate-limit windows are configurable through server-only env vars.
	if err := applyLimit(&cfg.RegisterLimit, "AUTH_REGISTER_LIMIT"); err != nil {
		return cfg, err
	}
	if err := applyLimit(&cfg.LoginLimit, "AUTH_LOGIN_LIMIT"); err != nil {
		return cfg, err
	}
	if err := applyLimit(&cfg.ResendLimit, "AUTH_VERIFY_RESEND_LIMIT"); err != nil {
		return cfg, err
	}
	if err := applyLimit(&cfg.ForgotLimit, "AUTH_FORGOT_PASSWORD_LIMIT"); err != nil {
		return cfg, err
	}
	if err := applyLimit(&cfg.RefreshLimit, "AUTH_REFRESH_LIMIT"); err != nil {
		return cfg, err
	}
	if err := applyLimit(&cfg.GoogleLimit, "AUTH_GOOGLE_LIMIT"); err != nil {
		return cfg, err
	}

	return cfg, nil
}

// applyLimit overrides a RateLimit.Limit from a positive integer env var.
// Window duration is fixed per default; only the count is configurable.
func applyLimit(l *RateLimit, envVar string) error {
	raw := os.Getenv(envVar)
	if raw == "" {
		return nil
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n <= 0 {
		return fmt.Errorf("invalid %s %q: want a positive integer", envVar, raw)
	}
	l.Limit = n
	return nil
}
