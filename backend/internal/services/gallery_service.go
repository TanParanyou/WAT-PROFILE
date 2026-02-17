package services

import (
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type GalleryService struct {
	db *gorm.DB
}

func NewGalleryService(db *gorm.DB) *GalleryService {
	return &GalleryService{db: db}
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
