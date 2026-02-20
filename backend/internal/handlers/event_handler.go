package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type EventHandler struct {
	eventService *services.EventService
}

func NewEventHandler(db *gorm.DB) *EventHandler {
	return &EventHandler{
		eventService: services.NewEventService(db),
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
	return utils.MessageResponse(c, "Event deleted successfully")
}
