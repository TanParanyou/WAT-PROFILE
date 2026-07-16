package services

import (
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func testDatabase(t *testing.T) *gorm.DB {
	t.Helper()

	dsn := os.Getenv("DATABASE_URL_TEST")
	if dsn == "" {
		t.Skip("DATABASE_URL_TEST is not configured")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}

	if err := db.AutoMigrate(&models.Media{}); err != nil {
		t.Fatalf("migrate media: %v", err)
	}

	if err := db.Exec("DELETE FROM media").Error; err != nil {
		t.Fatalf("clear media: %v", err)
	}

	return db
}

func TestMediaServiceListOrdersNewestFirst(t *testing.T) {
	db := testDatabase(t)

	older := models.Media{
		ID:        uuid.New(),
		Filename:  "older.png",
		URL:       "https://example.test/older.png",
		CreatedAt: time.Now().Add(-time.Minute),
	}
	newer := models.Media{
		ID:        uuid.New(),
		Filename:  "newer.png",
		URL:       "https://example.test/newer.png",
		CreatedAt: time.Now(),
	}

	if err := db.Create(&older).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&newer).Error; err != nil {
		t.Fatal(err)
	}

	items, err := NewMediaService(db).List()
	if err != nil {
		t.Fatal(err)
	}
	if len(items) != 2 {
		t.Fatalf("unexpected list length: %d", len(items))
	}
	if items[0].ID != newer.ID {
		t.Fatalf("expected newest media first, got %#v", items)
	}
}
