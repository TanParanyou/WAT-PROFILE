package services

import (
	"errors"
	"strconv"

	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type ChantingService struct {
	db *gorm.DB
}

func NewChantingService(db *gorm.DB) *ChantingService {
	return &ChantingService{db: db}
}

type ChantingListOptions struct {
	Common     listquery.Common
	Categories []string
	Statuses   []string
}

var chantingSortColumns = map[string]string{
	"id":            "chantings.id",
	"display_order": "chantings.display_order",
	"title":         "chantings.title->>'th'",
	"category":      "chantings.category",
	"duration":      "chantings.duration_seconds",
	"status":        "chantings.is_active",
	"created_at":    "chantings.created_at",
}

// ListActive returns active chantings for public view, optionally filtered by category
func (s *ChantingService) ListActive(category string) ([]models.Chanting, error) {
	var chantings []models.Chanting
	query := s.db.Where("is_active = ?", true).Order("display_order ASC, id ASC")
	if category != "" && category != "all" {
		query = query.Where("category = ?", category)
	}
	err := query.Find(&chantings).Error
	return chantings, err
}

// GetBySlug finds an active chanting by its URL slug
func (s *ChantingService) GetBySlug(slug string) (*models.Chanting, error) {
	var chanting models.Chanting
	err := s.db.Where("slug = ? AND is_active = ?", slug, true).First(&chanting).Error
	if err != nil {
		return nil, err
	}
	return &chanting, nil
}

// GetByID finds a chanting by ID
func (s *ChantingService) GetByID(id int) (*models.Chanting, error) {
	var chanting models.Chanting
	err := s.db.First(&chanting, id).Error
	if err != nil {
		return nil, err
	}
	return &chanting, nil
}

// ListAdmin returns a paginated list of chantings for admin management
func (s *ChantingService) ListAdmin(options ChantingListOptions) ([]models.Chanting, int64, error) {
	var chantings []models.Chanting
	var total int64

	query := s.db.Model(&models.Chanting{})

	if options.Common.Search != "" {
		searchTerm := "%" + options.Common.Search + "%"
		query = query.Where(
			"chantings.slug ILIKE ? OR chantings.title->>'th' ILIKE ? OR chantings.title->>'en' ILIKE ? OR chantings.title->>'de' ILIKE ? OR chantings.pali_thai ILIKE ? OR chantings.pali_roman ILIKE ? OR chantings.category ILIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	if len(options.Categories) > 0 {
		query = query.Where("chantings.category IN ?", options.Categories)
	}

	if len(options.Statuses) > 0 {
		var activeFilter []bool
		for _, st := range options.Statuses {
			if st == "active" {
				activeFilter = append(activeFilter, true)
			} else if st == "inactive" {
				activeFilter = append(activeFilter, false)
			}
		}
		if len(activeFilter) > 0 {
			query = query.Where("chantings.is_active IN ?", activeFilter)
		}
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortColumn, exists := chantingSortColumns[options.Common.Sort]
	if !exists {
		sortColumn = "chantings.display_order"
	}
	query = query.Order(sortColumn + " " + options.Common.Order + ", chantings.id ASC")

	offset := (options.Common.Page - 1) * options.Common.Limit
	if err := query.Offset(offset).Limit(options.Common.Limit).Find(&chantings).Error; err != nil {
		return nil, 0, err
	}

	return chantings, total, nil
}

// Create inserts a new chanting item
func (s *ChantingService) Create(chanting *models.Chanting) error {
	if chanting.Slug == "" {
		chanting.Slug = "chant-" + strconv.FormatInt(s.db.NowFunc().Unix(), 10)
	}
	return s.db.Create(chanting).Error
}

// Update updates an existing chanting
func (s *ChantingService) Update(id int, updated *models.Chanting) error {
	var existing models.Chanting
	if err := s.db.First(&existing, id).Error; err != nil {
		return err
	}

	existing.Slug = updated.Slug
	existing.Title = updated.Title
	existing.Subtitle = updated.Subtitle
	existing.Category = updated.Category
	existing.PaliThai = updated.PaliThai
	existing.PaliRoman = updated.PaliRoman
	existing.Translation = updated.Translation
	existing.AudioURL = updated.AudioURL
	existing.DurationSeconds = updated.DurationSeconds
	existing.DisplayOrder = updated.DisplayOrder
	existing.IsActive = updated.IsActive

	return s.db.Save(&existing).Error
}

// Delete removes a chanting by ID
func (s *ChantingService) Delete(id int) error {
	result := s.db.Delete(&models.Chanting{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("chanting not found")
	}
	return nil
}
