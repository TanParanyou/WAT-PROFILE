package handlers

import (
	"errors"

	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type RichTextMigrationHandler struct {
	service *services.RichTextMigrationService
}

func NewRichTextMigrationHandler(db *gorm.DB) *RichTextMigrationHandler {
	return &RichTextMigrationHandler{
		service: services.NewRichTextMigrationService(db),
	}
}

func (h *RichTextMigrationHandler) Migrate(c *fiber.Ctx) error {
	var req services.MigrationRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.service.Migrate(req); err != nil {
		if errors.Is(err, services.ErrMigrationConflict) {
			return utils.ErrorResponse(c, fiber.StatusConflict, "Migration conflict: the record was updated elsewhere. Please refresh and try again.")
		}
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	return utils.SuccessResponse(c, fiber.Map{"migrated": true})
}
