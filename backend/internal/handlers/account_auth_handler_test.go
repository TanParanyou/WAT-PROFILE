package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const (
	accountHandlerTestSecret   = "test-secret-account-handler"
	accountHandlerTestPassword = "test-password-123456"
	accountHandlerTestFrontend = "http://localhost:3000"
	accountHandlerTestOrigin   = "http://localhost:3000"
)

func accountHandlerTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := os.Getenv("DATABASE_URL_TEST")
	if dsn == "" {
		t.Skip("DATABASE_URL_TEST not set; skipping account auth handler test")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open test database: %v", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("failed to get sql database: %v", err)
	}
	t.Cleanup(func() { _ = sqlDB.Close() })
	if err := db.AutoMigrate(
		&models.Role{},
		&models.User{},
		&models.AccountProfile{},
		&models.AuthIdentity{},
		&models.AuthSession{},
		&models.AuthActionToken{},
		&models.AuthOAuthFlow{},
		&models.AuthSecurityEvent{},
	); err != nil {
		t.Fatalf("failed to migrate test database: %v", err)
	}
	return db
}

type fakeGoogleVerifier struct {
	identity accountauth.GoogleIdentity
}

func (f *fakeGoogleVerifier) AuthorizationURL(state, nonce, challenge string) string {
	return "https://accounts.google.com/o/oauth2/v2/auth?state=" + state
}

func (f *fakeGoogleVerifier) VerifyCallback(ctx context.Context, code, verifier, nonce string) (accountauth.GoogleIdentity, error) {
	if code == "" {
		return accountauth.GoogleIdentity{}, errors.New("missing code")
	}
	return f.identity, nil
}

// seedAccountVerifiedUser creates an active, verified user with a password
// identity so the session service can authenticate them. It removes any prior
// rows for the same email because the test database is shared across runs.
func seedAccountVerifiedUser(t *testing.T, db *gorm.DB, email string) *models.User {
	t.Helper()
	email = accountauth.NormalizeEmail(email)
	deleteAccountTestUser(t, db, email)

	hash, err := utils.HashPassword(accountHandlerTestPassword)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}
	user := &models.User{
		Email:         email,
		Name:          "Test User",
		EmailVerified: true,
		IsActive:      true,
		AccountStatus: models.AccountStatusActive,
	}
	if err := db.Create(user).Error; err != nil {
		t.Fatalf("failed to create user: %v", err)
	}
	if err := db.Create(&models.AuthIdentity{
		UserID:          user.ID,
		Provider:        "password",
		ProviderSubject: user.Email,
		ProviderEmail:   user.Email,
		CredentialHash:  &hash,
	}).Error; err != nil {
		t.Fatalf("failed to create identity: %v", err)
	}
	return user
}

// deleteAccountTestUser removes a user and all dependent auth rows so tests
// are repeatable against a persistent database.
func deleteAccountTestUser(t *testing.T, db *gorm.DB, email string) {
	t.Helper()
	var users []models.User
	if err := db.Where("email = ?", email).Find(&users).Error; err != nil {
		t.Fatalf("failed to find user for cleanup: %v", err)
	}
	for _, u := range users {
		for _, model := range []interface{}{
			&models.AuthIdentity{},
			&models.AuthSession{},
			&models.AuthActionToken{},
			&models.AuthSecurityEvent{},
			&models.AccountProfile{},
		} {
			if err := db.Where("user_id = ?", u.ID).Delete(model).Error; err != nil {
				t.Fatalf("failed to clean dependent rows: %v", err)
			}
		}
		if err := db.Delete(&models.User{}, "id = ?", u.ID).Error; err != nil {
			t.Fatalf("failed to clean user: %v", err)
		}
	}
}

