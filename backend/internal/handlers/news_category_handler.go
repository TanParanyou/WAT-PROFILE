package handlers

import (
	"fmt"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/logger"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type NewsCategoryHandler struct {
	db           *gorm.DB
	auditService *services.AuditService
}

func NewNewsCategoryHandler(db *gorm.DB, auditService *services.AuditService) *NewsCategoryHandler {
	return &NewsCategoryHandler{db: db, auditService: auditService}
}

// GetPublicCategories godoc
// @Summary List active news categories (Public)
// @Tags news
// @Produce json
// @Router /api/v1/public/news/categories [get]
func (h *NewsCategoryHandler) GetPublicCategories(c *fiber.Ctx) error {
	var categories []models.NewsCategory
	if err := h.db.Where("is_active = ?", true).
		Order("display_order ASC, id ASC").
		Find(&categories).Error; err != nil {
		logger.Log.Error().Err(err).Msg("Failed to fetch public news categories")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch categories")
	}

	return utils.SuccessResponse(c, categories)
}

// GetAdminCategories godoc
// @Summary List all news categories (Admin)
// @Tags admin-news
// @Produce json
// @Router /api/v1/admin/news-categories [get]
func (h *NewsCategoryHandler) GetAdminCategories(c *fiber.Ctx) error {
	var categories []models.NewsCategory
	if err := h.db.Order("display_order ASC, id ASC").Find(&categories).Error; err != nil {
		logger.Log.Error().Err(err).Msg("Failed to fetch admin news categories")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch categories")
	}

	return utils.SuccessResponse(c, categories)
}

// CreateCategory godoc
// @Summary Create news category (Admin)
// @Tags admin-news
// @Accept json
// @Produce json
// @Router /api/v1/admin/news-categories [post]
func (h *NewsCategoryHandler) CreateCategory(c *fiber.Ctx) error {
	var req models.NewsCategory
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.Slug == "" || req.Name == nil || req.Name["th"] == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Slug and Thai name are required")
	}

	if err := h.db.Create(&req).Error; err != nil {
		logger.Log.Error().Err(err).Msg("Failed to create news category")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create category")
	}

	if h.auditService != nil {
		_ = h.auditService.LogAction(c, "create", "news_categories", fmt.Sprint(req.ID), map[string]interface{}{"name": req.Name, "slug": req.Slug})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    req,
		"message": "Category created successfully",
	})
}

// UpdateCategory godoc
// @Summary Update news category (Admin)
// @Tags admin-news
// @Accept json
// @Produce json
// @Param id path int true "Category ID"
// @Router /api/v1/admin/news-categories/{id} [put]
func (h *NewsCategoryHandler) UpdateCategory(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID")
	}

	var existing models.NewsCategory
	if err := h.db.First(&existing, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Category not found")
	}

	if err := c.BodyParser(&existing); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	existing.ID = uint(id)

	if err := h.db.Save(&existing).Error; err != nil {
		logger.Log.Error().Err(err).Msg("Failed to update news category")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update category")
	}

	if h.auditService != nil {
		_ = h.auditService.LogAction(c, "update", "news_categories", fmt.Sprint(existing.ID), map[string]interface{}{"name": existing.Name, "slug": existing.Slug})
	}

	return utils.SuccessResponse(c, existing)
}

// DeleteCategory godoc
// @Summary Delete news category (Admin)
// @Tags admin-news
// @Param id path int true "Category ID"
// @Router /api/v1/admin/news-categories/{id} [delete]
func (h *NewsCategoryHandler) DeleteCategory(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID")
	}

	var existing models.NewsCategory
	if err := h.db.First(&existing, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Category not found")
	}

	if err := h.db.Delete(&models.NewsCategory{}, id).Error; err != nil {
		logger.Log.Error().Err(err).Msg("Failed to delete news category")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete category")
	}

	if h.auditService != nil {
		_ = h.auditService.LogAction(c, "delete", "news_categories", fmt.Sprint(id), map[string]interface{}{"name": existing.Name, "slug": existing.Slug})
	}

	return utils.SuccessResponse(c, fiber.Map{"message": "Category deleted successfully"})
}
