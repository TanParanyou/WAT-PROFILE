package handlers

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type MonkHandler struct {
	monkService  *services.MonkService
	auditService *services.AuditService
}

func NewMonkHandler(db *gorm.DB) *MonkHandler {
	return &MonkHandler{
		monkService:  services.NewMonkService(db),
		auditService: services.NewAuditService(db),
	}
}

func (h *MonkHandler) GetMonks(c *fiber.Ctx) error {
	monks, err := h.monkService.ListActive()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch monks")
	}
	return utils.SuccessResponse(c, monks)
}

func (h *MonkHandler) GetMonk(c *fiber.Ctx) error {
	monk, err := h.monkService.GetBySlug(c.Params("slug"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Monk not found")
	}
	return utils.SuccessResponse(c, monk)
}

func (h *MonkHandler) CreateMonk(c *fiber.Ctx) error {
	var monk models.Monk
	if err := c.BodyParser(&monk); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request")
	}
	if err := h.monkService.Create(&monk); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create")
	}

	_ = h.auditService.LogAction(c, "create", "monks", "", map[string]interface{}{"name": monk.Name})

	c.Status(fiber.StatusCreated)
	return utils.SuccessResponse(c, monk)
}

// GetMonkByID - Admin: Get single monk by ID
func (h *MonkHandler) GetMonkByID(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	item, err := h.monkService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Monk not found")
	}
	return utils.SuccessResponse(c, item)
}

func (h *MonkHandler) UpdateMonk(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	monk, err := h.monkService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Not found")
	}
	if err := c.BodyParser(monk); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request")
	}
	if err := h.monkService.Update(monk); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update")
	}

	uid := fmt.Sprint(monk.ID)
	_ = h.auditService.LogAction(c, "update", "monks", uid, map[string]interface{}{"name": monk.Name})

	return utils.SuccessResponse(c, monk)
}

func (h *MonkHandler) DeleteMonk(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	if err := h.monkService.Delete(id); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete")
	}

	_ = h.auditService.LogAction(c, "delete", "monks", fmt.Sprint(id), nil)

	return utils.MessageResponse(c, "Deleted successfully")
}

// BulkDeleteMonks - Admin: Delete multiple monks
func (h *MonkHandler) BulkDeleteMonks(c *fiber.Ctx) error {
	var req models.BulkDeleteRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if len(req.IDs) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No IDs provided for deletion")
	}

	if err := h.monkService.BulkDelete(req.IDs); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete monks")
	}

	_ = h.auditService.LogAction(c, "bulk_delete", "monks", "", map[string]interface{}{"count": len(req.IDs)})

	return utils.MessageResponse(c, "Monks deleted successfully")
}
