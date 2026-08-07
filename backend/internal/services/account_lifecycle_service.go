package services

import (
	"context"
	"errors"
	"os"
	"strings"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type AccountObjectDeleter interface {
	DeleteFile(context.Context, string) error
}

type AccountLifecycleService struct {
	db          *gorm.DB
	sender      accountauth.EmailSender
	clock       accountauth.Clock
	tokenGen    accountauth.TokenGenerator
	frontendURL string
	security    accountauth.SecurityRecorder
}

func NewAccountLifecycleService(db *gorm.DB, sender accountauth.EmailSender, clock accountauth.Clock, tokenGen accountauth.TokenGenerator, recorders ...accountauth.SecurityRecorder) *AccountLifecycleService {
	return &AccountLifecycleService{db: db, sender: sender, clock: clock, tokenGen: tokenGen, frontendURL: strings.TrimRight(os.Getenv("PUBLIC_ACCOUNT_FRONTEND_URL"), "/"), security: pickSecurityRecorder(recorders)}
}

func (s *AccountLifecycleService) RequestReopen(ctx context.Context, email, locale string) error {
	email = accountauth.NormalizeEmail(email)
	if !accountauth.ValidEmail(email) {
		return nil
	}
	if !supportedLocale(locale) {
		return accountauth.NewFieldError(accountauth.CodeValidation, "locale", "Unsupported locale.")
	}
	now := s.clock.Now()
	var message accountauth.EmailMessage
	var displayName string
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("lower(btrim(email)) = ? AND account_status = ? AND purge_after > ?", email, models.AccountStatusClosed, now).First(&user).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil
			}
			return err
		}
		displayName = user.Name
		if err := tx.Model(&models.AuthActionToken{}).Where("user_id = ? AND purpose = ? AND consumed_at IS NULL", user.ID, "reopen_account").Update("consumed_at", now).Error; err != nil {
			return err
		}
		raw, hash, err := s.tokenGen()
		if err != nil {
			return err
		}
		if err := tx.Create(&models.AuthActionToken{UserID: user.ID, Purpose: "reopen_account", TokenHash: hash, Payload: models.JSONMap{"locale": locale}, ExpiresAt: now.Add(30 * time.Minute)}).Error; err != nil {
			return err
		}
		message = accountauth.EmailMessage{To: user.Email, Locale: locale, ActionURL: s.frontendURL + "/" + locale + "/account/reopen?token=" + raw}
		return nil
	})
	if err != nil {
		return err
	}
	if message.To != "" {
		s.send(ctx, message, "reopen_account", accountauth.EmailTemplateVar{DisplayName: displayName, ActionURL: message.ActionURL})
	}
	return nil
}

func (s *AccountLifecycleService) ConfirmReopen(ctx context.Context, rawToken string) error {
	if rawToken == "" {
		return accountauth.NewError(accountauth.CodeTokenInvalid, "The account recovery link is invalid or has expired.")
	}
	now := s.clock.Now()
	hash := accountauth.HashOpaqueToken(rawToken)
	var user models.User
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var token models.AuthActionToken
		if err := tx.Where("token_hash = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > ?", hash, "reopen_account", now).First(&token).Error; err != nil {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The account recovery link is invalid or has expired.")
		}
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ? AND account_status = ? AND purge_after > ?", token.UserID, models.AccountStatusClosed, now).First(&user).Error; err != nil {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The account recovery link is invalid or has expired.")
		}
		if tx.Model(&models.AuthActionToken{}).Where("id = ? AND consumed_at IS NULL", token.ID).Update("consumed_at", now).RowsAffected != 1 {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "The account recovery link is invalid or has expired.")
		}
		user.AccountStatus = models.AccountStatusActive
		user.IsActive = true
		user.ClosedAt = nil
		user.PurgeAfter = nil
		if err := tx.Save(&user).Error; err != nil {
			return err
		}
		// Reopening never restores a previous browser/device session. This also
		// protects accounts closed before transactional revocation was deployed.
		return tx.Model(&models.AuthSession{}).
			Where("user_id = ? AND revoked_at IS NULL", user.ID).
			Updates(map[string]any{"revoked_at": now, "revoked_reason": "account_reopen", "updated_at": now}).Error
	})
	if err == nil {
		s.security.Record(ctx, accountauth.SecurityEvent{UserID: user.ID.String(), EventType: "account_reopen", Outcome: "success"})
	}
	return err
}

