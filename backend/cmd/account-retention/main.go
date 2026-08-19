package main

import (
	"context"
	"time"

	"github.com/joho/godotenv"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/internal/storage"
	"github.com/watloungporsai/wat-profile-backend/pkg/logger"
)

func main() {
	logger.Init()
	_ = godotenv.Load()
	cfg, err := config.LoadAccountAuthConfig()
	if err != nil {
		logger.Log.Fatal().Err(err).Msg("Failed to load account auth config")
	}
	if err := config.InitDatabase(); err != nil {
		logger.Log.Fatal().Err(err).Msg("Failed to initialize database")
	}
	defer config.CloseDatabase()
	sender, err := services.NewAccountEmailSender(cfg)
	if err != nil {
		logger.Log.Fatal().Err(err).Msg("Failed to initialize account email sender")
	}
	r2, err := storage.NewR2Service()
	if err != nil {
		logger.Log.Fatal().Err(err).Msg("Failed to initialize R2 storage service")
	}
	service := services.NewAccountLifecycleService(config.DB, sender, accountauth.SystemClock{}, accountauth.NewOpaqueToken, nil)
	startTime := time.Now()
	count, err := service.PurgeDue(context.Background(), r2)
	if err != nil {
		logger.Log.Fatal().Err(err).Msg("Failed to purge due accounts")
	}
	logger.Log.Info().
		Int("purged_count", count).
		Dur("duration", time.Since(startTime)).
		Msg("Purged public accounts successfully")
}
