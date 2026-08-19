package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/eventalert"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/logger"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type EventAlertHandler struct {
	service      *eventalert.Service
	auditService *services.AuditService
}

func NewEventAlertHandler(db *gorm.DB) *EventAlertHandler {
	return &EventAlertHandler{
		service:      eventalert.NewService(db),
		auditService: services.NewAuditService(db),
	}
}

func (h *EventAlertHandler) Get(c *fiber.Ctx) error {
	value, err := h.service.Get()
	if err != nil {
		logger.Log.Error().Err(err).Msg("Failed to fetch event alert settings")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch event alert settings")
	}
	return utils.SuccessResponse(c, value)
}

func (h *EventAlertHandler) Save(c *fiber.Ctx) error {
	var value eventalert.Settings
	if err := c.BodyParser(&value); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.service.Save(value); err != nil {
		logger.Log.Error().Err(err).Msg("Failed to save event alert settings")
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	_ = h.auditService.LogAction(c, "update", "event_alert_settings", "global", map[string]interface{}{
		"enabled": value.Enabled,
	})

	return utils.SuccessResponse(c, value)
}
