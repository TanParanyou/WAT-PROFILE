package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const testAdminPassword = "Password123!"

func testAdminHandlerDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := os.Getenv("DATABASE_URL_TEST")
	if dsn == "" {
		t.Skip("DATABASE_URL_TEST is not set; skipping admin handler DB test")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to connect to test database: %v", err)
	}
	if err := db.AutoMigrate(&models.Role{}, &models.User{}, &models.AdminSession{}, &models.AdminSessionRefreshHistory{}, &models.AuditLog{}); err != nil {
		t.Fatalf("failed to migrate test database: %v", err)
	}
	return db
}

func createAdminHandlerUser(t *testing.T, db *gorm.DB) *models.User {
	t.Helper()
	role := models.Role{
		ID:          uuid.New(),
		Name:        "admin-" + uuid.New().String(),
		IsActive:    true,
		AdminAccess: true,
		Permissions: models.PermissionsMap{"dashboard": "read"},
	}
	if err := db.Create(&role).Error; err != nil {
		t.Fatalf("failed to create role: %v", err)
	}

	hash, err := utils.HashPassword(testAdminPassword)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}
	user := models.User{
		ID:           uuid.New(),
		Email:        "admin-" + uuid.New().String() + "@wat.local",
		PasswordHash: &hash,
		Name:         "Test Admin",
		RoleID:       &role.ID,
		IsActive:     true,
	}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("failed to create user: %v", err)
	}
	return &user
}

func newAdminAuthTestApp(db *gorm.DB) *fiber.App {
	app := fiber.New()
	handler := NewAdminAuthHandler(db)
	guard := middleware.AdminOriginGuard([]string{"http://localhost:3000"})
	g := app.Group("/api/v1/auth/admin", guard)
	g.Post("/login", handler.Login)
	g.Post("/refresh", handler.Refresh)
	g.Post("/logout", handler.Logout)
	return app
}

func adminLoginRequest(t *testing.T, app *fiber.App, email, password string) *http.Response {
	t.Helper()
	body := bytes.NewBufferString(`{"email":"` + email + `","password":"` + password + `"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/admin/login", body)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "http://localhost:3000")
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("login request failed: %v", err)
	}
	return res
}

func TestAdminLoginRejectsDisallowedOrigin(t *testing.T) {
	app := fiber.New()
	app.Post("/api/v1/auth/admin/login", middleware.AdminOriginGuard([]string{"https://admin.example"}), func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/admin/login", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "https://evil.example")
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if res.StatusCode != fiber.StatusForbidden {
		t.Fatalf("status = %d, want %d", res.StatusCode, fiber.StatusForbidden)
	}
}

func TestAdminLoginSuccessSetsCookie(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	t.Setenv("ADMIN_COOKIE_SECURE", "true")
	db := testAdminHandlerDB(t)
	user := createAdminHandlerUser(t, db)
	app := newAdminAuthTestApp(db)

	res := adminLoginRequest(t, app, user.Email, testAdminPassword)
	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("status = %d, want %d", res.StatusCode, fiber.StatusOK)
	}

	var payload struct {
		Success bool `json:"success"`
		Data    struct {
			AccessToken string           `json:"access_token"`
			User        models.User      `json:"user"`
			Extra       map[string]any   `json:"-"`
		} `json:"data"`
	}
	var raw map[string]json.RawMessage
	if err := json.NewDecoder(res.Body).Decode(&raw); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if err := json.Unmarshal(raw["data"], &payload.Data); err != nil {
		t.Fatalf("failed to decode data: %v", err)
	}
	if payload.Data.AccessToken == "" {
		t.Fatal("access_token is empty")
	}
	if payload.Data.User.ID != user.ID {
		t.Fatalf("user id = %v, want %v", payload.Data.User.ID, user.ID)
	}
	if _, ok := raw["refresh_token"]; ok {
		t.Fatal("refresh_token leaked in login response body")
	}
	var dataMap map[string]json.RawMessage
	if err := json.Unmarshal(raw["data"], &dataMap); err != nil {
		t.Fatalf("failed to decode data map: %v", err)
	}
	for key := range dataMap {
		if key != "access_token" && key != "user" {
			t.Fatalf("unexpected key %q in login data; refresh credential must not be exposed", key)
		}
	}

	setCookie := res.Header.Get("Set-Cookie")
	if setCookie == "" {
		t.Fatal("no Set-Cookie header")
	}
	if !strings.Contains(setCookie, "wat_admin_refresh=") {
		t.Fatalf("cookie name not found in Set-Cookie: %s", setCookie)
	}
	if !strings.Contains(setCookie, "HttpOnly") {
		t.Fatalf("cookie missing HttpOnly: %s", setCookie)
	}
	if !strings.Contains(setCookie, "SameSite=Strict") {
		t.Fatalf("cookie missing SameSite=Strict: %s", setCookie)
	}
	if !strings.Contains(strings.ToLower(setCookie), "secure") {
		t.Fatalf("cookie missing Secure when ADMIN_COOKIE_SECURE=true: %s", setCookie)
	}
	if !strings.Contains(strings.ToLower(setCookie), "path=/api/v1/auth/admin") {
		t.Fatalf("cookie missing Path=/api/v1/auth/admin: %s", setCookie)
	}
}

func TestAdminLoginGenericError(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	db := testAdminHandlerDB(t)
	user := createAdminHandlerUser(t, db)
	app := newAdminAuthTestApp(db)

	res := adminLoginRequest(t, app, user.Email, "WrongPassword1!")
	if res.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", res.StatusCode, fiber.StatusUnauthorized)
	}

	var payload struct {
		Success bool   `json:"success"`
		Code    string `json:"code"`
		Error   string `json:"error"`
	}
	if err := json.NewDecoder(res.Body).Decode(&payload); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if payload.Code != "ADMIN_INVALID_CREDENTIALS" {
		t.Fatalf("code = %q, want ADMIN_INVALID_CREDENTIALS", payload.Code)
	}
	if payload.Error == "" {
		t.Fatal("generic error message is empty")
	}
	if res.Header.Get("Set-Cookie") != "" {
		t.Fatal("failed login must not set a refresh cookie")
	}
}

func TestAdminLoginMissingCredentials(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	db := testAdminHandlerDB(t)
	app := newAdminAuthTestApp(db)

	body := bytes.NewBufferString(`{"email":"","password":""}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/admin/login", body)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "http://localhost:3000")
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if res.StatusCode != fiber.StatusBadRequest {
		t.Fatalf("status = %d, want %d", res.StatusCode, fiber.StatusBadRequest)
	}
}

func TestAdminRefreshRotatesCookie(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	db := testAdminHandlerDB(t)
	user := createAdminHandlerUser(t, db)
	app := newAdminAuthTestApp(db)

	loginRes := adminLoginRequest(t, app, user.Email, testAdminPassword)
	cookies := loginRes.Cookies()
	if len(cookies) == 0 {
		t.Fatal("login did not set a cookie")
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/admin/refresh", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.AddCookie(cookies[0])
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("refresh request failed: %v", err)
	}
	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("status = %d, want %d", res.StatusCode, fiber.StatusOK)
	}

	var payload struct {
		Success bool `json:"success"`
		Data    struct {
			AccessToken string `json:"access_token"`
		} `json:"data"`
	}
	if err := json.NewDecoder(res.Body).Decode(&payload); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if payload.Data.AccessToken == "" {
		t.Fatal("refreshed access_token is empty")
	}
	if res.Header.Get("Set-Cookie") == "" {
		t.Fatal("refresh did not set a rotated cookie")
	}
}

