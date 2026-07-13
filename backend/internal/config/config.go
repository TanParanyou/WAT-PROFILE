package config

import (
	"fmt"
	"log"
	"os"
	"time"

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

	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             2 * time.Second,
			LogLevel:                  logger.Warn,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	var err error
	DB, err = gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true, // Disable prepared statements for connection poolers (e.g. Supabase)
	}), &gorm.Config{
		Logger: newLogger,
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
		&models.ContentPage{},
		&models.ContentSection{},
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

// ConfigureConnectionPool ตั้งค่า connection pool สำหรับ database
func ConfigureConnectionPool() {
	sqlDB, err := DB.DB()
	if err != nil {
		log.Printf("Warning: failed to get sql.DB for pool config: %v", err)
		return
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)
	sqlDB.SetConnMaxIdleTime(1 * time.Minute)

	log.Println("Database connection pool configured")
}

// CloseDatabase ปิด database connection อย่างปลอดภัย
func CloseDatabase() {
	sqlDB, err := DB.DB()
	if err != nil {
		log.Printf("Warning: failed to get sql.DB for closing: %v", err)
		return
	}
	if err := sqlDB.Close(); err != nil {
		log.Printf("Warning: error closing database: %v", err)
	} else {
		log.Println("Database connection closed")
	}
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}
