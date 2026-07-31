package services

import (
	"strings"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type MediaService struct {
	db *gorm.DB
}

func NewMediaService(db *gorm.DB) *MediaService {
	return &MediaService{db: db}
}

func (s *MediaService) List() ([]models.Media, error) {
	var media []models.Media
	err := s.db.Order("created_at DESC").Find(&media).Error
	return media, err
}

type MediaListOptions struct {
	Common      listquery.Common
	MIMEGroups  []string
	Categories  []string
	UploaderIDs []uuid.UUID
}

type MediaFilterOptions struct {
	Categories []string `json:"categories"`
	MimeTypes  []string `json:"mime_types"`
}

var mediaSortColumns = map[string]string{
	"created_at": "media.created_at",
	"filename":   "media.filename",
	"file_size":  "media.file_size",
	"mime_type":  "media.mime_type",
}

// ListOptions returns paginated media items with full search, filter, and sorting
func (s *MediaService) ListOptions(options MediaListOptions) ([]models.Media, int64, error) {
	var media []models.Media
	var total int64

	query := s.db.Model(&models.Media{})

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
		Where("category IS NOT NULL AND category != ''").
		Distinct().Pluck("category", &categories).Error; err != nil {
		return nil, err
	}

	var mimeTypes []string
	if err := s.db.Model(&models.Media{}).
		Where("mime_type IS NOT NULL AND mime_type != ''").
		Distinct().Pluck("mime_type", &mimeTypes).Error; err != nil {
		return nil, err
	}

	return &MediaFilterOptions{
		Categories: categories,
		MimeTypes:  mimeTypes,
	}, nil
}

func (s *MediaService) GetByID(id uuid.UUID) (*models.Media, error) {
	var media models.Media
	if err := s.db.First(&media, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &media, nil
}

func (s *MediaService) UpdateMetadata(id uuid.UUID, metadata map[string]interface{}) (*models.Media, error) {
	media, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	media.Metadata = metadata
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