func newAccountHandler(t *testing.T, db *gorm.DB, enabled bool) *AccountAuthHandler {
	t.Helper()
	cfg := config.AccountAuthConfig{
		Enabled:          enabled,
		Environment:      "development",
		EmailMode:        "capture",
		FrontendURL:      accountHandlerTestFrontend,
		GoogleFlowSecret: "test-flow-secret",
		AccessTTL:        15 * time.Minute,
		RefreshTTL:       30 * 24 * time.Hour,
	}
	secret := []byte(accountHandlerTestSecret)
	sender, err := services.NewAccountEmailSender(cfg)
	if err != nil {
		t.Fatalf("failed to create email sender: %v", err)
	}
	verifier := &fakeGoogleVerifier{identity: accountauth.GoogleIdentity{
		Subject:       "google-sub-1",
		Email:         "new-user@example.com",
		EmailVerified: true,
		DisplayName:   "New User",
	}}
	clock := accountauth.SystemClock{}
	issuer := accountauth.NewAccessTokenIssuer(secret, clock, cfg.AccessTTL)
	sessions := services.NewAccountSessionService(db, clock, accountauth.NewOpaqueToken, issuer, cfg.RefreshTTL)
	return &AccountAuthHandler{
		db:           db,
		registration: services.NewAccountRegistrationService(db, sender, clock, accountauth.NewOpaqueToken),
		sessions:     sessions,
		recovery:     services.NewAccountRecoveryService(db, sender, clock, accountauth.NewOpaqueToken, sessions),
		profile:      services.NewAccountProfileService(db, clock, sessions),
		google:       services.NewAccountGoogleService(db, clock, accountauth.NewOpaqueToken, sender, verifier, sessions, []byte(cfg.GoogleFlowSecret), cfg.FrontendURL),
		cfg:          cfg,
		secret:       secret,
	}
}

func newAccountHTTPTestApp(t *testing.T, enabled bool) (*fiber.App, *gorm.DB) {
	t.Helper()
	t.Setenv("JWT_SECRET", accountHandlerTestSecret)
	t.Setenv("PUBLIC_ACCOUNT_FRONTEND_URL", accountHandlerTestFrontend)
	db := accountHandlerTestDB(t)
	h := newAccountHandler(t, db, enabled)
	app := fiber.New()
	RegisterAccountRoutes(app.Group("/api/v1"), h, []string{accountHandlerTestOrigin})
	return app, db
}

func performJSON(t *testing.T, app *fiber.App, method, path string, body interface{}, headers map[string]string) *http.Response {
	t.Helper()
	var buf bytes.Buffer
	if body != nil {
		if err := json.NewEncoder(&buf).Encode(body); err != nil {
			t.Fatalf("failed to encode body: %v", err)
		}
	}
	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request %s %s failed: %v", method, path, err)
	}
	return resp
}

func bodyString(t *testing.T, resp *http.Response) string {
	t.Helper()
	defer resp.Body.Close()
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("failed to read body: %v", err)
	}
	return string(b)
}

func decodeBody(t *testing.T, resp *http.Response) map[string]interface{} {
	t.Helper()
	var body map[string]interface{}
	if err := json.Unmarshal([]byte(bodyString(t, resp)), &body); err != nil {
		t.Fatalf("failed to decode response body: %v", err)
	}
	return body
}

func headerValue(resp *http.Response, key string) string {
	return resp.Header.Get(key)
}

// setCookieValues returns ALL Set-Cookie headers (a response may set more than
// one cookie, and Header.Get only surfaces the first).
func setCookieValues(resp *http.Response) string {
	return strings.Join(resp.Header.Values("Set-Cookie"), "\n")
}

func cookieValue(setCookie, name string) string {
	for _, part := range strings.Split(setCookie, ";") {
		part = strings.TrimSpace(part)
		if strings.HasPrefix(part, name+"=") {
			return strings.TrimPrefix(part, name+"=")
		}
	}
	return ""
}

func authorizationState(t *testing.T, resp *http.Response) string {
	t.Helper()
	body := decodeBody(t, resp)
	data, _ := body["data"].(map[string]interface{})
	raw, _ := data["authorization_url"].(string)
	u, err := url.Parse(raw)
	if err != nil {
		t.Fatalf("parse authorization url: %v", err)
	}
	return u.Query().Get("state")
}

