package services

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

// testAccessIssuer returns an access-token issuer bound to the fixed clock.
func testAccessIssuer(t *testing.T) *accountauth.AccessTokenIssuer {
	t.Helper()
	return accountauth.NewAccessTokenIssuer([]byte("test-secret"), fixedClockAt(fixedNow()), 15*time.Minute)
}

// newSessionFixture builds a session service with a disposable DB and fixed clock.
func newSessionFixture(t *testing.T) *AccountSessionService {
	t.Helper()
	db := newAccountTestDB(t)
	return NewAccountSessionService(db, fixedClockAt(fixedNow()), accountauth.NewOpaqueToken, testAccessIssuer(t), 30*24*time.Hour)
}

// seedVerifiedPasswordAccount inserts a verified, active password account.
func seedVerifiedPasswordAccount(t *testing.T, db *gorm.DB, email string) models.User {
	t.Helper()
	hash, err := utils.HashPassword("correct horse battery staple")
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}
	user := models.User{
		Email:         accountauth.NormalizeEmail(email),
		Name:          "Session Tester",
		EmailVerified: true,
		IsActive:      true,
		AccountStatus: models.AccountStatusActive,
	}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}
	if err := db.Create(&models.AuthIdentity{
		UserID:          user.ID,
		Provider:        "password",
		ProviderSubject: user.Email,
		ProviderEmail:   user.Email,
		CredentialHash:  &hash,
	}).Error; err != nil {
		t.Fatalf("create identity: %v", err)
	}
	return user
}

// loginVerifiedAccount logs in a seeded account and returns the session result.
func loginVerifiedAccount(t *testing.T, service *AccountSessionService) (accountauth.SessionResult, models.AuthSession) {
	t.Helper()
	return loginVerifiedAccountAs(t, service, "session@example.com", "correct horse battery staple")
}

func loginVerifiedAccountAs(t *testing.T, service *AccountSessionService, email, password string) (accountauth.SessionResult, models.AuthSession) {
	t.Helper()
	result, err := service.LoginPassword(context.Background(), accountauth.LoginPasswordInput{
		Email:    email,
		Password: password,
		Client:   testClient(),
	})
	if err != nil {
		t.Fatalf("login: %v", err)
	}
	var session models.AuthSession
	if err := service.db.Where("token_hash = ?", accountauth.HashOpaqueToken(result.RefreshToken)).First(&session).Error; err != nil {
		t.Fatalf("load session: %v", err)
	}
	return result, session
}

func testClient() accountauth.ClientInfo {
	return accountauth.ClientInfo{IP: "203.0.113.42", UserAgent: "Mozilla/5.0 (Test Browser)"}
}

func assertSessionCount(t *testing.T, db *gorm.DB, want int64) {
	t.Helper()
	var count int64
	if err := db.Model(&models.AuthSession{}).Count(&count).Error; err != nil {
		t.Fatalf("count sessions: %v", err)
	}
	if count != want {
		t.Fatalf("expected %d auth_sessions, got %d", want, count)
	}
}

func assertFamilyRevoked(t *testing.T, db *gorm.DB, familyID uuid.UUID) {
	t.Helper()
	var count int64
	if err := db.Model(&models.AuthSession{}).
		Where("family_id = ? AND revoked_at IS NULL", familyID).
		Count(&count).Error; err != nil {
		t.Fatalf("count active family sessions: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected family %s fully revoked, %d active rows remain", familyID, count)
	}
}

// TestRefreshRotatesAndRejectsReuse covers rotation and family reuse detection.
func TestRefreshRotatesAndRejectsReuse(t *testing.T) {
	service := newSessionFixture(t)
	seedVerifiedPasswordAccount(t, service.db, "session@example.com")

	first, firstSession := loginVerifiedAccount(t, service)
	second, err := service.Refresh(context.Background(), first.RefreshToken, testClient())
	if err != nil {
		t.Fatalf("refresh: %v", err)
	}
	if first.RefreshToken == second.RefreshToken {
		t.Fatal("refresh token did not rotate")
	}
	if second.AccessToken == "" {
		t.Fatal("refresh returned no access token")
	}

	// Presenting the consumed token again revokes the family.
	_, err = service.Refresh(context.Background(), first.RefreshToken, testClient())
	if err == nil {
		t.Fatal("expected reuse of consumed refresh token to fail")
	}
	assertFamilyRevoked(t, service.db, firstSession.FamilyID)
	assertSessionCount(t, service.db, 2)
}

