package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/logger"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type RoleHandler struct {
	roleService  *services.RoleService
	auditService *services.AuditService
}

func NewRoleHandler(db *gorm.DB) *RoleHandler {
	return &RoleHandler{
		roleService:  services.NewRoleService(db),
		auditService: services.NewAuditService(db),
	}
}

// GetRoles - Admin: List all roles with pagination and filtering
func (h *RoleHandler) GetRoles(c *fiber.Ctx) error {
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "name",
		DefaultOrder: "asc",
		AllowedSort: map[string]string{
			"id":         "id",
			"name":       "name",
			"created_at": "created_at",
		},
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	statuses := listquery.ExtractMulti(c, "status")
	options := services.RoleListOptions{
		Common:   common,
		Statuses: statuses,
	}

	roles, total, err := h.roleService.List(options)
	if err != nil {
		logger.Log.Error().Err(err).Msg("Failed to fetch roles")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch roles")
	}
	return utils.PaginatedResponse(c, roles, common.Page, common.Limit, int(total))
}

// GetRole - Admin: Get single role by id
func (h *RoleHandler) GetRole(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid UUID")
	}
	role, err := h.roleService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Role not found")
	}
	return utils.SuccessResponse(c, role)
}

// CreateRole - Admin: Create new role
func (h *RoleHandler) CreateRole(c *fiber.Ctx) error {
	var role models.Role
	if err := c.BodyParser(&role); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if role.Name == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Role name is required")
	}

	if err := h.roleService.Create(&role); err != nil {
		logger.Log.Error().Err(err).Str("role_name", role.Name).Msg("Failed to create role")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create role")
	}

	_ = h.auditService.LogAction(c, "create", "roles", role.ID.String(), map[string]interface{}{
		"name":         role.Name,
		"admin_access": role.AdminAccess,
		"is_active":    role.IsActive,
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": role})
}

// UpdateRole - Admin: Update role
func (h *RoleHandler) UpdateRole(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid UUID")
	}

	role, err := h.roleService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Role not found")
	}

	if err := c.BodyParser(role); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.roleService.Update(role); err != nil {
		logger.Log.Error().Err(err).Str("role_id", id.String()).Msg("Failed to update role")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update role")
	}

	_ = h.auditService.LogAction(c, "update", "roles", id.String(), map[string]interface{}{
		"name":         role.Name,
		"admin_access": role.AdminAccess,
		"is_active":    role.IsActive,
	})

	return utils.SuccessResponse(c, role)
}

// DeleteRole - Admin: Delete role
func (h *RoleHandler) DeleteRole(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid UUID")
	}

	if err := h.roleService.Delete(id); err != nil {
		logger.Log.Error().Err(err).Str("role_id", id.String()).Msg("Failed to delete role")
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	_ = h.auditService.LogAction(c, "delete", "roles", id.String(), nil)

	return utils.MessageResponse(c, "Role deleted successfully")
}

// BulkDeleteRoles - Admin: Delete multiple roles
func (h *RoleHandler) BulkDeleteRoles(c *fiber.Ctx) error {
	var req models.BulkDeleteUUIDRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if len(req.IDs) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No IDs provided for deletion")
	}

	if err := h.roleService.BulkDelete(req.IDs); err != nil {
		logger.Log.Error().Err(err).Int("count", len(req.IDs)).Msg("Failed to bulk delete roles")
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	_ = h.auditService.LogAction(c, "bulk_delete", "roles", "", map[string]interface{}{
		"count": len(req.IDs),
	})

	return utils.MessageResponse(c, "Roles deleted successfully")
}
