package services

import (
	"context"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

const (
	maxReauthAge      = 10 * time.Minute
	accountPurgeDelay = 30 * 24 * time.Hour
)

// AccountView is the public-facing account DTO. It exposes only community-safe
// fields and never touches temple-member private records.
type AccountView struct {
	ID              uuid.UUID  `json:"id"`
	Email           string     `json:"email"`
	EmailVerified   bool       `json:"email_verified"`
	AccountStatus   string     `json:"account_status"`
	DisplayName     string     `json:"display_name"`
	AvatarURL       string     `json:"avatar_url"`
	PreferredLocale string     `json:"preferred_locale"`
	Providers       []string   `json:"providers"`
	PurgeAfter      *time.Time `json:"purge_after,omitempty"`
}

// UpdateProfileInput is the validated input for a public profile update.
type UpdateProfileInput struct {
	DisplayName     string `json:"display_name"`
	AvatarURL       string `json:"avatar_url"`
	PreferredLocale string `json:"preferred_locale"`
}

// AccountProfileService owns public account/profile reads, updates, and
// closure. It never creates or mutates members records.
type AccountProfileService struct {
	db         *gorm.DB
	clock      accountauth.Clock
	sessions   sessionLogoutAller
	sessionsTx sessionLogoutAllTxer
	security   accountauth.SecurityRecorder
}

// NewAccountProfileService builds the profile service. The sessions dependency
// revokes every session when an account is closed.
func NewAccountProfileService(db *gorm.DB, clock accountauth.Clock, sessions sessionLogoutAller, recorders ...accountauth.SecurityRecorder) *AccountProfileService {
	sessionsTx, _ := sessions.(sessionLogoutAllTxer)
	return &AccountProfileService{db: db, clock: clock, sessions: sessions, sessionsTx: sessionsTx, security: pickSecurityRecorder(recorders)}
}

// GetAccount returns the safe account view for the owner.
func (s *AccountProfileService) GetAccount(ctx context.Context, userID uuid.UUID) (AccountView, error) {
	var user models.User
	if err := s.db.WithContext(ctx).First(&user, "id = ?", userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return AccountView{}, accountauth.NewError(accountauth.CodeTokenInvalid, "Account not found.")
		}
		return AccountView{}, err
	}

	var profile models.AccountProfile
	if err := s.db.WithContext(ctx).First(&profile, "user_id = ?", userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return AccountView{}, accountauth.NewError(accountauth.CodeTokenInvalid, "Account profile not found.")
		}
		return AccountView{}, err
	}

	var identities []models.AuthIdentity
	if err := s.db.WithContext(ctx).Select("provider").Where("user_id = ?", userID).Find(&identities).Error; err != nil {
		return AccountView{}, err
	}
	providers := make([]string, 0, len(identities))
	seen := make(map[string]bool)
	for _, id := range identities {
		if !seen[id.Provider] {
			seen[id.Provider] = true
			providers = append(providers, id.Provider)
		}
	}

	return AccountView{
		ID:              user.ID,
		Email:           user.Email,
		EmailVerified:   user.EmailVerified,
		AccountStatus:   string(user.AccountStatus),
		DisplayName:     profile.DisplayName,
		AvatarURL:       profile.AvatarURL,
		PreferredLocale: profile.PreferredLocale,
		Providers:       providers,
		PurgeAfter:      user.PurgeAfter,
	}, nil
}

