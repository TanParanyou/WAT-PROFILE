package services

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
)

const (
	// refreshReuseReason marks every session in a family when a consumed token
	// is presented again (token-reuse detection).
	refreshReuseReason = "reuse_detected"
	// refreshRotationReason marks the consumed session during rotation.
	refreshRotationReason = "rotated"
	// logoutReason marks sessions revoked by an explicit logout.
	logoutReason = "logout"
	// logoutAllReason marks sessions revoked by logout-all.
	logoutAllReason = "logout_all"
	// userRevokeReason marks sessions revoked by the user from the session list.
	userRevokeReason = "user_revoked"
)

// dummyHash is a real bcrypt hash of a random password used only to equalize
// the timing of unknown-email and wrong-password responses. It never matches
// any real credential.
var (
	dummyHashOnce sync.Once
	dummyHash     string
)

func ensureDummyHash() string {
	dummyHashOnce.Do(func() {
		hash, err := utils.HashPassword("not-a-real-credential-for-timing")
		if err == nil {
			dummyHash = hash
		}
	})
	return dummyHash
}

// AccountSessionService owns password login, rotating refresh sessions, session
// listing, and revocation for the public account module. Only the hash of the
// opaque refresh token is ever stored.
type AccountSessionService struct {
	db         *gorm.DB
	clock      accountauth.Clock
	tokenGen   accountauth.TokenGenerator
	issuer     *accountauth.AccessTokenIssuer
	refreshTTL time.Duration
	security   accountauth.SecurityRecorder
}

// NewAccountSessionService builds the session service.
func NewAccountSessionService(db *gorm.DB, clock accountauth.Clock, tokenGen accountauth.TokenGenerator, issuer *accountauth.AccessTokenIssuer, refreshTTL time.Duration, recorders ...accountauth.SecurityRecorder) *AccountSessionService {
	return &AccountSessionService{db: db, clock: clock, tokenGen: tokenGen, issuer: issuer, refreshTTL: refreshTTL, security: pickSecurityRecorder(recorders)}
}

// createdSession carries a newly created session row together with its plain
// refresh token so the hash is never exposed to callers.
type createdSession struct {
	row          models.AuthSession
	refreshToken string
}

