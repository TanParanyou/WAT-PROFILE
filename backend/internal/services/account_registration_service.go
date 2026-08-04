package services

import (
	"context"
	"errors"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

const (
	actionTokenTTL = 30 * time.Minute
	minPasswordLen = 12
	maxPasswordLen = 128
	minDisplayName = 2
	maxDisplayName = 80
)

// validatePasswordLength enforces the 12-128 character password policy shared
// by registration and password reset.
func validatePasswordLength(password string) error {
	if len(password) < minPasswordLen || len(password) > maxPasswordLen {
		return accountauth.NewFieldError(accountauth.CodeValidation, "password", "Password must be between 12 and 128 characters.")
	}
	return nil
}

// RegisterPasswordInput is the validated input for password registration.
type RegisterPasswordInput struct {
	Email       string
	Password    string
	DisplayName string
	Locale      string
	Client      accountauth.ClientInfo
}

// pendingVerification carries the information needed to deliver the
// verification email after the registration transaction has committed.
type pendingVerification struct {
	to          string
	locale      string
	displayName string
	actionURL   string
}

// AccountRegistrationService owns password registration, email verification,
// and verification resend. Database writes happen in one transaction; email is
// delivered only after commit so a delivery failure never rolls back a valid
// account (the user can use the rate-limited resend flow).
type AccountRegistrationService struct {
	db          *gorm.DB
	sender      accountauth.EmailSender
	clock       accountauth.Clock
	tokenGen    accountauth.TokenGenerator
	frontendURL string
	security    accountauth.SecurityRecorder
}

// NewAccountRegistrationService builds the registration service.
func NewAccountRegistrationService(db *gorm.DB, sender accountauth.EmailSender, clock accountauth.Clock, tokenGen accountauth.TokenGenerator, recorders ...accountauth.SecurityRecorder) *AccountRegistrationService {
	return &AccountRegistrationService{
		db:          db,
		sender:      sender,
		clock:       clock,
		tokenGen:    tokenGen,
		frontendURL: strings.TrimRight(os.Getenv("PUBLIC_ACCOUNT_FRONTEND_URL"), "/"),
		security:    pickSecurityRecorder(recorders),
	}
}

// supportedLocale reports whether a UI locale is one of the module's three
// supported locales. Unlike SafeLocale (which falls back to English), a
// registration in an unsupported locale is rejected.
func supportedLocale(locale string) bool {
	switch locale {
	case "th", "en", "de":
		return true
	default:
		return false
	}
}

// RegisterPassword creates a role-less public account in pending_verification,
// its profile, and its password identity in one transaction, then delivers the
// localized verification email. A repeated registration for an existing
// unverified email returns the same generic result and resends verification.
// Registration never creates or modifies temple-member records.
func (s *AccountRegistrationService) RegisterPassword(ctx context.Context, in RegisterPasswordInput) error {
	email := accountauth.NormalizeEmail(in.Email)
	displayName := strings.TrimSpace(in.DisplayName)

	if !accountauth.ValidEmail(email) {
		return accountauth.NewFieldError(accountauth.CodeValidation, "email", "Enter a valid email address.")
	}
	if len(in.Password) < minPasswordLen || len(in.Password) > maxPasswordLen {
		return accountauth.NewFieldError(accountauth.CodeValidation, "password", "Password must be between 12 and 128 characters.")
	}
	if len(displayName) < minDisplayName || len(displayName) > maxDisplayName {
		return accountauth.NewFieldError(accountauth.CodeValidation, "display_name", "Display name must be between 2 and 80 characters.")
	}
	if !supportedLocale(in.Locale) {
		return accountauth.NewFieldError(accountauth.CodeValidation, "locale", "Unsupported locale.")
	}

	var pending *pendingVerification
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var existing models.User
		err := tx.Where("email = ?", email).First(&existing).Error
		switch {
		case err == nil:
			if existing.AccountStatus == models.AccountStatusActive || existing.EmailVerified {
				return accountauth.NewFieldError(accountauth.CodeEmailAlreadyRegistered, "email", "That email address is already registered.")
			}
			// Unverified duplicate: invalidate any prior verification token and
			// resend without creating a second identity.
			if err := s.invalidateVerificationTokens(tx, existing.ID); err != nil {
				return err
			}
			p, err := s.issueVerificationToken(tx, existing.ID, email, existing.Name, in.Locale)
			if err != nil {
				return err
			}
			pending = p
			return nil
		case !errors.Is(err, gorm.ErrRecordNotFound):
			return err
		}

		user := models.User{
			Email:         email,
			Name:          displayName,
			AccountStatus: models.AccountStatusPendingVerification,
		}
		if err := tx.Create(&user).Error; err != nil {
			return mapAccountConflict(err)
		}

		hash, err := utils.HashPassword(in.Password)
		if err != nil {
			return err
		}
		identity := models.AuthIdentity{
			UserID:          user.ID,
			Provider:        "password",
			ProviderSubject: email,
			ProviderEmail:   email,
			CredentialHash:  &hash,
		}
		if err := tx.Create(&identity).Error; err != nil {
			return err
		}

		profile := models.AccountProfile{
			UserID:          user.ID,
			DisplayName:     displayName,
			PreferredLocale: in.Locale,
		}
		if err := tx.Create(&profile).Error; err != nil {
			return err
		}

		p, err := s.issueVerificationToken(tx, user.ID, email, displayName, in.Locale)
		if err != nil {
			return err
		}
		pending = p
		return nil
	})
	if err != nil {
		s.security.Record(ctx, accountauth.SecurityEvent{EventType: "password_registration", Outcome: "failure", Provider: "password", IPPrefix: accountauth.CoarseIPPrefix(in.Client.IP), TraceID: in.Client.TraceID})
		return err
	}

	if pending != nil {
		s.sendEmail(ctx, *pending)
	}
	s.security.Record(ctx, accountauth.SecurityEvent{EventType: "password_registration", Outcome: "success", Provider: "password", IPPrefix: accountauth.CoarseIPPrefix(in.Client.IP), TraceID: in.Client.TraceID})
	return nil
}

