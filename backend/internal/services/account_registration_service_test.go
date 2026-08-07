package services

import (
	"context"
	"errors"
	"net/url"
	"os"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// fixedClock returns a deterministic clock used by service tests.
type fixedClock struct{ now time.Time }

func (c fixedClock) Now() time.Time { return c.now }

func fixedNow() time.Time {
	return time.Date(2026, 8, 2, 12, 0, 0, 0, time.UTC)
}

func fixedClockAt(t time.Time) accountauth.Clock { return fixedClock{now: t} }

// fakeEmailSender records delivered messages and can inject a delivery failure.
type fakeEmailSender struct {
	mu       sync.Mutex
	messages []accountauth.EmailMessage
	err      error
}

func (s *fakeEmailSender) Send(_ context.Context, m accountauth.EmailMessage) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.messages = append(s.messages, m)
	return s.err
}

func (s *fakeEmailSender) count() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return len(s.messages)
}

// newAccountTestDB opens an isolated test database and migrates every model the
// registration service touches, including members, so the "no temple member is
// created" assertion can count real rows.
func newAccountTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	dsn := os.Getenv("DATABASE_URL_TEST")
	if dsn == "" {
		t.Skip("DATABASE_URL_TEST is not configured")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("get sql database: %v", err)
	}
	t.Cleanup(func() { _ = sqlDB.Close() })

	if err := db.AutoMigrate(
		&models.Role{},
		&models.User{},
		&models.Member{},
		&models.AccountProfile{},
		&models.AccountAvatarCleanup{},
		&models.AuthIdentity{},
		&models.AuthActionToken{},
		&models.AuthSession{},
		&models.AuthOAuthFlow{},
		&models.AuthSecurityEvent{},
	); err != nil {
		t.Fatalf("migrate account auth models: %v", err)
	}

	// Every test shares one disposable database, so each test starts from an
	// empty state. CASCADE also clears any rows referencing the tables above.
	if err := db.Exec(
		"TRUNCATE auth_security_events, auth_sessions, auth_action_tokens, auth_identities, auth_oauth_flows, account_avatar_cleanups, account_profiles, members, users, roles RESTART IDENTITY CASCADE",
	).Error; err != nil {
		t.Fatalf("reset test tables: %v", err)
	}

	return db
}

func rowCount(t *testing.T, db *gorm.DB, table string) int64 {
	t.Helper()
	var count int64
	if err := db.Table(table).Count(&count).Error; err != nil {
		t.Fatalf("count %s: %v", table, err)
	}
	return count
}

func newRegistrationFixture(t *testing.T, db *gorm.DB, sender *fakeEmailSender) *AccountRegistrationService {
	t.Helper()
	return NewAccountRegistrationService(db, sender, fixedClockAt(fixedNow()), accountauth.NewOpaqueToken)
}

func TestRegisterPasswordCreatesNoTempleMember(t *testing.T) {
	db := newAccountTestDB(t)
	sender := &fakeEmailSender{}
	service := newRegistrationFixture(t, db, sender)

	err := service.RegisterPassword(context.Background(), RegisterPasswordInput{
		Email:       " Visitor@Example.DE ",
		Password:    "Abcdefghijk1",
		DisplayName: "Visitor",
		Locale:      "de",
	})
	if err != nil {
		t.Fatalf("register: %v", err)
	}
	if got := rowCount(t, db, "users"); got != 1 {
		t.Fatalf("expected 1 user, got %d", got)
	}
	if got := rowCount(t, db, "account_profiles"); got != 1 {
		t.Fatalf("expected 1 account profile, got %d", got)
	}
	if got := rowCount(t, db, "auth_identities"); got != 1 {
		t.Fatalf("expected 1 auth identity, got %d", got)
	}
	if got := rowCount(t, db, "members"); got != 0 {
		t.Fatalf("registration must not create temple members, got %d", got)
	}
	if sender.count() != 1 {
		t.Fatalf("expected 1 verification email, got %d", sender.count())
	}
	if sender.messages[0].To != "visitor@example.de" {
		t.Fatalf("expected normalized recipient, got %q", sender.messages[0].To)
	}
	if !strings.Contains(sender.messages[0].ActionURL, "/de/account/verify-email?token=") {
		t.Fatalf("verification URL must target the account route, got %q", sender.messages[0].ActionURL)
	}

	var user models.User
	if err := db.First(&user, "email = ?", "visitor@example.de").Error; err != nil {
		t.Fatalf("load user: %v", err)
	}
	if user.AccountStatus != models.AccountStatusPendingVerification {
		t.Fatalf("expected pending_verification, got %q", user.AccountStatus)
	}
	// Public password credentials live only in auth_identities; users.password_hash
	// stays NULL so the legacy Admin login treats the row as an authentication
	// failure until a role grants Admin access.
	if user.PasswordHash != nil {
		t.Fatal("expected users.password_hash to remain NULL for public accounts")
	}

	var identity models.AuthIdentity
	if err := db.First(&identity, "user_id = ? AND provider = ?", user.ID, "password").Error; err != nil {
		t.Fatalf("load password identity: %v", err)
	}
	if identity.CredentialHash == nil || *identity.CredentialHash == "" {
		t.Fatal("expected auth_identities to store the password hash")
	}
}

