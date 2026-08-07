package services

import (
	"context"
	"errors"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
)

// sessionLogoutAller is the session capability the recovery service needs:
// resetting a password revokes every session of the account.
type sessionLogoutAller interface {
	LogoutAll(ctx context.Context, userID uuid.UUID) error
}

// AccountRecoveryService owns forgot/reset password flows. The public response
// is always generic so the API never confirms whether an account exists.
type AccountRecoveryService struct {
	db          *gorm.DB
	sender      accountauth.EmailSender
	clock       accountauth.Clock
	tokenGen    accountauth.TokenGenerator
	sessions    sessionLogoutAller
	frontendURL string
	security    accountauth.SecurityRecorder
}

// NewAccountRecoveryService builds the recovery service.
func NewAccountRecoveryService(db *gorm.DB, sender accountauth.EmailSender, clock accountauth.Clock, tokenGen accountauth.TokenGenerator, sessions sessionLogoutAller, recorders ...accountauth.SecurityRecorder) *AccountRecoveryService {
	return &AccountRecoveryService{
		db:          db,
		sender:      sender,
		clock:       clock,
		tokenGen:    tokenGen,
		sessions:    sessions,
		frontendURL: strings.TrimRight(os.Getenv("PUBLIC_ACCOUNT_FRONTEND_URL"), "/"),
		security:    pickSecurityRecorder(recorders),
	}
}

// RequestPasswordReset handles the forgot-password flow. It always returns a
// generic nil when the request is not rate-limited. For an active password
// account it issues a single-use reset token and sends the localized reset
// email; for a Google-only account it sends a localized sign-in explanation
// with a safe login link; for unknown, disabled, or closed accounts it does nothing.
func (s *AccountRecoveryService) RequestPasswordReset(ctx context.Context, email, locale string, clients ...accountauth.ClientInfo) error {
	normalized := accountauth.NormalizeEmail(email)
	if !supportedLocale(locale) {
		return accountauth.NewFieldError(accountauth.CodeValidation, "locale", "Unsupported locale.")
	}
	now := s.clock.Now()
	client := firstClient(clients)

	var user models.User
	if err := s.db.WithContext(ctx).Where("email = ?", normalized).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil // generic: never disclose whether the account exists
		}
		return err
	}

	if user.AccountStatus != models.AccountStatusActive || !user.IsActive {
		return nil
	}

	// Google-only accounts have no password to reset; send a neutral notice.
	var hasPassword bool
	var pwIdentity models.AuthIdentity
	if err := s.db.WithContext(ctx).
		Where("user_id = ? AND provider = ?", user.ID, "password").
		First(&pwIdentity).Error; err == nil && pwIdentity.CredentialHash != nil {
		hasPassword = true
	}

	if !hasPassword {
		err := s.sendEmail(ctx, accountauth.EmailMessage{
			To:        user.Email,
			Locale:    locale,
			ActionURL: s.frontendURL + "/" + locale + "/account/login",
		}, "password_reset_google", accountauth.EmailTemplateVar{DisplayName: user.Name, ActionURL: s.frontendURL + "/" + locale + "/account/login"}, now)
		s.security.Record(ctx, accountauth.SecurityEvent{UserID: user.ID.String(), EventType: "password_recovery_request", Outcome: "success", Provider: "google", IPPrefix: accountauth.CoarseIPPrefix(client.IP), TraceID: client.TraceID})
		return err
	}

	var pending accountauth.EmailMessage
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.AuthActionToken{}).
			Where("user_id = ? AND purpose = ? AND consumed_at IS NULL", user.ID, "reset_password").
			Update("consumed_at", now).Error; err != nil {
			return err
		}
		raw, hash, err := s.tokenGen()
		if err != nil {
			return err
		}
		token := models.AuthActionToken{
			UserID:    user.ID,
			Purpose:   "reset_password",
			TokenHash: hash,
			Payload:   models.JSONMap{"locale": locale},
			ExpiresAt: now.Add(actionTokenTTL),
		}
		if err := tx.Create(&token).Error; err != nil {
			return err
		}
		actionURL := s.frontendURL + "/" + locale + "/account/reset-password?token=" + raw
		pending = accountauth.EmailMessage{
			To:        user.Email,
			Locale:    locale,
			ActionURL: actionURL,
		}
		return nil
	})
	if err != nil {
		return err
	}
	// Mail rendering/delivery happens after commit; it must never hold a DB
	// transaction open or make a committed reset appear to have failed.
	_ = s.sendEmail(ctx, pending, "password_reset", accountauth.EmailTemplateVar{DisplayName: user.Name, ActionURL: pending.ActionURL}, now)
	s.security.Record(ctx, accountauth.SecurityEvent{UserID: user.ID.String(), EventType: "password_recovery_request", Outcome: "success", Provider: "password", IPPrefix: accountauth.CoarseIPPrefix(client.IP), TraceID: client.TraceID})
	return nil
}

