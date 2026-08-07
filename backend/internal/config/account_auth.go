package config

import (
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	securityutil "github.com/watloungporsai/wat-profile-backend/internal/security"
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
	AllowedOrigins    []string
	CORSOrigins       []string

	RegisterLimit      RateLimit
	LoginLimit         RateLimit
	VerifyLimit        RateLimit
	ResendLimit        RateLimit
	ForgotLimit        RateLimit
	ResetLimit         RateLimit
	RefreshLimit       RateLimit
	ReauthLimit        RateLimit
	GoogleLimit        RateLimit
	AvatarLimit        RateLimit
	ConfirmEmailLimit  RateLimit
	ReopenRequestLimit RateLimit
	ReopenConfirmLimit RateLimit
	PasswordLimit      RateLimit
	EmailChangeLimit   RateLimit
	CloseLimit         RateLimit
	GoogleUnlinkLimit  RateLimit
}

const (
	defaultAccessTTL  = 15 * time.Minute
	defaultRefreshTTL = 30 * 24 * time.Hour
)

// LoadAccountAuthConfig reads and validates the public account auth module
// configuration from the environment. When the module is disabled it returns a
// zero-value config with no validation failures, so deployments that have not
// adopted the module keep working.
func LoadAccountAuthConfig() (AccountAuthConfig, error) {
	cfg := AccountAuthConfig{
		Enabled:            os.Getenv("PUBLIC_ACCOUNT_AUTH_ENABLED") == "true",
		Environment:        os.Getenv("ENV"),
		FrontendURL:        strings.TrimRight(os.Getenv("PUBLIC_ACCOUNT_FRONTEND_URL"), "/"),
		EmailMode:          os.Getenv("AUTH_EMAIL_DELIVERY_MODE"),
		AccessTTL:          defaultAccessTTL,
		RefreshTTL:         defaultRefreshTTL,
		RegisterLimit:      RateLimit{5, 15 * time.Minute},
		LoginLimit:         RateLimit{10, 15 * time.Minute},
		VerifyLimit:        RateLimit{10, 15 * time.Minute},
		ResendLimit:        RateLimit{3, time.Hour},
		ForgotLimit:        RateLimit{5, time.Hour},
		ResetLimit:         RateLimit{5, time.Hour},
		RefreshLimit:       RateLimit{60, time.Minute},
		ReauthLimit:        RateLimit{5, 15 * time.Minute},
		GoogleLimit:        RateLimit{20, 15 * time.Minute},
		AvatarLimit:        RateLimit{12, time.Hour},
		ConfirmEmailLimit:  RateLimit{5, time.Hour},
		ReopenRequestLimit: RateLimit{5, time.Hour},
		ReopenConfirmLimit: RateLimit{5, time.Hour},
		PasswordLimit:      RateLimit{5, time.Hour},
		EmailChangeLimit:   RateLimit{5, time.Hour},
		CloseLimit:         RateLimit{3, time.Hour},
		GoogleUnlinkLimit:  RateLimit{5, time.Hour},
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
	if env != "development" && env != "staging" && env != "production" {
		return cfg, fmt.Errorf("ENV must be development, staging, or production when PUBLIC_ACCOUNT_AUTH_ENABLED=true")
	}

	if cfg.FrontendURL == "" {
		return cfg, fmt.Errorf("PUBLIC_ACCOUNT_FRONTEND_URL is required when PUBLIC_ACCOUNT_AUTH_ENABLED=true")
	}

	if cfg.EmailMode == "" {
		cfg.EmailMode = "capture"
	}
	if (env == "staging" || env == "production") && cfg.EmailMode != "resend" {
		return cfg, fmt.Errorf("AUTH_EMAIL_DELIVERY_MODE=resend is required when ENV=%s", env)
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

	// Non-development HTTPS invariants: frontend, callback, and origins.
	if env == "staging" || env == "production" {
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
		secret := os.Getenv("JWT_SECRET")
		lowerSecret := strings.ToLower(secret)
		if len(secret) < 32 || strings.Contains(lowerSecret, "change-this") || strings.Contains(lowerSecret, "your-super-secret") {
			return cfg, fmt.Errorf("JWT_SECRET must be a non-placeholder value of at least 32 bytes when ENV=%s", env)
		}
	}

	corsOrigins, err := securityutil.ParseOrigins(os.Getenv("ALLOWED_ORIGINS"), env != "development")
	if err != nil {
		return cfg, fmt.Errorf("invalid ALLOWED_ORIGINS: %w", err)
	}
	accountOrigins, err := securityutil.ParseOrigins(os.Getenv("PUBLIC_ACCOUNT_ALLOWED_ORIGINS"), env != "development")
	if err != nil {
		return cfg, fmt.Errorf("invalid PUBLIC_ACCOUNT_ALLOWED_ORIGINS: %w", err)
	}
	if len(accountOrigins) == 0 {
		return cfg, fmt.Errorf("PUBLIC_ACCOUNT_ALLOWED_ORIGINS is required when PUBLIC_ACCOUNT_AUTH_ENABLED=true")
	}
	global := make(map[string]struct{}, len(corsOrigins))
	for _, origin := range corsOrigins {
		global[origin] = struct{}{}
	}
	for _, origin := range accountOrigins {
		if _, ok := global[origin]; !ok {
			return cfg, fmt.Errorf("PUBLIC_ACCOUNT_ALLOWED_ORIGINS origin %q must be included in ALLOWED_ORIGINS", origin)
		}
	}
	cfg.AllowedOrigins = accountOrigins
	cfg.CORSOrigins = corsOrigins

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
	if err := applyLimit(&cfg.AvatarLimit, "AUTH_AVATAR_UPLOAD_LIMIT"); err != nil {
		return cfg, err
	}
	// One shared knob keeps deployment configuration small while each surface
	// still has its own limiter bucket and window.
	if raw := os.Getenv("AUTH_SENSITIVE_MUTATION_LIMIT"); raw != "" {
		for _, limit := range []*RateLimit{
			&cfg.VerifyLimit,
			&cfg.ResetLimit,
			&cfg.ReauthLimit,
			&cfg.ConfirmEmailLimit,
			&cfg.ReopenRequestLimit,
			&cfg.ReopenConfirmLimit,
			&cfg.PasswordLimit,
			&cfg.EmailChangeLimit,
			&cfg.CloseLimit,
			&cfg.GoogleUnlinkLimit,
		} {
			if err := applyLimit(limit, "AUTH_SENSITIVE_MUTATION_LIMIT"); err != nil {
				return cfg, err
			}
		}
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
