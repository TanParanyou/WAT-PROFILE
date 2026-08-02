package services

import (
	"context"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
)

const (
	maxReauthAge = 10 * time.Minute
)

// AccountView is the public-facing account DTO. It exposes only community-safe
// fields and never touches temple-member private records.
type AccountView struct {
	ID              uuid.UUID `json:"id"`
	Email           string    `json:"email"`
	EmailVerified   bool      `json:"email_verified"`
	AccountStatus   string    `json:"account_status"`
	DisplayName     string    `json:"display_name"`
	AvatarURL       string    `json:"avatar_url,omitempty"`
	PreferredLocale string    `json:"preferred_locale"`
	Providers       []string  `json:"providers"`
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
	db       *gorm.DB
	clock    accountauth.Clock
	sessions sessionLogoutAller
}

// NewAccountProfileService builds the profile service. The sessions dependency
// revokes every session when an account is closed.
func NewAccountProfileService(db *gorm.DB, clock accountauth.Clock, sessions sessionLogoutAller) *AccountProfileService {
	return &AccountProfileService{db: db, clock: clock, sessions: sessions}
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
	}, nil
}

// UpdateProfile validates and persists the safe profile fields.
func (s *AccountProfileService) UpdateProfile(ctx context.Context, userID uuid.UUID, in UpdateProfileInput) (AccountView, error) {
	displayName := strings.TrimSpace(in.DisplayName)
	if len(displayName) < minDisplayName || len(displayName) > maxDisplayName {
		return AccountView{}, accountauth.NewFieldError(accountauth.CodeValidation, "display_name", "Display name must be between 2 and 80 characters.")
	}
	if !supportedLocale(in.PreferredLocale) {
		return AccountView{}, accountauth.NewFieldError(accountauth.CodeValidation, "locale", "Unsupported locale.")
	}
	if in.AvatarURL != "" {
		parsed, err := url.Parse(in.AvatarURL)
		if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
			return AccountView{}, accountauth.NewFieldError(accountauth.CodeValidation, "avatar_url", "Avatar URL must be a valid http(s) URL.")
		}
	}

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.First(&user, "id = ?", userID).Error; err != nil {
			return err
		}
		var profile models.AccountProfile
		if err := tx.First(&profile, "user_id = ?", userID).Error; err != nil {
			return err
		}
		profile.DisplayName = displayName
		profile.AvatarURL = in.AvatarURL
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

// CloseAccount marks the account closed after a recent authentication (at most
// maxReauthAge old). Password users must re-enter their password; Google-only
// users rely on a freshly verified Google assertion (fresh auth_time). Closure
// revokes every session and blanks profile visibility while retaining the row
// for later operational deletion.
func (s *AccountProfileService) CloseAccount(ctx context.Context, userID uuid.UUID, authTime time.Time, password string) error {
	now := s.clock.Now()
	if now.Sub(authTime) > maxReauthAge {
		return accountauth.NewError(accountauth.CodeReauthRequired, "Please re-authenticate to close your account.")
	}

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.First(&user, "id = ?", userID).Error; err != nil {
			return err
		}
		var identity models.AuthIdentity
		hasPasswordIdentity := tx.Where("user_id = ? AND provider = 'password'", userID).First(&identity).Error == nil
		if hasPasswordIdentity && identity.CredentialHash != nil {
			if password == "" {
				return accountauth.NewError(accountauth.CodeReauthRequired, "Please re-enter your password to close your account.")
			}
			if !checkPasswordAgainst(identity.CredentialHash, password) {
				return accountauth.NewError(accountauth.CodeInvalidCredentials, "Incorrect password.")
			}
		}

		user.AccountStatus = models.AccountStatusClosed
		user.IsActive = false
		user.UpdatedAt = now
		if err := tx.Save(&user).Error; err != nil {
			return err
		}

		var profile models.AccountProfile
		if err := tx.First(&profile, "user_id = ?", userID).Error; err != nil {
			return err
		}
		profile.AvatarURL = ""
		profile.UpdatedAt = now
		return tx.Save(&profile).Error
	})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return accountauth.NewError(accountauth.CodeTokenInvalid, "Account not found.")
		}
		return err
	}

	return s.sessions.LogoutAll(ctx, userID)
}

func checkPasswordAgainst(hash *string, password string) bool {
	if hash == nil {
		return false
	}
	return utils.CheckPasswordHash(password, *hash)
}
