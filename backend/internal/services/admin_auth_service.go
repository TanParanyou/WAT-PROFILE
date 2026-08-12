package services

import (
	"crypto/subtle"
	"errors"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	// ErrAdminCredentials is returned when login credentials or Admin
	// eligibility cannot be confirmed. The message never distinguishes between
	// unknown email, wrong password, or missing eligibility.
	ErrAdminCredentials = errors.New("invalid admin credentials")

	// ErrAdminAccountLocked is returned when an admin account is temporarily
	// locked due to exceeding the maximum allowed failed login attempts.
	ErrAdminAccountLocked = errors.New("account is temporarily locked due to failed login attempts")

	// ErrAdminSessionInvalid is returned when a refresh credential is
	// malformed, unknown, expired, or already revoked.
	ErrAdminSessionInvalid = errors.New("invalid admin session")

	// ErrAdminSessionReused is returned when a stale credential is presented
	// outside its grace window; the session is revoked as suspected reuse.
	ErrAdminSessionReused = errors.New("admin session reuse detected")
)

const (
	defaultAdminSessionExpiry = 24 * time.Hour
	defaultAdminSessionGrace  = 30 * time.Second
	maxUserAgentLength        = 512
	maxRevocationReasonLength = 100
	maxFailedLoginAttempts    = 5
	lockoutDuration           = 15 * time.Minute
)

// AdminLoginError wraps an authentication error with remaining attempts details
type AdminLoginError struct {
	Err               error
	RemainingAttempts int
}

func (e *AdminLoginError) Error() string {
	return e.Err.Error()
}

func (e *AdminLoginError) Unwrap() error {
	return e.Err
}

// AdminAuthResult is the outcome of a successful Admin login or refresh.
type AdminAuthResult struct {
	AccessToken       string
	RefreshCredential string
	SessionID         uuid.UUID
	User              *models.User
}

// AdminAuthService owns Admin eligibility checks, session creation, refresh
// rotation, reuse detection, and revocation.
type AdminAuthService struct {
	db      *gorm.DB
	timeNow func() time.Time
	expiry  time.Duration
	grace   time.Duration
}

// NewAdminAuthService creates an AdminAuthService with configurable session
// expiry and grace durations read from the environment.
func NewAdminAuthService(db *gorm.DB, timeNow func() time.Time) *AdminAuthService {
	return &AdminAuthService{
		db:      db,
		timeNow: timeNow,
		expiry:  envDuration("ADMIN_SESSION_EXPIRY", defaultAdminSessionExpiry),
		grace:   envDuration("ADMIN_SESSION_GRACE", defaultAdminSessionGrace),
	}
}

// SessionTTL returns the configured Admin session lifetime, used to match the
// refresh cookie expiry to the server-side session.
func (s *AdminAuthService) SessionTTL() time.Duration {
	return s.expiry
}

