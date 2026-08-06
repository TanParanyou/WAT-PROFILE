package services

import (
	"context"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
)

// stubSessionLogoutAll records LogoutAll calls so recovery/profile tests do not
// need a full session service.
type stubSessionLogoutAll struct {
	calls  []uuid.UUID
	revoke bool
}

func (s *stubSessionLogoutAll) LogoutAll(ctx context.Context, userID uuid.UUID) error {
	s.calls = append(s.calls, userID)
	return nil
}

// newRecoveryFixture builds the recovery service with a capture sender and
// fixed clock plus a stubbed session revoker.
func newRecoveryFixture(t *testing.T) (*AccountRecoveryService, *fakeEmailSender, *gorm.DB, *stubSessionLogoutAll) {
	t.Helper()
	db := newAccountTestDB(t)
	sender := &fakeEmailSender{}
	stub := &stubSessionLogoutAll{}
	svc := NewAccountRecoveryService(db, sender, fixedClockAt(fixedNow()), accountauth.NewOpaqueToken, stub)
	return svc, sender, db, stub
}

// issueResetToken requests a reset for the given email and returns the raw
// token extracted from the captured email link.
func issueResetToken(t *testing.T, svc *AccountRecoveryService, sender *fakeEmailSender, email string) string {
	t.Helper()
	if err := svc.RequestPasswordReset(context.Background(), email, "en"); err != nil {
		t.Fatalf("RequestPasswordReset: %v", err)
	}
	if sender.count() == 0 {
		t.Fatalf("expected reset email to be captured")
	}
	last := sender.messages[sender.count()-1]
	if last.ActionURL == "" {
		t.Fatalf("expected reset email to carry an action URL")
	}
	if !strings.Contains(last.ActionURL, "/en/account/reset-password?token=") {
		t.Fatalf("reset URL must target the account route, got %q", last.ActionURL)
	}
	return extractQueryParam(t, last.ActionURL, "token")
}

func extractQueryParam(t *testing.T, rawURL, key string) string {
	t.Helper()
	u, err := url.Parse(rawURL)
	if err != nil {
		t.Fatalf("parse action url %q: %v", rawURL, err)
	}
	return u.Query().Get(key)
}

// seedGoogleOnlyAccount creates an active user with a google identity and no
// password identity.
func seedGoogleOnlyAccount(t *testing.T, db *gorm.DB, email string) models.User {
	t.Helper()
	normalized := accountauth.NormalizeEmail(email)
	user := models.User{Email: normalized, Name: "Google Only", EmailVerified: true, IsActive: true, AccountStatus: models.AccountStatusActive}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}
	identity := models.AuthIdentity{
		UserID: user.ID, Provider: "google", ProviderSubject: "google-sub-" + uuid.NewString(),
		ProviderEmail: normalized, CredentialHash: nil,
	}
	if err := db.Create(&identity).Error; err != nil {
		t.Fatalf("create google identity: %v", err)
	}
	if err := db.Create(&models.AccountProfile{UserID: user.ID, DisplayName: "Google Only", PreferredLocale: "en"}).Error; err != nil {
		t.Fatalf("create profile: %v", err)
	}
	return user
}

func TestRequestPasswordResetSendsEmail(t *testing.T) {
	svc, sender, db, _ := newRecoveryFixture(t)
	user := seedVerifiedPasswordAccount(t, db, "recover@example.com")

	if err := svc.RequestPasswordReset(context.Background(), "recover@example.com", "en"); err != nil {
		t.Fatalf("RequestPasswordReset: %v", err)
	}
	if sender.count() != 1 {
		t.Fatalf("expected 1 email, got %d", sender.count())
	}
	if sender.messages[0].To != "recover@example.com" {
		t.Fatalf("email to %q", sender.messages[0].To)
	}
	var tokens int64
	db.Model(&models.AuthActionToken{}).Where("user_id = ? AND purpose = ? AND consumed_at IS NULL", user.ID, "reset_password").Count(&tokens)
	if tokens != 1 {
		t.Fatalf("expected 1 active reset token, got %d", tokens)
	}
}

