package handlers

import (
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

var (
	calendarResourceSlugPattern  = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
	calendarResourceTypePattern  = regexp.MustCompile(`^[a-z0-9]+(?:[_-][a-z0-9]+)*$`)
	calendarResourceColorPattern = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)
)

type CalendarResourceHandler struct {
	resourceService *services.CalendarResourceService
	auditService    *services.AuditService
}

type CalendarResourceInput struct {
	Slug         string               `json:"slug"`
	ResourceType string               `json:"resource_type"`
	Title        models.MultiLangText `json:"title"`
	Color        string               `json:"color"`
	Capacity     *int                 `json:"capacity"`
	Metadata     models.JSONMap       `json:"metadata"`
	IsActive     bool                 `json:"is_active"`
	IsPublic     bool                 `json:"is_public"`
	DisplayOrder int                  `json:"display_order"`
}

func NewCalendarResourceHandler(db *gorm.DB) *CalendarResourceHandler {
	return &CalendarResourceHandler{
		resourceService: services.NewCalendarResourceService(db),
		auditService:    services.NewAuditService(db),
	}
}

func ValidateCalendarResourceInput(input CalendarResourceInput) error {
	input.Slug = strings.TrimSpace(input.Slug)
	if input.Slug == "" || len(input.Slug) > 100 || !calendarResourceSlugPattern.MatchString(input.Slug) {
		return fmt.Errorf("slug must use lowercase letters, numbers, and hyphens")
	}
	input.ResourceType = strings.TrimSpace(input.ResourceType)
	if input.ResourceType == "" || len(input.ResourceType) > 50 || !calendarResourceTypePattern.MatchString(input.ResourceType) {
		return fmt.Errorf("resource_type must use lowercase letters, numbers, underscores, and hyphens")
	}
	for _, locale := range []string{"th", "en", "de"} {
		if strings.TrimSpace(input.Title[locale]) == "" {
			return fmt.Errorf("title.%s is required", locale)
		}
	}
	if input.Color != "" && !calendarResourceColorPattern.MatchString(input.Color) {
		return fmt.Errorf("color must be a six-digit hex color")
	}
	if input.Capacity != nil && *input.Capacity <= 0 {
		return fmt.Errorf("capacity must be positive")
	}
	if input.DisplayOrder < 0 {
		return fmt.Errorf("display_order must not be negative")
	}
	return nil
}

func (h *CalendarResourceHandler) GetAdminCalendarResources(c *fiber.Ctx) error {
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "display_order",
		DefaultOrder: "asc",
		AllowedSort:  services.CalendarResourceSortConfig(),
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	statuses := listquery.ExtractMulti(c, "status")
	if err := listquery.AllowedValues(statuses, map[string]struct{}{"active": {}, "inactive": {}}); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	items, total, err := h.resourceService.ListAdmin(services.CalendarResourceListOptions{
		Common:   common,
		Statuses: statuses,
		Types:    listquery.ExtractMulti(c, "type"),
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch calendar resources")
	}
	return utils.PaginatedResponse(c, items, common.Page, common.Limit, int(total))
}

func (h *CalendarResourceHandler) GetCalendarResource(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	resource, err := h.resourceService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Calendar resource not found")
	}
	return utils.SuccessResponse(c, resource)
}

func (h *CalendarResourceHandler) CreateCalendarResource(c *fiber.Ctx) error {
	var input CalendarResourceInput
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := ValidateCalendarResourceInput(input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	resource := calendarResourceModel(input)
	if err := h.resourceService.Create(&resource); err != nil {
		return utils.ErrorResponse(c, fiber.StatusConflict, "Calendar resource could not be created")
	}
	_ = h.auditService.LogAction(c, "create", "calendar_resources", fmt.Sprint(resource.ID), map[string]interface{}{"slug": resource.Slug})
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": resource})
}

func (h *CalendarResourceHandler) UpdateCalendarResource(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	resource, err := h.resourceService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Calendar resource not found")
	}
	input := calendarResourceInputFromModel(*resource)
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := ValidateCalendarResourceInput(input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	updated := calendarResourceModel(input)
	updated.ID = resource.ID
	updated.CreatedAt = resource.CreatedAt
	if err := h.resourceService.Update(&updated); err != nil {
		return utils.ErrorResponse(c, fiber.StatusConflict, "Calendar resource could not be updated")
	}
	_ = h.auditService.LogAction(c, "update", "calendar_resources", fmt.Sprint(updated.ID), map[string]interface{}{"slug": updated.Slug})
	return utils.SuccessResponse(c, updated)
}

func (h *CalendarResourceHandler) DeleteCalendarResource(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	if err := h.resourceService.Delete(id); err != nil {
		if errors.Is(err, services.ErrCalendarResourceAssigned) {
			return utils.ErrorResponse(c, fiber.StatusConflict, err.Error())
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Calendar resource not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete calendar resource")
	}
	_ = h.auditService.LogAction(c, "delete", "calendar_resources", fmt.Sprint(id), nil)
	return utils.MessageResponse(c, "Calendar resource deleted successfully")
}

func calendarResourceModel(input CalendarResourceInput) models.CalendarResource {
	return models.CalendarResource{
		Slug:         strings.TrimSpace(input.Slug),
		ResourceType: strings.TrimSpace(input.ResourceType),
		Title:        input.Title,
		Color:        strings.TrimSpace(input.Color),
		Capacity:     input.Capacity,
		Metadata:     input.Metadata,
		IsActive:     input.IsActive,
		IsPublic:     input.IsPublic,
		DisplayOrder: input.DisplayOrder,
	}
}

func calendarResourceInputFromModel(resource models.CalendarResource) CalendarResourceInput {
	return CalendarResourceInput{
		Slug:         resource.Slug,
		ResourceType: resource.ResourceType,
		Title:        resource.Title,
		Color:        resource.Color,
		Capacity:     resource.Capacity,
		Metadata:     resource.Metadata,
		IsActive:     resource.IsActive,
		IsPublic:     resource.IsPublic,
		DisplayOrder: resource.DisplayOrder,
	}
}