func TestRegisterPasswordDisplayNameUnicodeLength(t *testing.T) {
	tests := []struct {
		name        string
		email       string
		displayName string
		wantErr     bool
	}{
		{name: "thai accepted", email: "thai@example.com", displayName: strings.Repeat("ก", 80)},
		{name: "german accepted", email: "german@example.com", displayName: strings.Repeat("ä", 80)},
		{name: "emoji accepted", email: "emoji@example.com", displayName: strings.Repeat("🙂", 80)},
		{name: "one code point rejected", email: "short@example.com", displayName: "ก", wantErr: true},
		{name: "eighty one code points rejected", email: "long@example.com", displayName: strings.Repeat("🙂", 81), wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db := newAccountTestDB(t)
			service := newRegistrationFixture(t, db, &fakeEmailSender{})
			err := service.RegisterPassword(context.Background(), RegisterPasswordInput{
				Email:       tt.email,
				Password:    "Abcdefghijk1",
				DisplayName: tt.displayName,
				Locale:      "en",
			})
			if tt.wantErr {
				if err == nil || accountauth.ErrorCode(err) != accountauth.CodeValidation {
					t.Fatalf("expected validation error, got %v", err)
				}
				return
			}
			if err != nil {
				t.Fatalf("expected display name to be accepted, got %v", err)
			}
		})
	}
}

func TestValidDisplayNameUnicodeLength(t *testing.T) {
	tests := []struct {
		name        string
		displayName string
		want        bool
	}{
		{name: "thai at maximum", displayName: strings.Repeat("ก", 80), want: true},
		{name: "german at maximum", displayName: strings.Repeat("ä", 80), want: true},
		{name: "emoji at maximum", displayName: strings.Repeat("🙂", 80), want: true},
		{name: "one code point", displayName: "ก", want: false},
		{name: "emoji over maximum", displayName: strings.Repeat("🙂", 81), want: false},
		{name: "trimmed boundary", displayName: "  กข  ", want: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := validDisplayName(tt.displayName); got != tt.want {
				t.Fatalf("validDisplayName(%q) = %v, want %v", tt.displayName, got, tt.want)
			}
		})
	}
}

func TestRegisterPasswordRejectsShortPassword(t *testing.T) {
	db := newAccountTestDB(t)
	service := newRegistrationFixture(t, db, &fakeEmailSender{})

	err := service.RegisterPassword(context.Background(), RegisterPasswordInput{
		Email: "visitor@example.com", Password: "short", DisplayName: "Visitor", Locale: "en",
	})
	if err == nil {
		t.Fatal("expected short password to be rejected")
	}
	var authErr *accountauth.Error
	if !errors.As(err, &authErr) || authErr.Code != accountauth.CodeValidation {
		t.Fatalf("expected validation error, got %v", err)
	}
	if got := rowCount(t, db, "users"); got != 0 {
		t.Fatalf("expected no user created, got %d", got)
	}
}

func TestRegisterPasswordRejectsPasswordWithTooFewCharacterGroups(t *testing.T) {
	db := newAccountTestDB(t)
	service := newRegistrationFixture(t, db, &fakeEmailSender{})

	err := service.RegisterPassword(context.Background(), RegisterPasswordInput{
		Email: "visitor@example.com", Password: "abcdefghijkl!", DisplayName: "Visitor", Locale: "en",
	})
	if err == nil {
		t.Fatal("expected password with only two character groups to be rejected")
	}
	var authErr *accountauth.Error
	if !errors.As(err, &authErr) || authErr.Code != accountauth.CodeValidation || authErr.Field != "password" {
		t.Fatalf("expected password validation error, got %v", err)
	}
}

