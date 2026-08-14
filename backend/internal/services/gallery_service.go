package services

import (
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type GalleryService struct {
	db *gorm.DB
}

func NewGalleryService(db *gorm.DB) *GalleryService {
	return &GalleryService{db: db}
}

type GalleryListOptions struct {
	Common      listquery.Common
	Statuses    []string
	CategoryIDs []int
	EventIDs    []int
}

type GalleryCategoryListOptions struct {
	Common   listquery.Common
	Statuses []string
}

var gallerySortColumns = map[string]string{
	"id":            "galleries.id",
	"display_order": "galleries.display_order",
	"created_at":    "galleries.created_at",
	"caption":       "galleries.caption->>'th'",
}

var galleryCategorySortColumns = map[string]string{
	"id":            "gallery_categories.id",
	"display_order": "gallery_categories.display_order",
	"name":          "gallery_categories.name->>'th'",
	"slug":          "gallery_categories.slug",
	"created_at":    "gallery_categories.created_at",
}

// ListAdmin returns a paginated list of gallery items for admin management
func (s *GalleryService) ListAdmin(options GalleryListOptions) ([]models.Gallery, int64, error) {
	var galleries []models.Gallery
	var total int64

	query := s.db.Model(&models.Gallery{})

	if options.Common.Search != "" {
		searchTerm := "%" + options.Common.Search + "%"
		query = query.Where(
			"galleries.caption->>'th' ILIKE ? OR galleries.caption->>'en' ILIKE ? OR galleries.caption->>'de' ILIKE ?",
			searchTerm, searchTerm, searchTerm,
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
			query = query.Where("galleries.is_active IN ?", activeFilter)
		}
	}

	if len(options.CategoryIDs) > 0 {
		query = query.Where("galleries.category_id IN ?", options.CategoryIDs)
	}

	if len(options.EventIDs) > 0 {
		query = query.Where("galleries.event_id IN ?", options.EventIDs)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortCol, ok := gallerySortColumns[options.Common.Sort]
	if !ok {
		sortCol = "galleries.display_order"
	}
	orderDir := "ASC"
	if options.Common.Order == "desc" {
		orderDir = "DESC"
	}

	offset := (options.Common.Page - 1) * options.Common.Limit
	err := query.Preload("Category").
		Order(sortCol + " " + orderDir + ", galleries.id " + orderDir).
		Offset(offset).
		Limit(options.Common.Limit).
		Find(&galleries).Error

	return galleries, total, err
}

// ListCategoriesAdmin returns a paginated list of gallery categories for admin management
func (s *GalleryService) ListCategoriesAdmin(options GalleryCategoryListOptions) ([]models.GalleryCategory, int64, error) {
	var categories []models.GalleryCategory
	var total int64

	query := s.db.Model(&models.GalleryCategory{})

	if options.Common.Search != "" {
		searchTerm := "%" + options.Common.Search + "%"
		query = query.Where(
			"gallery_categories.slug ILIKE ? OR gallery_categories.name->>'th' ILIKE ? OR gallery_categories.name->>'en' ILIKE ? OR gallery_categories.name->>'de' ILIKE ? OR gallery_categories.description->>'th' ILIKE ? OR gallery_categories.description->>'en' ILIKE ? OR gallery_categories.description->>'de' ILIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
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
			query = query.Where("gallery_categories.is_active IN ?", activeFilter)
		}
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortCol, ok := galleryCategorySortColumns[options.Common.Sort]
	if !ok {
		sortCol = "gallery_categories.display_order"
	}
	orderDir := "ASC"
	if options.Common.Order == "desc" {
		orderDir = "DESC"
	}

	offset := (options.Common.Page - 1) * options.Common.Limit
	err := query.Order(sortCol + " " + orderDir + ", gallery_categories.id " + orderDir).
		Offset(offset).
		Limit(options.Common.Limit).
		Find(&categories).Error

	return categories, total, err
}

// ListActive returns all active galleries, optionally filtered by category
func (s *GalleryService) ListActive(categoryID string) ([]models.Gallery, error) {
	var galleries []models.Gallery
	query := s.db.Where("is_active = ?", true).Order("display_order ASC")

	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	err := query.Preload("Category").Find(&galleries).Error
	return galleries, err
}

// Create creates a new gallery item
func (s *GalleryService) Create(gallery *models.Gallery) error {
	return s.db.Create(gallery).Error
}

// GetByID returns a gallery item by ID
func (s *GalleryService) GetByID(id int) (*models.Gallery, error) {
	var gallery models.Gallery
	err := s.db.First(&gallery, id).Error
	if err != nil {
		return nil, err
	}
	return &gallery, nil
}

// Update saves changes to a gallery item
func (s *GalleryService) Update(gallery *models.Gallery) error {
	return s.db.Save(gallery).Error
}

// Delete removes a gallery item by ID
func (s *GalleryService) Delete(id int) error {
	return s.db.Delete(&models.Gallery{}, id).Error
}

// ListCategories returns all active gallery categories
func (s *GalleryService) ListCategories() ([]models.GalleryCategory, error) {
	var categories []models.GalleryCategory
	err := s.db.Where("is_active = ?", true).
		Order("display_order ASC").
		Find(&categories).Error
	return categories, err
}

// CreateCategory creates a new gallery category
func (s *GalleryService) CreateCategory(category *models.GalleryCategory) error {
	return s.db.Create(category).Error
}

// GetCategoryByID returns a gallery category by ID
func (s *GalleryService) GetCategoryByID(id int) (*models.GalleryCategory, error) {
	var category models.GalleryCategory
	err := s.db.First(&category, id).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

// UpdateCategory saves changes to a gallery category
func (s *GalleryService) UpdateCategory(category *models.GalleryCategory) error {
	return s.db.Save(category).Error
}

// BulkDelete removes multiple gallery items by their IDs
func (s *GalleryService) BulkDelete(ids []int) error {
	return s.db.Where("id IN ?", ids).Delete(&models.Gallery{}).Error
}

// BulkDeleteCategories removes multiple gallery categories by their IDs
func (s *GalleryService) BulkDeleteCategories(ids []int) error {
	return s.db.Where("id IN ?", ids).Delete(&models.GalleryCategory{}).Error
}

// BulkUpdateStatus updates the is_active status for multiple gallery items
func (s *GalleryService) BulkUpdateStatus(ids []int, isActive bool) error {
	return s.db.Model(&models.Gallery{}).Where("id IN ?", ids).Update("is_active", isActive).Error
}

// BulkUpdateCategory updates the category_id for multiple gallery items
func (s *GalleryService) BulkUpdateCategory(ids []int, categoryID *int) error {
	return s.db.Model(&models.Gallery{}).Where("id IN ?", ids).Update("category_id", categoryID).Error
}

// BulkUpdateEvent updates the event_id for multiple gallery items
func (s *GalleryService) BulkUpdateEvent(ids []int, eventID *int) error {
	return s.db.Model(&models.Gallery{}).Where("id IN ?", ids).Update("event_id", eventID).Error
}

// CreateBatch creates multiple gallery items in a single batch
func (s *GalleryService) CreateBatch(items []models.Gallery) ([]models.Gallery, error) {
	if len(items) == 0 {
		return []models.Gallery{}, nil
	}
	err := s.db.Create(&items).Error
	return items, err
}

// Reorder updates display_order for a list of gallery IDs and returns the updated items
func (s *GalleryService) Reorder(ids []int) ([]models.Gallery, error) {
	var updatedItems []models.Gallery
	err := s.db.Transaction(func(tx *gorm.DB) error {
		for index, id := range ids {
			if err := tx.Model(&models.Gallery{}).Where("id = ?", id).Update("display_order", index+1).Error; err != nil {
				return err
			}
		}
		return tx.Preload("Category").Preload("Event").Where("id IN ?", ids).Order("display_order ASC").Find(&updatedItems).Error
	})
	return updatedItems, err
}

