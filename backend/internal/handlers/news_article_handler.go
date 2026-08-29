package handlers

import (
	"fmt"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/richtext"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/logger"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type NewsArticleHandler struct {
	db           *gorm.DB
	auditService *services.AuditService
}

func NewNewsArticleHandler(db *gorm.DB, auditService *services.AuditService) *NewsArticleHandler {
	return &NewsArticleHandler{db: db, auditService: auditService}
}

// GetPublicNews godoc
// @Summary List published news articles (Public)
// @Tags news
// @Produce json
// @Router /api/v1/public/news [get]
func (h *NewsArticleHandler) GetPublicNews(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}
	offset := (page - 1) * limit

	query := h.db.Model(&models.NewsArticle{}).
		Preload("Category").
		Where("publish_status = ?", "published").
		Where("(published_at IS NOT NULL AND published_at <= ?)", time.Now())

	if catIDStr := c.Query("category_id"); catIDStr != "" {
		if catID, err := strconv.Atoi(catIDStr); err == nil && catID > 0 {
			query = query.Where("category_id = ?", catID)
		}
	}

	if featuredStr := c.Query("featured"); featuredStr == "true" {
		query = query.Where("is_featured = ?", true)
	}

	if search := c.Query("search"); search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where(
			"title->>'th' ILIKE ? OR title->>'en' ILIKE ? OR title->>'de' ILIKE ? OR excerpt->>'th' ILIKE ? OR excerpt->>'en' ILIKE ? OR excerpt->>'de' ILIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		logger.Log.Error().Err(err).Msg("Failed to count public news")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to count news")
	}

	var articles []models.NewsArticle
	if err := query.Order("is_pinned DESC, published_at DESC, id DESC").
		Offset(offset).
		Limit(limit).
		Find(&articles).Error; err != nil {
		logger.Log.Error().Err(err).Msg("Failed to fetch public news")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch news")
	}

	totalPages := (int(total) + limit - 1) / limit
	return c.JSON(fiber.Map{
		"success": true,
		"data":    articles,
		"pagination": fiber.Map{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": totalPages,
		},
	})
}

// GetPublicNewsBySlug godoc
// @Summary Get news article by slug (Public)
// @Tags news
// @Produce json
// @Router /api/v1/public/news/{slug} [get]
func (h *NewsArticleHandler) GetPublicNewsBySlug(c *fiber.Ctx) error {
	slug := c.Params("slug")

	var article models.NewsArticle
	err := h.db.Preload("Category").
		Where("slug = ?", slug).
		Where("publish_status = ?", "published").
		Where("(published_at IS NOT NULL AND published_at <= ?)", time.Now()).
		First(&article).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Article not found")
		}
		logger.Log.Error().Err(err).Msg("Failed to fetch public news by slug")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch article")
	}

	// Increment view count asynchronously
	go func(id uint) {
		h.db.Model(&models.NewsArticle{}).Where("id = ?", id).UpdateColumn("view_count", gorm.Expr("view_count + 1"))
	}(article.ID)

	return utils.SuccessResponse(c, article)
}

// GetAdminNews godoc
// @Summary List all news articles (Admin)
// @Tags admin-news
// @Produce json
// @Router /api/v1/admin/news [get]
func (h *NewsArticleHandler) GetAdminNews(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := h.db.Model(&models.NewsArticle{}).Preload("Category")

	if status := c.Query("status"); status != "" && status != "all" {
		query = query.Where("publish_status = ?", status)
	}

	if catIDStr := c.Query("category_id"); catIDStr != "" {
		if catID, err := strconv.Atoi(catIDStr); err == nil && catID > 0 {
			query = query.Where("category_id = ?", catID)
		}
	}

	if search := c.Query("search"); search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where(
			"title->>'th' ILIKE ? OR title->>'en' ILIKE ? OR title->>'de' ILIKE ? OR slug ILIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		logger.Log.Error().Err(err).Msg("Failed to count admin news")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to count news")
	}

	var articles []models.NewsArticle
	if err := query.Order("is_pinned DESC, is_featured DESC, id DESC").
		Offset(offset).
		Limit(limit).
		Find(&articles).Error; err != nil {
		logger.Log.Error().Err(err).Msg("Failed to fetch admin news")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch news")
	}

	totalPages := (int(total) + limit - 1) / limit
	return c.JSON(fiber.Map{
		"success": true,
		"data":    articles,
		"pagination": fiber.Map{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": totalPages,
		},
	})
}

