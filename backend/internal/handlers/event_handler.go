package handlers

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
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
	events, err := h.eventService.ListActive()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch events")
	}
	return utils.SuccessResponse(c, events)
}

// GetEvent - Public: Get single event by slug
func (h *EventHandler) GetEvent(c *fiber.Ctx) error {
	event, err := h.eventService.GetBySlug(c.Params("slug"))
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
	if err := h.eventService.Create(&event); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create event")
	}

	go h.auditService.LogAction(c, "create", "events", nil, map[string]interface{}{"title": event.Title})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": event})
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
	if err := h.eventService.Update(event); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update event")
	}

	uid := fmt.Sprint(event.ID)
	go h.auditService.LogAction(c, "update", "events", uid, map[string]interface{}{"title": event.Title})

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

	go h.auditService.LogAction(c, "delete", "events", &id, nil)

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

	go h.auditService.LogAction(c, "bulk_delete", "events", "", map[string]interface{}{"count": len(req.IDs)})

	return utils.MessageResponse(c, "Events deleted successfully")
}
