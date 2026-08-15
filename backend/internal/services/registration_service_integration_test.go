package services

import (
	"context"
	"errors"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/registrations"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type registrationTestClock struct{ now time.Time }

func (c registrationTestClock) Now() time.Time { return c.now }

type registrationTestOutbox struct {
	mu   sync.Mutex
	jobs []OutboxJobInput
}

func (o *registrationTestOutbox) EnqueueTx(_ *gorm.DB, input OutboxJobInput) (*models.OperationOutbox, error) {
	o.mu.Lock()
	defer o.mu.Unlock()
	o.jobs = append(o.jobs, input)
	return &models.OperationOutbox{}, nil
}

func registrationTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := os.Getenv("DATABASE_URL_TEST")
	if dsn == "" {
		t.Skip("DATABASE_URL_TEST is not configured")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("open registration test database: %v", err)
	}
	if err := db.AutoMigrate(&models.User{}, &models.Member{}, &models.Event{}, &models.EventRegistration{}, &models.EventRegistrationParticipant{}); err != nil {
		t.Fatalf("migrate registration models: %v", err)
	}
	return db
}

func TestRegistrationCreateReservesEveryParticipantAndDerivesIdentity(t *testing.T) {
	db := registrationTestDB(t)
	unique := uuid.NewString()
	now := time.Date(2026, 8, 20, 10, 0, 0, 0, time.UTC)
	eventStart := now.Add(24 * time.Hour)
	user := models.User{ID: uuid.New(), Email: "owner-" + unique + "@example.com", Name: "Owner One", AccountStatus: models.AccountStatusActive}
	if err := db.Create(&user).Error; err != nil {
		t.Fatal(err)
	}
	member := models.Member{UserID: &user.ID, MemberCode: "TEST-" + unique[:12]}
	if err := db.Create(&member).Error; err != nil {
		t.Fatal(err)
	}
	event := models.Event{Slug: "registration-test-" + unique, Title: models.MultiLangText{"en": "Registration Test"}, StartDate: eventStart, EndDate: eventStart.Add(time.Hour), RegistrationEnabled: true, MaxParticipants: registrationIntPtr(3)}
	if err := db.Create(&event).Error; err != nil {
		t.Fatal(err)
	}
	defer db.Where("id = ?", event.ID).Delete(&models.Event{})
	defer db.Where("id = ?", member.ID).Delete(&models.Member{})
	defer db.Where("id = ?", user.ID).Delete(&models.User{})

	cipher, err := registrations.NewTokenCipher([]byte("0123456789abcdef0123456789abcdef"))
	if err != nil {
		t.Fatal(err)
	}
	outbox := &registrationTestOutbox{}
	service := NewRegistrationServiceWithDependencies(db, outbox, registrationTestClock{now: now}, func() (string, string, error) {
		return "raw-token", "hashed-token", nil
	}, cipher)
	result, err := service.Create(context.Background(), event.ID, registrations.Identity{UserID: &user.ID, MemberID: &member.ID}, registrations.CreateInput{
		Locale: "en", Contact: registrations.ContactInput{FirstName: "Owner", LastName: "One", Email: user.Email},
		Participants: []registrations.ParticipantInput{{FirstName: "Owner", LastName: "One"}, {FirstName: "Guest", LastName: "Two"}}, PrivacyNoticeVersion: "2026-08",
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.RegistrationStatus != "pending" || len(result.Participants) != 2 || result.RegistrationType != "member" {
		t.Fatalf("unexpected result: %#v", result)
	}
	var count int64
	if err := db.Model(&models.EventRegistrationParticipant{}).Joins("JOIN event_registrations ON event_registrations.id = event_registration_participants.registration_id").Where("event_registrations.event_id = ?", event.ID).Count(&count).Error; err != nil {
		t.Fatal(err)
	}
	if count != 2 {
		t.Fatalf("participant count = %d, want 2", count)
	}
	if len(outbox.jobs) != 1 || outbox.jobs[0].Payload["token_ciphertext"] == "raw-token" {
		t.Fatalf("outbox payload did not preserve encrypted-only token material: %#v", outbox.jobs)
	}
}

func registrationIntPtr(value int) *int { return &value }

func TestRegistrationCreateRejectsDisabledEvent(t *testing.T) {
	db := registrationTestDB(t)
	unique := uuid.NewString()
	now := time.Now().UTC()
	event := models.Event{Slug: "registration-disabled-" + unique, Title: models.MultiLangText{"en": "Disabled"}, StartDate: now.Add(time.Hour), EndDate: now.Add(2 * time.Hour), RegistrationEnabled: false}
	if err := db.Create(&event).Error; err != nil {
		t.Fatal(err)
	}
	defer db.Where("id = ?", event.ID).Delete(&models.Event{})
	cipher, err := registrations.NewTokenCipher([]byte("0123456789abcdef0123456789abcdef"))
	if err != nil {
		t.Fatal(err)
	}
	service := NewRegistrationServiceWithDependencies(db, &registrationTestOutbox{}, accountauth.SystemClock{}, accountauth.NewOpaqueToken, cipher)
	_, err = service.Create(context.Background(), event.ID, registrations.Identity{}, registrations.CreateInput{Locale: "en", Contact: registrations.ContactInput{FirstName: "A", LastName: "B", Email: "disabled-" + unique + "@example.com"}, Participants: []registrations.ParticipantInput{{FirstName: "A", LastName: "B"}}, PrivacyNoticeVersion: "2026-08"})
	var domainErr *registrations.DomainError
	if !errors.As(err, &domainErr) || domainErr.Code != registrations.CodeDisabled {
		t.Fatalf("error = %v, want %s", err, registrations.CodeDisabled)
	}
}
