package services

import (
	"errors"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func testUserDB(t *testing.T) *gorm.DB {
	t.Helper()

	dsn := os.Getenv("DATABASE_URL_TEST")
	if dsn == "" {
		t.Skip("DATABASE_URL_TEST is not configured")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}

	if err := db.AutoMigrate(&models.User{}, &models.Role{}, &models.AdminSession{}, &models.AdminSessionRefreshHistory{}); err != nil {
		t.Fatalf("migrate user/role/admin-session: %v", err)
	}

	return db
}

func createTestAdminRole(t *testing.T, db *gorm.DB) *models.Role {
	t.Helper()
	role := models.Role{
		ID:          uuid.New(),
		Name:        "admin-" + uuid.NewString(),
		Description: "test admin role",
		Permissions: models.PermissionsMap{"dashboard": "read"},
		IsActive:    true,
		AdminAccess: true,
	}
	if err := db.Create(&role).Error; err != nil {
		t.Fatalf("create role: %v", err)
	}
	return &role
}

func createTestAdminSessionUser(t *testing.T, db *gorm.DB, role *models.Role) *models.User {
	t.Helper()
	hashed, err := utils.HashPassword("OldPassword123")
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}
	user := models.User{
		ID:           uuid.New(),
		Email:        "revoke-" + uuid.NewString() + "@wat.local",
		PasswordHash: hashed,
		Name:         "Revoke Admin",
		RoleID:       &role.ID,
		IsActive:     true,
	}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}
	return &user
}

func TestUserService_UpdateProfile(t *testing.T) {
	db := testUserDB(t)
	svc := NewUserService(db)

	hashed, _ := utils.HashPassword("OldPassword123")
	user := models.User{
		ID:           uuid.New(),
		Email:        "profile-test@wat.local",
		PasswordHash: hashed,
		Name:         "Old Admin",
		IsActive:     true,
	}
	if err := db.Create(&user).Error; err != nil {
		t.Fatal(err)
	}
	defer db.Delete(&user)

	t.Run("successfully update name, email, and avatar without password", func(t *testing.T) {
		avatar := "https://example.com/avatar.jpg"
		updated, err := svc.UpdateProfile(user.ID, "New Admin", "profile-new@wat.local", &avatar, "", "")
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if updated.Name != "New Admin" {
			t.Fatalf("expected name to be 'New Admin', got '%s'", updated.Name)
		}
		if updated.Email != "profile-new@wat.local" {
			t.Fatalf("expected email to be 'profile-new@wat.local', got '%s'", updated.Email)
		}
		if updated.AvatarURL != avatar {
			t.Fatalf("expected avatar_url to be '%s', got '%s'", avatar, updated.AvatarURL)
		}
	})

	t.Run("fail to update password if current password is wrong", func(t *testing.T) {
		_, err := svc.UpdateProfile(user.ID, "New Admin", "profile-new@wat.local", nil, "WrongPassword", "NewPassword123")
		if err == nil {
			t.Fatal("expected error with wrong current password, got nil")
		}
	})

	t.Run("successfully update password with valid current password", func(t *testing.T) {
		updated, err := svc.UpdateProfile(user.ID, "New Admin", "profile-new@wat.local", nil, "OldPassword123", "NewPassword123")
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if !utils.CheckPasswordHash("NewPassword123", updated.PasswordHash) {
			t.Fatal("expected password hash to match new password")
		}
	})
}

