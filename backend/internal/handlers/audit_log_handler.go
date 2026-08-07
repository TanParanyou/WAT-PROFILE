package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
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
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "created_at",
		DefaultOrder: "desc",
		AllowedSort: map[string]string{
			"id":          "id",
			"created_at":  "created_at",
			"action":      "action",
			"entity_type": "entity_type",
		},
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	actions := listquery.ExtractMulti(c, "action")
	entityTypes := listquery.ExtractMulti(c, "entity_type")
	userStrs := listquery.ExtractMulti(c, "user")
	var userIDs []uuid.UUID
	for _, uStr := range userStrs {
		if uid, parseErr := uuid.Parse(uStr); parseErr == nil {
			userIDs = append(userIDs, uid)
		}
	}

	options := services.AuditListOptions{
		Common:      common,
		Actions:     actions,
		EntityTypes: entityTypes,
		UserIDs:     userIDs,
	}

	logs, total, err := h.auditService.List(options)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch audit logs")
	}

	return utils.PaginatedResponse(c, logs, common.Page, common.Limit, int(total))
}

// GetFilterOptions - Admin: Return distinct audit log actions and entity types for filtering
func (h *AuditLogHandler) GetFilterOptions(c *fiber.Ctx) error {
	opts, err := h.auditService.GetFilterOptions()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch audit filter options")
	}
	return utils.SuccessResponse(c, opts)
}