// LoginPassword authenticates with a verified password identity and creates a
// new refresh-session family plus a short-lived public-account access token.
// Unknown email, wrong password, and non-password identities all return the
// same generic invalid-credentials code.
func (s *AccountSessionService) LoginPassword(ctx context.Context, in accountauth.LoginPasswordInput) (accountauth.SessionResult, error) {
	email := accountauth.NormalizeEmail(in.Email)

	var user models.User
	err := s.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Bounded hash comparison so unknown-email and wrong-password paths
		// have comparable timing and do not disclose account existence.
		_ = utils.CheckPasswordHash(in.Password, ensureDummyHash())
		err := accountauth.NewError(accountauth.CodeInvalidCredentials, "Incorrect email or password.")
		s.recordSecurity(ctx, accountauth.SecurityEvent{EventType: "password_login", Outcome: "failure", Provider: "password", IPPrefix: accountauth.CoarseIPPrefix(in.Client.IP), TraceID: in.Client.TraceID})
		return accountauth.SessionResult{}, err
	}
	if err != nil {
		return accountauth.SessionResult{}, err
	}

	var identity models.AuthIdentity
	err = s.db.WithContext(ctx).Where("user_id = ? AND provider = ?", user.ID, "password").First(&identity).Error
	if errors.Is(err, gorm.ErrRecordNotFound) || identity.CredentialHash == nil {
		_ = utils.CheckPasswordHash(in.Password, ensureDummyHash())
		err := accountauth.NewError(accountauth.CodeInvalidCredentials, "Incorrect email or password.")
		s.recordSecurity(ctx, accountauth.SecurityEvent{UserID: user.ID.String(), EventType: "password_login", Outcome: "failure", Provider: "password", IPPrefix: accountauth.CoarseIPPrefix(in.Client.IP), TraceID: in.Client.TraceID})
		return accountauth.SessionResult{}, err
	}
	if err != nil {
		return accountauth.SessionResult{}, err
	}

	if !utils.CheckPasswordHash(in.Password, *identity.CredentialHash) {
		err := accountauth.NewError(accountauth.CodeInvalidCredentials, "Incorrect email or password.")
		s.recordSecurity(ctx, accountauth.SecurityEvent{UserID: user.ID.String(), EventType: "password_login", Outcome: "failure", Provider: "password", IPPrefix: accountauth.CoarseIPPrefix(in.Client.IP), TraceID: in.Client.TraceID})
		return accountauth.SessionResult{}, err
	}

	if code := s.sessionStatusCode(user); code != "" {
		err := accountauth.NewError(code, "This account is not allowed to sign in.")
		s.recordSecurity(ctx, accountauth.SecurityEvent{UserID: user.ID.String(), EventType: "password_login", Outcome: "failure", Provider: "password", IPPrefix: accountauth.CoarseIPPrefix(in.Client.IP), TraceID: in.Client.TraceID})
		return accountauth.SessionResult{}, err
	}

	now := s.clock.Now()
	var result accountauth.SessionResult
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		created, err := s.createSession(tx, user.ID, uuid.New(), in.Client, now)
		if err != nil {
			return err
		}
		accessToken, err := s.issuer.Issue(user.ID, created.row.ID, now)
		if err != nil {
			return err
		}
		result = accountauth.SessionResult{AccessToken: accessToken, RefreshToken: created.refreshToken, ExpiresIn: s.issuer.TTL()}
		return tx.Model(&models.User{}).Where("id = ?", user.ID).Update("last_login_at", now).Error
	})
	if err == nil {
		s.recordSecurity(ctx, accountauth.SecurityEvent{UserID: user.ID.String(), EventType: "password_login", Outcome: "success", Provider: "password", IPPrefix: accountauth.CoarseIPPrefix(in.Client.IP), TraceID: in.Client.TraceID})
	}
	return result, err
}

// Refresh rotates the presented refresh token: the current session row is
// consumed and replaced by a new row in the same family. Presenting a consumed
// token again revokes the whole family (reuse detection).
func (s *AccountSessionService) Refresh(ctx context.Context, rawRefresh string, client accountauth.ClientInfo) (accountauth.SessionResult, error) {
	if rawRefresh == "" {
		return accountauth.SessionResult{}, accountauth.NewError(accountauth.CodeTokenInvalid, "The session is invalid or has expired.")
	}
	tokenHash := accountauth.HashOpaqueToken(rawRefresh)
	now := s.clock.Now()

	var result accountauth.SessionResult
	var reusedFamily uuid.UUID
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var session models.AuthSession
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("token_hash = ?", tokenHash).First(&session).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The session is invalid or has expired.")
		}
		if err != nil {
			return err
		}

		// Reuse of a consumed token revokes the entire token family. The
		// revocation must persist even though this request fails, so it is
		// committed in a separate transaction after this one.
		if session.RevokedAt != nil {
			if session.RevokedReason == refreshRotationReason {
				reusedFamily = session.FamilyID
			}
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The session is invalid or has expired.")
		}

		if now.After(session.ExpiresAt) {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The session is invalid or has expired.")
		}

		var user models.User
		if err := tx.Where("id = ?", session.UserID).First(&user).Error; err != nil {
			return err
		}
		if code := s.sessionStatusCode(user); code != "" {
			return accountauth.NewError(code, "This account is not allowed to sign in.")
		}

		// Rotate: consume the current row and create its replacement.
		if err := tx.Model(&models.AuthSession{}).Where("id = ?", session.ID).Updates(map[string]any{
			"revoked_at":     now,
			"revoked_reason": refreshRotationReason,
			"last_used_at":   now,
			"updated_at":     now,
		}).Error; err != nil {
			return err
		}

		created, err := s.createSession(tx, session.UserID, session.FamilyID, client, now)
		if err != nil {
			return err
		}

		accessToken, err := s.issuer.Issue(session.UserID, created.row.ID, session.CreatedAt)
		if err != nil {
			return err
		}
		result = accountauth.SessionResult{AccessToken: accessToken, RefreshToken: created.refreshToken, ExpiresIn: s.issuer.TTL()}
		return nil
	})
	if err != nil && reusedFamily != uuid.Nil {
		// The classifying transaction failed on reuse detection. Commit the
		// family revocation outside it so the whole family is revoked even
		// though this request returns an error.
		revokeErr := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
			return s.revokeFamily(tx, reusedFamily, refreshReuseReason, now)
		})
		if revokeErr != nil {
			return accountauth.SessionResult{}, revokeErr
		}
	}
	if err == nil {
		s.recordSecurity(ctx, accountauth.SecurityEvent{EventType: "session_refresh", Outcome: "success", Provider: "password", IPPrefix: accountauth.CoarseIPPrefix(client.IP), TraceID: client.TraceID})
	} else if reusedFamily != uuid.Nil {
		s.recordSecurity(ctx, accountauth.SecurityEvent{EventType: "session_refresh_reuse", Outcome: "failure", Provider: "password", IPPrefix: accountauth.CoarseIPPrefix(client.IP), TraceID: client.TraceID})
	}
	return result, err
}

