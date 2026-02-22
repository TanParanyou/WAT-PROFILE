package services

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type DonationService struct {
	db *gorm.DB
}

func NewDonationService(db *gorm.DB) *DonationService {
	return &DonationService{db: db}
}

// ListCategories returns all active donation categories
func (s *DonationService) ListCategories() ([]models.DonationCategory, error) {
	var categories []models.DonationCategory
	err := s.db.Where("is_active = ?", true).
		Order("display_order ASC").
		Find(&categories).Error
	return categories, err
}

// CreateDonation creates a new donation with auto-generated receipt number
func (s *DonationService) CreateDonation(donation *models.Donation, userID *uuid.UUID) error {
	if userID != nil {
		donation.CreatedByID = userID
	}

	err := s.db.Transaction(func(tx *gorm.DB) error {
		// สร้าง receipt number ภายใน transaction เพื่อป้องกัน race condition
		donation.ReceiptNumber = generateReceiptNumber(tx)

		if err := tx.Create(donation).Error; err != nil {
			return err
		}

		// Reload with relations
		return tx.Preload("Category").Preload("Member").First(donation, donation.ID).Error
	})

	return err
}

// ListDonations returns paginated donations with filters
func (s *DonationService) ListDonations(page, limit int, status, categoryID, from, to string) ([]models.Donation, int64, error) {
	var donations []models.Donation
	query := s.db.Order("created_at DESC")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}
	if from != "" {
		query = query.Where("donation_date >= ?", from)
	}
	if to != "" {
		query = query.Where("donation_date <= ?", to)
	}

	var total int64
	query.Model(&models.Donation{}).Count(&total)

	offset := (page - 1) * limit
	err := query.Preload("Category").Preload("Member").Preload("CreatedBy").
		Offset(offset).Limit(limit).Find(&donations).Error

	return donations, total, err
}

// GetStats returns donation statistics
func (s *DonationService) GetStats() (map[string]interface{}, error) {
	type totalStats struct {
		TotalAmount float64
		TotalCount  int64
	}
	var ts totalStats
	s.db.Model(&models.Donation{}).Where("status = ?", "confirmed").
		Select("COALESCE(SUM(amount), 0) as total_amount, COUNT(*) as total_count").
		Scan(&ts)

	now := time.Now()
	firstOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	type monthlyStats struct {
		MonthlyAmount float64
		MonthlyCount  int64
	}
	var ms monthlyStats
	s.db.Model(&models.Donation{}).Where("status = ? AND donation_date >= ?", "confirmed", firstOfMonth).
		Select("COALESCE(SUM(amount), 0) as monthly_amount, COUNT(*) as monthly_count").
		Scan(&ms)

	return map[string]interface{}{
		"total_amount":   ts.TotalAmount,
		"total_count":    ts.TotalCount,
		"monthly_amount": ms.MonthlyAmount,
		"monthly_count":  ms.MonthlyCount,
	}, nil
}

// GetByID returns a donation by ID
func (s *DonationService) GetByID(id int) (*models.Donation, error) {
	var donation models.Donation
	err := s.db.First(&donation, id).Error
	if err != nil {
		return nil, err
	}
	return &donation, nil
}

// Update saves changes to a donation
func (s *DonationService) Update(donation *models.Donation) error {
	return s.db.Save(donation).Error
}

// Delete removes a donation by ID
func (s *DonationService) Delete(id int) error {
	return s.db.Delete(&models.Donation{}, id).Error
}

// CreateCategory creates a new donation category
func (s *DonationService) CreateCategory(category *models.DonationCategory) error {
	return s.db.Create(category).Error
}

// GetCategoryByID returns a donation category by ID
func (s *DonationService) GetCategoryByID(id int) (*models.DonationCategory, error) {
	var category models.DonationCategory
	err := s.db.First(&category, id).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

// UpdateCategory saves changes to a donation category
func (s *DonationService) UpdateCategory(category *models.DonationCategory) error {
	return s.db.Save(category).Error
}

// DeleteCategory removes a donation category by ID
func (s *DonationService) DeleteCategory(id int) error {
	return s.db.Delete(&models.DonationCategory{}, id).Error
}

// BulkDelete removes multiple donations by their IDs
func (s *DonationService) BulkDelete(ids []int) error {
	return s.db.Where("id IN ?", ids).Delete(&models.Donation{}).Error
}

// BulkDeleteCategories removes multiple donation categories by their IDs
func (s *DonationService) BulkDeleteCategories(ids []int) error {
	return s.db.Where("id IN ?", ids).Delete(&models.DonationCategory{}).Error
}

// generateReceiptNumber creates a unique receipt number (ใช้ tx เพื่อให้อยู่ใน transaction เดียวกัน)
func generateReceiptNumber(tx *gorm.DB) string {
	now := time.Now()
	var count int64
	tx.Model(&models.Donation{}).
		Where("EXTRACT(YEAR FROM created_at) = ?", now.Year()).
		Count(&count)
	return fmt.Sprintf("DON-%d-%03d", now.Year(), count+1)
}
