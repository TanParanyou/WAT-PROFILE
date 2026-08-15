package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const accountAuthTestSecret = "test-secret-public-account-auth"

func accountAuthTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := os.Getenv("DATABASE_URL_TEST")
	if dsn == "" {
		t.Skip("DATABASE_URL_TEST not set; skipping account auth middleware test")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open test database: %v", err)
	}
	if err := db.AutoMigrate(&models.Role{}, &models.User{}, &models.AuthSession{}); err != nil {
		t.Fatalf("failed to migrate test database: %v", err)
	}
	return db
}

func createAccountAuthUser(t *testing.T, db *gorm.DB, status models.AccountStatus, active bool) *models.User {
	t.Helper()
	user := &models.User{
		Email:         "user-" + uuid.NewString() + "@wat.local",
		Name:          "Test User",
		AccountStatus: status,
		IsActive:      true,
		EmailVerified: true,
	}
	if err := db.Create(user).Error; err != nil {
		t.Fatalf("failed to create user: %v", err)
	}
	if !active {
		// IsActive has a DB default of true, so GORM drops the zero value on
		// insert; force the column explicitly.
		if err := db.Model(user).Update("is_active", false).Error; err != nil {
			t.Fatalf("failed to deactivate user: %v", err)
		}
	}
	return user
}

func issueAccountAuthToken(t *testing.T, db *gorm.DB, userID uuid.UUID) string {
	t.Helper()
	session := &models.AuthSession{
		UserID:     userID,
		FamilyID:   uuid.New(),
		TokenHash:  uuid.NewString(),
		ExpiresAt:  time.Now().Add(time.Hour),
		LastUsedAt: time.Now(),
	}
	if err := db.Create(session).Error; err != nil {
		t.Fatalf("failed to create auth session: %v", err)
	}
	issuer := accountauth.NewAccessTokenIssuer([]byte(accountAuthTestSecret), accountauth.SystemClock{}, 15*time.Minute)
	token, err := issuer.Issue(userID, session.ID, time.Now())
	if err != nil {
		t.Fatalf("failed to issue public token: %v", err)
	}
	return token
}

func newAccountAuthTestApp(db *gorm.DB) *fiber.App {
	app := fiber.New()
	account := app.Group("/account", PublicAccountRequired(db, []byte(accountAuthTestSecret)))
	account.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("ok")
	})
	return app
}

func performAccountAuthRequest(t *testing.T, app *fiber.App, token string) *http.Response {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/account/", nil)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	return resp
}

func decodeAccountAuthBody(t *testing.T, resp *http.Response) map[string]interface{} {
	t.Helper()
	defer resp.Body.Close()
	var body map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode response body: %v", err)
	}
	return body
}

func TestPublicAccountRequiredMissingToken(t *testing.T) {
	app := newAccountAuthTestApp(&gorm.DB{})
	resp := performAccountAuthRequest(t, app, "")
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401 for missing token, got %d", resp.StatusCode)
	}
}

func TestPublicAccountRequiredInvalidToken(t *testing.T) {
	app := newAccountAuthTestApp(&gorm.DB{})
	resp := performAccountAuthRequest(t, app, "not-a-valid-token")
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401 for invalid token, got %d", resp.StatusCode)
	}
}

func TestPublicAccountOptionalAllowsAnonymousRequest(t *testing.T) {
	app := fiber.New()
	app.Post("/optional", PublicAccountOptional(nil, []byte(accountAuthTestSecret)), func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusNoContent)
	})

	response, err := app.Test(httptest.NewRequest(http.MethodPost, "/optional", nil))
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != fiber.StatusNoContent {
		t.Fatalf("status=%d want %d", response.StatusCode, fiber.StatusNoContent)
	}
}

func TestPublicAccountOptionalRejectsInvalidSuppliedToken(t *testing.T) {
	app := fiber.New()
	app.Post("/optional", PublicAccountOptional(nil, []byte(accountAuthTestSecret)), func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusNoContent)
	})

	request := httptest.NewRequest(http.MethodPost, "/optional", nil)
	request.Header.Set("Authorization", "Bearer invalid")
	response, err := app.Test(request)
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("status=%d want %d", response.StatusCode, fiber.StatusUnauthorized)
	}
}