func TestRegisterPasswordRejectsUnsupportedLocale(t *testing.T) {
	db := newAccountTestDB(t)
	service := newRegistrationFixture(t, db, &fakeEmailSender{})

	err := service.RegisterPassword(context.Background(), RegisterPasswordInput{
		Email: "visitor@example.com", Password: "Abcdefghijk1",
		DisplayName: "Visitor", Locale: "fr",
	})
	if err == nil {
		t.Fatal("expected unsupported locale to be rejected")
	}
	if got := rowCount(t, db, "users"); got != 0 {
		t.Fatalf("expected no user created, got %d", got)
	}
}

func TestRegisterPasswordRejectsDisplayNameTooShort(t *testing.T) {
	db := newAccountTestDB(t)
	service := newRegistrationFixture(t, db, &fakeEmailSender{})

	err := service.RegisterPassword(context.Background(), RegisterPasswordInput{
		Email: "visitor@example.com", Password: "Abcdefghijk1",
		DisplayName: "   ", Locale: "en",
	})
	if err == nil {
		t.Fatal("expected blank display name to be rejected")
	}
	if got := rowCount(t, db, "users"); got != 0 {
		t.Fatalf("expected no user created, got %d", got)
	}
}

func TestRegisterPasswordDuplicateUnverifiedEmailResends(t *testing.T) {
	db := newAccountTestDB(t)
	sender := &fakeEmailSender{}
	service := newRegistrationFixture(t, db, sender)

	input := RegisterPasswordInput{
		Email: "visitor@example.com", Password: "Abcdefghijk1",
		DisplayName: "Visitor", Locale: "en",
	}
	if err := service.RegisterPassword(context.Background(), input); err != nil {
		t.Fatalf("first register: %v", err)
	}

	// A repeated registration for an existing unverified email returns the same
	// generic result and may resend the verification email.
	if err := service.RegisterPassword(context.Background(), input); err != nil {
		t.Fatalf("duplicate register must not error, got %v", err)
	}
	if got := rowCount(t, db, "users"); got != 1 {
		t.Fatalf("expected still 1 user, got %d", got)
	}
	if got := rowCount(t, db, "auth_identities"); got != 1 {
		t.Fatalf("expected still 1 identity, got %d", got)
	}
	if sender.count() != 2 {
		t.Fatalf("expected a resend email, got %d messages", sender.count())
	}
}

func TestRegisterPasswordActiveDuplicateEmailRejected(t *testing.T) {
	db := newAccountTestDB(t)
	service := newRegistrationFixture(t, db, &fakeEmailSender{})

	if err := service.RegisterPassword(context.Background(), RegisterPasswordInput{
		Email: "visitor@example.com", Password: "Abcdefghijk1",
		DisplayName: "Visitor", Locale: "en",
	}); err != nil {
		t.Fatalf("first register: %v", err)
	}

	var user models.User
	if err := db.First(&user, "email = ?", "visitor@example.com").Error; err != nil {
		t.Fatalf("load user: %v", err)
	}
	user.AccountStatus = models.AccountStatusActive
	user.EmailVerified = true
	if err := db.Save(&user).Error; err != nil {
		t.Fatalf("activate user: %v", err)
	}

	err := service.RegisterPassword(context.Background(), RegisterPasswordInput{
		Email: "visitor@example.com", Password: "Abcdefghijk1",
		DisplayName: "Visitor", Locale: "en",
	})
	if err == nil {
		t.Fatal("expected active duplicate email to be rejected")
	}
	var authErr *accountauth.Error
	if !errors.As(err, &authErr) || authErr.Code != accountauth.CodeEmailAlreadyRegistered {
		t.Fatalf("expected email-already-registered error, got %v", err)
	}
}

