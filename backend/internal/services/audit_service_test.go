package services

import (
	"os"
	"testing"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func testAuditDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := os.Getenv("DATABASE_URL_TEST")
	if dsn == "" {
		t.Skip("DATABASE_URL_TEST is not configured")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	if err := db.AutoMigrate(&models.AuditLog{}); err != nil {
		t.Fatalf("migrate audit log: %v", err)
	}
	return db
}

func TestLogSecurityEventRejectsDisallowedCategory(t *testing.T) {
	db := testAuditDB(t)
	svc := NewAuditService(db)

	err := svc.LogSecurityEvent(nil, "admin.login.failure", "free_form_secret_data", "admin_auth", "")
	if err == nil {
		t.Fatal("expected disallowed category to be rejected")
	}
}

func TestLogSecurityEventStoresOnlyBoundedData(t *testing.T) {
	db := testAuditDB(t)
	svc := NewAuditService(db)

	if err := db.Where("1 = 1").Delete(&models.AuditLog{}).Error; err != nil {
		t.Fatalf("clear audit logs: %v", err)
	}

	err := svc.LogSecurityEvent(nil, "admin.login.failure", "credentials_or_eligibility", "admin_auth", "")
	if err != nil {
		t.Fatalf("expected allowlisted category to succeed, got %v", err)
	}

	var logs []models.AuditLog
	if err := db.Find(&logs).Error; err != nil {
		t.Fatalf("list audit logs: %v", err)
	}
	if len(logs) != 1 {
		t.Fatalf("expected 1 audit log, got %d", len(logs))
	}
	log := logs[len(logs)-1]
	if log.Changes["category"] != "credentials_or_eligibility" {
		t.Fatalf("expected category stored, got %v", log.Changes)
	}
	if log.Action != "admin.login.failure" {
		t.Fatalf("expected action stored, got %q", log.Action)
	}
}
