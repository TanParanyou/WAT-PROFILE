package handlers

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/richtext"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type EventHandler struct {
	eventService *services.EventService
	auditService *services.AuditService
}

func NewEventHandler(db *gorm.DB) *EventHandler {
	return &EventHandler{
		eventService: services.NewEventService(db),
		auditService: services.NewAuditService(db),
	}
}

// GetEvents - Public: List all active events
func (h *EventHandler) GetEvents(c *fiber.Ctx) error {
	limit := 0
	if rawLimit := c.Query("limit"); rawLimit != "" {
		parsedLimit, err := strconv.Atoi(rawLimit)
		if err != nil || parsedLimit <= 0 {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "limit must be a positive integer")
		}
		limit = parsedLimit
	}

	events, err := h.eventService.ListActive(limit)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch events")
	}
	return utils.SuccessResponse(c, events)
}

// GetAdminEvents - Admin: List all events with pagination and filters
func (h *EventHandler) GetAdminEvents(c *fiber.Ctx) error {
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "start_date",
		DefaultOrder: "desc",
		AllowedSort: map[string]string{
			"id":            "id",
			"start_date":    "start_date",
			"title":         "title",
			"event_type":    "event_type",
			"end_date":      "end_date",
			"created_at":    "created_at",
			"display_order": "display_order",
		},
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	statuses := listquery.ExtractMulti(c, "status")
	types := listquery.ExtractMulti(c, "type")

	options := services.EventListOptions{
		Common:   common,
		Statuses: statuses,
		Types:    types,
	}

	events, total, err := h.eventService.ListAdmin(options)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch events")
	}

	return utils.PaginatedResponse(c, events, common.Page, common.Limit, int(total))
}

// GetEvent - Public: Get single event by slug
func (h *EventHandler) GetEvent(c *fiber.Ctx) error {
	event, err := h.eventService.GetBySlug(c.Params("slug"))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Event not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch event")
	}
	return utils.SuccessResponse(c, event)
}

// GetEventByID - Admin: Get single event by ID
func (h *EventHandler) GetEventByID(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	event, err := h.eventService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Event not found")
	}
	return utils.SuccessResponse(c, event)
}

// CreateEvent - Admin: Create new event
func (h *EventHandler) CreateEvent(c *fiber.Ctx) error {
	var event models.Event
	if err := c.BodyParser(&event); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := richtext.ValidateLocalized(event.Description); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	if err := h.eventService.Create(&event); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create event")
	}

	_ = h.auditService.LogAction(c, "create", "events", "", map[string]interface{}{"title": event.Title})

	c.Status(fiber.StatusCreated)
	return utils.SuccessResponse(c, event)
}

// UpdateEvent - Admin: Update event
func (h *EventHandler) UpdateEvent(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	event, err := h.eventService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Event not found")
	}
	if err := c.BodyParser(event); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := richtext.ValidateLocalized(event.Description); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	if err := h.eventService.Update(event); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}

	uid := fmt.Sprint(event.ID)
	_ = h.auditService.LogAction(c, "update", "events", uid, map[string]interface{}{"title": event.Title})

	return utils.SuccessResponse(c, event)
}

// DeleteEvent - Admin: Delete event
func (h *EventHandler) DeleteEvent(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	if err := h.eventService.Delete(id); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete event")
	}

	_ = h.auditService.LogAction(c, "delete", "events", fmt.Sprint(id), nil)

	return utils.MessageResponse(c, "Event deleted successfully")
}

// BulkDeleteEvents - Admin: Delete multiple events
func (h *EventHandler) BulkDeleteEvents(c *fiber.Ctx) error {
	var req models.BulkDeleteRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if len(req.IDs) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No IDs provided for deletion")
	}

	if err := h.eventService.BulkDelete(req.IDs); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete events")
	}

	_ = h.auditService.LogAction(c, "bulk_delete", "events", "", map[string]interface{}{"count": len(req.IDs)})

	return utils.MessageResponse(c, "Events deleted successfully")
}