// TestLoginSetsHttpOnlyRefreshCookieWithoutReturningToken verifies the core
// contract: login returns the access token in the body and the rotating
// refresh token only inside a Secure HttpOnly cookie.
func TestLoginSetsHttpOnlyRefreshCookieWithoutReturningToken(t *testing.T) {
	app, db := newAccountHTTPTestApp(t, true)
	seedAccountVerifiedUser(t, db, "login@example.com")

	resp := performJSON(t, app, http.MethodPost, "/api/v1/accounts/login", map[string]string{
		"email":    "login@example.com",
		"password": accountHandlerTestPassword,
	}, nil)
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, bodyString(t, resp))
	}

	setCookie := headerValue(resp, "Set-Cookie")
	if !strings.Contains(setCookie, "wat_public_refresh=") {
		t.Fatalf("expected refresh cookie in Set-Cookie, got %q", setCookie)
	}
	if !strings.Contains(setCookie, "HttpOnly") {
		t.Fatalf("expected HttpOnly flag on refresh cookie, got %q", setCookie)
	}
	if !strings.Contains(setCookie, "SameSite=Lax") {
		t.Fatalf("expected SameSite=Lax on refresh cookie, got %q", setCookie)
	}

	raw := bodyString(t, resp)
	if strings.Contains(raw, "refresh_token") {
		t.Fatalf("refresh token must not appear in the response body")
	}
	var body map[string]interface{}
	if err := json.Unmarshal([]byte(raw), &body); err != nil {
		t.Fatalf("failed to decode body: %v", err)
	}
	data, _ := body["data"].(map[string]interface{})
	if data["access_token"] == nil || data["access_token"] == "" {
		t.Fatalf("expected access_token in body, got %v", data["access_token"])
	}
	if expires, ok := data["expires_in"].(float64); !ok || expires != 900 {
		t.Fatalf("expected access token expires_in=900 seconds, got %v", data["expires_in"])
	}
}

// TestAccountRegisterValidationErrors verifies typed field errors surface with
// the stable validation code.
func TestAccountRegisterValidationErrors(t *testing.T) {
	app, _ := newAccountHTTPTestApp(t, true)

	resp := performJSON(t, app, http.MethodPost, "/api/v1/accounts/register", map[string]string{
		"email":        "not-an-email",
		"password":     "short",
		"display_name": "x",
	}, nil)
	if resp.StatusCode != fiber.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", resp.StatusCode, bodyString(t, resp))
	}
	body := decodeBody(t, resp)
	if body["code"] != string(accountauth.CodeValidation) {
		t.Fatalf("expected code %q, got %v", accountauth.CodeValidation, body["code"])
	}
	if body["field_errors"] == nil {
		t.Fatalf("expected field_errors in response, got %v", body)
	}
}

func TestAccountRegisterSuccessThenLogin(t *testing.T) {
	app, _ := newAccountHTTPTestApp(t, true)

	resp := performJSON(t, app, http.MethodPost, "/api/v1/accounts/register", map[string]string{
		"email":        "fresh@example.com",
		"password":     "test-password-123456",
		"display_name": "Fresh User",
		"locale":       "en",
	}, nil)
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200 on register, got %d: %s", resp.StatusCode, bodyString(t, resp))
	}

	// Pending verification: login must fail with the verification code.
	resp = performJSON(t, app, http.MethodPost, "/api/v1/accounts/login", map[string]string{
		"email":    "fresh@example.com",
		"password": "test-password-123456",
	}, nil)
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401 for unverified account, got %d", resp.StatusCode)
	}
	body := decodeBody(t, resp)
	if body["code"] != string(accountauth.CodeVerificationRequired) {
		t.Fatalf("expected code %q, got %v", accountauth.CodeVerificationRequired, body["code"])
	}
}

func TestAccountLoginInvalidCredentials(t *testing.T) {
	app, db := newAccountHTTPTestApp(t, true)
	seedAccountVerifiedUser(t, db, "wrong@example.com")

	for _, body := range []map[string]string{
		{"email": "wrong@example.com", "password": "not-the-password"},
		{"email": "nobody@example.com", "password": "test-password-123456"},
	} {
		resp := performJSON(t, app, http.MethodPost, "/api/v1/accounts/login", body, nil)
		if resp.StatusCode != fiber.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", resp.StatusCode)
		}
		respBody := decodeBody(t, resp)
		if respBody["code"] != string(accountauth.CodeInvalidCredentials) {
			t.Fatalf("expected code %q, got %v", accountauth.CodeInvalidCredentials, respBody["code"])
		}
	}
}

func TestAccountRefreshRejectsDisallowedOrigin(t *testing.T) {
	app, _ := newAccountHTTPTestApp(t, true)

	resp := performJSON(t, app, http.MethodPost, "/api/v1/accounts/refresh", map[string]string{}, map[string]string{
		"Origin": "https://evil.example.com",
	})
	if resp.StatusCode != fiber.StatusForbidden {
		t.Fatalf("expected 403 for disallowed origin, got %d", resp.StatusCode)
	}
}