func TestAdminSessionRevocation(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	db := testUserDB(t)
	svc := NewUserService(db)
	adminAuth := NewAdminAuthService(db, time.Now)

	role := createTestAdminRole(t, db)
	user := createTestAdminSessionUser(t, db, role)
	defer db.Delete(role)
	defer db.Delete(user)

	login1, err := adminAuth.LoginAdmin(user.Email, "OldPassword123", "127.0.0.1", "test-agent")
	if err != nil {
		t.Fatalf("login: %v", err)
	}
	login2, err := adminAuth.LoginAdmin(user.Email, "OldPassword123", "127.0.0.1", "test-agent")
	if err != nil {
		t.Fatalf("login: %v", err)
	}

	t.Run("self-service password change revokes all admin sessions", func(t *testing.T) {
		if _, err := svc.UpdateProfile(user.ID, "New Name", user.Email, nil, "OldPassword123", "NewPassword123"); err != nil {
			t.Fatalf("update profile: %v", err)
		}
		if _, err := adminAuth.RefreshAdmin(login1.RefreshCredential); !errors.Is(err, ErrAdminSessionInvalid) {
			t.Fatalf("expected first session revoked, got %v", err)
		}
		if _, err := adminAuth.RefreshAdmin(login2.RefreshCredential); !errors.Is(err, ErrAdminSessionInvalid) {
			t.Fatalf("expected second session revoked, got %v", err)
		}
		if _, err := adminAuth.LoginAdmin(user.Email, "NewPassword123", "127.0.0.1", "test-agent"); err != nil {
			t.Fatalf("expected login with new password to succeed, got %v", err)
		}
	})

	t.Run("non-security profile edits do not revoke sessions", func(t *testing.T) {
		l, err := adminAuth.LoginAdmin(user.Email, "NewPassword123", "127.0.0.1", "test-agent")
		if err != nil {
			t.Fatalf("login: %v", err)
		}
		avatar := "https://example.com/avatar.png"
		if _, err := svc.UpdateProfile(user.ID, "Changed Name", user.Email, &avatar, "", ""); err != nil {
			t.Fatalf("update profile: %v", err)
		}
		if _, err := adminAuth.RefreshAdmin(l.RefreshCredential); err != nil {
			t.Fatalf("expected session to remain valid, got %v", err)
		}
	})
}

func TestAdminSessionRevocationAdminSetPassword(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	db := testUserDB(t)
	svc := NewUserService(db)
	adminAuth := NewAdminAuthService(db, time.Now)

	role := createTestAdminRole(t, db)
	user := createTestAdminSessionUser(t, db, role)
	defer db.Delete(role)
	defer db.Delete(user)

	login, err := adminAuth.LoginAdmin(user.Email, "OldPassword123", "127.0.0.1", "test-agent")
	if err != nil {
		t.Fatalf("login: %v", err)
	}

	user.PasswordHash = ""
	if err := svc.Update(user, "AdminSetPassword1"); err != nil {
		t.Fatalf("update: %v", err)
	}
	if _, err := adminAuth.RefreshAdmin(login.RefreshCredential); !errors.Is(err, ErrAdminSessionInvalid) {
		t.Fatalf("expected session revoked after admin-set password, got %v", err)
	}
}

func TestAdminSessionRevocationAccountDisable(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	db := testUserDB(t)
	svc := NewUserService(db)
	adminAuth := NewAdminAuthService(db, time.Now)

	role := createTestAdminRole(t, db)
	user := createTestAdminSessionUser(t, db, role)
	defer db.Delete(role)
	defer db.Delete(user)

	login, err := adminAuth.LoginAdmin(user.Email, "OldPassword123", "127.0.0.1", "test-agent")
	if err != nil {
		t.Fatalf("login: %v", err)
	}

	var loaded models.User
	if err := db.First(&loaded, "id = ?", user.ID).Error; err != nil {
		t.Fatalf("load user: %v", err)
	}
	loaded.IsActive = false
	if err := svc.Update(&loaded, ""); err != nil {
		t.Fatalf("update: %v", err)
	}
	if _, err := adminAuth.RefreshAdmin(login.RefreshCredential); !errors.Is(err, ErrAdminSessionInvalid) {
		t.Fatalf("expected session revoked after account disable, got %v", err)
	}
}

func TestAdminSessionNotRevokedOnNameOnlyUpdate(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	db := testUserDB(t)
	svc := NewUserService(db)
	adminAuth := NewAdminAuthService(db, time.Now)

	role := createTestAdminRole(t, db)
	user := createTestAdminSessionUser(t, db, role)
	defer db.Delete(role)
	defer db.Delete(user)

	login, err := adminAuth.LoginAdmin(user.Email, "OldPassword123", "127.0.0.1", "test-agent")
	if err != nil {
		t.Fatalf("login: %v", err)
	}

	var loaded models.User
	if err := db.First(&loaded, "id = ?", user.ID).Error; err != nil {
		t.Fatalf("load user: %v", err)
	}
	loaded.Name = "Renamed Admin"
	if err := svc.Update(&loaded, ""); err != nil {
		t.Fatalf("update: %v", err)
	}
	if _, err := adminAuth.RefreshAdmin(login.RefreshCredential); err != nil {
		t.Fatalf("expected session to remain valid, got %v", err)
	}
}