func TestAdminRefreshWithoutCookie(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	db := testAdminHandlerDB(t)
	app := newAdminAuthTestApp(db)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/admin/refresh", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("refresh request failed: %v", err)
	}
	if res.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", res.StatusCode, fiber.StatusUnauthorized)
	}

	var payload struct {
		Code string `json:"code"`
	}
	if err := json.NewDecoder(res.Body).Decode(&payload); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if payload.Code != "ADMIN_SESSION_INVALID" {
		t.Fatalf("code = %q, want ADMIN_SESSION_INVALID", payload.Code)
	}
}

func TestAdminLogoutClearsCookie(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	db := testAdminHandlerDB(t)
	user := createAdminHandlerUser(t, db)
	app := newAdminAuthTestApp(db)

	loginRes := adminLoginRequest(t, app, user.Email, testAdminPassword)
	cookies := loginRes.Cookies()
	if len(cookies) == 0 {
		t.Fatal("login did not set a cookie")
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/admin/logout", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.AddCookie(cookies[0])
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("logout request failed: %v", err)
	}
	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("status = %d, want %d", res.StatusCode, fiber.StatusOK)
	}

	setCookie := res.Header.Get("Set-Cookie")
	if setCookie == "" {
		t.Fatal("logout did not clear the refresh cookie")
	}
	if !strings.Contains(setCookie, "wat_admin_refresh=;") && !strings.Contains(setCookie, "wat_admin_refresh=\"\"") {
		t.Fatalf("logout did not clear cookie value: %s", setCookie)
	}
}

func TestAdminLogoutClearsCookieForInvalidCredential(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	db := testAdminHandlerDB(t)
	app := newAdminAuthTestApp(db)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/admin/logout", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.AddCookie(&http.Cookie{Name: "wat_admin_refresh", Value: "not-a-real-credential"})
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("logout request failed: %v", err)
	}
	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("status = %d, want %d (logout must succeed and clear cookie)", res.StatusCode, fiber.StatusOK)
	}
	if res.Header.Get("Set-Cookie") == "" {
		t.Fatal("logout must clear the refresh cookie even for an invalid credential")
	}
}
