package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type RegistrationHandler struct {
	registrationService *services.RegistrationService
}

func NewRegistrationHandler(db *gorm.DB) *RegistrationHandler {
	return &RegistrationHandler{
		registrationService: services.NewRegistrationService(db),
	}
}

// RegisterForEvent - Public: Register for an event
func (h *RegistrationHandler) RegisterForEvent(c *fiber.Ctx) error {
	eventID, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	var registration models.EventRegistration
	if err := c.BodyParser(&registration); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.registrationService.RegisterForEvent(eventID, &registration); err != nil {
		switch err.Error() {
		case "event not found":
			return utils.ErrorResponse(c, fiber.StatusNotFound, err.Error())
		case "registration is not enabled for this event":
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		case "event is full", "already registered for this event":
			return utils.ErrorResponse(c, fiber.StatusConflict, err.Error())
		default:
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to register")
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success":           true,
		"data":              registration,
		"confirmation_code": registration.ConfirmationCode,
	})
}

// GetMyRegistrations - Auth: Get current user's registrations
func (h *RegistrationHandler) GetMyRegistrations(c *fiber.Ctx) error {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "User not authenticated")
	}

	registrations, err := h.registrationService.GetMyRegistrations(userID)
	if err != nil {
		if err.Error() == "member profile not found" {
			return utils.ErrorResponse(c, fiber.StatusNotFound, err.Error())
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch registrations")
	}
	return utils.SuccessResponse(c, registrations)
}

// GetRegistrations - Admin: List all registrations with filters
func (h *RegistrationHandler) GetRegistrations(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	page, limit = utils.ClampPagination(page, limit)

	registrations, total, err := h.registrationService.List(
		page, limit, c.Query("event_id"), c.Query("status"),
	)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch registrations")
	}
	return utils.PaginatedResponse(c, registrations, page, limit, int(total))
}

// UpdateRegistrationStatus - Admin: Update registration status
func (h *RegistrationHandler) UpdateRegistrationStatus(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	registration, err := h.registrationService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Registration not found")
	}

	var body struct {
		Status string `json:"status"`
		Reason string `json:"reason"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.registrationService.UpdateStatus(registration, body.Status, body.Reason); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update registration")
	}
	return utils.SuccessResponse(c, registration)
}

// BulkDeleteRegistrations - Admin: Delete multiple event registrations
func (h *RegistrationHandler) BulkDeleteRegistrations(c *fiber.Ctx) error {
	var req models.BulkDeleteRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if len(req.IDs) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No IDs provided for deletion")
	}

	if err := h.registrationService.BulkDelete(req.IDs); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete event registrations")
	}

	return utils.MessageResponse(c, "Event registrations deleted successfully")
}
