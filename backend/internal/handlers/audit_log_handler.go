package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type AuditLogHandler struct {
	auditService *services.AuditService
}

func NewAuditLogHandler(db *gorm.DB) *AuditLogHandler {
	return &AuditLogHandler{
		auditService: services.NewAuditService(db),
	}
}

// GetAuditLogs - Admin: List audit logs with pagination and filters
func (h *AuditLogHandler) GetAuditLogs(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	entityType := c.Query("entity_type")
	action := c.Query("action")

	logs, total, err := h.auditService.List(page, limit, entityType, action)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch audit logs")
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    logs,
		"total":   total,
		"page":    page,
		"limit":   limit,
	})
}
