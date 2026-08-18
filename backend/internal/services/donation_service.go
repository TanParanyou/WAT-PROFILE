package services

import (
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type DonationService struct {
	db     *gorm.DB
	now    func() time.Time
	outbox *OperationOutboxService
}

func NewDonationService(db *gorm.DB, clocks ...func() time.Time) *DonationService {
	now := time.Now
	if len(clocks) > 0 && clocks[0] != nil {
		now = clocks[0]
	}
	return &DonationService{db: db, now: now}
}

func NewDonationServiceWithOutbox(db *gorm.DB, outbox *OperationOutboxService, clocks ...func() time.Time) *DonationService {
	service := NewDonationService(db, clocks...)
	service.outbox = outbox
	return service
}

type SelfReportedDonationInput struct {
	Donation models.Donation
	Proof    *models.DonationProof
}

// CreateSelfReported creates a pending proof-backed donation. Bank transfers
// and PayPal reports cannot enter the workflow without one private proof.
func (s *DonationService) CreateSelfReported(input SelfReportedDonationInput) (*models.Donation, error) {
	method := strings.ToLower(strings.TrimSpace(input.Donation.DonationMethod))
	if method != "bank_transfer" && method != "paypal" {
		return nil, errors.New("self-reported donations require bank_transfer or paypal")
	}
	if input.Proof == nil || input.Proof.StorageKey == "" {
		return nil, errors.New("donation proof is required")
	}
	donation := input.Donation
	donation.Source = "self_reported"
	donation.Status = "pending"
	if donation.CommunicationLocale == "" {
		donation.CommunicationLocale = "th"
	}
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		donation.ReceiptNumber = generateReceiptNumberAt(tx, s.now())
		if err := tx.Create(&donation).Error; err != nil {
			return err
		}
		input.Proof.DonationID = donation.ID
		if err := tx.Create(input.Proof).Error; err != nil {
			return err
		}
		if s.outbox != nil {
			if _, err := s.outbox.EnqueueTx(tx, OutboxJobInput{
				JobKey:        "donation:ack:" + strconv.Itoa(donation.ID),
				Kind:          "donation.acknowledgement",
				AggregateType: "donation",
				AggregateID:   strconv.Itoa(donation.ID),
				Payload:       models.JSONMap{"donation_id": donation.ID},
			}); err != nil {
				return err
			}
		}
		return tx.Preload("Category").Preload("Member").First(&donation, donation.ID).Error
	}); err != nil {
		return nil, err
	}
	return &donation, nil
}

// CreateStaffRecorded creates a donation entered by staff. Cash entries do
// not require proof and are immediately confirmed by the recording operator.
func (s *DonationService) CreateStaffRecorded(donation *models.Donation, actorID uuid.UUID) error {
	donation.Source = "staff_recorded"
	donation.Status = "confirmed"
	donation.ConfirmedByID = &actorID
	now := s.now()
	donation.ConfirmedAt = &now
	if donation.CommunicationLocale == "" {
		donation.CommunicationLocale = "th"
	}
	return s.db.Transaction(func(tx *gorm.DB) error {
		donation.ReceiptNumber = generateReceiptNumberAt(tx, s.now())
		if err := tx.Create(donation).Error; err != nil {
			return err
		}
		return tx.Preload("Category").Preload("Member").First(donation, donation.ID).Error
	})
}

// Confirm atomically moves a pending donation to confirmed.
func (s *DonationService) Confirm(id int, actorID uuid.UUID) (*models.Donation, error) {
	var donation models.Donation
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&donation, id).Error; err != nil {
			return err
		}
		if donation.Status != "pending" {
			return fmt.Errorf("donation is not pending")
		}
		now := s.now()
		if err := tx.Model(&donation).Updates(map[string]interface{}{
			"status": "confirmed", "confirmed_by_id": actorID, "confirmed_at": now,
		}).Error; err != nil {
			return err
		}
		return tx.Preload("Category").Preload("Member").First(&donation, donation.ID).Error
	})
	if err != nil {
		return nil, err
	}
	if err := s.db.Preload("Category").Preload("Member").First(&donation, id).Error; err != nil {
		return nil, err
	}
	return &donation, nil
}

