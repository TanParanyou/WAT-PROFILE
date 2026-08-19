package main

import (
	"context"
	"time"

	"github.com/joho/godotenv"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
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
	refs := services.NewMediaReferenceService(config.DB)
	retention := services.NewMediaRetentionService(config.DB, r2, refs)
	outbox := services.NewOperationOutboxService(config.DB)
	if _, err := outbox.Enqueue(services.OutboxJobInput{
		JobKey:        "media:purge:" + time.Now().UTC().Format("2006-01-02"),
		Kind:          "media.purge_due",
		AggregateType: "media",
		AggregateID:   "-",
	}); err != nil {
		logger.Log.Fatal().Err(err).Msg("Failed to enqueue media purge job")
	}
	dispatcher := services.NewOperationDispatcher(nil, nil, r2, retention, nil, nil)
	startTime := time.Now()
	count, err := outbox.RunOnceKinds(context.Background(), "media-retention", 1, dispatcher.Dispatch, "media.purge_due")
	if err != nil {
		logger.Log.Fatal().Err(err).Msg("Failed to run media retention job")
	}
	logger.Log.Info().
		Int("processed_count", count).
		Dur("duration", time.Since(startTime)).
		Msg("Processed media retention jobs successfully")
}
