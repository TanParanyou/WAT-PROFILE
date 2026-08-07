package services

import (
	"errors"
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

func TestMediaServiceSoftDeleteSetsPurgeAt(t *testing.T) {
	db := testDatabase(t)
	now := time.Date(2026, 8, 7, 0, 0, 0, 0, time.UTC)
	media := models.Media{
		ID:       uuid.New(),
		Filename: "lifecycle.png",
		URL:      "https://example.test/lifecycle.png",
	}
	if err := db.Create(&media).Error; err != nil {
		t.Fatal(err)
	}

	svc := NewMediaService(db, func() time.Time { return now })
	actorID := uuid.New()
	if err := svc.SoftDelete(media.ID, actorID); err != nil {
		t.Fatal(err)
	}

	got, err := svc.GetByIDIncludingDeleted(media.ID)
	if err != nil {
		t.Fatal(err)
	}
	if got.DeletedByID == nil || *got.DeletedByID != actorID {
		t.Fatalf("deleted_by_id = %v, want %s", got.DeletedByID, actorID)
	}
	wantPurgeAt := now.AddDate(0, 0, 30)
	if got.PurgeAt == nil || !got.PurgeAt.Equal(wantPurgeAt) {
		t.Fatalf("purge_at = %v, want %v", got.PurgeAt, wantPurgeAt)
	}
	if _, err := svc.GetByID(media.ID); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("GetByID error = %v, want record not found for deleted media", err)
	}
}

func TestMediaServiceRestoreClearsLifecycleFields(t *testing.T) {
	db := testDatabase(t)
	media := models.Media{
		ID:        uuid.New(),
		Filename:  "restore.png",
		URL:       "https://example.test/restore.png",
		DeletedAt: ptrTime(time.Now().Add(-time.Hour)),
		PurgeAt:   ptrTime(time.Now().Add(29 * 24 * time.Hour)),
	}
	if err := db.Create(&media).Error; err != nil {
		t.Fatal(err)
	}

	svc := NewMediaService(db)
	if err := svc.Restore(media.ID); err != nil {
		t.Fatal(err)
	}
	got, err := svc.GetByIDIncludingDeleted(media.ID)
	if err != nil {
		t.Fatal(err)
	}
	if got.DeletedAt != nil || got.PurgeAt != nil || got.DeletedByID != nil {
		t.Fatalf("lifecycle fields were not cleared: %#v", got)
	}
}

func ptrTime(value time.Time) *time.Time { return &value }