func TestAccountRefreshInvalidCookie(t *testing.T) {
	app, _ := newAccountHTTPTestApp(t, true)

	resp := performJSON(t, app, http.MethodPost, "/api/v1/accounts/refresh", map[string]string{}, map[string]string{
		"Origin": accountHandlerTestOrigin,
	})
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401 for missing refresh cookie, got %d", resp.StatusCode)
	}
	body := decodeBody(t, resp)
	if body["code"] != string(accountauth.CodeTokenInvalid) {
		t.Fatalf("expected code %q, got %v", accountauth.CodeTokenInvalid, body["code"])
	}
}

func TestAccountLogoutClearsRefreshCookie(t *testing.T) {
	app, db := newAccountHTTPTestApp(t, true)
	seedAccountVerifiedUser(t, db, "logout@example.com")

	loginResp := performJSON(t, app, http.MethodPost, "/api/v1/accounts/login", map[string]string{
		"email":    "logout@example.com",
		"password": accountHandlerTestPassword,
	}, nil)
	if loginResp.StatusCode != fiber.StatusOK {
		t.Fatalf("login failed: %d", loginResp.StatusCode)
	}
	setCookie := headerValue(loginResp, "Set-Cookie")
	refreshValue := cookieValue(setCookie, "wat_public_refresh")
	loginBody := decodeBody(t, loginResp)
	loginData, _ := loginBody["data"].(map[string]interface{})
	accessToken, _ := loginData["access_token"].(string)

	logoutResp := performJSON(t, app, http.MethodPost, "/api/v1/accounts/logout", map[string]string{}, map[string]string{
		"Origin":        accountHandlerTestOrigin,
		"Authorization": "Bearer " + accessToken,
		"Cookie":        "wat_public_refresh=" + refreshValue,
	})
	if logoutResp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200 on logout, got %d: %s", logoutResp.StatusCode, bodyString(t, logoutResp))
	}
	cleared := setCookieValues(logoutResp)
	if !strings.Contains(cleared, "wat_public_refresh=") {
		t.Fatalf("expected refresh cookie clearing on logout, got %q", cleared)
	}
}

func TestAccountGoogleStartSetsFlowCookie(t *testing.T) {
	app, _ := newAccountHTTPTestApp(t, true)

	resp := performJSON(t, app, http.MethodGet, "/api/v1/accounts/google/start?locale=de&return_to=/account", nil, nil)
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, bodyString(t, resp))
	}
	setCookie := headerValue(resp, "Set-Cookie")
	if !strings.Contains(setCookie, "wat_google_flow=") {
		t.Fatalf("expected google flow cookie, got %q", setCookie)
	}
	body := decodeBody(t, resp)
	data, _ := body["data"].(map[string]interface{})
	if data["authorization_url"] == nil || data["authorization_url"] == "" {
		t.Fatalf("expected authorization_url in body, got %v", data["authorization_url"])
	}
}

func TestAccountGoogleCallbackRedirectsWithoutTokens(t *testing.T) {
	app, db := newAccountHTTPTestApp(t, true)
	// The callback flow creates this account via the service; clean any
	// leftover from a previous run against the shared test database.
	deleteAccountTestUser(t, db, "new-user@example.com")

	startResp := performJSON(t, app, http.MethodGet, "/api/v1/accounts/google/start?locale=en", nil, nil)
	if startResp.StatusCode != fiber.StatusOK {
		t.Fatalf("start failed: %d", startResp.StatusCode)
	}
	flowCookie := cookieValue(headerValue(startResp, "Set-Cookie"), "wat_google_flow")
	state := authorizationState(t, startResp)

	resp := performJSON(t, app, http.MethodGet, "/api/v1/accounts/google/callback?code=test-code&state="+url.QueryEscape(state), nil, map[string]string{
		"Cookie": "wat_google_flow=" + flowCookie,
	})
	if resp.StatusCode != fiber.StatusFound {
		t.Fatalf("expected 302 redirect, got %d: %s", resp.StatusCode, bodyString(t, resp))
	}
	location := headerValue(resp, "Location")
	if !strings.HasPrefix(location, accountHandlerTestFrontend+"/en/account") {
		t.Fatalf("expected redirect to frontend account page, got %q", location)
	}
	if strings.Contains(location, "access_token") || strings.Contains(location, "refresh_token") {
		t.Fatalf("tokens must never appear in redirect URL, got %q", location)
	}
	if !strings.Contains(setCookieValues(resp), "wat_public_refresh=") {
		t.Fatalf("expected refresh cookie on google sign-in, got %q", setCookieValues(resp))
	}
}

