package handlers

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type ChantingHandler struct {
	chantingService *services.ChantingService
	auditService    *services.AuditService
}

func NewChantingHandler(db *gorm.DB) *ChantingHandler {
	return &ChantingHandler{
		chantingService: services.NewChantingService(db),
		auditService:    services.NewAuditService(db),
	}
}

// GetChantings - Public: List active chantings, optionally filtered by category
func (h *ChantingHandler) GetChantings(c *fiber.Ctx) error {
	category := c.Query("category", "")
	chantings, err := h.chantingService.ListActive(category)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch chantings")
	}
	return utils.SuccessResponse(c, chantings)
}

// GetChantingBySlug - Public: Get single chanting by slug
func (h *ChantingHandler) GetChantingBySlug(c *fiber.Ctx) error {
	slug := c.Params("slug")
	if slug == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Slug is required")
	}
	chanting, err := h.chantingService.GetBySlug(slug)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Chanting not found")
	}
	return utils.SuccessResponse(c, chanting)
}

// GetAdminChantings - Admin: List chantings with pagination, search, and category/status filters
func (h *ChantingHandler) GetAdminChantings(c *fiber.Ctx) error {
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "display_order",
		DefaultOrder: "asc",
		AllowedSort: map[string]string{
			"id":            "id",
			"display_order": "display_order",
			"title":         "title",
			"category":      "category",
			"duration":      "duration",
			"status":        "status",
			"created_at":    "created_at",
		},
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	categories := listquery.ExtractMulti(c, "category")
	statuses := listquery.ExtractMulti(c, "status")
	options := services.ChantingListOptions{
		Common:     common,
		Categories: categories,
		Statuses:   statuses,
	}

	chantings, total, err := h.chantingService.ListAdmin(options)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch chantings")
	}

	return utils.PaginatedResponse(c, chantings, common.Page, common.Limit, int(total))
}

// GetAdminChantingByID - Admin: Get single chanting by ID
func (h *ChantingHandler) GetAdminChantingByID(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	item, err := h.chantingService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Chanting not found")
	}
	return utils.SuccessResponse(c, item)
}

// CreateChanting - Admin: Create new chanting
func (h *ChantingHandler) CreateChanting(c *fiber.Ctx) error {
	var chanting models.Chanting
	if err := c.BodyParser(&chanting); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request")
	}

	if chanting.PaliThai == "" || chanting.PaliRoman == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Pali texts in Thai and Roman script are required")
	}

	if err := h.chantingService.Create(&chanting); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create chanting")
	}

	_ = h.auditService.LogAction(c, "create", "chanting", fmt.Sprint(chanting.ID), map[string]interface{}{"title": chanting.Title})

	c.Status(fiber.StatusCreated)
	return utils.SuccessResponse(c, chanting)
}

// UpdateChanting - Admin: Update an existing chanting
func (h *ChantingHandler) UpdateChanting(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	var chanting models.Chanting
	if err := c.BodyParser(&chanting); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request")
	}

	if chanting.PaliThai == "" || chanting.PaliRoman == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Pali texts in Thai and Roman script are required")
	}

	if err := h.chantingService.Update(id, &chanting); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update chanting")
	}

	_ = h.auditService.LogAction(c, "update", "chanting", fmt.Sprint(id), map[string]interface{}{"title": chanting.Title})

	return utils.SuccessResponse(c, chanting)
}

// DeleteChanting - Admin: Delete chanting by ID
func (h *ChantingHandler) DeleteChanting(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	if err := h.chantingService.Delete(id); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete chanting")
	}

	_ = h.auditService.LogAction(c, "delete", "chanting", fmt.Sprint(id), nil)

	return utils.SuccessResponse(c, fiber.Map{"deleted": true})
}
