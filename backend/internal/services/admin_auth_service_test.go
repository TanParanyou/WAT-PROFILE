package services

import (
	"errors"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func testAdminAuthDB(t *testing.T) *gorm.DB {
	t.Helper()

	dsn := os.Getenv("DATABASE_URL_TEST")
	if dsn == "" {
		t.Skip("DATABASE_URL_TEST is not configured")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}

	if err := db.AutoMigrate(
		&models.Role{},
		&models.User{},
		&models.AdminSession{},
		&models.AdminSessionRefreshHistory{},
	); err != nil {
		t.Fatalf("migrate admin session models: %v", err)
	}

	return db
}

func createAdminAuthRole(t *testing.T, db *gorm.DB, permissions models.PermissionsMap, adminAccess bool) models.Role {
	t.Helper()
	role := models.Role{
		ID:          uuid.New(),
		Name:        fmt.Sprintf("role-%s", uuid.New().String()),
		Permissions: permissions,
		IsActive:    true,
		AdminAccess: adminAccess,
	}
	if err := db.Create(&role).Error; err != nil {
		t.Fatalf("create role: %v", err)
	}
	return role
}

func createAdminAuthUser(t *testing.T, db *gorm.DB, role *models.Role, active bool) models.User {
	t.Helper()
	hashed, _ := utils.HashPassword("Password123!")
	user := models.User{
		ID:           uuid.New(),
		Email:        fmt.Sprintf("admin-%s@wat.local", uuid.New().String()),
		PasswordHash: &hashed,
		Name:         "Admin Tester",
		IsActive:     active,
	}
	if role != nil {
		user.RoleID = &role.ID
	}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}
	// The IsActive field carries a gorm default:true tag, so a zero-value
	// Create omits it and the DB applies true. Force the intended value.
	if err := db.Model(&user).Update("is_active", active).Error; err != nil {
		t.Fatalf("set is_active: %v", err)
	}
	return user
}

func TestAdminAuthServiceRejectsRolelessUser(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-admin-service")
	db := testAdminAuthDB(t)
	user := createAdminAuthUser(t, db, nil, true)
	svc := NewAdminAuthService(db, time.Now)

	_, err := svc.LoginAdmin(user.Email, "Password123!", "127.0.0.1", "test")
	if !errors.Is(err, ErrAdminCredentials) {
		t.Fatalf("error = %v", err)
	}
}

func TestAdminAuthServiceRejectsInactiveRole(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-admin-service")
	db := testAdminAuthDB(t)
	role := createAdminAuthRole(t, db, nil, true)
	role.IsActive = false
	if err := db.Save(&role).Error; err != nil {
		t.Fatalf("deactivate role: %v", err)
	}
	user := createAdminAuthUser(t, db, &role, true)
	svc := NewAdminAuthService(db, time.Now)

	_, err := svc.LoginAdmin(user.Email, "Password123!", "127.0.0.1", "test")
	if !errors.Is(err, ErrAdminCredentials) {
		t.Fatalf("error = %v", err)
	}
}

func TestAdminAuthServiceRejectsAdminAccessFalse(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-admin-service")
	db := testAdminAuthDB(t)
	role := createAdminAuthRole(t, db, models.PermissionsMap{"events": "read"}, false)
	user := createAdminAuthUser(t, db, &role, true)
	svc := NewAdminAuthService(db, time.Now)

	_, err := svc.LoginAdmin(user.Email, "Password123!", "127.0.0.1", "test")
	if !errors.Is(err, ErrAdminCredentials) {
		t.Fatalf("error = %v", err)
	}
}

func TestAdminAuthServiceRejectsInactiveUser(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-admin-service")
	db := testAdminAuthDB(t)
	role := createAdminAuthRole(t, db, nil, true)
	user := createAdminAuthUser(t, db, &role, false)
	svc := NewAdminAuthService(db, time.Now)

	_, err := svc.LoginAdmin(user.Email, "Password123!", "127.0.0.1", "test")
	if !errors.Is(err, ErrAdminCredentials) {
		t.Fatalf("error = %v", err)
	}
}

func TestAdminAuthServiceLoginAndRefreshRotation(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-admin-service")
	t.Setenv("ADMIN_SESSION_EXPIRY", "24h")
	t.Setenv("ADMIN_SESSION_GRACE", "30s")
	db := testAdminAuthDB(t)
	role := createAdminAuthRole(t, db, models.PermissionsMap{"dashboard": "read"}, true)
	user := createAdminAuthUser(t, db, &role, true)
	now := time.Now()
	svc := NewAdminAuthService(db, func() time.Time { return now })

	login, err := svc.LoginAdmin(user.Email, "Password123!", "127.0.0.1", "test")
	if err != nil {
		t.Fatalf("login failed: %v", err)
	}
	if login.AccessToken == "" || login.RefreshCredential == "" || login.User == nil {
		t.Fatalf("expected access token, refresh credential and user in result")
	}
	if login.User.ID != user.ID {
		t.Fatalf("expected user %s, got %s", user.ID, login.User.ID)
	}

	second, err := svc.RefreshAdmin(login.RefreshCredential)
	if err != nil {
		t.Fatalf("refresh failed: %v", err)
	}
	if second.RefreshCredential == login.RefreshCredential {
		t.Fatalf("expected rotated refresh credential")
	}

	oldInGrace, err := svc.RefreshAdmin(login.RefreshCredential)
	if err != nil {
		t.Fatalf("expected old credential to remain valid within grace: %v", err)
	}

	third, err := svc.RefreshAdmin(second.RefreshCredential)
	if err != nil {
		t.Fatalf("expected second credential valid within grace: %v", err)
	}
	if third.RefreshCredential == second.RefreshCredential {
		t.Fatalf("expected rotated refresh credential after history refresh")
	}

	_ = oldInGrace
}

