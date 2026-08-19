package main

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/registrations"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/internal/storage"
	"github.com/watloungporsai/wat-profile-backend/pkg/logger"
)

func main() {
	logger.Init()
	_ = godotenv.Load()
	if err := config.InitDatabase(); err != nil {
		logger.Log.Fatal().Err(err).Msg("Failed to initialize database")
	}
	defer config.CloseDatabase()

	r2, err := storage.NewR2Service()
	if err != nil {
		logger.Log.Fatal().Err(err).Msg("Failed to initialize R2 storage service")
	}
	outbox := services.NewOperationOutboxService(config.DB)
	refs := services.NewMediaReferenceService(config.DB)
	retention := services.NewMediaRetentionService(config.DB, r2, refs)
	sender, err := workerEmailSender()
	if err != nil {
		logger.Log.Fatal().Err(err).Msg("Failed to initialize worker email sender")
	}
	contactSender, err := services.NewResendEmailSender(
		strings.TrimSpace(os.Getenv("RESEND_API_KEY")),
		strings.TrimSpace(os.Getenv("CONTACT_EMAIL_FROM")),
	)
	if err != nil {
		logger.Log.Fatal().Err(err).Msg("Failed to initialize contact email sender")
	}
	recipient := strings.TrimSpace(os.Getenv("CONTACT_NOTIFICATION_TO"))
	if recipient == "" {
		logger.Log.Fatal().Msg("CONTACT_NOTIFICATION_TO is required")
	}
	donations := services.NewDonationServiceWithOutbox(config.DB, outbox)
	contacts := services.NewContactService(config.DB)
	notifications := services.NewContactNotificationService(contactSender, recipient)
	tokenCipher, err := registrations.NewTokenCipher([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		logger.Log.Fatal().Err(err).Msg("Failed to initialize token cipher")
	}
	registrationEmails, err := services.NewRegistrationEmailService(config.DB, sender, os.Getenv("PUBLIC_ACCOUNT_FRONTEND_URL"), tokenCipher, os.Getenv("ENV"))
	if err != nil {
		logger.Log.Fatal().Err(err).Msg("Failed to initialize registration email service")
	}
	dispatcher := services.NewOperationDispatcher(donations, services.NewDonationEmailService(sender), r2, retention, contacts, notifications, registrationEmails)
	accountCfg, accountCfgErr := config.LoadAccountAuthConfig()
	if accountCfgErr != nil {
		logger.Log.Fatal().Err(accountCfgErr).Msg("Failed to load account auth config")
	}
	communityCfg, communityCfgErr := config.LoadCommunityConfig(accountCfg)
	if communityCfgErr != nil {
		logger.Log.Fatal().Err(communityCfgErr).Msg("Failed to load community config")
	}
	dispatcher.SetCommunityRetentionService(services.NewCommunityRetentionService(config.DB, communityCfg))
	if frontendURL := strings.TrimSpace(os.Getenv("PUBLIC_ACCOUNT_FRONTEND_URL")); frontendURL != "" {
		communityEmail, emailErr := services.NewCommunityEmailService(config.DB, sender, frontendURL)
		if emailErr != nil {
			logger.Log.Fatal().Err(emailErr).Msg("Failed to initialize community email service")
		}
		dispatcher.SetCommunityEmailService(communityEmail)
	}

	// A daily deterministic job makes media retention durable and safe to run
	// from cron more than once. The worker also processes donation email jobs.
	if _, err := outbox.Enqueue(services.OutboxJobInput{
		JobKey:        "media:purge:" + time.Now().UTC().Format("2006-01-02"),
		Kind:          "media.purge_due",
		AggregateType: "media",
		AggregateID:   "-",
	}); err != nil {
		logger.Log.Fatal().Err(err).Msg("Failed to enqueue media purge job")
	}
	day := time.Now().UTC().Format("2006-01-02")
	for _, job := range []services.OutboxJobInput{
		{JobKey: "community:retention:" + day, Kind: "community.retention_due", AggregateType: "community", AggregateID: "-"},
		{JobKey: "community:reconcile:" + day, Kind: "community.reconcile_counts", AggregateType: "community", AggregateID: "-"},
	} {
		if _, err := outbox.Enqueue(job); err != nil {
			logger.Log.Fatal().Err(err).Str("job_key", job.JobKey).Msg("Failed to enqueue community job")
		}
	}

	host, _ := os.Hostname()
	workerID := fmt.Sprintf("operations-worker:%s:%s", host, uuid.NewString())
	startTime := time.Now()
	count, err := outbox.RunOnce(context.Background(), workerID, 25, dispatcher.Dispatch)
	if err != nil {
		logger.Log.Fatal().Err(err).Str("worker_id", workerID).Msg("Failed to process operation outbox jobs")
	}
	logger.Log.Info().
		Int("processed_count", count).
		Str("worker_id", workerID).
		Dur("duration", time.Since(startTime)).
		Msg("Processed operation outbox jobs successfully")
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
