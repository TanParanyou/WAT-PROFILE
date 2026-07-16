package handlers

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type MediaHandler struct {
	mediaService *services.MediaService
}

func NewMediaHandler(db *gorm.DB) *MediaHandler {
	return &MediaHandler{
		mediaService: services.NewMediaService(db),
	}
}

func (h *MediaHandler) GetMedia(c *fiber.Ctx) error {
	media, err := h.mediaService.List()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch media")
	}
	return utils.SuccessResponse(c, media)
}

func (h *MediaHandler) UpdateMedia(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid media ID")
	}

	var req struct {
		Metadata map[string]interface{} `json:"metadata"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if req.Metadata == nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Metadata is required")
	}

	media, err := h.mediaService.UpdateMetadata(id, req.Metadata)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Media not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update media")
	}

	return utils.SuccessResponse(c, media)
}

func (h *MediaHandler) DeleteMedia(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid media ID")
	}

	if err := h.mediaService.Delete(id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Media not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete media")
	}

	return utils.MessageResponse(c, "Media deleted successfully")
}
