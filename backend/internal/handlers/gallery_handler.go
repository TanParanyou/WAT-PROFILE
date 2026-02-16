package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
)

type GalleryHandler struct{}

func NewGalleryHandler() *GalleryHandler {
	return &GalleryHandler{}
}

func (h *GalleryHandler) GetGalleries(c *fiber.Ctx) error {
	var galleries []models.Gallery
	query := config.DB.Where("is_active = ?", true).Order("display_order ASC")

	// Filter by category if provided
	if catID := c.Query("category_id"); catID != "" {
		query = query.Where("category_id = ?", catID)
	}

	if err := query.Preload("Category").Find(&galleries).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch galleries")
	}
	return utils.SuccessResponse(c, galleries)
}

func (h *GalleryHandler) CreateGallery(c *fiber.Ctx) error {
	var gallery models.Gallery
	if err := c.BodyParser(&gallery); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request")
	}
	if err := config.DB.Create(&gallery).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create")
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": gallery})
}

func (h *GalleryHandler) DeleteGallery(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	if err := config.DB.Delete(&models.Gallery{}, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete")
	}
	return utils.MessageResponse(c, "Deleted successfully")
}

// Category handlers
func (h *GalleryHandler) GetCategories(c *fiber.Ctx) error {
	var categories []models.GalleryCategory
	if err := config.DB.Where("is_active = ?", true).Order("display_order ASC").Find(&categories).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch categories")
	}
	return utils.SuccessResponse(c, categories)
}