func (s *AccountLifecycleService) PurgeDue(ctx context.Context, deleter AccountObjectDeleter) (int, error) {
	now := s.clock.Now()
	if err := s.cleanupExpiredAuthArtifacts(ctx, now); err != nil {
		return 0, err
	}
	var users []models.User
	if err := s.db.WithContext(ctx).Where("account_status = ? AND purge_after IS NOT NULL AND purge_after <= ?", models.AccountStatusClosed, now).Find(&users).Error; err != nil {
		return 0, err
	}
	purged := 0
	for _, user := range users {
		skipped := false
		err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
			var current models.User
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ? AND account_status = ? AND purge_after IS NOT NULL AND purge_after <= ?", user.ID, models.AccountStatusClosed, now).First(&current).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					skipped = true
					return nil
				}
				return err
			}
			var profile models.AccountProfile
			profileErr := tx.Where("user_id = ?", current.ID).First(&profile).Error
			avatarKeys := make([]string, 0, 1)
			if profileErr == nil {
				if isAccountAvatarObjectKey(current.ID, profile.AvatarObjectKey) {
					avatarKeys = append(avatarKeys, profile.AvatarObjectKey)
				}
			} else if !errors.Is(profileErr, gorm.ErrRecordNotFound) {
				return profileErr
			}
			var pending []models.AccountAvatarCleanup
			if err := tx.Where("user_id = ?", current.ID).Find(&pending).Error; err != nil {
				return err
			}
			for _, item := range pending {
				if isAccountAvatarObjectKey(current.ID, item.ObjectKey) {
					avatarKeys = append(avatarKeys, item.ObjectKey)
				}
			}
			if len(avatarKeys) > 0 && deleter == nil {
				return errors.New("account avatar storage is not configured")
			}
			seenKeys := make(map[string]struct{}, len(avatarKeys))
			for _, key := range avatarKeys {
				if _, seen := seenKeys[key]; seen {
					continue
				}
				seenKeys[key] = struct{}{}
				if err := deleter.DeleteFile(ctx, key); err != nil {
					return err
				}
			}
			if err := tx.Model(&models.AuthSecurityEvent{}).Where("user_id = ?", current.ID).Updates(map[string]any{"user_id": nil, "ip_prefix": "", "request_trace_id": "", "metadata": models.JSONMap{}}).Error; err != nil {
				return err
			}
			return tx.Delete(&models.User{}, "id = ?", current.ID).Error
		})
		if err != nil {
			return purged, err
		}
		if skipped {
			continue
		}
		purged++
	}
	return purged, nil
}

// cleanupExpiredAuthArtifacts removes abandoned one-time credentials and OAuth
// state, including anonymous OAuth flows that cannot be removed by user
// cascade when an account is purged.
func (s *AccountLifecycleService) cleanupExpiredAuthArtifacts(ctx context.Context, now time.Time) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("expires_at <= ?", now).Delete(&models.AuthOAuthFlow{}).Error; err != nil {
			return err
		}
		return tx.Where("expires_at <= ?", now).Delete(&models.AuthActionToken{}).Error
	})
}

func (s *AccountLifecycleService) send(ctx context.Context, message accountauth.EmailMessage, purpose string, vars accountauth.EmailTemplateVar) {
	if s.sender == nil {
		return
	}
	subject, body, err := accountauth.RenderEmail(purpose, message.Locale, vars)
	if err != nil {
		return
	}
	message.Subject = subject
	message.Body = body
	_ = s.sender.Send(ctx, message)
}
