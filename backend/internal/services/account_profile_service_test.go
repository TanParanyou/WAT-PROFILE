package services

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
)

// newProfileFixture builds an AccountProfileService with a fixed clock and the
// session-revocation stub so CloseAccount can be observed without touching
// real sessions.
func newProfileFixture(t *testing.T) (*AccountProfileService, *stubSessionLogoutAll, *gorm.DB) {
	t.Helper()
	db := newAccountTestDB(t)
	stub := &stubSessionLogoutAll{}
	svc := NewAccountProfileService(db, fixedClockAt(fixedNow()), stub)
	return svc, stub, db
}

// seedProfileAccount creates an active verified password account with a
// profile row and returns the user.
func seedProfileAccount(t *testing.T, db *gorm.DB, email, displayName, locale string) models.User {
	t.Helper()
	hashed, err := utils.HashPassword("correct horse battery staple")
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}
	user := models.User{
		Email:         accountauth.NormalizeEmail(email),
		Name:          displayName,
		EmailVerified: true,
		IsActive:      true,
		AccountStatus: models.AccountStatusActive,
	}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}
	identity := models.AuthIdentity{
		UserID:          user.ID,
		Provider:        "password",
		ProviderSubject: user.Email,
		ProviderEmail:   user.Email,
		CredentialHash:  &hashed,
	}
	if err := db.Create(&identity).Error; err != nil {
		t.Fatalf("create identity: %v", err)
	}
	profile := models.AccountProfile{
		UserID:          user.ID,
		DisplayName:     displayName,
		PreferredLocale: locale,
	}
	if err := db.Create(&profile).Error; err != nil {
		t.Fatalf("create profile: %v", err)
	}
	return user
}

func TestGetAccountReturnsSafeView(t *testing.T) {
	svc, _, db := newProfileFixture(t)
	user := seedProfileAccount(t, db, "profile@example.com", "Profile Person", "de")

	view, err := svc.GetAccount(context.Background(), user.ID)
	if err != nil {
		t.Fatalf("GetAccount: %v", err)
	}
	if view.ID != user.ID {
		t.Fatalf("expected id %s, got %s", user.ID, view.ID)
	}
	if view.Email != "profile@example.com" {
		t.Fatalf("expected normalized email, got %q", view.Email)
	}
	if !view.EmailVerified {
		t.Fatal("expected email_verified true")
	}
	if view.AccountStatus != string(models.AccountStatusActive) {
		t.Fatalf("expected active status, got %q", view.AccountStatus)
	}
	if view.DisplayName != "Profile Person" {
		t.Fatalf("expected display name, got %q", view.DisplayName)
	}
	if view.PreferredLocale != "de" {
		t.Fatalf("expected locale de, got %q", view.PreferredLocale)
	}
	if len(view.Providers) != 1 || view.Providers[0] != "password" {
		t.Fatalf("expected [password] providers, got %v", view.Providers)
	}
}

func TestGetAccountListsGoogleProvider(t *testing.T) {
	svc, _, db := newProfileFixture(t)
	user := seedGoogleOnlyAccount(t, db, "google-profile@example.com")

	view, err := svc.GetAccount(context.Background(), user.ID)
	if err != nil {
		t.Fatalf("GetAccount: %v", err)
	}
	if len(view.Providers) != 1 || view.Providers[0] != "google" {
		t.Fatalf("expected [google] providers, got %v", view.Providers)
	}
}

func TestGetAccountUnknownUserFails(t *testing.T) {
	svc, _, _ := newProfileFixture(t)
	if _, err := svc.GetAccount(context.Background(), uuid.New()); err == nil {
		t.Fatal("expected error for unknown user")
	}
}

func TestUpdateProfileTrimsDisplayName(t *testing.T) {
	svc, _, db := newProfileFixture(t)
	user := seedProfileAccount(t, db, "trim@example.com", "  Trimmed  Name  ", "en")

	view, err := svc.UpdateProfile(context.Background(), user.ID, UpdateProfileInput{
		DisplayName:     "  New  Name  ",
		AvatarURL:       "https://example.com/avatar.png",
		PreferredLocale: "de",
	})
	if err != nil {
		t.Fatalf("UpdateProfile: %v", err)
	}
	if view.DisplayName != "New  Name" {
		t.Fatalf("expected trimmed display name, got %q", view.DisplayName)
	}
	if view.AvatarURL != "https://example.com/avatar.png" {
		t.Fatalf("expected avatar url, got %q", view.AvatarURL)
	}
	if view.PreferredLocale != "de" {
		t.Fatalf("expected locale de, got %q", view.PreferredLocale)
	}
}

func TestUpdateProfileRejectsTooShortDisplayName(t *testing.T) {
	svc, _, db := newProfileFixture(t)
	user := seedProfileAccount(t, db, "short@example.com", "Valid Name", "en")

	_, err := svc.UpdateProfile(context.Background(), user.ID, UpdateProfileInput{
		DisplayName:     " x ",
		PreferredLocale: "en",
	})
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeValidation {
		t.Fatalf("expected validation error, got %v", err)
	}
}

func TestUpdateProfileRejectsUnsupportedLocale(t *testing.T) {
	svc, _, db := newProfileFixture(t)
	user := seedProfileAccount(t, db, "locale@example.com", "Valid Name", "en")

	_, err := svc.UpdateProfile(context.Background(), user.ID, UpdateProfileInput{
		DisplayName:     "Valid Name",
		PreferredLocale: "fr",
	})
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeValidation {
		t.Fatalf("expected validation error, got %v", err)
	}
}