// ResetPassword consumes the single-use reset token, replaces the password
// identity hash, revokes every session, and sends a password-changed notice.
func (s *AccountRecoveryService) ResetPassword(ctx context.Context, rawToken, newPassword string, clients ...accountauth.ClientInfo) error {
	if err := accountauth.ValidatePasswordPolicy(newPassword); err != nil {
		return err
	}
	if rawToken == "" {
		return accountauth.NewError(accountauth.CodeTokenInvalid, "The password reset link is invalid or has expired.")
	}
	tokenHash := accountauth.HashOpaqueToken(rawToken)
	now := s.clock.Now()

	var user models.User
	var identity models.AuthIdentity

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var token models.AuthActionToken
		if err := tx.Clauses().Where("token_hash = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > ?",
			tokenHash, "reset_password", now).First(&token).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return accountauth.NewError(accountauth.CodeTokenInvalid, "The password reset link is invalid or has expired.")
			}
			return err
		}

		// Atomic single-use consumption: exactly one concurrent request wins.
		res := tx.Model(&models.AuthActionToken{}).
			Where("id = ? AND consumed_at IS NULL", token.ID).
			Update("consumed_at", now)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected != 1 {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The password reset link is invalid or has expired.")
		}

		if err := tx.Where("id = ?", token.UserID).First(&user).Error; err != nil {
			return err
		}
		if err := tx.Where("user_id = ? AND provider = ?", user.ID, "password").First(&identity).Error; err != nil {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The password reset link is invalid or has expired.")
		}

		newHash, err := utils.HashPassword(newPassword)
		if err != nil {
			return err
		}
		identity.CredentialHash = &newHash
		if err := tx.Save(&identity).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return err
	}

	// Revoke every session after the commit and notify. Notification failure
	// must not fail the reset itself.
	if err := s.sessions.LogoutAll(ctx, user.ID); err != nil {
		return err
	}
	err = s.sendEmail(ctx, accountauth.EmailMessage{
		To:     user.Email,
		Locale: "en",
	}, "password_changed", accountauth.EmailTemplateVar{DisplayName: user.Name}, now)
	s.security.Record(ctx, accountauth.SecurityEvent{UserID: user.ID.String(), EventType: "password_reset", Outcome: "success", Provider: "password", IPPrefix: accountauth.CoarseIPPrefix(firstClient(clients).IP), TraceID: firstClient(clients).TraceID})
	return err
}

func firstClient(clients []accountauth.ClientInfo) accountauth.ClientInfo {
	if len(clients) == 0 {
		return accountauth.ClientInfo{}
	}
	return clients[0]
}

// sendEmail renders and sends a transactional email; delivery errors are
// swallowed so committed account state is never rolled back by mail failures.
func (s *AccountRecoveryService) sendEmail(ctx context.Context, msg accountauth.EmailMessage, purpose string, vars accountauth.EmailTemplateVar, now time.Time) error {
	if s.sender == nil {
		return nil
	}
	subject, body, err := accountauth.RenderEmail(purpose, msg.Locale, vars)
	if err != nil {
		return err
	}
	msg.Subject = subject
	msg.Body = body
	if sendErr := s.sender.Send(ctx, msg); sendErr != nil {
		// Email delivery is retryable through the resend flow; never fail the
		// underlying operation because the mail backend is down.
		return nil
	}
	return nil
}
