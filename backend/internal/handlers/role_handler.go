package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type RoleHandler struct {
	roleService *services.RoleService
}

func NewRoleHandler(db *gorm.DB) *RoleHandler {
	return &RoleHandler{
		roleService: services.NewRoleService(db),
	}
}

// GetRoles - Admin: List all roles
func (h *RoleHandler) GetRoles(c *fiber.Ctx) error {
	roles, err := h.roleService.List()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch roles")
	}
	return utils.SuccessResponse(c, roles)
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
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create role")
	}

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
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update role")
	}

	return utils.SuccessResponse(c, role)
}

// DeleteRole - Admin: Delete role
func (h *RoleHandler) DeleteRole(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid UUID")
	}

	if err := h.roleService.Delete(id); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

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
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	return utils.MessageResponse(c, "Roles deleted successfully")
}