func TestAdminAuthServiceOutOfWindowReuseRevokesSession(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-admin-service")
	t.Setenv("ADMIN_SESSION_EXPIRY", "24h")
	t.Setenv("ADMIN_SESSION_GRACE", "30s")
	db := testAdminAuthDB(t)
	role := createAdminAuthRole(t, db, nil, true)
	user := createAdminAuthUser(t, db, &role, true)
	now := time.Now()
	svc := NewAdminAuthService(db, func() time.Time { return now })

	login, err := svc.LoginAdmin(user.Email, "Password123!", "127.0.0.1", "test")
	if err != nil {
		t.Fatalf("login failed: %v", err)
	}

	now = now.Add(1 * time.Minute)
	if _, err := svc.RefreshAdmin(login.RefreshCredential); err != nil {
		t.Fatalf("refresh within session expiry failed: %v", err)
	}

	now = now.Add(1 * time.Minute)
	_, err = svc.RefreshAdmin(login.RefreshCredential)
	if !errors.Is(err, ErrAdminSessionReused) {
		t.Fatalf("expected ErrAdminSessionReused, got %v", err)
	}

	_, err = svc.RefreshAdmin(login.RefreshCredential)
	if !errors.Is(err, ErrAdminSessionInvalid) {
		t.Fatalf("expected session to stay revoked, got %v", err)
	}
}

func TestAdminAuthServiceExpiredSessionRejected(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-admin-service")
	t.Setenv("ADMIN_SESSION_EXPIRY", "1h")
	t.Setenv("ADMIN_SESSION_GRACE", "30s")
	db := testAdminAuthDB(t)
	role := createAdminAuthRole(t, db, nil, true)
	user := createAdminAuthUser(t, db, &role, true)
	now := time.Now()
	svc := NewAdminAuthService(db, func() time.Time { return now })

	login, err := svc.LoginAdmin(user.Email, "Password123!", "127.0.0.1", "test")
	if err != nil {
		t.Fatalf("login failed: %v", err)
	}

	now = now.Add(2 * time.Hour)
	_, err = svc.RefreshAdmin(login.RefreshCredential)
	if !errors.Is(err, ErrAdminSessionInvalid) {
		t.Fatalf("expected ErrAdminSessionInvalid after expiry, got %v", err)
	}
}

func TestAdminAuthServiceIdempotentLogout(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-admin-service")
	db := testAdminAuthDB(t)
	role := createAdminAuthRole(t, db, nil, true)
	user := createAdminAuthUser(t, db, &role, true)
	svc := NewAdminAuthService(db, time.Now)

	login, err := svc.LoginAdmin(user.Email, "Password123!", "127.0.0.1", "test")
	if err != nil {
		t.Fatalf("login failed: %v", err)
	}

	if err := svc.RevokeAdminSession(login.RefreshCredential, "logout"); err != nil {
		t.Fatalf("first logout failed: %v", err)
	}
	if err := svc.RevokeAdminSession(login.RefreshCredential, "logout"); err != nil {
		t.Fatalf("second logout should be idempotent, got %v", err)
	}

	_, err = svc.RefreshAdmin(login.RefreshCredential)
	if !errors.Is(err, ErrAdminSessionInvalid) {
		t.Fatalf("expected revoked session rejected, got %v", err)
	}
}

func TestAdminAuthServiceRevokeAllSessions(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-admin-service")
	db := testAdminAuthDB(t)
	role := createAdminAuthRole(t, db, nil, true)
	user := createAdminAuthUser(t, db, &role, true)
	svc := NewAdminAuthService(db, time.Now)

	first, err := svc.LoginAdmin(user.Email, "Password123!", "127.0.0.1", "test")
	if err != nil {
		t.Fatalf("first login failed: %v", err)
	}
	second, err := svc.LoginAdmin(user.Email, "Password123!", "127.0.0.1", "test")
	if err != nil {
		t.Fatalf("second login failed: %v", err)
	}

	if err := svc.RevokeAllAdminSessions(user.ID, "password_changed"); err != nil {
		t.Fatalf("revoke all failed: %v", err)
	}

	if _, err := svc.RefreshAdmin(first.RefreshCredential); !errors.Is(err, ErrAdminSessionInvalid) {
		t.Fatalf("expected first session revoked, got %v", err)
	}
	if _, err := svc.RefreshAdmin(second.RefreshCredential); !errors.Is(err, ErrAdminSessionInvalid) {
		t.Fatalf("expected second session revoked, got %v", err)
	}
}

func TestAdminAuthServiceInvalidCredentialRejected(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret-admin-service")
	db := testAdminAuthDB(t)
	role := createAdminAuthRole(t, db, nil, true)
	user := createAdminAuthUser(t, db, &role, true)
	svc := NewAdminAuthService(db, time.Now)

	_, err := svc.LoginAdmin(user.Email, "WrongPassword", "127.0.0.1", "test")
	if !errors.Is(err, ErrAdminCredentials) {
		t.Fatalf("error = %v", err)
	}
}
