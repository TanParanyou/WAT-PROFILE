package main

import (
	"fmt"
	"log"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system env")
	}

	// Build database URL
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
			getEnv("DB_USER", "postgres"),
			getEnv("DB_PASSWORD", ""),
			getEnv("DB_HOST", "localhost"),
			getEnv("DB_PORT", "5432"),
			getEnv("DB_NAME", "wat_profile"),
			getEnv("DB_SSLMODE", "disable"),
		)
	}

	// Get command
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run cmd/migrate/main.go <command>")
		fmt.Println("Commands:")
		fmt.Println("  up       - Apply all pending migrations")
		fmt.Println("  down     - Rollback last migration")
		fmt.Println("  drop     - Drop all tables")
		fmt.Println("  version  - Show current migration version")
		fmt.Println("  force N  - Force set version to N (use after dirty state)")
		os.Exit(1)
	}

	command := os.Args[1]

	// Create migrate instance
	m, err := migrate.New("file://migrations", dbURL)
	if err != nil {
		log.Fatalf("Failed to create migrate instance: %v", err)
	}
	defer m.Close()

	switch command {
	case "up":
		if err := m.Up(); err != nil {
			if err == migrate.ErrNoChange {
				log.Println("No migrations to apply")
			} else {
				log.Fatalf("Migration up failed: %v", err)
			}
		} else {
			log.Println("Migrations applied successfully")
		}

	case "down":
		if err := m.Steps(-1); err != nil {
			log.Fatalf("Migration down failed: %v", err)
		}
		log.Println("Rolled back 1 migration")

	case "drop":
		if err := m.Drop(); err != nil {
			log.Fatalf("Drop failed: %v", err)
		}
		log.Println("All tables dropped")

	case "version":
		version, dirty, err := m.Version()
		if err != nil {
			if err == migrate.ErrNilVersion {
				log.Println("No migrations applied yet")
			} else {
				log.Fatalf("Failed to get version: %v", err)
			}
		} else {
			log.Printf("Version: %d (dirty: %v)", version, dirty)
		}

	case "force":
		if len(os.Args) < 3 {
			log.Fatal("Usage: go run cmd/migrate/main.go force <version>")
		}
		var version int
		fmt.Sscanf(os.Args[2], "%d", &version)
		if err := m.Force(version); err != nil {
			log.Fatalf("Force version failed: %v", err)
		}
		log.Printf("Forced version to %d", version)

	default:
		log.Fatalf("Unknown command: %s", command)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
