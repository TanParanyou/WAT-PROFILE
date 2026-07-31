package services

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
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

type DonationListOptions struct {
	Common      listquery.Common
	Statuses    []string
	CategoryIDs []int
	Methods     []string
	Currencies  []string
}

type DonationCategoryListOptions struct {
	Common   listquery.Common
	Statuses []string
}

type DonationFilterOptions struct {
	PaymentMethods []string                  `json:"payment_methods"`
	Currencies     []string                  `json:"currencies"`
	Categories     []models.DonationCategory `json:"categories"`
}

var donationSortColumns = map[string]string{
	"receipt_number": "donations.receipt_number",
	"donor_name":     "donations.donor_name",
	"amount":         "donations.amount",
	"donation_date":  "donations.donation_date",
	"payment_method": "donations.payment_method",
	"status":         "donations.status",
	"created_at":     "donations.created_at",
}

var donationCategorySortColumns = map[string]string{
	"display_order": "donation_categories.display_order",
	"name":          "donation_categories.name->>'th'",
	"created_at":    "donation_categories.created_at",
}

// ListDonationsOptions returns paginated donations with full search, filter, and sorting
func (s *DonationService) ListDonationsOptions(options DonationListOptions) ([]models.Donation, int64, error) {
	var donations []models.Donation
	var total int64

	query := s.db.Model(&models.Donation{})

	if options.Common.Search != "" {
		searchTerm := "%" + options.Common.Search + "%"
		query = query.Where(
			"donations.donor_name ILIKE ? OR donations.receipt_number ILIKE ? OR donations.note ILIKE ?",
			searchTerm, searchTerm, searchTerm,
		)
	}

	if len(options.Statuses) > 0 {
		query = query.Where("donations.status IN ?", options.Statuses)
	}

	if len(options.CategoryIDs) > 0 {
		query = query.Where("donations.category_id IN ?", options.CategoryIDs)
	}

	if len(options.Methods) > 0 {
		query = query.Where("donations.payment_method IN ?", options.Methods)
	}

	if len(options.Currencies) > 0 {
		query = query.Where("donations.currency IN ?", options.Currencies)
	}

	if options.Common.From != nil {
		query = query.Where("donations.donation_date >= ?", *options.Common.From)
	}

	if options.Common.To != nil {
		query = query.Where("donations.donation_date <= ?", *options.Common.To)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortCol, ok := donationSortColumns[options.Common.Sort]
	if !ok {
		sortCol = "donations.donation_date"
	}
	orderDir := "DESC"
	if options.Common.Order == "asc" {
		orderDir = "ASC"
	}

	offset := (options.Common.Page - 1) * options.Common.Limit
	err := query.Preload("Category").Preload("Member").Preload("CreatedBy").
		Order(sortCol + " " + orderDir + ", donations.id " + orderDir).
		Offset(offset).
		Limit(options.Common.Limit).
		Find(&donations).Error

	return donations, total, err
}

// GetFilterOptions returns distinct payment methods, currencies, and categories for filtering
func (s *DonationService) GetFilterOptions() (*DonationFilterOptions, error) {
	var methods []string
	if err := s.db.Model(&models.Donation{}).
		Where("payment_method IS NOT NULL AND payment_method != ''").
		Distinct().Pluck("payment_method", &methods).Error; err != nil {
		return nil, err
	}

	var currencies []string
	if err := s.db.Model(&models.Donation{}).
		Where("currency IS NOT NULL AND currency != ''").
		Distinct().Pluck("currency", &currencies).Error; err != nil {
		return nil, err
	}

	categories, err := s.ListCategories()
	if err != nil {
		return nil, err
	}

	return &DonationFilterOptions{
		PaymentMethods: methods,
		Currencies:     currencies,
		Categories:     categories,
	}, nil
}

// ListCategoriesAdmin returns paginated donation categories for admin
func (s *DonationService) ListCategoriesAdmin(options DonationCategoryListOptions) ([]models.DonationCategory, int64, error) {
	var categories []models.DonationCategory
	var total int64

	query := s.db.Model(&models.DonationCategory{})

	if options.Common.Search != "" {
		searchTerm := "%" + options.Common.Search + "%"
		query = query.Where(
			"donation_categories.name->>'th' ILIKE ? OR donation_categories.name->>'en' ILIKE ? OR donation_categories.name->>'de' ILIKE ? OR donation_categories.description->>'th' ILIKE ? OR donation_categories.description->>'en' ILIKE ? OR donation_categories.description->>'de' ILIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
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
			query = query.Where("donation_categories.is_active IN ?", activeFilter)
		}
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortCol, ok := donationCategorySortColumns[options.Common.Sort]
	if !ok {
		sortCol = "donation_categories.display_order"
	}
	orderDir := "ASC"
	if options.Common.Order == "desc" {
		orderDir = "DESC"
	}

	offset := (options.Common.Page - 1) * options.Common.Limit
	err := query.Order(sortCol + " " + orderDir + ", donation_categories.id " + orderDir).
		Offset(offset).
		Limit(options.Common.Limit).
		Find(&categories).Error

	return categories, total, err
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