// TestLoginPasswordWrongPasswordGeneric ensures wrong password returns the
// same generic code as an unknown email.
func TestLoginPasswordWrongPasswordGeneric(t *testing.T) {
	service := newSessionFixture(t)
	seedVerifiedPasswordAccount(t, service.db, "session@example.com")

	_, err := service.LoginPassword(context.Background(), accountauth.LoginPasswordInput{
		Email:    "session@example.com",
		Password: "wrong password value",
		Client:   testClient(),
	})
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeInvalidCredentials {
		t.Fatalf("expected invalid credentials, got %v", err)
	}
	assertSessionCount(t, service.db, 0)
}

// TestLoginPasswordUnknownEmailGeneric ensures unknown email is generic.
func TestLoginPasswordUnknownEmailGeneric(t *testing.T) {
	service := newSessionFixture(t)
	seedVerifiedPasswordAccount(t, service.db, "session@example.com")

	_, err := service.LoginPassword(context.Background(), accountauth.LoginPasswordInput{
		Email:    "nobody@example.com",
		Password: "correct horse battery staple",
		Client:   testClient(),
	})
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeInvalidCredentials {
		t.Fatalf("expected invalid credentials, got %v", err)
	}
}

// TestLoginPasswordUnverifiedRejected ensures unverified accounts cannot log in.
func TestLoginPasswordUnverifiedRejected(t *testing.T) {
	service := newSessionFixture(t)
	hash, err := utils.HashPassword("correct horse battery staple")
	if err != nil {
		t.Fatalf("hash: %v", err)
	}
	user := models.User{Email: "unverified@example.com", Name: "Unverified", AccountStatus: models.AccountStatusPendingVerification, EmailVerified: false, IsActive: true}
	if err := service.db.Create(&user).Error; err != nil {
		t.Fatalf("create: %v", err)
	}
	if err := service.db.Create(&models.AuthIdentity{UserID: user.ID, Provider: "password", ProviderSubject: user.Email, ProviderEmail: user.Email, CredentialHash: &hash}).Error; err != nil {
		t.Fatalf("identity: %v", err)
	}

	_, err = service.LoginPassword(context.Background(), accountauth.LoginPasswordInput{Email: "unverified@example.com", Password: "correct horse battery staple", Client: testClient()})
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeVerificationRequired {
		t.Fatalf("expected verification required, got %v", err)
	}
	assertSessionCount(t, service.db, 0)
}

// TestLoginPasswordDisabledRejected ensures disabled accounts cannot log in.
func TestLoginPasswordDisabledRejected(t *testing.T) {
	service := newSessionFixture(t)
	user := seedVerifiedPasswordAccount(t, service.db, "disabled@example.com")
	if err := service.db.Model(&user).Update("account_status", models.AccountStatusDisabled).Error; err != nil {
		t.Fatalf("disable: %v", err)
	}
	_, err := service.LoginPassword(context.Background(), accountauth.LoginPasswordInput{Email: "disabled@example.com", Password: "correct horse battery staple", Client: testClient()})
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeAccountDisabled {
		t.Fatalf("expected account disabled, got %v", err)
	}
}

// TestLoginPasswordClosedRejected ensures closed accounts cannot log in.
func TestLoginPasswordClosedRejected(t *testing.T) {
	service := newSessionFixture(t)
	user := seedVerifiedPasswordAccount(t, service.db, "closed@example.com")
	if err := service.db.Model(&user).Update("account_status", models.AccountStatusClosed).Error; err != nil {
		t.Fatalf("close: %v", err)
	}
	_, err := service.LoginPassword(context.Background(), accountauth.LoginPasswordInput{Email: "closed@example.com", Password: "correct horse battery staple", Client: testClient()})
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeAccountDisabled {
		t.Fatalf("expected account disabled, got %v", err)
	}
}