// GetNewsByID godoc
// @Summary Get news article by ID (Admin)
// @Tags admin-news
// @Param id path int true "News Article ID"
// @Router /api/v1/admin/news/{id} [get]
func (h *NewsArticleHandler) GetNewsByID(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid news ID")
	}

	var article models.NewsArticle
	if err := h.db.Preload("Category").First(&article, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "News article not found")
	}

	return utils.SuccessResponse(c, article)
}

// CreateNews godoc
// @Summary Create news article (Admin)
// @Tags admin-news
// @Accept json
// @Produce json
// @Router /api/v1/admin/news [post]
func (h *NewsArticleHandler) CreateNews(c *fiber.Ctx) error {
	var req models.NewsArticle
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.Slug == "" || req.Title == nil || req.Title["th"] == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Slug and Thai title are required")
	}

	// Validate TipTap RichText AST if present
	if req.Content != nil {
		if err := richtext.ValidateLocalized(req.Content); err != nil {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		}
	}

	// Auto-fill publish timestamp if published
	if req.PublishStatus == "published" && req.PublishedAt == nil {
		now := time.Now()
		req.PublishedAt = &now
	}

	if err := h.db.Create(&req).Error; err != nil {
		logger.Log.Error().Err(err).Msg("Failed to create news article")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create news article")
	}

	if h.auditService != nil {
		_ = h.auditService.LogAction(c, "create", "news_articles", fmt.Sprint(req.ID), map[string]interface{}{"title": req.Title, "slug": req.Slug})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    req,
		"message": "News article created successfully",
	})
}

// UpdateNews godoc
// @Summary Update news article (Admin)
// @Tags admin-news
// @Accept json
// @Produce json
// @Param id path int true "News Article ID"
// @Router /api/v1/admin/news/{id} [put]
func (h *NewsArticleHandler) UpdateNews(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid news ID")
	}

	var existing models.NewsArticle
	if err := h.db.First(&existing, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "News article not found")
	}

	// Parse body over existing to preserve unchanged fields during partial updates
	if err := c.BodyParser(&existing); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	existing.ID = uint(id)

	if existing.Content != nil {
		if err := richtext.ValidateLocalized(existing.Content); err != nil {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		}
	}

	if existing.PublishStatus == "published" && existing.PublishedAt == nil {
		now := time.Now()
		existing.PublishedAt = &now
	}

	if err := h.db.Save(&existing).Error; err != nil {
		logger.Log.Error().Err(err).Msg("Failed to update news article")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update news article")
	}

	if h.auditService != nil {
		_ = h.auditService.LogAction(c, "update", "news_articles", fmt.Sprint(existing.ID), map[string]interface{}{"title": existing.Title, "slug": existing.Slug})
	}

	return utils.SuccessResponse(c, existing)
}

// DeleteNews godoc
// @Summary Delete news article (Admin)
// @Tags admin-news
// @Param id path int true "News Article ID"
// @Router /api/v1/admin/news/{id} [delete]
func (h *NewsArticleHandler) DeleteNews(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid news ID")
	}

	var existing models.NewsArticle
	if err := h.db.First(&existing, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "News article not found")
	}

	if err := h.db.Delete(&models.NewsArticle{}, id).Error; err != nil {
		logger.Log.Error().Err(err).Msg("Failed to delete news article")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete news article")
	}

	if h.auditService != nil {
		_ = h.auditService.LogAction(c, "delete", "news_articles", fmt.Sprint(id), map[string]interface{}{"title": existing.Title, "slug": existing.Slug})
	}

	return utils.SuccessResponse(c, fiber.Map{"message": "News article deleted successfully"})
}
