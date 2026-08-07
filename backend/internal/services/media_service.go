package services

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type MediaService struct {
	db  *gorm.DB
	now func() time.Time
}

func NewMediaService(db *gorm.DB, clocks ...func() time.Time) *MediaService {
	now := time.Now
	if len(clocks) > 0 && clocks[0] != nil {
		now = clocks[0]
	}
	return &MediaService{db: db, now: now}
}

func (s *MediaService) List() ([]models.Media, error) {
	var media []models.Media
	err := s.db.Where("deleted_at IS NULL").Order("created_at DESC").Find(&media).Error
	return media, err
}

type MediaListOptions struct {
	Common            listquery.Common
	MIMEGroups        []string
	Categories        []string
	UploaderIDs       []uuid.UUID
	MissingAltLocales []string
}

type MediaFilterOptions struct {
	Categories        []string `json:"categories"`
	MimeTypes         []string `json:"mime_types"`
	AltMissingLocales []string `json:"alt_missing_locales"`
}

var mediaSortColumns = map[string]string{
	"id":         "media.id",
	"created_at": "media.created_at",
	"filename":   "media.filename",
	"file_size":  "media.size",
	"size":       "media.size",
	"mime_type":  "media.mime_type",
}

// ListOptions returns paginated media items with full search, filter, and sorting
func (s *MediaService) ListOptions(options MediaListOptions) ([]models.Media, int64, error) {
	var media []models.Media
	var total int64

	query := s.db.Model(&models.Media{})
	query = query.Where("media.deleted_at IS NULL")

	if options.Common.Search != "" {
		searchTerm := "%" + options.Common.Search + "%"
		query = query.Where(
			"media.filename ILIKE ? OR media.mime_type ILIKE ?",
			searchTerm, searchTerm,
		)
	}

	if len(options.Categories) > 0 {
		query = query.Where("media.category IN ?", options.Categories)
	}

	if len(options.UploaderIDs) > 0 {
		query = query.Where("media.uploaded_by_id IN ?", options.UploaderIDs)
	}

	if len(options.MIMEGroups) > 0 {
		var mimeConditions []string
		var mimeArgs []interface{}
		for _, mg := range options.MIMEGroups {
			mgLower := strings.ToLower(mg)
			if strings.Contains(mgLower, "/") {
				mimeConditions = append(mimeConditions, "media.mime_type = ?")
				mimeArgs = append(mimeArgs, mgLower)
			} else {
				mimeConditions = append(mimeConditions, "media.mime_type ILIKE ?")
				mimeArgs = append(mimeArgs, mgLower+"/%")
			}
		}
		if len(mimeConditions) > 0 {
			query = query.Where("("+strings.Join(mimeConditions, " OR ")+")", mimeArgs...)
		}
	}

	var missingAltConditions []string
	var missingAltArgs []interface{}
	for _, locale := range options.MissingAltLocales {
		if locale == "th" || locale == "en" || locale == "de" {
			missingAltConditions = append(missingAltConditions, "BTRIM(COALESCE(media.alt_texts->>?, '')) = ''")
			missingAltArgs = append(missingAltArgs, locale)
		}
	}
	if len(missingAltConditions) > 0 {
		// Multi-select follows the other Admin filters: show a media item when
		// any selected locale is missing, so editors can work one language queue
		// at a time without accidentally hiding items missing another locale.
		query = query.Where("("+strings.Join(missingAltConditions, " OR ")+")", missingAltArgs...)
	}

	if options.Common.From != nil {
		query = query.Where("media.created_at >= ?", *options.Common.From)
	}

	if options.Common.To != nil {
		query = query.Where("media.created_at <= ?", *options.Common.To)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortCol, ok := mediaSortColumns[options.Common.Sort]
	if !ok {
		sortCol = "media.created_at"
	}
	orderDir := "DESC"
	if options.Common.Order == "asc" {
		orderDir = "ASC"
	}

	offset := (options.Common.Page - 1) * options.Common.Limit
	err := query.Preload("UploadedBy").
		Order(sortCol + " " + orderDir + ", media.id " + orderDir).
		Offset(offset).
		Limit(options.Common.Limit).
		Find(&media).Error

	return media, total, err
}

// GetFilterOptions returns distinct categories and mime types for filtering
func (s *MediaService) GetFilterOptions() (*MediaFilterOptions, error) {
	var categories []string
	if err := s.db.Model(&models.Media{}).
		Where("deleted_at IS NULL AND category IS NOT NULL AND category != ''").
		Distinct().Pluck("category", &categories).Error; err != nil {
		return nil, err
	}

	var mimeTypes []string
	if err := s.db.Model(&models.Media{}).
		Where("deleted_at IS NULL AND mime_type IS NOT NULL AND mime_type != ''").
		Distinct().Pluck("mime_type", &mimeTypes).Error; err != nil {
		return nil, err
	}

	return &MediaFilterOptions{
		Categories:        categories,
		MimeTypes:         mimeTypes,
		AltMissingLocales: []string{"th", "en", "de"},
	}, nil
}

func (s *MediaService) GetByID(id uuid.UUID) (*models.Media, error) {
	var media models.Media
	if err := s.db.Where("deleted_at IS NULL").First(&media, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &media, nil
}

func (s *MediaService) GetByIDIncludingDeleted(id uuid.UUID) (*models.Media, error) {
	var media models.Media
	if err := s.db.First(&media, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &media, nil
}

func (s *MediaService) SoftDelete(id, actorID uuid.UUID) error {
	now := s.now()
	result := s.db.Model(&models.Media{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Updates(map[string]interface{}{
			"deleted_at":    now,
			"deleted_by_id": actorID,
			"purge_at":      now.AddDate(0, 0, 30),
		})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (s *MediaService) Restore(id uuid.UUID) error {
	result := s.db.Model(&models.Media{}).
		Where("id = ? AND deleted_at IS NOT NULL", id).
		Updates(map[string]interface{}{
			"deleted_at":    nil,
			"deleted_by_id": nil,
			"purge_at":      nil,
		})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (s *MediaService) UpdateMetadata(id uuid.UUID, metadata map[string]interface{}) (*models.Media, error) {
	media, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	media.Metadata = metadata
	if alt, ok := metadata["alt"]; ok {
		encoded, marshalErr := json.Marshal(alt)
		if marshalErr != nil {
			return nil, marshalErr
		}
		var localized models.MultiLangText
		if unmarshalErr := json.Unmarshal(encoded, &localized); unmarshalErr != nil {
			return nil, unmarshalErr
		}
		media.AltTexts = localized
	}
	if err := s.db.Save(media).Error; err != nil {
		return nil, err
	}

	return media, nil
}

func (s *MediaService) Delete(id uuid.UUID) error {
	result := s.db.Delete(&models.Media{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
