package services

import (
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type ContactService struct {
	db *gorm.DB
}

func NewContactService(db *gorm.DB) *ContactService {
	return &ContactService{db: db}
}

// Submit creates a new contact inquiry
func (s *ContactService) Submit(inquiry *models.ContactInquiry) error {
	inquiry.Status = "new"
	return s.db.Create(inquiry).Error
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