// TestLoginPasswordGoogleOnlyRejected ensures a Google-only account cannot use
// the password path and the failure is generic.
func TestLoginPasswordGoogleOnlyRejected(t *testing.T) {
	service := newSessionFixture(t)
	user := models.User{Email: "googleonly@example.com", Name: "Google Only", EmailVerified: true, IsActive: true, AccountStatus: models.AccountStatusActive}
	if err := service.db.Create(&user).Error; err != nil {
		t.Fatalf("create: %v", err)
	}
	if err := service.db.Create(&models.AuthIdentity{UserID: user.ID, Provider: "google", ProviderSubject: "google-sub", ProviderEmail: user.Email}).Error; err != nil {
		t.Fatalf("identity: %v", err)
	}
	_, err := service.LoginPassword(context.Background(), accountauth.LoginPasswordInput{Email: "googleonly@example.com", Password: "correct horse battery staple", Client: testClient()})
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeInvalidCredentials {
		t.Fatalf("expected invalid credentials, got %v", err)
	}
}

// TestConcurrentRefreshSingleWinner ensures concurrent refresh of one token
// yields exactly one successful rotation and seven reuse rejections.
func TestConcurrentRefreshSingleWinner(t *testing.T) {
	service := newSessionFixture(t)
	seedVerifiedPasswordAccount(t, service.db, "session@example.com")
	first, _ := loginVerifiedAccount(t, service)

	var (
		mu        sync.Mutex
		successes int
		rejects   int
	)
	var wg sync.WaitGroup
	for i := 0; i < 8; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := service.Refresh(context.Background(), first.RefreshToken, testClient())
			mu.Lock()
			defer mu.Unlock()
			if err == nil {
				successes++
			} else {
				rejects++
			}
		}()
	}
	wg.Wait()
	if successes != 1 {
		t.Fatalf("expected exactly 1 successful refresh, got %d", successes)
	}
	if rejects != 7 {
		t.Fatalf("expected 7 rejected refreshes, got %d", rejects)
	}
}

// TestRefreshExpiredRejected ensures expired sessions cannot refresh.
func TestRefreshExpiredRejected(t *testing.T) {
	service := newSessionFixture(t)
	seedVerifiedPasswordAccount(t, service.db, "session@example.com")
	first, _ := loginVerifiedAccount(t, service)

	// Build a service with the clock advanced beyond the 30-day refresh TTL.
	expiredService := NewAccountSessionService(
		service.db,
		fixedClockAt(fixedNow().Add(30*24*time.Hour+time.Minute)),
		accountauth.NewOpaqueToken,
		testAccessIssuer(t),
		30*24*time.Hour,
	)
	_, err := expiredService.Refresh(context.Background(), first.RefreshToken, testClient())
	if err == nil || accountauth.ErrorCode(err) != accountauth.CodeTokenInvalid {
		t.Fatalf("expected token invalid, got %v", err)
	}
}

// TestLogoutRevokesCurrentFamily ensures logout revokes the family and the
// refresh token cannot be reused.
func TestLogoutRevokesCurrentFamily(t *testing.T) {
	service := newSessionFixture(t)
	seedVerifiedPasswordAccount(t, service.db, "session@example.com")
	first, firstSession := loginVerifiedAccount(t, service)

	if err := service.Logout(context.Background(), firstSession.UserID, first.RefreshToken); err != nil {
		t.Fatalf("logout: %v", err)
	}
	assertFamilyRevoked(t, service.db, firstSession.FamilyID)

	_, err := service.Refresh(context.Background(), first.RefreshToken, testClient())
	if err == nil {
		t.Fatal("expected refresh after logout to fail")
	}
}