func TestAccountGoogleCallbackApprovalRedirect(t *testing.T) {
	app, db := newAccountHTTPTestApp(t, true)
	seedAccountVerifiedUser(t, db, "new-user@example.com")

	startResp := performJSON(t, app, http.MethodGet, "/api/v1/accounts/google/start?locale=en", nil, nil)
	flowCookie := cookieValue(headerValue(startResp, "Set-Cookie"), "wat_google_flow")
	state := authorizationState(t, startResp)

	resp := performJSON(t, app, http.MethodGet, "/api/v1/accounts/google/callback?code=test-code&state="+url.QueryEscape(state), nil, map[string]string{
		"Cookie": "wat_google_flow=" + flowCookie,
	})
	if resp.StatusCode != fiber.StatusFound {
		t.Fatalf("expected 302 redirect, got %d: %s", resp.StatusCode, bodyString(t, resp))
	}
	location := headerValue(resp, "Location")
	if !strings.Contains(location, "/account/link?status=approval_sent") {
		t.Fatalf("expected approval_sent redirect, got %q", location)
	}
	if strings.Contains(setCookieValues(resp), "wat_public_refresh=") {
		t.Fatalf("approval must not issue a session cookie")
	}
}

func TestAccountGoogleCallbackInvalidFlowRedirectsWithError(t *testing.T) {
	app, _ := newAccountHTTPTestApp(t, true)

	resp := performJSON(t, app, http.MethodGet, "/api/v1/accounts/google/callback?code=test-code", nil, map[string]string{
		"Cookie": "wat_google_flow=tampered",
	})
	if resp.StatusCode != fiber.StatusFound {
		t.Fatalf("expected 302 redirect, got %d: %s", resp.StatusCode, bodyString(t, resp))
	}
	location := headerValue(resp, "Location")
	if !strings.Contains(location, "/login?error=") {
		t.Fatalf("expected login error redirect, got %q", location)
	}
}

func loginAccessToken(t *testing.T, app *fiber.App, db *gorm.DB, email string) string {
	t.Helper()
	resp := performJSON(t, app, http.MethodPost, "/api/v1/accounts/login", map[string]string{
		"email":    email,
		"password": accountHandlerTestPassword,
	}, nil)
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("login failed: %d: %s", resp.StatusCode, bodyString(t, resp))
	}
	body := decodeBody(t, resp)
	data, _ := body["data"].(map[string]interface{})
	token, _ := data["access_token"].(string)
	if token == "" {
		t.Fatal("expected access token from login")
	}
	return token
}

func TestAccountGoogleLinkStartRequiresPublicAccount(t *testing.T) {
	app, _ := newAccountHTTPTestApp(t, true)

	resp := performJSON(t, app, http.MethodGet, "/api/v1/accounts/google/link/start", nil, map[string]string{
		"Origin": accountHandlerTestOrigin,
	})
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401 without bearer token, got %d", resp.StatusCode)
	}
}

func TestAccountGoogleLinkStartSetsFlowCookie(t *testing.T) {
	app, db := newAccountHTTPTestApp(t, true)
	seedAccountVerifiedUser(t, db, "link-start@example.com")
	token := loginAccessToken(t, app, db, "link-start@example.com")

	resp := performJSON(t, app, http.MethodGet, "/api/v1/accounts/google/link/start?locale=th&return_to=/account", nil, map[string]string{
		"Origin":        accountHandlerTestOrigin,
		"Authorization": "Bearer " + token,
	})
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, bodyString(t, resp))
	}
	setCookie := headerValue(resp, "Set-Cookie")
	if !strings.Contains(setCookie, "wat_google_flow=") {
		t.Fatalf("expected google flow cookie, got %q", setCookie)
	}
	body := decodeBody(t, resp)
	data, _ := body["data"].(map[string]interface{})
	url, _ := data["authorization_url"].(string)
	if !strings.HasPrefix(url, "https://accounts.google.com/") {
		t.Fatalf("expected authorization url, got %q", url)
	}
}

