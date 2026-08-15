package services

import (
	"context"
	"strconv"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/contacts"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type ContactService struct {
	db     *gorm.DB
	outbox ContactOutbox
}

func NewContactService(db *gorm.DB) *ContactService {
	return NewContactServiceWithOutbox(db, NewOperationOutboxService(db))
}

type ContactOutbox interface {
	EnqueueTx(*gorm.DB, OutboxJobInput) (*models.OperationOutbox, error)
}

func NewContactServiceWithOutbox(db *gorm.DB, outbox ContactOutbox) *ContactService {
	return &ContactService{db: db, outbox: outbox}
}

type ContactListOptions struct {
	Common       listquery.Common
	Statuses     []string
	InquiryTypes []string
}

var contactSortColumns = map[string]string{
	"id":           "contact_inquiries.id",
	"created_at":   "contact_inquiries.created_at",
	"name":         "contact_inquiries.name",
	"email":        "contact_inquiries.email",
	"subject":      "contact_inquiries.subject",
	"status":       "contact_inquiries.status",
	"inquiry_type": "contact_inquiries.inquiry_type",
}

// ListOptions returns paginated contact inquiries with full search, filter, and sorting
func (s *ContactService) ListOptions(options ContactListOptions) ([]models.ContactInquiry, int64, error) {
	var inquiries []models.ContactInquiry
	var total int64

	query := s.db.Model(&models.ContactInquiry{})

	if options.Common.Search != "" {
		searchTerm := "%" + options.Common.Search + "%"
		query = query.Where(
			"contact_inquiries.name ILIKE ? OR contact_inquiries.email ILIKE ? OR contact_inquiries.subject ILIKE ? OR contact_inquiries.message ILIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	if len(options.Statuses) > 0 {
		query = query.Where("contact_inquiries.status IN ?", options.Statuses)
	}

	if len(options.InquiryTypes) > 0 {
		query = query.Where("contact_inquiries.inquiry_type IN ?", options.InquiryTypes)
	}

	if options.Common.From != nil {
		query = query.Where("contact_inquiries.created_at >= ?", *options.Common.From)
	}

	if options.Common.To != nil {
		query = query.Where("contact_inquiries.created_at <= ?", *options.Common.To)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortCol, ok := contactSortColumns[options.Common.Sort]
	if !ok {
		sortCol = "contact_inquiries.created_at"
	}
	orderDir := "DESC"
	if options.Common.Order == "asc" {
		orderDir = "ASC"
	}

	offset := (options.Common.Page - 1) * options.Common.Limit
	err := query.Preload("RepliedBy").
		Order(sortCol + " " + orderDir + ", contact_inquiries.id " + orderDir).
		Offset(offset).
		Limit(options.Common.Limit).
		Find(&inquiries).Error

	return inquiries, total, err
}

// Submit creates a new contact inquiry and notification job atomically.
func (s *ContactService) Submit(ctx context.Context, input contacts.Submission) (*models.ContactInquiry, error) {
	inquiry := &models.ContactInquiry{
		Name:                input.Name,
		Email:               input.Email,
		Subject:             input.Subject,
		Message:             input.Message,
		CommunicationLocale: input.Locale,
		InquiryType:         "general",
		Status:              "new",
	}
	if s.outbox == nil {
		return nil, gorm.ErrInvalidDB
	}
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(inquiry).Error; err != nil {
			return err
		}
		id := strconv.Itoa(inquiry.ID)
		_, err := s.outbox.EnqueueTx(tx, OutboxJobInput{
			JobKey:        "contact:notification:" + id,
			Kind:          "contact.notification",
			AggregateType: "contact",
			AggregateID:   id,
			Payload:       models.JSONMap{"contact_id": inquiry.ID},
		})
		return err
	})
	if err != nil {
		return nil, err
	}
	return inquiry, nil
}

// List returns paginated contact inquiries with filters
func (s *ContactService) List(page, limit int, status, inquiryType string) ([]models.ContactInquiry, int64, error) {
	var inquiries []models.ContactInquiry
	query := s.db.Order("created_at DESC")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if inquiryType != "" {
		query = query.Where("inquiry_type = ?", inquiryType)
	}

	var total int64
	query.Model(&models.ContactInquiry{}).Count(&total)

	offset := (page - 1) * limit
	err := query.Preload("RepliedBy").Offset(offset).Limit(limit).Find(&inquiries).Error

	return inquiries, total, err
}

// GetByID returns a contact inquiry by ID
func (s *ContactService) GetByID(id int) (*models.ContactInquiry, error) {
	var inquiry models.ContactInquiry
	err := s.db.First(&inquiry, id).Error
	if err != nil {
		return nil, err
	}
	return &inquiry, nil
}

// UpdateStatus updates contact inquiry status and reply
func (s *ContactService) UpdateStatus(inquiry *models.ContactInquiry, status, replyMessage string, repliedByID *uuid.UUID) error {
	if status != "" {
		inquiry.Status = status
	}
	if replyMessage != "" {
		inquiry.ReplyMessage = replyMessage
		inquiry.RepliedByID = repliedByID
	}
	return s.db.Save(inquiry).Error
}

// Delete removes a contact inquiry by ID
func (s *ContactService) Delete(id int) error {
	return s.db.Delete(&models.ContactInquiry{}, id).Error
}

// BulkDelete removes multiple contact inquiries by their IDs
func (s *ContactService) BulkDelete(ids []int) error {
	return s.db.Where("id IN ?", ids).Delete(&models.ContactInquiry{}).Error
}