// TestLogoutAllRevokesEverySession ensures logout-all revokes all families.
func TestLogoutAllRevokesEverySession(t *testing.T) {
	service := newSessionFixture(t)
	user := seedVerifiedPasswordAccount(t, service.db, "session@example.com")
	first, _ := loginVerifiedAccount(t, service)
	second, err := service.LoginPassword(context.Background(), accountauth.LoginPasswordInput{Email: "session@example.com", Password: "correct horse battery staple", Client: testClient()})
	if err != nil {
		t.Fatalf("second login: %v", err)
	}

	if err := service.LogoutAll(context.Background(), user.ID); err != nil {
		t.Fatalf("logout all: %v", err)
	}
	assertSessionCount(t, service.db, 2)
	for _, token := range []string{first.RefreshToken, second.RefreshToken} {
		if _, err := service.Refresh(context.Background(), token, testClient()); err == nil {
			t.Fatal("expected refresh after logout-all to fail")
		}
	}
}

// TestRevokeSessionOwnership ensures a user can only revoke their own session.
func TestRevokeSessionOwnership(t *testing.T) {
	service := newSessionFixture(t)
	seedVerifiedPasswordAccount(t, service.db, "session@example.com")
	_, firstSession := loginVerifiedAccount(t, service)

	seedVerifiedPasswordAccount(t, service.db, "other@example.com")
	_, otherSession := loginVerifiedAccountAs(t, service, "other@example.com", "correct horse battery staple")
	_ = otherSession

	// Own session revokes fine.
	if err := service.RevokeSession(context.Background(), firstSession.UserID, firstSession.ID); err != nil {
		t.Fatalf("revoke own session: %v", err)
	}
	// Another user's session is not found.
	if err := service.RevokeSession(context.Background(), firstSession.UserID, otherSession.ID); err == nil {
		t.Fatal("expected revoking another user's session to fail")
	}
	// Unknown session id is not found.
	if err := service.RevokeSession(context.Background(), firstSession.UserID, uuid.New()); err == nil {
		t.Fatal("expected revoking an unknown session to fail")
	}
}

// TestListSessionsRedactsSecrets ensures listing exposes no token hashes and
// flags the current session.
func TestListSessionsRedactsSecrets(t *testing.T) {
	service := newSessionFixture(t)
	user := seedVerifiedPasswordAccount(t, service.db, "session@example.com")
	_, firstSession := loginVerifiedAccount(t, service)
	// Second login creates another active session.
	if _, err := service.LoginPassword(context.Background(), accountauth.LoginPasswordInput{Email: "session@example.com", Password: "correct horse battery staple", Client: testClient()}); err != nil {
		t.Fatalf("second login: %v", err)
	}

	sessions, err := service.ListSessions(context.Background(), user.ID, firstSession.ID)
	if err != nil {
		t.Fatalf("list sessions: %v", err)
	}
	if len(sessions) != 2 {
		t.Fatalf("expected 2 sessions, got %d", len(sessions))
	}
	var sawCurrent bool
	for _, s := range sessions {
		if s.TokenHash != "" {
			t.Fatal("session listing must not expose token hash")
		}
		if s.Current {
			sawCurrent = true
		}
	}
	if !sawCurrent {
		t.Fatal("expected the current session to be flagged")
	}
}

// TestAccessTokenIssuerAudience ensures issued tokens carry the public-account
// audience and verification rejects other audiences.
func TestAccessTokenIssuerAudience(t *testing.T) {
	// The fixed test clock is anchored in the past, so this test issues and
	// verifies with the real system clock to avoid an expired-token failure.
	issuer := accountauth.NewAccessTokenIssuer([]byte("test-secret"), accountauth.SystemClock{}, 15*time.Minute)
	now := time.Now()
	raw, err := issuer.Issue(uuid.New(), uuid.New(), now)
	if err != nil {
		t.Fatalf("issue: %v", err)
	}
	claims, err := accountauth.VerifyPublicAccountToken(raw, []byte("test-secret"))
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if claims.Subject == "" || claims.SessionID == "" || claims.AuthTime == 0 {
		t.Fatalf("claims missing required fields: %+v", claims)
	}

	// A legacy admin token must be rejected by the public verifier.
	t.Setenv("JWT_SECRET", "test-secret")
	adminRaw, err := utils.GenerateAdminAccessToken(uuid.New())
	if err != nil {
		t.Fatalf("admin token: %v", err)
	}
	if _, err := accountauth.VerifyPublicAccountToken(adminRaw, []byte("test-secret")); err == nil {
		t.Fatal("expected admin audience token to be rejected")
	}
}
