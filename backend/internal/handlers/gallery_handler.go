package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type GalleryHandler struct {
	galleryService *services.GalleryService
}

func NewGalleryHandler(db *gorm.DB) *GalleryHandler {
	return &GalleryHandler{
		galleryService: services.NewGalleryService(db),
	}
}

func (h *GalleryHandler) GetGalleries(c *fiber.Ctx) error {
	galleries, err := h.galleryService.ListActive(c.Query("category_id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch galleries")
	}
	return utils.SuccessResponse(c, galleries)
}

func (h *GalleryHandler) CreateGallery(c *fiber.Ctx) error {
	var gallery models.Gallery
	if err := c.BodyParser(&gallery); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request")
	}
	if err := h.galleryService.Create(&gallery); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create")
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": gallery})
}

// GetGalleryByID - Admin: Get single gallery by ID
func (h *GalleryHandler) GetGalleryByID(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	item, err := h.galleryService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Gallery not found")
	}
	return utils.SuccessResponse(c, item)
}

func (h *GalleryHandler) UpdateGallery(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	gallery, err := h.galleryService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Gallery not found")
	}
	if err := c.BodyParser(gallery); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request")
	}
	if err := h.galleryService.Update(gallery); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update")
	}
	return utils.SuccessResponse(c, gallery)
}

func (h *GalleryHandler) DeleteGallery(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	if err := h.galleryService.Delete(id); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete")
	}
	return utils.MessageResponse(c, "Deleted successfully")
}

func (h *GalleryHandler) GetCategories(c *fiber.Ctx) error {
	categories, err := h.galleryService.ListCategories()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch categories")
	}
	return utils.SuccessResponse(c, categories)
}

func (h *GalleryHandler) CreateCategory(c *fiber.Ctx) error {
	var category models.GalleryCategory
	if err := c.BodyParser(&category); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request")
	}
	if err := h.galleryService.CreateCategory(&category); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create category")
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": category})
}

func (h *GalleryHandler) UpdateCategory(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	category, err := h.galleryService.GetCategoryByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Category not found")
	}
	if err := c.BodyParser(category); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request")
	}
	if err := h.galleryService.UpdateCategory(category); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update category")
	}
	return utils.SuccessResponse(c, category)
}

// BulkDeleteGalleries - Admin: Delete multiple gallery items
func (h *GalleryHandler) BulkDeleteGalleries(c *fiber.Ctx) error {
	var req models.BulkDeleteRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if len(req.IDs) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No IDs provided for deletion")
	}

	if err := h.galleryService.BulkDelete(req.IDs); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete gallery items")
	}

	return utils.MessageResponse(c, "Gallery items deleted successfully")
}

// BulkDeleteCategories - Admin: Delete multiple gallery categories
func (h *GalleryHandler) BulkDeleteCategories(c *fiber.Ctx) error {
	var req models.BulkDeleteRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if len(req.IDs) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No IDs provided for deletion")
	}

	if err := h.galleryService.BulkDeleteCategories(req.IDs); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete gallery categories")
	}

	return utils.MessageResponse(c, "Gallery categories deleted successfully")
}