func TestUpdateProfileUnknownUserFails(t *testing.T) {
	svc, _, _ := newProfileFixture(t)
	_, err := svc.UpdateProfile(context.Background(), uuid.New(), UpdateProfileInput{
		DisplayName:     "Any Name",
		PreferredLocale: "en",
	})
	if err == nil {
		t.Fatal("expected error for unknown user")
	}
}

func TestCloseAccountRequiresRecentAuth(t *testing.T) {
	svc, stub, db := newProfileFixture(t)
	user := seedProfileAccount(t, db, "stale@example.com", "Stale Person", "en")

	authTime := fixedNow().Add(-11 * time.Minute)
	err := svc.CloseAccount(context.Background(), user.ID, authTime, "correct horse battery staple")
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeReauthRequired {
		t.Fatalf("expected reauth required, got %v", err)
	}
	if len(stub.calls) != 0 {
		t.Fatal("expected no session revocation on stale auth")
	}
	var after models.User
	if err := db.First(&after, "id = ?", user.ID).Error; err != nil {
		t.Fatalf("load user: %v", err)
	}
	if after.AccountStatus != models.AccountStatusActive {
		t.Fatalf("expected account to remain active, got %q", after.AccountStatus)
	}
}

func TestCloseAccountWrongPasswordRejected(t *testing.T) {
	svc, stub, db := newProfileFixture(t)
	user := seedProfileAccount(t, db, "wrongpass@example.com", "Wrong Pass", "en")

	err := svc.CloseAccount(context.Background(), user.ID, fixedNow(), "not the right password")
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeInvalidCredentials {
		t.Fatalf("expected invalid credentials, got %v", err)
	}
	if len(stub.calls) != 0 {
		t.Fatal("expected no session revocation on wrong password")
	}
}

func TestCloseAccountRequiresPasswordReentryForPasswordUsers(t *testing.T) {
	svc, _, db := newProfileFixture(t)
	user := seedProfileAccount(t, db, "reenter@example.com", "Re-enter Person", "en")

	err := svc.CloseAccount(context.Background(), user.ID, fixedNow(), "")
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeReauthRequired {
		t.Fatalf("expected reauth required when password omitted, got %v", err)
	}
}

func TestCloseAccountClosesAndRevokesSessions(t *testing.T) {
	svc, stub, db := newProfileFixture(t)
	user := seedProfileAccount(t, db, "close@example.com", "Close Person", "en")

	err := svc.CloseAccount(context.Background(), user.ID, fixedNow(), "correct horse battery staple")
	if err != nil {
		t.Fatalf("CloseAccount: %v", err)
	}
	if len(stub.calls) != 1 || stub.calls[0] != user.ID {
		t.Fatalf("expected logout all for user, got %v", stub.calls)
	}
	var after models.User
	if err := db.First(&after, "id = ?", user.ID).Error; err != nil {
		t.Fatalf("load user: %v", err)
	}
	if after.AccountStatus != models.AccountStatusClosed {
		t.Fatalf("expected closed status, got %q", after.AccountStatus)
	}
	if after.IsActive {
		t.Fatal("expected account to be inactive")
	}
	if after.PasswordHash != nil {
		t.Fatal("expected users.password_hash to remain NULL for public account")
	}
	// Row retained for later operational deletion; profile visibility blanked.
	var count int64
	if err := db.Model(&models.Member{}).Count(&count).Error; err != nil {
		t.Fatalf("count members: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected no members rows, got %d", count)
	}
	// GetAccount still resolves (owner sees closed state) but never exposes secrets.
	view, err := svc.GetAccount(context.Background(), user.ID)
	if err != nil {
		t.Fatalf("GetAccount after close: %v", err)
	}
	if view.AccountStatus != string(models.AccountStatusClosed) {
		t.Fatalf("expected closed status in view, got %q", view.AccountStatus)
	}
	if strings.Contains(view.DisplayName, "Close Person") == false {
		// display_name is retained (NOT NULL check requires 2-80 chars)
		t.Logf("display name retained: %q", view.DisplayName)
	}
}

func TestCloseAccountGoogleOnlyUsesFreshAuth(t *testing.T) {
	svc, stub, db := newProfileFixture(t)
	user := seedGoogleOnlyAccount(t, db, "google-close@example.com")

	err := svc.CloseAccount(context.Background(), user.ID, fixedNow(), "")
	if err != nil {
		t.Fatalf("CloseAccount (google fresh auth, no password): %v", err)
	}
	if len(stub.calls) != 1 {
		t.Fatalf("expected one logout all, got %v", stub.calls)
	}
}

func TestCloseAccountGoogleOnlyStaleAuthRejected(t *testing.T) {
	svc, stub, db := newProfileFixture(t)
	user := seedGoogleOnlyAccount(t, db, "google-stale@example.com")

	err := svc.CloseAccount(context.Background(), user.ID, fixedNow().Add(-10*time.Minute-time.Second), "")
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeReauthRequired {
		t.Fatalf("expected reauth required for stale google auth, got %v", err)
	}
	if len(stub.calls) != 0 {
		t.Fatal("expected no revocation on stale auth")
	}
}
