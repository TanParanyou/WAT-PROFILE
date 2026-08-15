package services

import (
	"context"
	"errors"
	"os"
	"strconv"
	"testing"

	"github.com/watloungporsai/wat-profile-backend/internal/contacts"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type failingContactOutbox struct{}

func (failingContactOutbox) EnqueueTx(*gorm.DB, OutboxJobInput) (*models.OperationOutbox, error) {
	return nil, errors.New("outbox unavailable")
}

func contactTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := os.Getenv("DATABASE_URL_TEST")
	if dsn == "" {
		t.Skip("DATABASE_URL_TEST is not configured")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	if err := db.AutoMigrate(&models.ContactInquiry{}, &models.OperationOutbox{}); err != nil {
		t.Fatalf("migrate contact models: %v", err)
	}
	return db
}

func TestContactSubmitCommitsInquiryAndOutbox(t *testing.T) {
	db := contactTestDB(t)
	service := NewContactServiceWithOutbox(db, NewOperationOutboxService(db))
	created, err := service.Submit(context.Background(), contacts.Submission{
		Name: "Visitor", Email: "visitor@example.invalid", Subject: "Visit", Message: "Hello", Locale: "en",
	})
	if err != nil {
		t.Fatal(err)
	}
	defer db.Delete(&models.ContactInquiry{}, created.ID)
	defer db.Where("job_key = ?", "contact:notification:"+strconv.Itoa(created.ID)).Delete(&models.OperationOutbox{})

	var job models.OperationOutbox
	if err := db.Where("job_key = ?", "contact:notification:"+strconv.Itoa(created.ID)).First(&job).Error; err != nil {
		t.Fatal(err)
	}
	if job.Kind != "contact.notification" || job.AggregateID != strconv.Itoa(created.ID) || job.Payload["contact_id"] == nil {
		t.Fatalf("unexpected job: %+v", job)
	}
}

func TestContactSubmitRollsBackWhenOutboxFails(t *testing.T) {
	db := contactTestDB(t)
	var before int64
	if err := db.Model(&models.ContactInquiry{}).Count(&before).Error; err != nil {
		t.Fatal(err)
	}
	_, err := NewContactServiceWithOutbox(db, failingContactOutbox{}).Submit(context.Background(), contacts.Submission{
		Name: "Visitor", Email: "rollback@example.invalid", Subject: "Visit", Message: "Hello", Locale: "de",
	})
	if err == nil {
		t.Fatal("expected enqueue failure")
	}
	var after int64
	if err := db.Model(&models.ContactInquiry{}).Count(&after).Error; err != nil {
		t.Fatal(err)
	}
	if after != before {
		t.Fatalf("contact count = %d, want %d", after, before)
	}
}