func TestPublicAccountRequiredRejectsAdminAudienceToken(t *testing.T) {
	t.Setenv("JWT_SECRET", accountAuthTestSecret)
	db := accountAuthTestDB(t)
	role := createAdminAuthTestRole(t, db, true, true, models.PermissionsMap{"dashboard": "read"})
	user := createAdminAuthTestUser(t, db, role, true)

	adminToken, err := utils.GenerateAdminAccessToken(user.ID)
	if err != nil {
		t.Fatalf("failed to generate admin token: %v", err)
	}

	app := newAccountAuthTestApp(db)
	resp := performAccountAuthRequest(t, app, adminToken)
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401 for admin-audience token, got %d", resp.StatusCode)
	}
}

func TestPublicAccountRequiredAcceptsPublicToken(t *testing.T) {
	db := accountAuthTestDB(t)
	user := createAccountAuthUser(t, db, models.AccountStatusActive, true)

	app := newAccountAuthTestApp(db)
	resp := performAccountAuthRequest(t, app, issueAccountAuthToken(t, db, user.ID))
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200 for valid public token, got %d", resp.StatusCode)
	}
}

func TestPublicAccountRequiredRejectsInactiveUser(t *testing.T) {
	db := accountAuthTestDB(t)
	user := createAccountAuthUser(t, db, models.AccountStatusActive, false)

	app := newAccountAuthTestApp(db)
	resp := performAccountAuthRequest(t, app, issueAccountAuthToken(t, db, user.ID))
	if resp.StatusCode != fiber.StatusForbidden {
		t.Fatalf("expected 403 for inactive user, got %d", resp.StatusCode)
	}
	body := decodeAccountAuthBody(t, resp)
	if body["code"] != string(accountauth.CodeAccountDisabled) {
		t.Fatalf("expected code %q, got %v", accountauth.CodeAccountDisabled, body["code"])
	}
}

func TestPublicAccountRequiredRejectsNonActiveStatus(t *testing.T) {
	for _, status := range []models.AccountStatus{
		models.AccountStatusPendingVerification,
		models.AccountStatusDisabled,
		models.AccountStatusClosed,
	} {
		db := accountAuthTestDB(t)
		user := createAccountAuthUser(t, db, status, true)

		app := newAccountAuthTestApp(db)
		resp := performAccountAuthRequest(t, app, issueAccountAuthToken(t, db, user.ID))
		if resp.StatusCode != fiber.StatusForbidden {
			t.Fatalf("expected 403 for status %q, got %d", status, resp.StatusCode)
		}
	}
}

func TestPublicAccountRequiredRejectsRevokedSession(t *testing.T) {
	db := accountAuthTestDB(t)
	user := createAccountAuthUser(t, db, models.AccountStatusActive, true)
	session := &models.AuthSession{
		UserID:     user.ID,
		FamilyID:   uuid.New(),
		TokenHash:  uuid.NewString(),
		ExpiresAt:  time.Now().Add(time.Hour),
		LastUsedAt: time.Now(),
	}
	if err := db.Create(session).Error; err != nil {
		t.Fatalf("failed to create auth session: %v", err)
	}
	issuer := accountauth.NewAccessTokenIssuer([]byte(accountAuthTestSecret), accountauth.SystemClock{}, 15*time.Minute)
	token, err := issuer.Issue(user.ID, session.ID, time.Now())
	if err != nil {
		t.Fatalf("failed to issue public token: %v", err)
	}
	if err := db.Model(session).Updates(map[string]interface{}{"revoked_at": time.Now(), "revoked_reason": "logout_all"}).Error; err != nil {
		t.Fatalf("failed to revoke auth session: %v", err)
	}

	resp := performAccountAuthRequest(t, newAccountAuthTestApp(db), token)
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401 for revoked session, got %d", resp.StatusCode)
	}
	body := decodeAccountAuthBody(t, resp)
	if body["code"] != string(accountauth.CodeTokenInvalid) {
		t.Fatalf("expected code %q, got %v", accountauth.CodeTokenInvalid, body["code"])
	}
}