// LoginAdmin authenticates an eligible Admin and creates a session in one
// transaction. The session stores only the SHA-256 hash of the secret.
func (s *AdminAuthService) LoginAdmin(email, password, ip, userAgent string) (*AdminAuthResult, error) {
	normalized := strings.ToLower(strings.TrimSpace(email))

	var user models.User
	if err := s.db.Preload("Role").Where("email = ?", normalized).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Perform dummy hash comparison to prevent timing attacks (user enumeration)
			utils.CheckPasswordHash(password, "$2a$12$dummy.hash.to.prevent.timing.attacks.placeholder")
		}
		return nil, &AdminLoginError{
			Err:               ErrAdminCredentials,
			RemainingAttempts: maxFailedLoginAttempts,
		}
	}

	now := s.timeNow()

	if user.IsLockedOut() {
		return nil, ErrAdminAccountLocked
	}

	if !s.eligible(&user) || user.PasswordHash == nil {
		return nil, &AdminLoginError{
			Err:               ErrAdminCredentials,
			RemainingAttempts: maxFailedLoginAttempts,
		}
	}

	if !utils.CheckPasswordHash(password, *user.PasswordHash) {
		// Atomic increment in DB
		s.db.Model(&user).Where("id = ?", user.ID).UpdateColumn("failed_login_attempts", gorm.Expr("failed_login_attempts + 1"))
		
		var updatedUser models.User
		s.db.Select("failed_login_attempts").First(&updatedUser, user.ID)

		if updatedUser.FailedLoginAttempts >= maxFailedLoginAttempts {
			lockedUntil := now.Add(lockoutDuration)
			s.db.Model(&user).Where("id = ?", user.ID).Update("locked_until", lockedUntil)
			return nil, ErrAdminAccountLocked
		}
		
		remaining := maxFailedLoginAttempts - updatedUser.FailedLoginAttempts
		if remaining < 0 {
			remaining = 0
		}
		return nil, &AdminLoginError{
			Err:               ErrAdminCredentials,
			RemainingAttempts: remaining,
		}
	}

	// Login successful - reset lockout state and rehash password if needed
	userUpdates := map[string]interface{}{}
	if user.FailedLoginAttempts > 0 || user.LockedUntil != nil {
		user.FailedLoginAttempts = 0
		user.LockedUntil = nil
		userUpdates["failed_login_attempts"] = 0
		userUpdates["locked_until"] = nil
	}

	if utils.NeedsPasswordRehash(*user.PasswordHash, utils.AdminPasswordCost) {
		if newHash, err := utils.HashAdminPassword(password); err == nil {
			user.PasswordHash = &newHash
			userUpdates["password_hash"] = newHash
		}
	}

	if len(userUpdates) > 0 {
		_ = s.db.Model(&user).Updates(userUpdates).Error
	}

	sessionID := uuid.New()
	raw, hash, err := utils.NewAdminRefreshCredential(sessionID)
	if err != nil {
		return nil, err
	}

	session := models.AdminSession{
		ID:                sessionID,
		UserID:            user.ID,
		CurrentSecretHash: hash,
		ExpiresAt:         now.Add(s.expiry),
		LastUsedAt:        now,
		IPAddress:         ip,
		UserAgent:         truncateString(userAgent, maxUserAgentLength),
	}

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		return tx.Create(&session).Error
	}); err != nil {
		return nil, err
	}

	accessToken, err := utils.GenerateAdminAccessToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &AdminAuthResult{
		AccessToken:       accessToken,
		RefreshCredential: raw,
		SessionID:         session.ID,
		User:              &user,
	}, nil
}

