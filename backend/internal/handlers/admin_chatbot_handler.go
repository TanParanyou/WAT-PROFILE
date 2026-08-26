package handlers

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type AdminChatbotHandler struct {
	kbService    *services.ChatbotKnowledgeBaseService
	auditService *services.AuditService
}

func NewAdminChatbotHandler(db *gorm.DB) *AdminChatbotHandler {
	return &AdminChatbotHandler{
		kbService:    services.NewChatbotKnowledgeBaseService(db),
		auditService: services.NewAuditService(db),
	}
}

// GetAllKnowledgeBase - Admin: List knowledge base entries with search, filter, and pagination
func (h *AdminChatbotHandler) GetAllKnowledgeBase(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search", "")
	category := c.Query("category", "")
	activeOnly := c.Query("active_only") == "true"

	items, total, err := h.kbService.GetAll(c.Context(), page, limit, search, category, activeOnly)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch knowledge base items")
	}

	return utils.PaginatedResponse(c, items, page, limit, int(total))
}

// GetKnowledgeBaseByID - Admin: Get single knowledge base entry
func (h *AdminChatbotHandler) GetKnowledgeBaseByID(c *fiber.Ctx) error {
	idInt, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid ID parameter")
	}

	item, err := h.kbService.GetByID(c.Context(), uint(idInt))
	if err != nil {
		if errors.Is(err, services.ErrKnowledgeBaseNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Knowledge base item not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to retrieve knowledge base item")
	}

	return utils.SuccessResponse(c, item)
}

// CreateKnowledgeBase - Admin: Create new knowledge base entry
func (h *AdminChatbotHandler) CreateKnowledgeBase(c *fiber.Ctx) error {
	var item models.ChatbotKnowledgeBase
	if err := c.BodyParser(&item); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload")
	}

	if err := h.kbService.Create(c.Context(), &item); err != nil {
		if errors.Is(err, services.ErrKnowledgeBaseInvalidData) {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create knowledge base item")
	}

	_ = h.auditService.LogAction(c, "create", "chatbot_knowledge_base", fmt.Sprint(item.ID), map[string]interface{}{
		"category": item.Category,
		"question": item.Question,
	})

	c.Status(fiber.StatusCreated)
	return utils.SuccessResponse(c, item)
}

// UpdateKnowledgeBase - Admin: Update existing knowledge base entry
func (h *AdminChatbotHandler) UpdateKnowledgeBase(c *fiber.Ctx) error {
	idInt, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid ID parameter")
	}

	var item models.ChatbotKnowledgeBase
	if err := c.BodyParser(&item); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload")
	}

	if err := h.kbService.Update(c.Context(), uint(idInt), &item); err != nil {
		if errors.Is(err, services.ErrKnowledgeBaseNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Knowledge base item not found")
		}
		if errors.Is(err, services.ErrKnowledgeBaseInvalidData) {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update knowledge base item")
	}

	_ = h.auditService.LogAction(c, "update", "chatbot_knowledge_base", fmt.Sprint(idInt), map[string]interface{}{
		"category": item.Category,
		"question": item.Question,
	})

	return utils.SuccessResponse(c, item)
}

// ToggleActiveKnowledgeBase - Admin: Toggle active status
func (h *AdminChatbotHandler) ToggleActiveKnowledgeBase(c *fiber.Ctx) error {
	idInt, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid ID parameter")
	}

	item, err := h.kbService.ToggleActive(c.Context(), uint(idInt))
	if err != nil {
		if errors.Is(err, services.ErrKnowledgeBaseNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Knowledge base item not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to toggle status")
	}

	_ = h.auditService.LogAction(c, "update_status", "chatbot_knowledge_base", fmt.Sprint(idInt), map[string]interface{}{
		"is_active": item.IsActive,
	})

	return utils.SuccessResponse(c, item)
}

// DeleteKnowledgeBase - Admin: Delete knowledge base entry
func (h *AdminChatbotHandler) DeleteKnowledgeBase(c *fiber.Ctx) error {
	idInt, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid ID parameter")
	}

	if err := h.kbService.Delete(c.Context(), uint(idInt)); err != nil {
		if errors.Is(err, services.ErrKnowledgeBaseNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Knowledge base item not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete knowledge base item")
	}

	_ = h.auditService.LogAction(c, "delete", "chatbot_knowledge_base", fmt.Sprint(idInt), nil)

	return utils.SuccessResponse(c, fiber.Map{
		"message": "Knowledge base item deleted successfully",
	})
}