// Cancel marks a donation as cancelled while retaining its financial record.
func (s *DonationService) Cancel(id int, actorID uuid.UUID, reason string) (*models.Donation, error) {
	if strings.TrimSpace(reason) == "" {
		return nil, errors.New("cancellation reason is required")
	}
	var donation models.Donation
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&donation, id).Error; err != nil {
			return err
		}
		if donation.Status == "cancelled" {
			return errors.New("donation is already cancelled")
		}
		now := s.now()
		return tx.Model(&donation).Updates(map[string]interface{}{
			"status": "cancelled", "cancellation_reason": strings.TrimSpace(reason), "cancelled_by_id": actorID, "cancelled_at": now,
		}).Error
	})
	if err != nil {
		return nil, err
	}
	if err := s.db.Preload("Category").Preload("Member").First(&donation, id).Error; err != nil {
		return nil, err
	}
	return &donation, nil
}

// MarkReceiptDispatched is idempotent: a retry returns the already-dispatched
// record without rendering or sending a second receipt.
func (s *DonationService) MarkReceiptDispatched(id int, actorID uuid.UUID, objectKey, checksum string) (*models.Donation, bool, error) {
	var donation models.Donation
	wasAlready := false
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&donation, id).Error; err != nil {
			return err
		}
		if donation.Status != "confirmed" {
			return fmt.Errorf("donation must be confirmed before receipt dispatch")
		}
		if !donation.ReceiptRequested || strings.TrimSpace(donation.DonorEmail) == "" {
			return errors.New("receipt request and donor email are required")
		}
		if donation.ReceiptDispatchedAt != nil {
			wasAlready = true
			return nil
		}
		now := s.now()
		if err := tx.Model(&donation).Updates(map[string]interface{}{
			"receipt_object_key": objectKey, "receipt_checksum": checksum,
			"receipt_dispatched_by_id": actorID, "receipt_dispatched_at": now,
		}).Error; err != nil {
			return err
		}
		return tx.First(&donation, id).Error
	})
	return &donation, wasAlready, err
}

// QueueReceiptDispatch persists the immutable receipt object identity and
// queues the email before returning to the admin request. The unique job key
// makes repeated button clicks safe and keeps the email retryable.
func (s *DonationService) QueueReceiptDispatch(id int, actorID uuid.UUID, objectKey, checksum string) (*models.Donation, bool, error) {
	var donation models.Donation
	queuedAlready := false
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&donation, id).Error; err != nil {
			return err
		}
		if donation.Status != "confirmed" {
			return fmt.Errorf("donation must be confirmed before receipt dispatch")
		}
		if !donation.ReceiptRequested || strings.TrimSpace(donation.DonorEmail) == "" {
			return errors.New("receipt request and donor email are required")
		}
		if donation.ReceiptDispatchedAt != nil {
			queuedAlready = true
			return nil
		}
		if donation.ReceiptObjectKey != "" {
			objectKey = donation.ReceiptObjectKey
			checksum = donation.ReceiptChecksum
		}
		if objectKey == "" {
			return errors.New("receipt object key is required")
		}
		updates := map[string]interface{}{"receipt_object_key": objectKey, "receipt_checksum": checksum}
		if err := tx.Model(&donation).Updates(updates).Error; err != nil {
			return err
		}
		if s.outbox == nil {
			return errors.New("outbox is not configured")
		}
		_, err := s.outbox.EnqueueTx(tx, OutboxJobInput{
			JobKey:        "donation:receipt:" + strconv.Itoa(id),
			Kind:          "donation.receipt",
			AggregateType: "donation",
			AggregateID:   strconv.Itoa(id),
			Payload: models.JSONMap{
				"donation_id": id,
				"actor_id":    actorID.String(),
				"object_key":  objectKey,
				"checksum":    checksum,
			},
		})
		return err
	})
	if err != nil {
		return nil, queuedAlready, err
	}
	if err := s.db.Preload("Category").Preload("Member").First(&donation, id).Error; err != nil {
		return nil, queuedAlready, err
	}
	return &donation, queuedAlready, nil
}

// ListCategories returns all active donation categories
func (s *DonationService) ListCategories() ([]models.DonationCategory, error) {
	var categories []models.DonationCategory
	err := s.db.Where("is_active = ?", true).
		Order("display_order ASC").
		Find(&categories).Error
	return categories, err
}

// ValidateActiveCategory accepts an empty category (general support) and
// rejects IDs that are missing or no longer active.
func (s *DonationService) ValidateActiveCategory(categoryID *int) error {
	if categoryID == nil {
		return nil
	}
	if s.db == nil {
		return errors.New("donation category validation is unavailable")
	}
	var category models.DonationCategory
	if err := s.db.Where("id = ? AND is_active = ?", *categoryID, true).First(&category).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("donation category is invalid or inactive")
		}
		return err
	}
	return nil
}

