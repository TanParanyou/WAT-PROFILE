package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/internal/storage"
)

func main() {
	_ = godotenv.Load()
	if err := config.InitDatabase(); err != nil {
		log.Fatal(err)
	}
	defer config.CloseDatabase()

	r2, err := storage.NewR2Service()
	if err != nil {
		log.Fatal(err)
	}
	outbox := services.NewOperationOutboxService(config.DB)
	refs := services.NewMediaReferenceService(config.DB)
	retention := services.NewMediaRetentionService(config.DB, r2, refs)
	sender, err := workerEmailSender()
	if err != nil {
		log.Fatal(err)
	}
	contactSender, err := services.NewResendEmailSender(
		strings.TrimSpace(os.Getenv("RESEND_API_KEY")),
		strings.TrimSpace(os.Getenv("CONTACT_EMAIL_FROM")),
	)
	if err != nil {
		log.Fatal(err)
	}
	recipient := strings.TrimSpace(os.Getenv("CONTACT_NOTIFICATION_TO"))
	if recipient == "" {
		log.Fatal("CONTACT_NOTIFICATION_TO is required")
	}
	donations := services.NewDonationServiceWithOutbox(config.DB, outbox)
	contacts := services.NewContactService(config.DB)
	notifications := services.NewContactNotificationService(contactSender, recipient)
	dispatcher := services.NewOperationDispatcher(donations, services.NewDonationEmailService(sender), r2, retention, contacts, notifications)

	// A daily deterministic job makes media retention durable and safe to run
	// from cron more than once. The worker also processes donation email jobs.
	if _, err := outbox.Enqueue(services.OutboxJobInput{
		JobKey:        "media:purge:" + time.Now().UTC().Format("2006-01-02"),
		Kind:          "media.purge_due",
		AggregateType: "media",
		AggregateID:   "-",
	}); err != nil {
		log.Fatal(err)
	}

	host, _ := os.Hostname()
	workerID := fmt.Sprintf("operations-worker:%s:%s", host, uuid.NewString())
	count, err := outbox.RunOnce(context.Background(), workerID, 25, dispatcher.Dispatch)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("processed %d operation outbox jobs", count)
}

func workerEmailSender() (accountauth.EmailSender, error) {
	mode := os.Getenv("AUTH_EMAIL_DELIVERY_MODE")
	environment := os.Getenv("ENV")
	if mode == "" {
		mode = "capture"
	}
	sender, err := services.NewAccountEmailSender(config.AccountAuthConfig{
		EmailMode:    mode,
		Environment:  environment,
		ResendAPIKey: os.Getenv("RESEND_API_KEY"),
		EmailFrom:    os.Getenv("ACCOUNT_EMAIL_FROM"),
	})
	if err != nil {
		return nil, err
	}
	return sender, nil
}
