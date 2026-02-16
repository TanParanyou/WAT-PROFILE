package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
)

type MonkHandler struct{}

func NewMonkHandler() *MonkHandler {
	return &MonkHandler{}
}

func (h *MonkHandler) GetMonks(c *fiber.Ctx) error {
	var monks []models.Monk
	if err := config.DB.Where("is_active = ?", true).Order("display_order ASC").Find(&monks).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch monks")
	}
	return utils.SuccessResponse(c, monks)
}

func (h *MonkHandler) GetMonk(c *fiber.Ctx) error {
	slug := c.Params("slug")
	var monk models.Monk
	if err := config.DB.Where("slug = ? AND is_active = ?", slug, true).First(&monk).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Monk not found")
	}
	return utils.SuccessResponse(c, monk)
}

func (h *MonkHandler) CreateMonk(c *fiber.Ctx) error {
	var monk models.Monk
	if err := c.BodyParser(&monk); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request")
	}
	if err := config.DB.Create(&monk).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create")
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": monk})
}

func (h *MonkHandler) UpdateMonk(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var monk models.Monk
	if err := config.DB.First(&monk, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Not found")
	}
	if err := c.BodyParser(&monk); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request")
	}
	if err := config.DB.Save(&monk).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update")
	}
	return utils.SuccessResponse(c, monk)
}

func (h *MonkHandler) DeleteMonk(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	if err := config.DB.Delete(&models.Monk{}, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete")
	}
	return utils.MessageResponse(c, "Deleted successfully")
}