func TestRegisterPasswordDeliveryFailureLeavesAccountPending(t *testing.T) {
	db := newAccountTestDB(t)
	sender := &fakeEmailSender{err: errors.New("smtp down")}
	service := newRegistrationFixture(t, db, sender)

	err := service.RegisterPassword(context.Background(), RegisterPasswordInput{
		Email: "visitor@example.com", Password: "Abcdefghijk1",
		DisplayName: "Visitor", Locale: "en",
	})
	if err != nil {
		t.Fatalf("delivery failure must not fail registration, got %v", err)
	}
	if got := rowCount(t, db, "users"); got != 1 {
		t.Fatalf("expected committed pending user, got %d", got)
	}
	var user models.User
	if err := db.First(&user, "email = ?", "visitor@example.com").Error; err != nil {
		t.Fatalf("load user: %v", err)
	}
	if user.AccountStatus != models.AccountStatusPendingVerification {
		t.Fatalf("expected pending_verification after delivery failure, got %q", user.AccountStatus)
	}
}

func TestRegisterPasswordTransactionRollback(t *testing.T) {
	db := newAccountTestDB(t)
	sender := &fakeEmailSender{}

	// A token generator that fails inside the transaction must roll back the
	// user, profile, and identity rows created before it.
	failingGen := func() (string, string, error) {
		return "", "", errors.New("random source failed")
	}
	service := NewAccountRegistrationService(db, sender, fixedClockAt(fixedNow()), failingGen)

	err := service.RegisterPassword(context.Background(), RegisterPasswordInput{
		Email: "visitor@example.com", Password: "Abcdefghijk1",
		DisplayName: "Visitor", Locale: "en",
	})
	if err == nil {
		t.Fatal("expected token generation failure to error")
	}
	if got := rowCount(t, db, "users"); got != 0 {
		t.Fatalf("expected rolled-back user count 0, got %d", got)
	}
	if got := rowCount(t, db, "account_profiles"); got != 0 {
		t.Fatalf("expected rolled-back profile count 0, got %d", got)
	}
	if got := rowCount(t, db, "auth_identities"); got != 0 {
		t.Fatalf("expected rolled-back identity count 0, got %d", got)
	}
}

func TestVerifyEmailActivatesAccount(t *testing.T) {
	db := newAccountTestDB(t)
	sender := &fakeEmailSender{}
	service := newRegistrationFixture(t, db, sender)

	if err := service.RegisterPassword(context.Background(), RegisterPasswordInput{
		Email: "visitor@example.com", Password: "Abcdefghijk1",
		DisplayName: "Visitor", Locale: "en",
	}); err != nil {
		t.Fatalf("register: %v", err)
	}

	token := extractVerificationToken(t, sender)

	if err := service.VerifyEmail(context.Background(), token); err != nil {
		t.Fatalf("verify: %v", err)
	}
	var user models.User
	if err := db.First(&user, "email = ?", "visitor@example.com").Error; err != nil {
		t.Fatalf("load user: %v", err)
	}
	if !user.EmailVerified {
		t.Fatal("expected email_verified after verification")
	}
	if user.AccountStatus != models.AccountStatusActive {
		t.Fatalf("expected active status after verification, got %q", user.AccountStatus)
	}

	// Single use: a second verification must fail.
	if err := service.VerifyEmail(context.Background(), token); err == nil {
		t.Fatal("expected reused verification token to fail")
	}
}

func TestVerifyEmailExpiredToken(t *testing.T) {
	db := newAccountTestDB(t)
	sender := &fakeEmailSender{}
	service := newRegistrationFixture(t, db, sender)

	if err := service.RegisterPassword(context.Background(), RegisterPasswordInput{
		Email: "visitor@example.com", Password: "Abcdefghijk1",
		DisplayName: "Visitor", Locale: "en",
	}); err != nil {
		t.Fatalf("register: %v", err)
	}

	token := extractVerificationToken(t, sender)

	// Advance the clock beyond the 30-minute action-token lifetime.
	expiredService := NewAccountRegistrationService(db, sender, fixedClockAt(fixedNow().Add(31*time.Minute)), accountauth.NewOpaqueToken)
	err := expiredService.VerifyEmail(context.Background(), token)
	if err == nil {
		t.Fatal("expected expired verification token to fail")
	}
	var authErr *accountauth.Error
	if !errors.As(err, &authErr) || authErr.Code != accountauth.CodeTokenInvalid {
		t.Fatalf("expected token-invalid error, got %v", err)
	}
}

