package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
)

type EventHandler struct{}

func NewEventHandler() *EventHandler {
	return &EventHandler{}
}

// GetEvents - Public: List all active events
func (h *EventHandler) GetEvents(c *fiber.Ctx) error {
	var events []models.Event
	query := config.DB.Where("is_active = ?", true).Order("event_date DESC")

	if err := query.Preload("Schedules").Find(&events).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch events")
	}

	return utils.SuccessResponse(c, events)
}

// GetEvent - Public: Get single event by slug
func (h *EventHandler) GetEvent(c *fiber.Ctx) error {
	slug := c.Params("slug")
	var event models.Event

	if err := config.DB.Where("slug = ? AND is_active = ?", slug, true).
		Preload("Schedules").First(&event).Error; err != nil {
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

	if err := config.DB.Create(&event).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create event")
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    event,
	})
}

// UpdateEvent - Admin: Update event
func (h *EventHandler) UpdateEvent(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var event models.Event

	if err := config.DB.First(&event, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Event not found")
	}

	if err := c.BodyParser(&event); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := config.DB.Save(&event).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update event")
	}

	return utils.SuccessResponse(c, event)
}

// DeleteEvent - Admin: Delete event
func (h *EventHandler) DeleteEvent(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	if err := config.DB.Delete(&models.Event{}, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete event")
	}

	return utils.MessageResponse(c, "Event deleted successfully")
}
