package services

import (
	"context"
	"errors"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const emailChangeTokenTTL = 30 * time.Minute

type AccountCredentialsService struct {
	db          *gorm.DB
	sender      accountauth.EmailSender
	clock       accountauth.Clock
	tokenGen    accountauth.TokenGenerator
	sessions    sessionLogoutAller
	sessionsTx  sessionLogoutAllTxer
	frontendURL string
	security    accountauth.SecurityRecorder
}

func NewAccountCredentialsService(db *gorm.DB, sender accountauth.EmailSender, clock accountauth.Clock, tokenGen accountauth.TokenGenerator, sessions sessionLogoutAller, recorders ...accountauth.SecurityRecorder) *AccountCredentialsService {
	sessionsTx, _ := sessions.(sessionLogoutAllTxer)
	return &AccountCredentialsService{db: db, sender: sender, clock: clock, tokenGen: tokenGen, sessions: sessions, sessionsTx: sessionsTx, frontendURL: strings.TrimRight(os.Getenv("PUBLIC_ACCOUNT_FRONTEND_URL"), "/"), security: pickSecurityRecorder(recorders)}
}

func (s *AccountCredentialsService) RequestEmailChange(ctx context.Context, userID uuid.UUID, authTime time.Time, newEmail, locale string) error {
	newEmail = accountauth.NormalizeEmail(newEmail)
	if !accountauth.ValidEmail(newEmail) {
		return accountauth.NewFieldError(accountauth.CodeValidation, "email", "Enter a valid email address.")
	}
	if !supportedLocale(locale) {
		return accountauth.NewFieldError(accountauth.CodeValidation, "locale", "Unsupported locale.")
	}
	now := s.clock.Now()
	if authTime.IsZero() || now.Sub(authTime) > maxReauthAge {
		return accountauth.NewError(accountauth.CodeReauthRequired, "Please re-authenticate before changing your email.")
	}
	var message accountauth.EmailMessage
	var displayName string
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, "id = ?", userID).Error; err != nil {
			return err
		}
		if user.AccountStatus != models.AccountStatusActive || !user.IsActive {
			return accountauth.NewError(accountauth.CodeAccountDisabled, "This account is not allowed to change credentials.")
		}
		displayName = user.Name
		if accountauth.NormalizeEmail(user.Email) == newEmail {
			return accountauth.NewFieldError(accountauth.CodeValidation, "new_email", "The new email must be different from the current email.")
		}
		var other models.User
		if err := tx.Where("lower(btrim(email)) = ? AND id <> ?", newEmail, userID).First(&other).Error; err == nil {
			return accountauth.NewError(accountauth.CodeEmailAlreadyRegistered, "That email address is already registered.")
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if err := tx.Model(&models.AuthActionToken{}).Where("user_id = ? AND purpose = ? AND consumed_at IS NULL", userID, "change_email").Update("consumed_at", now).Error; err != nil {
			return err
		}
		raw, hash, err := s.tokenGen()
		if err != nil {
			return err
		}
		if err := tx.Create(&models.AuthActionToken{UserID: userID, Purpose: "change_email", TokenHash: hash, Payload: models.JSONMap{"email": newEmail, "locale": locale, "old_email": user.Email}, ExpiresAt: now.Add(emailChangeTokenTTL)}).Error; err != nil {
			return err
		}
		message = accountauth.EmailMessage{To: newEmail, Locale: locale, ActionURL: s.frontendURL + "/" + locale + "/account/confirm-email-change?token=" + raw}
		return nil
	})
	if err != nil {
		return err
	}
	if err := s.send(ctx, message, "change_email", accountauth.EmailTemplateVar{DisplayName: displayName, ActionURL: message.ActionURL}); err != nil {
		return accountauth.NewError(accountauth.CodeInternal, "Unable to deliver the email confirmation message.")
	}
	return nil
}

func (s *AccountCredentialsService) ConfirmEmailChange(ctx context.Context, rawToken string) error {
	if rawToken == "" {
		return accountauth.NewError(accountauth.CodeTokenInvalid, "The email confirmation link is invalid or has expired.")
	}
	now := s.clock.Now()
	hash := accountauth.HashOpaqueToken(rawToken)
	var user models.User
	var oldEmail, newEmail string
	var locale string
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var token models.AuthActionToken
		if err := tx.Where("token_hash = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > ?", hash, "change_email", now).First(&token).Error; err != nil {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The email confirmation link is invalid or has expired.")
		}
		value, ok := token.Payload["email"].(string)
		if !ok || !accountauth.ValidEmail(value) {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The email confirmation link is invalid or has expired.")
		}
		newEmail = value
		if value, ok := token.Payload["locale"].(string); ok {
			locale = value
		}
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", token.UserID).First(&user).Error; err != nil {
			return err
		}
		if user.AccountStatus != models.AccountStatusActive || !user.IsActive {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The email confirmation link is invalid or has expired.")
		}
		if tx.Model(&models.AuthActionToken{}).Where("id = ? AND consumed_at IS NULL", token.ID).Update("consumed_at", now).RowsAffected != 1 {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The email confirmation link is invalid or has expired.")
		}
		oldEmail = user.Email
		var conflict models.User
		if err := tx.Where("lower(btrim(email)) = ? AND id <> ?", newEmail, user.ID).First(&conflict).Error; err == nil {
			return accountauth.NewError(accountauth.CodeEmailAlreadyRegistered, "That email address is already registered.")
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		user.Email = newEmail
		user.EmailVerified = true
		if err := tx.Save(&user).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.AuthActionToken{}).
			Where("user_id = ? AND purpose = ? AND consumed_at IS NULL", user.ID, "change_email").
			Update("consumed_at", now).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.AuthIdentity{}).Where("user_id = ? AND provider = 'password'", user.ID).Updates(map[string]any{"provider_email": newEmail, "provider_subject": newEmail}).Error; err != nil {
			return err
		}
		if s.sessionsTx != nil {
			if err := s.sessionsTx.LogoutAllTx(tx, user.ID, now); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return err
	}
	if s.sessionsTx == nil {
		if err := s.sessions.LogoutAll(ctx, user.ID); err != nil {
			return err
		}
	} else {
		s.security.Record(ctx, accountauth.SecurityEvent{UserID: user.ID.String(), EventType: "logout_all", Outcome: "success"})
	}
	if locale == "" {
		locale = "en"
	}
	_ = s.send(ctx, accountauth.EmailMessage{To: oldEmail, Locale: locale}, "email_changed", accountauth.EmailTemplateVar{DisplayName: user.Name})
	s.security.Record(ctx, accountauth.SecurityEvent{UserID: user.ID.String(), EventType: "email_changed", Outcome: "success"})
	return nil
}

func (s *AccountCredentialsService) send(ctx context.Context, message accountauth.EmailMessage, purpose string, vars accountauth.EmailTemplateVar) error {
	if s.sender == nil {
		return nil
	}
	subject, body, err := accountauth.RenderEmail(purpose, message.Locale, vars)
	if err != nil {
		return err
	}
	message.Subject = subject
	message.Body = body
	return s.sender.Send(ctx, message)
}
