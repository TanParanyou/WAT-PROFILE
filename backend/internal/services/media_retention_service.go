package services

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type MediaObjectDeleter interface {
	DeleteFile(context.Context, string) error
}

type MediaRetentionService struct {
	db      *gorm.DB
	store   MediaObjectDeleter
	refs    *MediaReferenceService
	now     func() time.Time
}

func NewMediaRetentionService(db *gorm.DB, store MediaObjectDeleter, refs *MediaReferenceService, clocks ...func() time.Time) *MediaRetentionService {
	now := time.Now
	if len(clocks) > 0 && clocks[0] != nil {
		now = clocks[0]
	}
	return &MediaRetentionService{db: db, store: store, refs: refs, now: now}
}

func (s *MediaRetentionService) ListTrash() ([]models.Media, error) {
	var media []models.Media
	err := s.db.Where("deleted_at IS NOT NULL").Order("purge_at ASC, created_at DESC").Find(&media).Error
	return media, err
}

func (s *MediaRetentionService) PurgeDue(ctx context.Context) (int, error) {
	var media []models.Media
	if err := s.db.WithContext(ctx).Where("deleted_at IS NOT NULL AND purge_at <= ?", s.now()).Find(&media).Error; err != nil {
		return 0, err
	}
	if s.store == nil {
		return 0, errors.New("media storage is not configured")
	}
	purged := 0
	for _, item := range media {
		refs, err := s.refs.FindReferences(ctx, item.URL)
		if err != nil {
			return purged, err
		}
		if len(refs) > 0 {
			continue
		}
		if item.Path != "" {
			if err := s.store.DeleteFile(ctx, item.Path); err != nil {
				return purged, err
			}
		}
		if err := s.db.WithContext(ctx).Delete(&models.Media{}, "id = ? AND deleted_at IS NOT NULL", item.ID).Error; err != nil {
			return purged, err
		}
		purged++
	}
	return purged, nil
}

func (s *MediaRetentionService) PurgeOne(ctx context.Context, id uuid.UUID, confirm bool) error {
	if !confirm {
		return errors.New("permanent deletion requires confirmation")
	}
	var item models.Media
	if err := s.db.WithContext(ctx).Where("id = ? AND deleted_at IS NOT NULL", id).First(&item).Error; err != nil {
		return err
	}
	if s.store == nil {
		return errors.New("media storage is not configured")
	}
	if item.Path != "" {
		if err := s.store.DeleteFile(ctx, item.Path); err != nil {
			return err
		}
	}
	return s.db.WithContext(ctx).Delete(&models.Media{}, "id = ?", id).Error
}