func TestRequestPasswordResetInvalidatesPreviousToken(t *testing.T) {
	svc, sender, db, _ := newRecoveryFixture(t)
	seedVerifiedPasswordAccount(t, db, "rotate-reset@example.com")
	first := issueResetToken(t, svc, sender, "rotate-reset@example.com")
	second := issueResetToken(t, svc, sender, "rotate-reset@example.com")
	if first == second {
		t.Fatal("expected reset token rotation")
	}
	if err := svc.ResetPassword(context.Background(), first, "Abcdefghijk1"); accountauth.ErrorCode(err) != accountauth.CodeTokenInvalid {
		t.Fatalf("expected prior reset token to be invalid, got %v", err)
	}
	if err := svc.ResetPassword(context.Background(), second, "Abcdefghijk1"); err != nil {
		t.Fatalf("latest reset token should remain usable: %v", err)
	}
}

func TestRequestPasswordResetRejectsUnsupportedLocaleBeforeIssuingToken(t *testing.T) {
	svc, sender, db, _ := newRecoveryFixture(t)
	seedVerifiedPasswordAccount(t, db, "invalid-locale@example.com")
	if err := svc.RequestPasswordReset(context.Background(), "invalid-locale@example.com", "fr"); accountauth.ErrorCode(err) != accountauth.CodeValidation {
		t.Fatalf("expected locale validation error, got %v", err)
	}
	if sender.count() != 0 {
		t.Fatalf("unsupported locale must not send email, got %d", sender.count())
	}
	var tokens int64
	db.Model(&models.AuthActionToken{}).Where("purpose = ?", "reset_password").Count(&tokens)
	if tokens != 0 {
		t.Fatalf("unsupported locale must not issue reset token, got %d", tokens)
	}
}

func TestRequestPasswordResetGenericForUnknownEmail(t *testing.T) {
	svc, sender, _, _ := newRecoveryFixture(t)
	if err := svc.RequestPasswordReset(context.Background(), "nobody@example.com", "en"); err != nil {
		t.Fatalf("expected generic nil for unknown email, got %v", err)
	}
	if sender.count() != 0 {
		t.Fatalf("expected no email for unknown account, got %d", sender.count())
	}
}

func TestRequestPasswordResetGoogleOnlyInformationalEmail(t *testing.T) {
	svc, sender, db, _ := newRecoveryFixture(t)
	user := seedGoogleOnlyAccount(t, db, "google-only@example.com")

	if err := svc.RequestPasswordReset(context.Background(), "google-only@example.com", "en"); err != nil {
		t.Fatalf("RequestPasswordReset: %v", err)
	}
	if sender.count() != 1 {
		t.Fatalf("expected 1 informational email, got %d", sender.count())
	}
	// The neutral message must not contain a reset action link.
	if sender.messages[0].ActionURL != "" {
		t.Fatalf("google-only email must not carry a reset link, got %q", sender.messages[0].ActionURL)
	}
	var tokens int64
	db.Model(&models.AuthActionToken{}).Where("user_id = ? AND purpose = ?", user.ID, "reset_password").Count(&tokens)
	if tokens != 0 {
		t.Fatalf("expected no reset token for google-only account, got %d", tokens)
	}
}

func TestResetPasswordRevokesAllSessions(t *testing.T) {
	svc, sender, db, stub := newRecoveryFixture(t)
	user := seedVerifiedPasswordAccount(t, db, "reset@example.com")
	raw := issueResetToken(t, svc, sender, "reset@example.com")

	if err := svc.ResetPassword(context.Background(), raw, "Abcdefghijk1"); err != nil {
		t.Fatalf("ResetPassword: %v", err)
	}
	if len(stub.calls) != 1 || stub.calls[0] != user.ID {
		t.Fatalf("expected LogoutAll for %s, got %v", user.ID, stub.calls)
	}
	var consumed int64
	db.Model(&models.AuthActionToken{}).Where("token_hash = ? AND consumed_at IS NOT NULL", accountauth.HashOpaqueToken(raw)).Count(&consumed)
	if consumed != 1 {
		t.Fatalf("expected reset token consumed")
	}
	// Password identity hash must be replaced.
	var identity models.AuthIdentity
	if err := db.Where("user_id = ? AND provider = ?", user.ID, "password").First(&identity).Error; err != nil {
		t.Fatalf("load identity: %v", err)
	}
	if identity.CredentialHash == nil || !checkHashMatches("Abcdefghijk1", *identity.CredentialHash) {
		t.Fatalf("password hash was not replaced")
	}
	// password-changed notification email
	if sender.count() < 2 {
		t.Fatalf("expected password-changed notification, got %d emails", sender.count())
	}
}

