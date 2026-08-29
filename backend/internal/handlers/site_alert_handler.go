package handlers

import (
	"fmt"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/logger"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type SiteAlertHandler struct {
	db           *gorm.DB
	auditService *services.AuditService
}

func NewSiteAlertHandler(db *gorm.DB, auditService *services.AuditService) *SiteAlertHandler {
	return &SiteAlertHandler{db: db, auditService: auditService}
}

// GetPublicAlerts godoc
// @Summary List active site alerts (Public)
// @Tags alerts
// @Produce json
// @Router /api/v1/public/alerts [get]
func (h *SiteAlertHandler) GetPublicAlerts(c *fiber.Ctx) error {
	now := time.Now()

	var alerts []models.SiteAlert
	err := h.db.Where("is_active = ?", true).
		Where("(starts_at IS NULL OR starts_at <= ?)", now).
		Where("(ends_at IS NULL OR ends_at >= ?)", now).
		Order("CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END, display_order ASC, id DESC").
		Find(&alerts).Error

	if err != nil {
		logger.Log.Error().Err(err).Msg("Failed to fetch public site alerts")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch alerts")
	}

	return utils.SuccessResponse(c, alerts)
}

// GetAdminAlerts godoc
// @Summary List all site alerts (Admin)
// @Tags admin-alerts
// @Produce json
// @Router /api/v1/admin/site-alerts [get]
func (h *SiteAlertHandler) GetAdminAlerts(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := h.db.Model(&models.SiteAlert{})

	if search := c.Query("search"); search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where(
			"title->>'th' ILIKE ? OR title->>'en' ILIKE ? OR title->>'de' ILIKE ? OR message->>'th' ILIKE ? OR message->>'en' ILIKE ? OR message->>'de' ILIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	if severity := c.Query("severity"); severity != "" && severity != "all" {
		query = query.Where("severity = ?", severity)
	}

	if scope := c.Query("scope"); scope != "" && scope != "all" {
		query = query.Where("scope = ?", scope)
	}

	if activeStr := c.Query("is_active"); activeStr != "" && activeStr != "all" {
		if activeStr == "true" {
			query = query.Where("is_active = ?", true)
		} else if activeStr == "false" {
			query = query.Where("is_active = ?", false)
		}
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		logger.Log.Error().Err(err).Msg("Failed to count admin site alerts")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to count alerts")
	}

	var alerts []models.SiteAlert
	if err := query.Order("CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END, display_order ASC, id DESC").
		Offset(offset).
		Limit(limit).
		Find(&alerts).Error; err != nil {
		logger.Log.Error().Err(err).Msg("Failed to fetch admin site alerts")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch alerts")
	}

	totalPages := (int(total) + limit - 1) / limit
	return c.JSON(fiber.Map{
		"success": true,
		"data":    alerts,
		"pagination": fiber.Map{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": totalPages,
		},
	})
}

// GetAlertByID godoc
// @Summary Get site alert by ID (Admin)
// @Tags admin-alerts
// @Param id path int true "Site Alert ID"
// @Router /api/v1/admin/site-alerts/{id} [get]
func (h *SiteAlertHandler) GetAlertByID(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid alert ID")
	}

	var alert models.SiteAlert
	if err := h.db.First(&alert, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Site alert not found")
	}

	return utils.SuccessResponse(c, alert)
}

// CreateAlert godoc
// @Summary Create site alert (Admin)
// @Tags admin-alerts
// @Accept json
// @Produce json
// @Router /api/v1/admin/site-alerts [post]
func (h *SiteAlertHandler) CreateAlert(c *fiber.Ctx) error {
	var req models.SiteAlert
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.Title == nil || req.Title["th"] == "" || req.Message == nil || req.Message["th"] == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Thai title and message are required")
	}

	if req.Severity == "" {
		req.Severity = "info"
	}
	if req.DisplayType == "" {
		req.DisplayType = "top_banner"
	}
	if req.Scope == "" {
		req.Scope = "all_pages"
	}

	if err := h.db.Create(&req).Error; err != nil {
		logger.Log.Error().Err(err).Msg("Failed to create site alert")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create site alert")
	}

	if h.auditService != nil {
		_ = h.auditService.LogAction(c, "create", "site_alerts", fmt.Sprint(req.ID), map[string]interface{}{"title": req.Title, "severity": req.Severity})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    req,
		"message": "Site alert created successfully",
	})
}

// UpdateAlert godoc
// @Summary Update site alert (Admin)
// @Tags admin-alerts
// @Accept json
// @Produce json
// @Param id path int true "Site Alert ID"
// @Router /api/v1/admin/site-alerts/{id} [put]
func (h *SiteAlertHandler) UpdateAlert(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid alert ID")
	}

	var existing models.SiteAlert
	if err := h.db.First(&existing, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Site alert not found")
	}

	// Parse body over existing to preserve unchanged fields during partial updates
	if err := c.BodyParser(&existing); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	existing.ID = uint(id)

	if err := h.db.Save(&existing).Error; err != nil {
		logger.Log.Error().Err(err).Msg("Failed to update site alert")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update site alert")
	}

	if h.auditService != nil {
		_ = h.auditService.LogAction(c, "update", "site_alerts", fmt.Sprint(existing.ID), map[string]interface{}{"title": existing.Title, "severity": existing.Severity})
	}

	return utils.SuccessResponse(c, existing)
}

// DeleteAlert godoc
// @Summary Delete site alert (Admin)
// @Tags admin-alerts
// @Param id path int true "Site Alert ID"
// @Router /api/v1/admin/site-alerts/{id} [delete]
func (h *SiteAlertHandler) DeleteAlert(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid alert ID")
	}

	var existing models.SiteAlert
	if err := h.db.First(&existing, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Site alert not found")
	}

	if err := h.db.Delete(&models.SiteAlert{}, id).Error; err != nil {
		logger.Log.Error().Err(err).Msg("Failed to delete site alert")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete site alert")
	}

	if h.auditService != nil {
		_ = h.auditService.LogAction(c, "delete", "site_alerts", fmt.Sprint(id), map[string]interface{}{"title": existing.Title, "severity": existing.Severity})
	}

	return utils.SuccessResponse(c, fiber.Map{"message": "Site alert deleted successfully"})
}
