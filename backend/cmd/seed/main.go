package main

import (
	"flag"
	"log"

	"github.com/joho/godotenv"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/seeder"
)

func main() {
	mode := flag.String("mode", "full", "Seed mode: 'essential' for minimal production, 'full' for complete staging/demo")
	flag.Parse()

	// Load .env if present
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Connect database
	if err := config.InitDatabase(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Run migrations
	if err := config.MigrateModels(); err != nil {
		log.Fatalf("Failed to migrate database models: %v", err)
	}

	s := seeder.NewSeeder(config.DB)

	switch *mode {
	case "essential", "prod", "production":
		if err := s.SeedEssential(); err != nil {
			log.Fatalf("Essential seed failed: %v", err)
		}
	case "full", "dev", "demo", "staging":
		if err := s.SeedFull(); err != nil {
			log.Fatalf("Full seed failed: %v", err)
		}
	default:
		log.Fatalf("Unknown seed mode %q. Use 'essential' or 'full'.", *mode)
	}
}