func TestAccountGoogleLinkStatusReturnsTypedData(t *testing.T) {
	app, db := newAccountHTTPTestApp(t, true)
	seedAccountVerifiedUser(t, db, "link-status@example.com")
	token := loginAccessToken(t, app, db, "link-status@example.com")

	resp := performJSON(t, app, http.MethodGet, "/api/v1/accounts/google/link/status", nil, map[string]string{
		"Authorization": "Bearer " + token,
	})
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, bodyString(t, resp))
	}
	body := decodeBody(t, resp)
	data, _ := body["data"].(map[string]interface{})
	connected, _ := data["connected"].(bool)
	if connected {
		t.Fatal("expected connected=false for password-only account")
	}
	pending, _ := data["pending"].(bool)
	if pending {
		t.Fatal("expected pending=false with no approval token")
	}
	retry, ok := data["retry_after_seconds"].(float64)
	if !ok || retry != 0 {
		t.Fatalf("expected integer retry_after_seconds=0, got %v", data["retry_after_seconds"])
	}
}

func TestAccountGoogleUnlinkRejectsStaleAuth(t *testing.T) {
	app, db := newAccountHTTPTestApp(t, true)
	user := seedAccountVerifiedUser(t, db, "link-unlink-stale@example.com")

	issuer := accountauth.NewAccessTokenIssuer([]byte(accountHandlerTestSecret), accountauth.SystemClock{}, 15*time.Minute)
	staleToken, err := issuer.Issue(user.ID, uuid.New(), time.Now().Add(-11*time.Minute))
	if err != nil {
		t.Fatalf("issue stale token: %v", err)
	}

	resp := performJSON(t, app, http.MethodDelete, "/api/v1/account/providers/google", map[string]string{
		"password": accountHandlerTestPassword,
	}, map[string]string{
		"Authorization": "Bearer " + staleToken,
	})
	if resp.StatusCode != fiber.StatusForbidden {
		t.Fatalf("expected 403 for stale auth, got %d: %s", resp.StatusCode, bodyString(t, resp))
	}
	body := decodeBody(t, resp)
	if body["code"] != string(accountauth.CodeReauthRequired) {
		t.Fatalf("expected code %q, got %v", accountauth.CodeReauthRequired, body["code"])
	}
}

func TestAccountRoutesMissingWhenFeatureDisabled(t *testing.T) {
	app, _ := newAccountHTTPTestApp(t, false)

	resp := performJSON(t, app, http.MethodPost, "/api/v1/accounts/register", map[string]string{
		"email":        "any@example.com",
		"password":     "test-password-123456",
		"display_name": "Any User",
	}, nil)
	if resp.StatusCode != fiber.StatusNotFound {
		t.Fatalf("expected 404 when feature disabled, got %d", resp.StatusCode)
	}
}

func TestPublicTokenRejectedOnAdminDashboard(t *testing.T) {
	t.Setenv("JWT_SECRET", accountHandlerTestSecret)
	db := accountHandlerTestDB(t)
	user := createAdminHandlerUser(t, db)

	issuer := accountauth.NewAccessTokenIssuer([]byte(accountHandlerTestSecret), accountauth.SystemClock{}, 15*time.Minute)
	publicToken, err := issuer.Issue(user.ID, uuid.New(), time.Now())
	if err != nil {
		t.Fatalf("failed to issue public token: %v", err)
	}

	app := fiber.New()
	admin := app.Group("/admin", middleware.AdminAuthRequired(db))
	admin.Get("/dashboard/stats", func(c *fiber.Ctx) error { return c.SendString("ok") })

	req := httptest.NewRequest(http.MethodGet, "/admin/dashboard/stats", nil)
	req.Header.Set("Authorization", "Bearer "+publicToken)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401 for public token on admin route, got %d", resp.StatusCode)
	}
}

func TestAdminLoginStillWorksWithPublicAccountModule(t *testing.T) {
	t.Setenv("JWT_SECRET", accountHandlerTestSecret)
	db := accountHandlerTestDB(t)
	admin := createAdminHandlerUser(t, db)

	app := fiber.New()
	auth := app.Group("/api/v1/auth/admin", middleware.AdminOriginGuard([]string{accountHandlerTestOrigin}))
	h := NewAdminAuthHandler(db)
	auth.Post("/login", h.Login)

	body := bytes.NewBufferString(`{"email":"` + admin.Email + `","password":"` + testAdminPassword + `"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/admin/login", body)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", accountHandlerTestOrigin)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200 for admin login, got %d: %s", resp.StatusCode, bodyString(t, resp))
	}
}