// UpdateProfile validates and persists the safe profile fields.
func (s *AccountProfileService) UpdateProfile(ctx context.Context, userID uuid.UUID, in UpdateProfileInput) (AccountView, error) {
	displayName := strings.TrimSpace(in.DisplayName)
	if !validDisplayName(displayName) {
		return AccountView{}, accountauth.NewFieldError(accountauth.CodeValidation, "display_name", "Display name must be between 2 and 80 characters.")
	}
	if !supportedLocale(in.PreferredLocale) {
		return AccountView{}, accountauth.NewFieldError(accountauth.CodeValidation, "locale", "Unsupported locale.")
	}
	if err := validateAvatarURL(in.AvatarURL); err != nil {
		return AccountView{}, err
	}

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, "id = ?", userID).Error; err != nil {
			return err
		}
		if user.AccountStatus != models.AccountStatusActive || !user.IsActive {
			return accountauth.NewError(accountauth.CodeAccountDisabled, "This account is not allowed to update its profile.")
		}
		var profile models.AccountProfile
		if err := tx.First(&profile, "user_id = ?", userID).Error; err != nil {
			return err
		}
		profile.DisplayName = displayName
		// Avatar changes go through SetAvatarURL after a server-side upload. Do
		// not erase a stored avatar when a profile form updates another field.
		if in.AvatarURL != "" {
			profile.AvatarURL = in.AvatarURL
		}
		profile.PreferredLocale = in.PreferredLocale
		profile.UpdatedAt = s.clock.Now()
		return tx.Save(&profile).Error
	})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return AccountView{}, accountauth.NewError(accountauth.CodeTokenInvalid, "Account not found.")
		}
		return AccountView{}, err
	}
	return s.GetAccount(ctx, userID)
}

// SetAvatarURL persists a server-generated avatar URL. Keeping this operation
// separate from UpdateProfile prevents clients from choosing arbitrary storage
// keys while still allowing existing OAuth avatar URLs to remain readable.
func (s *AccountProfileService) SetAvatarURL(ctx context.Context, userID uuid.UUID, avatarURL string) (AccountView, error) {
	return s.SetAvatar(ctx, userID, avatarURL, "")
}

// SetAvatar persists the server-generated URL and its private object key.
func (s *AccountProfileService) SetAvatar(ctx context.Context, userID uuid.UUID, avatarURL, objectKey string) (AccountView, error) {
	if err := validateAvatarURL(avatarURL); err != nil {
		return AccountView{}, err
	}
	if objectKey != "" && !isAccountAvatarObjectKey(userID, objectKey) {
		return AccountView{}, accountauth.NewError(accountauth.CodeValidation, "Avatar storage key is invalid.")
	}

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, "id = ?", userID).Error; err != nil {
			return err
		}
		if user.AccountStatus != models.AccountStatusActive || !user.IsActive {
			return accountauth.NewError(accountauth.CodeAccountDisabled, "This account is not allowed to update its profile.")
		}
		var profile models.AccountProfile
		if err := tx.First(&profile, "user_id = ?", userID).Error; err != nil {
			return err
		}
		if profile.AvatarObjectKey != "" && profile.AvatarObjectKey != objectKey && isAccountAvatarObjectKey(userID, profile.AvatarObjectKey) {
			cleanup := models.AccountAvatarCleanup{UserID: userID, ObjectKey: profile.AvatarObjectKey}
			if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&cleanup).Error; err != nil {
				return err
			}
		}
		profile.AvatarURL = avatarURL
		profile.AvatarObjectKey = objectKey
		profile.UpdatedAt = s.clock.Now()
		return tx.Save(&profile).Error
	})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return AccountView{}, accountauth.NewError(accountauth.CodeTokenInvalid, "Account not found.")
		}
		return AccountView{}, err
	}
	return s.GetAccount(ctx, userID)
}

// PendingAvatarCleanup returns replacement objects that still need deletion.
// The handler owns the storage call; this service owns the database state.
func (s *AccountProfileService) PendingAvatarCleanup(ctx context.Context, userID uuid.UUID) ([]models.AccountAvatarCleanup, error) {
	var pending []models.AccountAvatarCleanup
	err := s.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at ASC").Find(&pending).Error
	return pending, err
}

// MarkAvatarCleanupDeleted removes a cleanup record after storage confirms the
// object is gone. The user predicate prevents cross-account key deletion.
func (s *AccountProfileService) MarkAvatarCleanupDeleted(ctx context.Context, userID, cleanupID uuid.UUID) error {
	return s.db.WithContext(ctx).Where("id = ? AND user_id = ?", cleanupID, userID).Delete(&models.AccountAvatarCleanup{}).Error
}

// ClearAvatarObjectKey forgets the current object only after storage deletion
// has succeeded. Keeping it in the profile makes account purge retry-safe.
func (s *AccountProfileService) ClearAvatarObjectKey(ctx context.Context, userID uuid.UUID) error {
	return s.db.WithContext(ctx).Model(&models.AccountProfile{}).
		Where("user_id = ?", userID).Update("avatar_object_key", "").Error
}