func checkHashMatches(password, hash string) bool {
	return utils.CheckPasswordHash(password, hash)
}

func TestResetPasswordExpiredRejected(t *testing.T) {
	db := newAccountTestDB(t)
	sender := &fakeEmailSender{}
	stub := &stubSessionLogoutAll{}
	svc := NewAccountRecoveryService(db, sender, fixedClockAt(fixedNow()), accountauth.NewOpaqueToken, stub)
	user := seedVerifiedPasswordAccount(t, db, "expired@example.com")

	// Issue with normal clock, then verify with a clock 31 minutes later.
	if err := svc.RequestPasswordReset(context.Background(), "expired@example.com", "en"); err != nil {
		t.Fatalf("RequestPasswordReset: %v", err)
	}
	raw := extractQueryParam(t, sender.messages[0].ActionURL, "token")

	expiredSvc := NewAccountRecoveryService(db, sender, fixedClockAt(fixedNow().Add(31*time.Minute)), accountauth.NewOpaqueToken, stub)
	if err := expiredSvc.ResetPassword(context.Background(), raw, "Abcdefghijk1"); err == nil {
		t.Fatalf("expected expired token rejection")
	} else if accountauth.ErrorCode(err) != accountauth.CodeTokenInvalid {
		t.Fatalf("expected CodeTokenInvalid, got %v", accountauth.ErrorCode(err))
	}
	// user must still have old password
	var identity models.AuthIdentity
	db.Where("user_id = ? AND provider = ?", user.ID, "password").First(&identity)
	if identity.CredentialHash == nil || !checkHashMatches("correct horse battery staple", *identity.CredentialHash) {
		t.Fatalf("password changed despite expired token")
	}
}

func TestResetPasswordRaceSingleUse(t *testing.T) {
	svc, sender, db, _ := newRecoveryFixture(t)
	seedVerifiedPasswordAccount(t, db, "race@example.com")
	raw := issueResetToken(t, svc, sender, "race@example.com")

	results := make(chan error, 2)
	for i := 0; i < 2; i++ {
		go func() {
			results <- svc.ResetPassword(context.Background(), raw, "Abcdefghijk1")
		}()
	}
	successes := 0
	for i := 0; i < 2; i++ {
		if err := <-results; err == nil {
			successes++
		}
	}
	if successes != 1 {
		t.Fatalf("expected exactly 1 successful reset, got %d", successes)
	}
}

func TestResetPasswordBounds(t *testing.T) {
	svc, sender, db, _ := newRecoveryFixture(t)
	seedVerifiedPasswordAccount(t, db, "bounds@example.com")
	raw := issueResetToken(t, svc, sender, "bounds@example.com")

	if err := svc.ResetPassword(context.Background(), raw, "short"); err == nil {
		t.Fatalf("expected short password rejection")
	}
	if err := svc.ResetPassword(context.Background(), raw, "abcdefghijkl!"); err == nil {
		t.Fatalf("expected password with only two character groups to be rejected")
	}
	tooLong := make([]byte, 129)
	for i := range tooLong {
		tooLong[i] = 'a'
	}
	if err := svc.ResetPassword(context.Background(), raw, string(tooLong)); err == nil {
		t.Fatalf("expected long password rejection")
	}
}

func TestResetPasswordGoogleOnlyRejected(t *testing.T) {
	svc, sender, db, _ := newRecoveryFixture(t)
	seedGoogleOnlyAccount(t, db, "go-reset@example.com")

	// google-only flow sends an informational email; there is no token, so a
	// fabricated token must fail generically.
	if err := svc.ResetPassword(context.Background(), "fabricated-token", "Abcdefghijk1"); err == nil {
		t.Fatalf("expected reset to fail for google-only account")
	}
	_ = sender
}

func TestRequestPasswordResetDisabledAccountNoEmail(t *testing.T) {
	svc, sender, db, _ := newRecoveryFixture(t)
	user := seedVerifiedPasswordAccount(t, db, "disabled@example.com")
	db.Model(&user).Update("account_status", string(models.AccountStatusDisabled))

	if err := svc.RequestPasswordReset(context.Background(), "disabled@example.com", "en"); err != nil {
		t.Fatalf("expected generic nil, got %v", err)
	}
	if sender.count() != 0 {
		t.Fatalf("expected no email for disabled account, got %d", sender.count())
	}
}
