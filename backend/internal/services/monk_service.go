package services

import (
	"strconv"

	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type MonkService struct {
	db *gorm.DB
}

func NewMonkService(db *gorm.DB) *MonkService {
	return &MonkService{db: db}
}

type MonkListOptions struct {
	Common   listquery.Common
	Statuses []string
}

var monkSortColumns = map[string]string{
	"id":              "monks.id",
	"display_order":   "monks.display_order",
	"name":            "monks.name->>'th'",
	"position":        "monks.position",
	"pansa":           "monks.ordination_date",
	"ordination_date": "monks.ordination_date",
	"status":          "monks.is_active",
	"created_at":      "monks.created_at",
}

// ListAdmin returns a paginated list of monks for admin management
func (s *MonkService) ListAdmin(options MonkListOptions) ([]models.Monk, int64, error) {
	var monks []models.Monk
	var total int64

	query := s.db.Model(&models.Monk{})

	if options.Common.Search != "" {
		searchTerm := "%" + options.Common.Search + "%"
		query = query.Where(
			"monks.slug ILIKE ? OR monks.name->>'th' ILIKE ? OR monks.name->>'en' ILIKE ? OR monks.name->>'de' ILIKE ? OR monks.title->>'th' ILIKE ? OR monks.title->>'en' ILIKE ? OR monks.title->>'de' ILIKE ? OR monks.position->>'th' ILIKE ? OR monks.position->>'en' ILIKE ? OR monks.position->>'de' ILIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
		)
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
			query = query.Where("monks.is_active IN ?", activeFilter)
		}
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortCol, ok := monkSortColumns[options.Common.Sort]
	if !ok {
		sortCol = "monks.display_order"
	}
	orderDir := "ASC"
	if options.Common.Order == "desc" {
		orderDir = "DESC"
	}

	offset := (options.Common.Page - 1) * options.Common.Limit
	err := query.Order(sortCol + " " + orderDir + ", monks.id " + orderDir).
		Offset(offset).
		Limit(options.Common.Limit).
		Find(&monks).Error

	return monks, total, err
}

// ListActive returns all active monks ordered by display_order
func (s *MonkService) ListActive() ([]models.Monk, error) {
	var monks []models.Monk
	err := s.db.Where("is_active = ?", true).
		Order("display_order ASC").
		Find(&monks).Error
	return monks, err
}

// GetBySlug returns a single active monk by slug or ID
func (s *MonkService) GetBySlug(slug string) (*models.Monk, error) {
	var monk models.Monk
	query := s.db.Where("is_active = ?", true)
	if id, err := strconv.Atoi(slug); err == nil {
		query = query.Where("slug = ? OR id = ?", slug, id)
	} else {
		query = query.Where("slug = ?", slug)
	}
	err := query.First(&monk).Error
	if err != nil {
		return nil, err
	}
	return &monk, nil
}

// Create creates a new monk
func (s *MonkService) Create(monk *models.Monk) error {
	return s.db.Create(monk).Error
}

// GetByID returns a monk by ID
func (s *MonkService) GetByID(id int) (*models.Monk, error) {
	var monk models.Monk
	err := s.db.First(&monk, id).Error
	if err != nil {
		return nil, err
	}
	return &monk, nil
}

// Update saves changes to a monk
func (s *MonkService) Update(monk *models.Monk) error {
	return s.db.Save(monk).Error
}

// Delete removes a monk by ID
func (s *MonkService) Delete(id int) error {
	return s.db.Delete(&models.Monk{}, id).Error
}

// BulkDelete removes multiple monks by their IDs
func (s *MonkService) BulkDelete(ids []int) error {
	return s.db.Where("id IN ?", ids).Delete(&models.Monk{}).Error
}