// ReauthenticatePassword verifies the password for the current session and
// issues a new access token with a fresh auth_time. It does not create or
// rotate a refresh session; callers keep the existing session family.
func (s *AccountSessionService) ReauthenticatePassword(ctx context.Context, userID, sessionID uuid.UUID, password string) (accountauth.SessionResult, error) {
	now := s.clock.Now()
	var result accountauth.SessionResult
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var session models.AuthSession
		if err := tx.Where("id = ? AND user_id = ? AND revoked_at IS NULL", sessionID, userID).First(&session).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return accountauth.NewError(accountauth.CodeTokenInvalid, "The session is invalid or has expired.")
			}
			return err
		}
		if now.After(session.ExpiresAt) {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The session is invalid or has expired.")
		}

		var user models.User
		if err := tx.First(&user, "id = ?", userID).Error; err != nil {
			return err
		}
		if code := s.sessionStatusCode(user); code != "" {
			return accountauth.NewError(code, "This account is not allowed to sign in.")
		}

		var identity models.AuthIdentity
		err := tx.Where("user_id = ? AND provider = 'password'", userID).First(&identity).Error
		if errors.Is(err, gorm.ErrRecordNotFound) || identity.CredentialHash == nil {
			return accountauth.NewError(accountauth.CodeReauthRequired, "This account uses Google sign-in. Continue with Google to confirm.")
		}
		if err != nil {
			return err
		}
		if !utils.CheckPasswordHash(password, *identity.CredentialHash) {
			return accountauth.NewError(accountauth.CodeInvalidCredentials, "Incorrect email or password.")
		}

		accessToken, err := s.issuer.Issue(userID, sessionID, now)
		if err != nil {
			return err
		}
		if err := tx.Model(&models.AuthSession{}).Where("id = ?", sessionID).Updates(map[string]any{
			"last_used_at": now,
			"updated_at":   now,
		}).Error; err != nil {
			return err
		}
		result = accountauth.SessionResult{AccessToken: accessToken, ExpiresIn: s.issuer.TTL()}
		return nil
	})
	if err == nil {
		s.recordSecurity(ctx, accountauth.SecurityEvent{UserID: userID.String(), EventType: "password_reauth", Outcome: "success"})
	} else if accountauth.ErrorCode(err) == accountauth.CodeInvalidCredentials {
		s.recordSecurity(ctx, accountauth.SecurityEvent{UserID: userID.String(), EventType: "password_reauth", Outcome: "failure"})
	} else if accountauth.ErrorCode(err) == accountauth.CodeReauthRequired {
		s.recordSecurity(ctx, accountauth.SecurityEvent{UserID: userID.String(), EventType: "password_reauth", Outcome: "failure", Provider: "google"})
	}
	return result, err
}