func TestVerifyEmailRaceSingleUse(t *testing.T) {
	db := newAccountTestDB(t)
	sender := &fakeEmailSender{}
	service := newRegistrationFixture(t, db, sender)

	if err := service.RegisterPassword(context.Background(), RegisterPasswordInput{
		Email: "visitor@example.com", Password: "Abcdefghijk1",
		DisplayName: "Visitor", Locale: "en",
	}); err != nil {
		t.Fatalf("register: %v", err)
	}
	token := extractVerificationToken(t, sender)

	results := make(chan error, 2)
	var wg sync.WaitGroup
	for i := 0; i < 2; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			results <- service.VerifyEmail(context.Background(), token)
		}()
	}
	wg.Wait()
	close(results)

	successes := 0
	for err := range results {
		if err == nil {
			successes++
		}
	}
	if successes != 1 {
		t.Fatalf("expected exactly one successful verification, got %d", successes)
	}
}

func TestResendVerificationInvalidatesPriorToken(t *testing.T) {
	db := newAccountTestDB(t)
	sender := &fakeEmailSender{}
	service := newRegistrationFixture(t, db, sender)

	if err := service.RegisterPassword(context.Background(), RegisterPasswordInput{
		Email: "visitor@example.com", Password: "Abcdefghijk1",
		DisplayName: "Visitor", Locale: "en",
	}); err != nil {
		t.Fatalf("register: %v", err)
	}
	firstToken := extractVerificationToken(t, sender)

	if err := service.ResendVerification(context.Background(), "visitor@example.com", "en"); err != nil {
		t.Fatalf("resend: %v", err)
	}

	var count int64
	if err := db.Model(&models.AuthActionToken{}).
		Where("purpose = ? AND consumed_at IS NULL AND token_hash != ?", "verify_email", accountauth.HashOpaqueToken(firstToken)).
		Count(&count).Error; err != nil {
		t.Fatalf("count active tokens: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected exactly one active verification token after resend, got %d", count)
	}

	// The old token must no longer verify.
	if err := service.VerifyEmail(context.Background(), firstToken); err == nil {
		t.Fatal("expected invalidated prior token to fail")
	}
}

func TestResendVerificationUnknownEmailGeneric(t *testing.T) {
	db := newAccountTestDB(t)
	service := newRegistrationFixture(t, db, &fakeEmailSender{})

	// Unknown email returns the same generic accepted result without error.
	if err := service.ResendVerification(context.Background(), "nobody@example.com", "en"); err != nil {
		t.Fatalf("resend for unknown email must not error, got %v", err)
	}
}

func TestResendVerificationRejectsUnsupportedLocaleWithoutInvalidatingToken(t *testing.T) {
	db := newAccountTestDB(t)
	sender := &fakeEmailSender{}
	service := newRegistrationFixture(t, db, sender)
	if err := service.RegisterPassword(context.Background(), RegisterPasswordInput{
		Email: "locale-resend@example.com", Password: "Abcdefghijk1",
		DisplayName: "Visitor", Locale: "en",
	}); err != nil {
		t.Fatalf("register: %v", err)
	}
	firstToken := extractVerificationToken(t, sender)
	if err := service.ResendVerification(context.Background(), "locale-resend@example.com", "fr"); accountauth.ErrorCode(err) != accountauth.CodeValidation {
		t.Fatalf("expected locale validation error, got %v", err)
	}
	if err := service.VerifyEmail(context.Background(), firstToken); err != nil {
		t.Fatalf("valid token must remain usable after invalid-locale resend: %v", err)
	}
}

// extractVerificationToken returns the plaintext verification token from the
// most recent captured verification email. Only hashes are stored in the
// database, so tests recover the plaintext from the delivered action URL.
func extractVerificationToken(t *testing.T, sender *fakeEmailSender) string {
	t.Helper()
	if sender.count() == 0 {
		t.Fatal("no email captured")
	}
	last := sender.messages[sender.count()-1]
	if last.ActionURL == "" {
		t.Fatal("captured email has no action URL")
	}
	parsed, err := url.Parse(last.ActionURL)
	if err != nil {
		t.Fatalf("parse action URL: %v", err)
	}
	token := parsed.Query().Get("token")
	if token == "" {
		t.Fatalf("action URL has no token: %s", last.ActionURL)
	}
	return token
}