func isAccountAvatarObjectKey(userID uuid.UUID, objectKey string) bool {
	return strings.HasPrefix(objectKey, "accounts/"+userID.String()+"/avatar/")
}

func validateAvatarURL(avatarURL string) error {
	if avatarURL == "" {
		return nil
	}
	parsed, err := url.Parse(avatarURL)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
		return accountauth.NewFieldError(accountauth.CodeValidation, "avatar_url", "Avatar URL must be a valid http(s) URL.")
	}
	return nil
}

// CloseAccount marks the account closed after a recent authentication (at most
// maxReauthAge old). Closure revokes every session and blanks profile
// visibility while retaining the row for later operational deletion.
func (s *AccountProfileService) CloseAccount(ctx context.Context, userID uuid.UUID, authTime time.Time) error {
	now := s.clock.Now()
	if authTime.IsZero() || now.Sub(authTime) > maxReauthAge {
		return accountauth.NewError(accountauth.CodeReauthRequired, "Please re-authenticate to close your account.")
	}

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, "id = ?", userID).Error; err != nil {
			return err
		}
		if user.AccountStatus != models.AccountStatusActive || !user.IsActive {
			return accountauth.NewError(accountauth.CodeAccountDisabled, "This account is not allowed to close.")
		}
		user.AccountStatus = models.AccountStatusClosed
		user.IsActive = false
		user.ClosedAt = &now
		purgeAfter := now.Add(accountPurgeDelay)
		user.PurgeAfter = &purgeAfter
		user.UpdatedAt = now
		if err := tx.Save(&user).Error; err != nil {
			return err
		}

		var profile models.AccountProfile
		if err := tx.First(&profile, "user_id = ?", userID).Error; err != nil {
			return err
		}
		profile.AvatarURL = ""
		// Keep the internal key until storage deletion succeeds. It is never
		// exposed in AccountView and gives the retention command a safe fallback
		// when an object store is temporarily unavailable during closure.
		profile.UpdatedAt = now
		if err := tx.Save(&profile).Error; err != nil {
			return err
		}
		if s.sessionsTx != nil {
			return s.sessionsTx.LogoutAllTx(tx, userID, now)
		}
		return nil
	})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "Account not found.")
		}
		return err
	}

	if s.sessionsTx == nil {
		if err := s.sessions.LogoutAll(ctx, userID); err != nil {
			return err
		}
	} else {
		s.security.Record(ctx, accountauth.SecurityEvent{UserID: userID.String(), EventType: "logout_all", Outcome: "success"})
	}
	s.security.Record(ctx, accountauth.SecurityEvent{UserID: userID.String(), EventType: "account_close", Outcome: "success"})
	return nil
}

// UnlinkGoogle disconnects a linked Google identity after recent
// authentication. The password identity is never removed and unrelated
// sessions are never revoked. A Google identity that is already absent is
// treated as an idempotent success.
func (s *AccountProfileService) UnlinkGoogle(ctx context.Context, userID uuid.UUID, authTime time.Time) error {
	now := s.clock.Now()
	if authTime.IsZero() || now.Sub(authTime) > maxReauthAge {
		return accountauth.NewError(accountauth.CodeReauthRequired, "Please re-authenticate to disconnect Google.")
	}

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, "id = ?", userID).Error; err != nil {
			return err
		}
		if user.AccountStatus != models.AccountStatusActive || !user.IsActive {
			return accountauth.NewError(accountauth.CodeAccountDisabled, "This account is not allowed to disconnect Google.")
		}
		var identity models.AuthIdentity
		if err := tx.Where("user_id = ? AND provider = 'password'", userID).First(&identity).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return accountauth.NewError(accountauth.CodeReauthRequired, "This account needs a password identity to disconnect Google.")
			}
			return err
		}
		if identity.CredentialHash == nil {
			return accountauth.NewError(accountauth.CodeReauthRequired, "This account needs a password identity to disconnect Google.")
		}
		if err := tx.Where("user_id = ? AND provider = 'google'", userID).Delete(&models.AuthIdentity{}).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return err
	}

	s.security.Record(ctx, accountauth.SecurityEvent{UserID: userID.String(), EventType: "google_unlink", Outcome: "success", Provider: "google"})
	return nil
}
