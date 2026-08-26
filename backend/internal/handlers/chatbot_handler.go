package handlers

import (
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type ChatbotHandler struct {
	chatbotService *services.ChatbotService
}

func NewChatbotHandler(db *gorm.DB) *ChatbotHandler {
	return &ChatbotHandler{
		chatbotService: services.NewChatbotService(db),
	}
}

// SendMessage - Public: Process chat message and receive bot response
func (h *ChatbotHandler) SendMessage(c *fiber.Ctx) error {
	var req services.ChatMessageRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload")
	}

	req.Message = strings.TrimSpace(req.Message)
	if req.Message == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Message cannot be empty")
	}

	if len(req.Message) > 1000 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Message exceeds maximum length of 1000 characters")
	}

	if req.Locale == "" {
		req.Locale = "th"
	}

	resp, err := h.chatbotService.ProcessMessage(c.Context(), req)
	if err != nil {
		if errors.Is(err, services.ErrChatbotDisabled) {
			return utils.ErrorResponse(c, fiber.StatusForbidden, "Chatbot is currently disabled")
		}
		if errors.Is(err, services.ErrChatbotEmptyPrompt) {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to process chat message")
	}

	return utils.SuccessResponse(c, resp)
}

// GetQuickQuestions - Public: Get starter question chips for visitors
func (h *ChatbotHandler) GetQuickQuestions(c *fiber.Ctx) error {
	locale := c.Query("locale", "th")
	questions, err := h.chatbotService.GetQuickQuestions(c.Context(), locale)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch suggested questions")
	}
	return utils.SuccessResponse(c, questions)
}