// CreateDonation creates a new donation with auto-generated receipt number
func (s *DonationService) CreateDonation(donation *models.Donation, userID *uuid.UUID) error {
	if userID != nil {
		donation.CreatedByID = userID
	}

	err := s.db.Transaction(func(tx *gorm.DB) error {
		// สร้าง receipt number ภายใน transaction เพื่อป้องกัน race condition
		donation.ReceiptNumber = generateReceiptNumberAt(tx, s.now())

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

// ListForMember returns only donations linked to the authenticated user's
// member profile. The member lookup and donation query are both scoped by the
// user ID so callers cannot supply another member identifier.
func (s *DonationService) ListForMember(userID uuid.UUID, common listquery.Common) ([]models.Donation, int64, error) {
	var member models.Member
	if err := s.db.Where("user_id = ?", userID).First(&member).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []models.Donation{}, 0, nil
		}
		return nil, 0, err
	}
	query := s.db.Model(&models.Donation{}).Where("member_id = ?", member.ID)
	if common.Search != "" {
		term := "%" + common.Search + "%"
		query = query.Where("(donor_name ILIKE ? OR receipt_number ILIKE ?)", term, term)
	}
	if common.From != nil {
		query = query.Where("donation_date >= ?", *common.From)
	}
	if common.To != nil {
		query = query.Where("donation_date <= ?", *common.To)
	}
	var total int64
	if err := query.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	column := "donation_date"
	if common.Sort == "created_at" {
		column = "created_at"
	}
	if common.Order == "asc" {
		column += " ASC"
	} else {
		column += " DESC"
	}
	var donations []models.Donation
	if err := query.Preload("Category").Offset((common.Page - 1) * common.Limit).Limit(common.Limit).Order(column).Find(&donations).Error; err != nil {
		return nil, 0, err
	}
	return donations, total, nil
}

type DonationFilterOptions struct {
	PaymentMethods []string                  `json:"payment_methods"`
	Currencies     []string                  `json:"currencies"`
	Categories     []models.DonationCategory `json:"categories"`
}

var donationSortColumns = map[string]string{
	"id":              "donations.id",
	"receipt_number":  "donations.receipt_number",
	"donor_name":      "donations.donor_name",
	"amount":          "donations.amount",
	"donation_date":   "donations.donation_date",
	"payment_method":  "donations.donation_method",
	"donation_method": "donations.donation_method",
	"status":          "donations.status",
	"created_at":      "donations.created_at",
}

var donationCategorySortColumns = map[string]string{
	"id":            "donation_categories.id",
	"display_order": "donation_categories.display_order",
	"name":          "donation_categories.name->>'th'",
	"is_active":     "donation_categories.is_active",
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
			"donations.donor_name ILIKE ? OR donations.receipt_number ILIKE ? OR donations.notes ILIKE ?",
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
		query = query.Where("donations.donation_method IN ?", options.Methods)
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

	if err := query.Session(&gorm.Session{}).Count(&total).Error; err != nil {
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
		Where("donation_method IS NOT NULL AND donation_method != ''").
		Distinct().Pluck("donation_method", &methods).Error; err != nil {
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

	if err := query.Session(&gorm.Session{}).Count(&total).Error; err != nil {
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

func (s *DonationService) GetProof(donationID int, proof *models.DonationProof) error {
	return s.db.Where("donation_id = ?", donationID).First(proof).Error
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
	return generateReceiptNumberAt(tx, time.Now())
}

func generateReceiptNumberAt(tx *gorm.DB, now time.Time) string {
	var count int64
	tx.Model(&models.Donation{}).
		Where("EXTRACT(YEAR FROM created_at) = ?", now.Year()).
		Count(&count)
	return fmt.Sprintf("DON-%d-%03d", now.Year(), count+1)
}

type DonorAnnualSummary struct {
	DonorName      string    `json:"donor_name"`
	DonorEmail     string    `json:"donor_email"`
	DonorAddress   string    `json:"donor_address"`
	MemberID       *int      `json:"member_id,omitempty"`
	TotalAmount    float64   `json:"total_amount"`
	Currency       string    `json:"currency"`
	DonationCount  int       `json:"donation_count"`
	FirstDate      time.Time `json:"first_date"`
	LastDate       time.Time `json:"last_date"`
	Methods        []string  `json:"methods"`
	ReceiptNumbers []string  `json:"receipt_numbers"`
}

type AnnualDonationSummaryResponse struct {
	Year        int                  `json:"year"`
	GrandTotal  float64              `json:"grand_total"`
	Currency    string               `json:"currency"`
	TotalDonors int                  `json:"total_donors"`
	TotalCount  int                  `json:"total_count"`
	Donors      []DonorAnnualSummary `json:"donors"`
}

// GetAnnualSummary aggregates all confirmed donations for the specified year grouped by donor
func (s *DonationService) GetAnnualSummary(year int) (*AnnualDonationSummaryResponse, error) {
	if year <= 0 {
		year = time.Now().Year()
	}

	startDate := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(year, 12, 31, 23, 59, 59, 0, time.UTC)

	var donations []models.Donation
	err := s.db.Where("status = ? AND donation_date >= ? AND donation_date <= ?", "confirmed", startDate, endDate).
		Order("donation_date ASC, id ASC").
		Find(&donations).Error
	if err != nil {
		return nil, err
	}

	donorMap := make(map[string]*DonorAnnualSummary)
	donorOrder := make([]string, 0)
	var grandTotal float64

	for _, d := range donations {
		name := strings.TrimSpace(d.DonorName)
		if name == "" {
			if d.IsAnonymous {
				name = "Anonymous Donor"
			} else {
				name = "General Donor"
			}
		}

		key := strings.ToLower(name) + "|" + strings.ToLower(strings.TrimSpace(d.DonorEmail))
		if d.MemberID != nil && *d.MemberID > 0 {
			key = fmt.Sprintf("member_%d", *d.MemberID)
		}

		summary, exists := donorMap[key]
		if !exists {
			summary = &DonorAnnualSummary{
				DonorName:      name,
				DonorEmail:     d.DonorEmail,
				DonorAddress:   d.DonorAddress,
				MemberID:       d.MemberID,
				TotalAmount:    0,
				Currency:       "EUR",
				DonationCount:  0,
				FirstDate:      d.DonationDate,
				LastDate:       d.DonationDate,
				Methods:        make([]string, 0),
				ReceiptNumbers: make([]string, 0),
			}
			donorMap[key] = summary
			donorOrder = append(donorOrder, key)
		}

		summary.TotalAmount += d.Amount
		grandTotal += d.Amount
		summary.DonationCount++
		if d.DonationDate.Before(summary.FirstDate) {
			summary.FirstDate = d.DonationDate
		}
		if d.DonationDate.After(summary.LastDate) {
			summary.LastDate = d.DonationDate
		}

		if d.DonorAddress != "" && summary.DonorAddress == "" {
			summary.DonorAddress = d.DonorAddress
		}

		if d.DonationMethod != "" {
			methodExists := false
			for _, m := range summary.Methods {
				if m == d.DonationMethod {
					methodExists = true
					break
				}
			}
			if !methodExists {
				summary.Methods = append(summary.Methods, d.DonationMethod)
			}
		}

		if d.ReceiptNumber != "" {
			summary.ReceiptNumbers = append(summary.ReceiptNumbers, d.ReceiptNumber)
		}
	}

	donors := make([]DonorAnnualSummary, 0, len(donorOrder))
	for _, key := range donorOrder {
		donors = append(donors, *donorMap[key])
	}

	sort.Slice(donors, func(i, j int) bool {
		return donors[i].TotalAmount > donors[j].TotalAmount
	})

	return &AnnualDonationSummaryResponse{
		Year:        year,
		GrandTotal:  grandTotal,
		Currency:    "EUR",
		TotalDonors: len(donors),
		TotalCount:  len(donations),
		Donors:      donors,
	}, nil
}

// GetDonorAnnualStatement returns all confirmed donation records for a donor in a specific year
func (s *DonationService) GetDonorAnnualStatement(year int, donorName, donorEmail string) ([]models.Donation, error) {
	if year <= 0 {
		year = time.Now().Year()
	}

	startDate := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(year, 12, 31, 23, 59, 59, 0, time.UTC)

	query := s.db.Preload("Category").Where("status = ? AND donation_date >= ? AND donation_date <= ?", "confirmed", startDate, endDate)

	if donorEmail != "" {
		query = query.Where("donor_email ILIKE ?", donorEmail)
	} else if donorName != "" {
		query = query.Where("donor_name ILIKE ?", donorName)
	}

	var donations []models.Donation
	if err := query.Order("donation_date ASC, id ASC").Find(&donations).Error; err != nil {
		return nil, err
	}
	return donations, nil
}
