package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/logger"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type SettingsHandler struct {
	settingsService *services.SettingsService
	auditService    *services.AuditService
}

func NewSettingsHandler(db *gorm.DB) *SettingsHandler {
	return &SettingsHandler{
		settingsService: services.NewSettingsService(db),
		auditService:    services.NewAuditService(db),
	}
}

// GetPublicSettings - Public: Get all public settings
func (h *SettingsHandler) GetPublicSettings(c *fiber.Ctx) error {
	result, err := h.settingsService.GetPublic()
	if err != nil {
		logger.Log.Error().Err(err).Msg("Failed to fetch public settings")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch settings")
	}
	return utils.SuccessResponse(c, result)
}

// GetAllSettings - Admin: Get all settings grouped by category
func (h *SettingsHandler) GetAllSettings(c *fiber.Ctx) error {
	category := c.Query("category")
	settings, err := h.settingsService.GetAll(category)
	if err != nil {
		logger.Log.Error().Err(err).Str("category", category).Msg("Failed to fetch admin settings")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch settings")
	}
	return utils.SuccessResponse(c, settings)
}

// UpdateSettings - Admin: Update multiple settings at once
func (h *SettingsHandler) UpdateSettings(c *fiber.Ctx) error {
	var body []struct {
		Key   string `json:"key"`
		Value string `json:"value"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.settingsService.UpdateBatch(body); err != nil {
		logger.Log.Error().Err(err).Int("count", len(body)).Msg("Failed to update settings batch")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update settings")
	}

	keys := make([]string, 0, len(body))
	for _, item := range body {
		keys = append(keys, item.Key)
	}
	_ = h.auditService.LogAction(c, "update_batch", "settings", "", map[string]interface{}{
		"keys":  keys,
		"count": len(body),
	})

	return utils.MessageResponse(c, "Settings updated successfully")
}

// UpsertSetting - Admin: Create or update a single setting
func (h *SettingsHandler) UpsertSetting(c *fiber.Ctx) error {
	var setting models.Setting
	if err := c.BodyParser(&setting); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.settingsService.Upsert(&setting); err != nil {
		logger.Log.Error().Err(err).Str("key", setting.Key).Msg("Failed to upsert setting")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create setting")
	}

	_ = h.auditService.LogAction(c, "upsert", "settings", setting.Key, map[string]interface{}{
		"key":      setting.Key,
		"category": setting.Category,
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": setting})
}
