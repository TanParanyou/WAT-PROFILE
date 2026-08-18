package handlers

import (
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type AiTranslationHandler struct {
	aiService *services.AiTranslationService
}

func NewAiTranslationHandler(db *gorm.DB) *AiTranslationHandler {
	return &AiTranslationHandler{
		aiService: services.NewAiTranslationService(db),
	}
}

type TranslateDraftRequest struct {
	Text        string   `json:"text"`
	SourceLang  string   `json:"source_lang"`
	TargetLangs []string `json:"target_langs"`
}

// TranslateDraft - Admin: Translate draft text from source language to target languages
func (h *AiTranslationHandler) TranslateDraft(c *fiber.Ctx) error {
	var req TranslateDraftRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	req.Text = strings.TrimSpace(req.Text)
	if req.Text == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Text cannot be empty")
	}

	if req.SourceLang == "" {
		req.SourceLang = "th"
	}

	if len(req.TargetLangs) == 0 {
		req.TargetLangs = []string{"en", "de"}
	}

	translations, err := h.aiService.TranslateDraft(c.Context(), req.Text, req.SourceLang, req.TargetLangs)
	if err != nil {
		if errors.Is(err, services.ErrAiTranslateDisabled) {
			return utils.ErrorResponse(c, fiber.StatusForbidden, err.Error())
		}
		if errors.Is(err, services.ErrAiTranslateNotConfigured) {
			return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, err.Error())
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}

	return utils.SuccessResponse(c, fiber.Map{
		"translations": translations,
	})
}
