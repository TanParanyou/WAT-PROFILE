package services

import (
	"context"
	"testing"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func TestChatbotKnowledgeBaseValidation(t *testing.T) {
	service := NewChatbotKnowledgeBaseService(nil)

	ctx := context.Background()

	// Empty item should fail validation
	err := service.Create(ctx, nil)
	if err != ErrKnowledgeBaseInvalidData {
		t.Fatalf("expected ErrKnowledgeBaseInvalidData, got %v", err)
	}

	// Item with empty Question/Answer should fail validation
	emptyItem := &models.ChatbotKnowledgeBase{
		Category: "general",
		Question: models.MultiLangText{},
		Answer:   models.MultiLangText{},
	}
	err = service.Create(ctx, emptyItem)
	if err != ErrKnowledgeBaseInvalidData {
		t.Fatalf("expected ErrKnowledgeBaseInvalidData for empty Q&A, got %v", err)
	}

	err = service.Update(ctx, 1, emptyItem)
	if err != ErrKnowledgeBaseInvalidData {
		t.Fatalf("expected ErrKnowledgeBaseInvalidData for empty Q&A update, got %v", err)
	}
}
