package config

import (
	"fmt"
	"log"
	"os"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDatabase initializes the database connection
func InitDatabase() error {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return fmt.Errorf("DATABASE_URL environment variable is not set")
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Database connected successfully")
	return nil
}

// MigrateModels runs auto-migration for all models
func MigrateModels() error {
	log.Println("Running database migrations...")

	err := DB.AutoMigrate(
		// Core models
		&models.Role{},
		&models.User{},
		&models.RefreshToken{},
		&models.PasswordReset{},
		&models.Setting{},
		&models.Media{},
		&models.AuditLog{},

		// Temple-specific models
		&models.Member{},
		&models.Event{},
		&models.EventSchedule{},
		&models.Monk{},
		&models.GalleryCategory{},
		&models.Gallery{},
		&models.Schedule{},
		&models.DonationCategory{},
		&models.Donation{},
		&models.EventRegistration{},
		&models.ContactInquiry{},
	)

	if err != nil {
		return fmt.Errorf("failed to migrate models: %w", err)
	}

	log.Println("Database migration completed successfully")
	return nil
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}
