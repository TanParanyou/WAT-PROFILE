package services

import (
	"os"
	"testing"

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

	if err := db.AutoMigrate(&models.User{}, &models.Role{}); err != nil {
		t.Fatalf("migrate user/role: %v", err)
	}

	return db
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

	t.Run("successfully update name and email without password", func(t *testing.T) {
		updated, err := svc.UpdateProfile(user.ID, "New Admin", "profile-new@wat.local", "", "")
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if updated.Name != "New Admin" {
			t.Fatalf("expected name to be 'New Admin', got '%s'", updated.Name)
		}
		if updated.Email != "profile-new@wat.local" {
			t.Fatalf("expected email to be 'profile-new@wat.local', got '%s'", updated.Email)
		}
	})

	t.Run("fail to update password if current password is wrong", func(t *testing.T) {
		_, err := svc.UpdateProfile(user.ID, "New Admin", "profile-new@wat.local", "WrongPassword", "NewPassword123")
		if err == nil {
			t.Fatal("expected error with wrong current password, got nil")
		}
	})

	t.Run("successfully update password with valid current password", func(t *testing.T) {
		updated, err := svc.UpdateProfile(user.ID, "New Admin", "profile-new@wat.local", "OldPassword123", "NewPassword123")
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if !utils.CheckPasswordHash("NewPassword123", updated.PasswordHash) {
			t.Fatal("expected password hash to match new password")
		}
	})
}