// RefreshAdmin rotates the refresh credential and issues a new access token.
// The session row is locked for update so concurrent tabs cannot race. A hash
// that matches neither the current secret nor an in-window history secret is
// treated as reuse and revokes the session.
func (s *AdminAuthService) RefreshAdmin(rawCredential string, clientIP ...string) (*AdminAuthResult, error) {
	sessionID, hash, err := utils.ParseAdminRefreshCredential(rawCredential)
	if err != nil {
		return nil, ErrAdminSessionInvalid
	}

	ip := ""
	if len(clientIP) > 0 {
		ip = clientIP[0]
	}

	now := s.timeNow()
	result, err := s.refreshInTx(sessionID, hash, ip, now)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (s *AdminAuthService) refreshInTx(sessionID uuid.UUID, hash string, ip string, now time.Time) (*AdminAuthResult, error) {
	var out *AdminAuthResult
	reuseDetected := false

	err := s.db.Transaction(func(tx *gorm.DB) error {
		var session models.AdminSession
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&session, sessionID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrAdminSessionInvalid
			}
			return err
		}

		if session.RevokedAt != nil || now.After(session.ExpiresAt) {
			return ErrAdminSessionInvalid
		}

		if session.IPAddress != "" && ip != "" && session.IPAddress != ip {
			log.Warn().
				Str("session_id", session.ID.String()).
				Str("session_ip", session.IPAddress).
				Str("request_ip", ip).
				Msg("admin refresh IP mismatch")
		}

		currentMatch := subtle.ConstantTimeCompare([]byte(session.CurrentSecretHash), []byte(hash)) == 1

		historyMatch := false
		if !currentMatch {
			var history models.AdminSessionRefreshHistory
			err := tx.Where("session_id = ? AND secret_hash = ?", session.ID, hash).First(&history).Error
			if err == nil {
				historyMatch = now.Before(history.GraceExpiresAt)
			} else if !errors.Is(err, gorm.ErrRecordNotFound) {
				return err
			}
		}

		if !currentMatch && !historyMatch {
			if err := tx.Model(&session).Updates(map[string]interface{}{
				"revoked_at":        now,
				"revocation_reason": "reuse_detected",
			}).Error; err != nil {
				return err
			}
			reuseDetected = true
			return nil
		}

		newRaw, newHash, err := utils.NewAdminRefreshCredential(session.ID)
		if err != nil {
			return err
		}

		// The credential being rotated out (the current secret) must stay
		// valid within the grace window so concurrent tabs can rotate too.
		priorSecret := models.AdminSessionRefreshHistory{
			SessionID:      session.ID,
			SecretHash:     session.CurrentSecretHash,
			GraceExpiresAt: now.Add(s.grace),
		}
		if err := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "session_id"}, {Name: "secret_hash"}},
			DoNothing: true,
		}).Create(&priorSecret).Error; err != nil {
			return err
		}

		if err := tx.Model(&session).Updates(map[string]interface{}{
			"current_secret_hash": newHash,
			"last_used_at":        now,
		}).Error; err != nil {
			return err
		}

		if err := tx.Where("session_id = ? AND grace_expires_at <= ?", session.ID, now).
			Delete(&models.AdminSessionRefreshHistory{}).Error; err != nil {
			return err
		}

		var user models.User
		if err := tx.Preload("Role").First(&user, session.UserID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrAdminSessionInvalid
			}
			return err
		}

		accessToken, err := utils.GenerateAdminAccessToken(user.ID)
		if err != nil {
			return err
		}

		out = &AdminAuthResult{
			AccessToken:       accessToken,
			RefreshCredential: newRaw,
			SessionID:         session.ID,
			User:              &user,
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	if reuseDetected {
		return nil, ErrAdminSessionReused
	}
	return out, nil
}

// RevokeAdminSession marks the session referenced by the credential as revoked.
// The operation is idempotent: unknown or already revoked sessions return nil.
func (s *AdminAuthService) RevokeAdminSession(rawCredential, reason string) error {
	sessionID, _, err := utils.ParseAdminRefreshCredential(rawCredential)
	if err != nil {
		return nil
	}

	now := s.timeNow()
	return s.db.Model(&models.AdminSession{}).
		Where("id = ? AND revoked_at IS NULL", sessionID).
		Updates(map[string]interface{}{
			"revoked_at":        now,
			"revocation_reason": truncateString(reason, maxRevocationReasonLength),
		}).Error
}

// RevokeAllAdminSessions revokes every active Admin session for the user.
func (s *AdminAuthService) RevokeAllAdminSessions(userID uuid.UUID, reason string) error {
	return revokeAllAdminSessionsTx(s.db, userID, reason, s.timeNow())
}

// revokeAllAdminSessionsTx revokes every active Admin session for the user
// within the supplied transaction so callers can pair revocation with the
// security change that caused it.
func revokeAllAdminSessionsTx(tx *gorm.DB, userID uuid.UUID, reason string, now time.Time) error {
	return tx.Model(&models.AdminSession{}).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Updates(map[string]interface{}{
			"revoked_at":        now,
			"revocation_reason": truncateString(reason, maxRevocationReasonLength),
		}).Error
}

// eligible reports whether the user is an active Admin with an active role
// that explicitly grants Admin access.
func (s *AdminAuthService) eligible(user *models.User) bool {
	if !user.IsActive || user.Role == nil {
		return false
	}
	return user.Role.IsActive && user.Role.AdminAccess
}

func envDuration(key string, fallback time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return fallback
}

func truncateString(s string, max int) string {
	runes := []rune(s)
	if len(runes) <= max {
		return s
	}
	return string(runes[:max])
}