// VerifyEmail atomically consumes a single-use verification token and activates
// the account. Concurrent consumption of the same token results in exactly one
// success; every other caller receives the generic invalid-token error.
func (s *AccountRegistrationService) VerifyEmail(ctx context.Context, rawToken string) error {
	if rawToken == "" {
		return accountauth.NewError(accountauth.CodeTokenInvalid, "The verification link is invalid or has expired.")
	}
	hash := accountauth.HashOpaqueToken(rawToken)
	now := s.clock.Now()

	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var token models.AuthActionToken
		err := tx.Where(
			"token_hash = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > ?",
			hash, "verify_email", now,
		).First(&token).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The verification link is invalid or has expired.")
		}
		if err != nil {
			return err
		}

		// Conditional consumption: exactly one concurrent caller wins.
		res := tx.Model(&models.AuthActionToken{}).
			Where("id = ? AND consumed_at IS NULL", token.ID).
			Update("consumed_at", now)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The verification link is invalid or has expired.")
		}

		return tx.Model(&models.User{}).Where("id = ?", token.UserID).Updates(map[string]interface{}{
			"email_verified": true,
			"account_status": string(models.AccountStatusActive),
		}).Error
	})
}

// ResendVerification invalidates prior unconsumed verification tokens and issues
// a replacement for a known unverified account. Unknown emails receive the same
// generic accepted result so account existence is not disclosed.
func (s *AccountRegistrationService) ResendVerification(ctx context.Context, email, locale string) error {
	email = accountauth.NormalizeEmail(email)
	if !supportedLocale(locale) {
		return accountauth.NewFieldError(accountauth.CodeValidation, "locale", "Unsupported locale.")
	}

	var pending *pendingVerification
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var user models.User
		err := tx.Where("email = ?", email).First(&user).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		if err != nil {
			return err
		}

		if err := s.invalidateVerificationTokens(tx, user.ID); err != nil {
			return err
		}
		p, err := s.issueVerificationToken(tx, user.ID, user.Email, user.Name, locale)
		if err != nil {
			return err
		}
		pending = p
		return nil
	})
	if err != nil {
		return err
	}

	if pending != nil {
		s.sendEmail(ctx, *pending)
	}
	return nil
}

// issueVerificationToken creates one single-use verification token and the
// pending email descriptor used after commit. The token generator runs inside
// the transaction so any failure rolls back the whole registration.
func (s *AccountRegistrationService) issueVerificationToken(tx *gorm.DB, userID uuid.UUID, email, displayName, locale string) (*pendingVerification, error) {
	plain, hash, err := s.tokenGen()
	if err != nil {
		return nil, err
	}
	token := models.AuthActionToken{
		UserID:    userID,
		Purpose:   "verify_email",
		TokenHash: hash,
		Payload:   models.JSONMap{"locale": locale},
		ExpiresAt: s.clock.Now().Add(actionTokenTTL),
	}
	if err := tx.Create(&token).Error; err != nil {
		return nil, err
	}

	actionURL := s.frontendURL + "/" + locale + "/verify-email?token=" + plain
	return &pendingVerification{to: email, locale: locale, displayName: displayName, actionURL: actionURL}, nil
}

// invalidateVerificationTokens marks every unconsumed verification token for a
// user as consumed, so issuing a replacement invalidates prior ones.
func (s *AccountRegistrationService) invalidateVerificationTokens(tx *gorm.DB, userID uuid.UUID) error {
	return tx.Model(&models.AuthActionToken{}).
		Where("user_id = ? AND purpose = ? AND consumed_at IS NULL", userID, "verify_email").
		Update("consumed_at", s.clock.Now()).Error
}

// sendEmail renders and delivers the verification email. Delivery failures are
// swallowed: the committed account stays pending and the user can resend.
func (s *AccountRegistrationService) sendEmail(ctx context.Context, p pendingVerification) {
	subject, body, err := accountauth.RenderEmail("verify_email", p.locale, accountauth.EmailTemplateVar{
		DisplayName: p.displayName,
		ActionURL:   p.actionURL,
	})
	if err != nil {
		return
	}
	_ = s.sender.Send(ctx, accountauth.EmailMessage{
		To:        p.to,
		Locale:    p.locale,
		Subject:   subject,
		Body:      body,
		ActionURL: p.actionURL,
	})
}

// mapAccountConflict converts a PostgreSQL unique-violation on the normalized
// email into the stable account-auth error.
func mapAccountConflict(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return accountauth.NewFieldError(accountauth.CodeEmailAlreadyRegistered, "email", "That email address is already registered.")
	}
	return err
}
