package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/logger"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type GalleryHandler struct {
	galleryService *services.GalleryService
	auditService   *services.AuditService
}

func NewGalleryHandler(db *gorm.DB) *GalleryHandler {
	return &GalleryHandler{
		galleryService: services.NewGalleryService(db),
		auditService:   services.NewAuditService(db),
	}
}

// GetGalleries - Public: List active galleries
func (h *GalleryHandler) GetGalleries(c *fiber.Ctx) error {
	galleries, err := h.galleryService.ListActive(c.Query("category_id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch galleries")
	}
	return utils.SuccessResponse(c, galleries)
}

// GetAdminGalleries - Admin: List gallery items with pagination and filters
func (h *GalleryHandler) GetAdminGalleries(c *fiber.Ctx) error {
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "display_order",
		DefaultOrder: "asc",
		AllowedSort: map[string]string{
			"id":            "id",
			"display_order": "display_order",
			"created_at":    "created_at",
			"caption":       "caption",
		},
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	statuses := listquery.ExtractMulti(c, "status")
	categoryIDStrs := listquery.ExtractMulti(c, "category")
	var categoryIDs []int
	for _, catStr := range categoryIDStrs {
		if id, parseErr := strconv.Atoi(catStr); parseErr == nil {
			categoryIDs = append(categoryIDs, id)
		}
	}

	eventIDStrs := listquery.ExtractMulti(c, "event")
	var eventIDs []int
	for _, evStr := range eventIDStrs {
		if id, parseErr := strconv.Atoi(evStr); parseErr == nil {
			eventIDs = append(eventIDs, id)
		}
	}

	options := services.GalleryListOptions{
		Common:      common,
		Statuses:    statuses,
		CategoryIDs: categoryIDs,
		EventIDs:    eventIDs,
	}

	galleries, total, err := h.galleryService.ListAdmin(options)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch galleries")
	}

	return utils.PaginatedResponse(c, galleries, common.Page, common.Limit, int(total))
}

// GetAdminCategories - Admin: List gallery categories with pagination and filters
func (h *GalleryHandler) GetAdminCategories(c *fiber.Ctx) error {
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "display_order",
		DefaultOrder: "asc",
		AllowedSort: map[string]string{
			"id":            "id",
			"display_order": "display_order",
			"name":          "name",
			"slug":          "slug",
			"created_at":    "created_at",
		},
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	statuses := listquery.ExtractMulti(c, "status")
	options := services.GalleryCategoryListOptions{
		Common:   common,
		Statuses: statuses,
	}

	categories, total, err := h.galleryService.ListCategoriesAdmin(options)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch categories")
	}

	return utils.PaginatedResponse(c, categories, common.Page, common.Limit, int(total))
}

func (h *GalleryHandler) CreateGallery(c *fiber.Ctx) error {
	var gallery models.Gallery
	if err := c.BodyParser(&gallery); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request")
	}
	if err := h.galleryService.Create(&gallery); err != nil {
		logger.Log.Error().Err(err).Msg("Failed to create gallery item")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create")
	}

	_ = h.auditService.LogAction(c, "create", "galleries", strconv.Itoa(int(gallery.ID)), map[string]interface{}{
		"category_id": gallery.CategoryID,
		"event_id":    gallery.EventID,
	})

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
		logger.Log.Error().Err(err).Int("gallery_id", id).Msg("Failed to update gallery item")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update")
	}

	_ = h.auditService.LogAction(c, "update", "galleries", strconv.Itoa(id), map[string]interface{}{
		"category_id": gallery.CategoryID,
		"event_id":    gallery.EventID,
		"is_active":   gallery.IsActive,
	})

	return utils.SuccessResponse(c, gallery)
}

func (h *GalleryHandler) DeleteGallery(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	if err := h.galleryService.Delete(id); err != nil {
		logger.Log.Error().Err(err).Int("gallery_id", id).Msg("Failed to delete gallery item")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete")
	}

	_ = h.auditService.LogAction(c, "delete", "galleries", strconv.Itoa(id), nil)

	return utils.MessageResponse(c, "Deleted successfully")
}

func (h *GalleryHandler) GetCategories(c *fiber.Ctx) error {
	categories, err := h.galleryService.ListCategories()
	if err != nil {
		logger.Log.Error().Err(err).Msg("Failed to fetch gallery categories")
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
		logger.Log.Error().Err(err).Msg("Failed to create gallery category")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create category")
	}

	_ = h.auditService.LogAction(c, "create", "gallery_categories", strconv.Itoa(int(category.ID)), map[string]interface{}{
		"slug": category.Slug,
	})

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
		logger.Log.Error().Err(err).Int("category_id", id).Msg("Failed to update gallery category")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update category")
	}

	_ = h.auditService.LogAction(c, "update", "gallery_categories", strconv.Itoa(id), map[string]interface{}{
		"slug":      category.Slug,
		"is_active": category.IsActive,
	})

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
		logger.Log.Error().Err(err).Int("count", len(req.IDs)).Msg("Failed to delete gallery items")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete gallery items")
	}

	_ = h.auditService.LogAction(c, "bulk_delete", "galleries", "", map[string]interface{}{
		"count": len(req.IDs),
	})

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
		logger.Log.Error().Err(err).Int("count", len(req.IDs)).Msg("Failed to delete gallery categories")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete gallery categories")
	}

	_ = h.auditService.LogAction(c, "bulk_delete", "gallery_categories", "", map[string]interface{}{
		"count": len(req.IDs),
	})

	return utils.MessageResponse(c, "Gallery categories deleted successfully")
}

// BulkUpdateStatus - Admin: Update status for multiple gallery items
func (h *GalleryHandler) BulkUpdateStatus(c *fiber.Ctx) error {
	var req models.BulkGalleryStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if len(req.IDs) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No IDs provided")
	}
	if err := h.galleryService.BulkUpdateStatus(req.IDs, req.IsActive); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update gallery status")
	}
	return utils.MessageResponse(c, "Gallery status updated successfully")
}

// BulkUpdateCategory - Admin: Update category for multiple gallery items
func (h *GalleryHandler) BulkUpdateCategory(c *fiber.Ctx) error {
	var req models.BulkGalleryCategoryRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if len(req.IDs) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No IDs provided")
	}
	if err := h.galleryService.BulkUpdateCategory(req.IDs, req.CategoryID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update gallery category")
	}
	return utils.MessageResponse(c, "Gallery category updated successfully")
}

// BulkUpdateEvent - Admin: Update event for multiple gallery items
func (h *GalleryHandler) BulkUpdateEvent(c *fiber.Ctx) error {
	var req models.BulkGalleryEventRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if len(req.IDs) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No IDs provided")
	}
	if err := h.galleryService.BulkUpdateEvent(req.IDs, req.EventID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update gallery event")
	}
	return utils.MessageResponse(c, "Gallery event updated successfully")
}

// BatchCreateGalleries - Admin: Create multiple gallery items
func (h *GalleryHandler) BatchCreateGalleries(c *fiber.Ctx) error {
	var req models.BatchCreateGalleryRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if len(req.Items) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No items provided")
	}
	created, err := h.galleryService.CreateBatch(req.Items)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create gallery items")
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": created})
}

// ReorderGalleries - Admin: Reorder gallery items
func (h *GalleryHandler) ReorderGalleries(c *fiber.Ctx) error {
	var req models.ReorderGalleryRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if len(req.IDs) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No IDs provided")
	}
	updated, err := h.galleryService.Reorder(req.IDs)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to reorder gallery items")
	}
	return utils.SuccessResponse(c, updated)
}

