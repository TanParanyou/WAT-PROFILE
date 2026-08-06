package main

import (
	"context"
	"log"

	"github.com/joho/godotenv"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/internal/storage"
)

func main() {
	_ = godotenv.Load()
	cfg, err := config.LoadAccountAuthConfig()
	if err != nil {
		log.Fatal(err)
	}
	if err := config.InitDatabase(); err != nil {
		log.Fatal(err)
	}
	defer config.CloseDatabase()
	sender, err := services.NewAccountEmailSender(cfg)
	if err != nil {
		log.Fatal(err)
	}
	r2, err := storage.NewR2Service()
	if err != nil {
		log.Fatal(err)
	}
	service := services.NewAccountLifecycleService(config.DB, sender, accountauth.SystemClock{}, accountauth.NewOpaqueToken, nil)
	count, err := service.PurgeDue(context.Background(), r2)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("purged %d public accounts", count)
}
