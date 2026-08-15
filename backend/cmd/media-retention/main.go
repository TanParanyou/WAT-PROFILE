package main

import (
	"context"
	"log"
	"time"

	"github.com/joho/godotenv"
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
	refs := services.NewMediaReferenceService(config.DB)
	retention := services.NewMediaRetentionService(config.DB, r2, refs)
	outbox := services.NewOperationOutboxService(config.DB)
	if _, err := outbox.Enqueue(services.OutboxJobInput{
		JobKey:        "media:purge:" + time.Now().UTC().Format("2006-01-02"),
		Kind:          "media.purge_due",
		AggregateType: "media",
		AggregateID:   "-",
	}); err != nil {
		log.Fatal(err)
	}
	dispatcher := services.NewOperationDispatcher(nil, nil, r2, retention, nil, nil)
	count, err := outbox.RunOnceKinds(context.Background(), "media-retention", 1, dispatcher.Dispatch, "media.purge_due")
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("processed %d media retention jobs", count)
}