// ChangePassword creates or replaces the password identity after recent
// authentication. The current password is verified only by the explicit
// reauthentication endpoint. Other sessions are revoked and the current
// session gets a fresh access token.
func (s *AccountSessionService) ChangePassword(ctx context.Context, userID, sessionID uuid.UUID, authTime time.Time, newPassword string) (accountauth.SessionResult, error) {
	if err := accountauth.ValidatePasswordPolicy(newPassword); err != nil {
		return accountauth.SessionResult{}, err
	}
	now := s.clock.Now()
	if authTime.IsZero() || now.Sub(authTime) > maxReauthAge {
		return accountauth.SessionResult{}, accountauth.NewError(accountauth.CodeReauthRequired, "Please re-authenticate before changing your password.")
	}
	var result accountauth.SessionResult
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var session models.AuthSession
		if err := tx.Where("id = ? AND user_id = ? AND revoked_at IS NULL", sessionID, userID).First(&session).Error; err != nil {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The session is invalid or has expired.")
		}
		var identity models.AuthIdentity
		identityErr := tx.Where("user_id = ? AND provider = 'password'", userID).First(&identity).Error
		if identityErr != nil && !errors.Is(identityErr, gorm.ErrRecordNotFound) {
			return identityErr
		}
		hash, err := utils.HashPassword(newPassword)
		if err != nil {
			return err
		}
		if identityErr == nil {
			identity.CredentialHash = &hash
			if err := tx.Save(&identity).Error; err != nil {
				return err
			}
		} else {
			identity = models.AuthIdentity{UserID: userID, Provider: "password", ProviderSubject: uuid.NewString(), CredentialHash: &hash}
			var user models.User
			if err := tx.First(&user, "id = ?", userID).Error; err != nil {
				return err
			}
			identity.ProviderEmail = user.Email
			if err := tx.Create(&identity).Error; err != nil {
				return err
			}
		}
		if err := tx.Model(&models.AuthSession{}).Where("user_id = ? AND id <> ? AND revoked_at IS NULL", userID, sessionID).Updates(map[string]any{"revoked_at": now, "revoked_reason": "password_changed", "updated_at": now}).Error; err != nil {
			return err
		}
		access, err := s.issuer.Issue(userID, sessionID, now)
		if err != nil {
			return err
		}
		result = accountauth.SessionResult{AccessToken: access, ExpiresIn: s.issuer.TTL()}
		return nil
	})
	if err == nil {
		s.recordSecurity(ctx, accountauth.SecurityEvent{UserID: userID.String(), EventType: "password_changed", Outcome: "success", Provider: "password"})
	}
	return result, err
}

// Logout revokes the token family of the presented refresh token.
func (s *AccountSessionService) Logout(ctx context.Context, userID uuid.UUID, rawRefresh string) error {
	if rawRefresh == "" {
		return nil
	}
	tokenHash := accountauth.HashOpaqueToken(rawRefresh)
	now := s.clock.Now()
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var session models.AuthSession
		if err := tx.Where("token_hash = ?", tokenHash).First(&session).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil // Idempotent: unknown token is already signed out.
			}
			return err
		}
		if session.UserID != userID {
			return nil
		}
		return s.revokeFamily(tx, session.FamilyID, logoutReason, now)
	})
	if err == nil {
		s.recordSecurity(ctx, accountauth.SecurityEvent{UserID: userID.String(), EventType: "logout", Outcome: "success"})
	}
	return err
}

// LogoutAll revokes every active session of the user.
func (s *AccountSessionService) LogoutAll(ctx context.Context, userID uuid.UUID) error {
	now := s.clock.Now()
	err := s.db.WithContext(ctx).Model(&models.AuthSession{}).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Updates(map[string]any{"revoked_at": now, "revoked_reason": logoutAllReason, "updated_at": now}).Error
	if err == nil {
		s.recordSecurity(ctx, accountauth.SecurityEvent{UserID: userID.String(), EventType: "logout_all", Outcome: "success"})
	}
	return err
}

