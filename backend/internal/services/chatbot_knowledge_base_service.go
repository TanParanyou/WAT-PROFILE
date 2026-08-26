package services

import (
	"context"
	"errors"
	"strings"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

var (
	ErrKnowledgeBaseNotFound     = errors.New("knowledge base item not found")
	ErrKnowledgeBaseInvalidData  = errors.New("question and answer are required")
)

type ChatbotKnowledgeBaseService struct {
	db *gorm.DB
}

func NewChatbotKnowledgeBaseService(db *gorm.DB) *ChatbotKnowledgeBaseService {
	return &ChatbotKnowledgeBaseService{db: db}
}

// GetAll retrieves knowledge base items with pagination, search, category filtering, and status filtering
func (s *ChatbotKnowledgeBaseService) GetAll(ctx context.Context, page, limit int, search, category string, activeOnly bool) ([]models.ChatbotKnowledgeBase, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	query := s.db.WithContext(ctx).Model(&models.ChatbotKnowledgeBase{})

	if activeOnly {
		query = query.Where("is_active = ?", true)
	}

	if category != "" && category != "all" {
		query = query.Where("category = ?", category)
	}

	if search = strings.TrimSpace(search); search != "" {
		searchTerm := "%" + strings.ToLower(search) + "%"
		query = query.Where(
			"LOWER(question->>'th') LIKE ? OR LOWER(question->>'en') LIKE ? OR LOWER(question->>'de') LIKE ? OR LOWER(answer->>'th') LIKE ? OR LOWER(answer->>'en') LIKE ? OR LOWER(answer->>'de') LIKE ? OR LOWER(category) LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var items []models.ChatbotKnowledgeBase
	err := query.Order("priority DESC, id DESC").Offset(offset).Limit(limit).Find(&items).Error
	if err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

// GetByID finds a single knowledge base item
func (s *ChatbotKnowledgeBaseService) GetByID(ctx context.Context, id uint) (*models.ChatbotKnowledgeBase, error) {
	var item models.ChatbotKnowledgeBase
	err := s.db.WithContext(ctx).First(&item, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrKnowledgeBaseNotFound
		}
		return nil, err
	}
	return &item, nil
}

// Create validates and creates a new knowledge base item
func (s *ChatbotKnowledgeBaseService) Create(ctx context.Context, item *models.ChatbotKnowledgeBase) error {
	if item == nil || item.Question.IsEmpty() || item.Answer.IsEmpty() {
		return ErrKnowledgeBaseInvalidData
	}
	if item.Category == "" {
		item.Category = "general"
	}
	if item.Keywords == nil {
		item.Keywords = models.StringSlice{}
	}

	return s.db.WithContext(ctx).Create(item).Error
}

// Update updates an existing knowledge base item
func (s *ChatbotKnowledgeBaseService) Update(ctx context.Context, id uint, item *models.ChatbotKnowledgeBase) error {
	if item == nil || item.Question.IsEmpty() || item.Answer.IsEmpty() {
		return ErrKnowledgeBaseInvalidData
	}

	var existing models.ChatbotKnowledgeBase
	if err := s.db.WithContext(ctx).First(&existing, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrKnowledgeBaseNotFound
		}
		return err
	}

	existing.Category = item.Category
	if existing.Category == "" {
		existing.Category = "general"
	}
	existing.Question = item.Question
	existing.Answer = item.Answer
	existing.Keywords = item.Keywords
	existing.Priority = item.Priority
	existing.IsActive = item.IsActive

	return s.db.WithContext(ctx).Save(&existing).Error
}

// ToggleActive toggles the is_active status of a knowledge base item
func (s *ChatbotKnowledgeBaseService) ToggleActive(ctx context.Context, id uint) (*models.ChatbotKnowledgeBase, error) {
	var item models.ChatbotKnowledgeBase
	if err := s.db.WithContext(ctx).First(&item, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrKnowledgeBaseNotFound
		}
		return nil, err
	}

	item.IsActive = !item.IsActive
	if err := s.db.WithContext(ctx).Save(&item).Error; err != nil {
		return nil, err
	}

	return &item, nil
}

// Delete soft-deletes a knowledge base item
func (s *ChatbotKnowledgeBaseService) Delete(ctx context.Context, id uint) error {
	res := s.db.WithContext(ctx).Delete(&models.ChatbotKnowledgeBase{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrKnowledgeBaseNotFound
	}
	return nil
}