// ListSessions returns redacted session summaries for the user. The current
// session is flagged so the UI can highlight it.
func (s *AccountSessionService) ListSessions(ctx context.Context, userID uuid.UUID, currentSessionID uuid.UUID) ([]accountauth.SessionSummary, error) {
	var sessions []models.AuthSession
	if err := s.db.WithContext(ctx).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Order("last_used_at DESC").
		Find(&sessions).Error; err != nil {
		return nil, err
	}
	summaries := make([]accountauth.SessionSummary, 0, len(sessions))
	for _, session := range sessions {
		summaries = append(summaries, accountauth.SessionSummary{
			ID:               session.ID,
			Current:          session.ID == currentSessionID,
			UserAgentSummary: session.UserAgentSummary,
			IPPrefix:         session.IPPrefix,
			CreatedAt:        session.CreatedAt,
			LastUsedAt:       session.LastUsedAt,
			ExpiresAt:        session.ExpiresAt,
			TokenHash:        "", // Never expose the hash
		})
	}
	return summaries, nil
}

// RevokeSession revokes the family of one owned session. Another user's or an
// unknown session ID returns an invalid-token error.
func (s *AccountSessionService) RevokeSession(ctx context.Context, userID uuid.UUID, sessionID uuid.UUID) error {
	now := s.clock.Now()
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var session models.AuthSession
		if err := tx.Where("id = ? AND user_id = ?", sessionID, userID).First(&session).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return accountauth.NewError(accountauth.CodeTokenInvalid, "The session is invalid or has expired.")
			}
			return err
		}
		return s.revokeFamily(tx, session.FamilyID, userRevokeReason, now)
	})
	if err == nil {
		s.recordSecurity(ctx, accountauth.SecurityEvent{UserID: userID.String(), EventType: "session_revoke", Outcome: "success"})
	}
	return err
}

// sessionStatusCode returns an error code when the user may not create or
// refresh sessions, or an empty string when the user may.
func (s *AccountSessionService) sessionStatusCode(user models.User) accountauth.Code {
	if user.AccountStatus == models.AccountStatusDisabled || user.AccountStatus == models.AccountStatusClosed || !user.IsActive {
		return accountauth.CodeAccountDisabled
	}
	if user.AccountStatus == models.AccountStatusPendingVerification || !user.EmailVerified {
		return accountauth.CodeVerificationRequired
	}
	return ""
}

// createSession creates one session row inside the transaction and returns it
// together with the plain refresh token (never the hash).
func (s *AccountSessionService) createSession(tx *gorm.DB, userID, familyID uuid.UUID, client accountauth.ClientInfo, now time.Time) (createdSession, error) {
	plain, hash, err := s.tokenGen()
	if err != nil {
		return createdSession{}, err
	}
	session := models.AuthSession{
		ID:               uuid.New(),
		UserID:           userID,
		FamilyID:         familyID,
		TokenHash:        hash,
		ExpiresAt:        now.Add(s.refreshTTL),
		LastUsedAt:       now,
		UserAgentSummary: accountauth.SanitizeUserAgent(client.UserAgent),
		IPPrefix:         accountauth.CoarseIPPrefix(client.IP),
		CreatedAt:        now,
		UpdatedAt:        now,
	}
	if err := tx.Create(&session).Error; err != nil {
		return createdSession{}, err
	}
	return createdSession{row: session, refreshToken: plain}, nil
}

// revokeFamily marks every active session row in the family as revoked.
func (s *AccountSessionService) revokeFamily(tx *gorm.DB, familyID uuid.UUID, reason string, now time.Time) error {
	return tx.Model(&models.AuthSession{}).
		Where("family_id = ? AND revoked_at IS NULL", familyID).
		Updates(map[string]any{"revoked_at": now, "revoked_reason": reason, "updated_at": now}).Error
}

func (s *AccountSessionService) recordSecurity(ctx context.Context, event accountauth.SecurityEvent) {
	s.security.Record(ctx, event)
}
