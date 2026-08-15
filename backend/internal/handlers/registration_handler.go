package handlers

import (
	"errors"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/registrations"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type RegistrationHandler struct {
	registrationService *services.RegistrationService
}

const registrationRequestMaxBytes = 64 * 1024

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
	if len(c.Body()) > registrationRequestMaxBytes {
		return utils.CodedFieldErrorResponse(c, fiber.StatusRequestEntityTooLarge, string(registrations.CodeValidation), "Registration request is too large", map[string]string{"body": "Registration request is too large"})
	}

	var request registrations.CreateRequest
	if err := c.BodyParser(&request); err != nil {
		return utils.CodedErrorResponse(c, fiber.StatusUnprocessableEntity, string(registrations.CodeValidation), "Registration request is invalid")
	}
	input, domainErr := registrations.NormalizeAndValidateCreate(request)
	if domainErr != nil {
		return utils.CodedFieldErrorResponse(c, fiber.StatusUnprocessableEntity, string(domainErr.Code), domainErr.Message, domainErr.Fields)
	}

	identity := registrations.Identity{}
	if userID, ok := publicAccountUserID(c); ok {
		identity, err = h.registrationService.IdentityForUser(c.UserContext(), userID)
		if err != nil {
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to resolve account ownership")
		}
	}
	detail, err := h.registrationService.Create(c.UserContext(), eventID, identity, input)
	if err != nil {
		return registrationServiceErrorResponse(c, err)
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": detail})
}

type registrationManageRequest struct {
	Token        string                           `json:"token"`
	Locale       string                           `json:"locale"`
	Contact      registrations.ContactInput       `json:"contact"`
	Participants []registrations.ParticipantInput `json:"participants"`
}

type registrationCancelRequest struct {
	Token  string `json:"token"`
	Reason string `json:"reason"`
}

func (h *RegistrationHandler) ResolveGuestRegistration(c *fiber.Ctx) error {
	if len(c.Body()) > registrationRequestMaxBytes {
		return utils.CodedErrorResponse(c, fiber.StatusRequestEntityTooLarge, string(registrations.CodeValidation), "Registration request is too large")
	}
	var request registrationCancelRequest
	if err := c.BodyParser(&request); err != nil || strings.TrimSpace(request.Token) == "" {
		return utils.CodedErrorResponse(c, fiber.StatusUnprocessableEntity, string(registrations.CodeTokenInvalid), "This management link is invalid")
	}
	detail, err := h.registrationService.ResolveManage(c.UserContext(), request.Token)
	if err != nil {
		return registrationServiceErrorResponse(c, err)
	}
	return utils.SuccessResponse(c, detail)
}

func (h *RegistrationHandler) UpdateGuestRegistration(c *fiber.Ctx) error {
	if len(c.Body()) > registrationRequestMaxBytes {
		return utils.CodedErrorResponse(c, fiber.StatusRequestEntityTooLarge, string(registrations.CodeValidation), "Registration request is too large")
	}
	var request registrationManageRequest
	if err := c.BodyParser(&request); err != nil || strings.TrimSpace(request.Token) == "" {
		return utils.CodedErrorResponse(c, fiber.StatusUnprocessableEntity, string(registrations.CodeTokenInvalid), "This management link is invalid")
	}
	input, domainErr := registrations.NormalizeAndValidateUpdate(registrations.UpdateRequest{Locale: request.Locale, Contact: request.Contact, Participants: request.Participants})
	if domainErr != nil {
		return utils.CodedFieldErrorResponse(c, fiber.StatusUnprocessableEntity, string(domainErr.Code), domainErr.Message, domainErr.Fields)
	}
	detail, err := h.registrationService.UpdateByToken(c.UserContext(), request.Token, input)
	if err != nil {
		return registrationServiceErrorResponse(c, err)
	}
	return utils.SuccessResponse(c, detail)
}

func (h *RegistrationHandler) CancelGuestRegistration(c *fiber.Ctx) error {
	if len(c.Body()) > registrationRequestMaxBytes {
		return utils.CodedErrorResponse(c, fiber.StatusRequestEntityTooLarge, string(registrations.CodeValidation), "Registration request is too large")
	}
	var request registrationCancelRequest
	if err := c.BodyParser(&request); err != nil || strings.TrimSpace(request.Token) == "" {
		return utils.CodedErrorResponse(c, fiber.StatusUnprocessableEntity, string(registrations.CodeTokenInvalid), "This management link is invalid")
	}
	if err := h.registrationService.CancelByToken(c.UserContext(), request.Token, services.RegistrationCancelInput{Reason: request.Reason}); err != nil {
		return registrationServiceErrorResponse(c, err)
	}
	return utils.MessageResponse(c, "Registration cancelled")
}

func (h *RegistrationHandler) GetAccountRegistrations(c *fiber.Ctx) error {
	userID, ok := publicAccountUserID(c)
	if !ok {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, string(registrations.CodeUnauthorized), "User is not authenticated")
	}
	items, err := h.registrationService.ListByUser(c.UserContext(), userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch registrations")
	}
	return utils.SuccessResponse(c, items)
}

func (h *RegistrationHandler) UpdateAccountRegistration(c *fiber.Ctx) error {
	userID, ok := publicAccountUserID(c)
	if !ok {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, string(registrations.CodeUnauthorized), "User is not authenticated")
	}
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	if len(c.Body()) > registrationRequestMaxBytes {
		return utils.CodedErrorResponse(c, fiber.StatusRequestEntityTooLarge, string(registrations.CodeValidation), "Registration request is too large")
	}
	var request registrations.UpdateRequest
	if err := c.BodyParser(&request); err != nil {
		return utils.CodedErrorResponse(c, fiber.StatusUnprocessableEntity, string(registrations.CodeValidation), "Registration request is invalid")
	}
	input, domainErr := registrations.NormalizeAndValidateUpdate(request)
	if domainErr != nil {
		return utils.CodedFieldErrorResponse(c, fiber.StatusUnprocessableEntity, string(domainErr.Code), domainErr.Message, domainErr.Fields)
	}
	detail, err := h.registrationService.UpdateByUser(c.UserContext(), userID, id, input)
	if err != nil {
		return registrationServiceErrorResponse(c, err)
	}
	return utils.SuccessResponse(c, detail)
}

func (h *RegistrationHandler) CancelAccountRegistration(c *fiber.Ctx) error {
	userID, ok := publicAccountUserID(c)
	if !ok {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, string(registrations.CodeUnauthorized), "User is not authenticated")
	}
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	if len(c.Body()) > registrationRequestMaxBytes {
		return utils.CodedErrorResponse(c, fiber.StatusRequestEntityTooLarge, string(registrations.CodeValidation), "Registration request is too large")
	}
	var request struct {
		Reason string `json:"reason"`
	}
	if err := c.BodyParser(&request); err != nil {
		return utils.CodedErrorResponse(c, fiber.StatusUnprocessableEntity, string(registrations.CodeValidation), "Registration request is invalid")
	}
	if err := h.registrationService.CancelByUser(c.UserContext(), userID, id, services.RegistrationCancelInput{Reason: request.Reason}); err != nil {
		return registrationServiceErrorResponse(c, err)
	}
	return utils.MessageResponse(c, "Registration cancelled")
}

func publicAccountUserID(c *fiber.Ctx) (uuid.UUID, bool) {
	if userID, ok := c.Locals("userID").(uuid.UUID); ok && userID != uuid.Nil {
		return userID, true
	}
	if raw, ok := c.Locals("user_id").(string); ok {
		userID, err := uuid.Parse(strings.TrimSpace(raw))
		if err == nil && userID != uuid.Nil {
			return userID, true
		}
	}
	return uuid.Nil, false
}

func registrationServiceErrorResponse(c *fiber.Ctx, err error) error {
	var domainErr *registrations.DomainError
	if !errors.As(err, &domainErr) {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Registration service unavailable")
	}
	statusCode := fiber.StatusConflict
	switch domainErr.Code {
	case registrations.CodeNotFound:
		statusCode = fiber.StatusNotFound
	case registrations.CodeValidation, registrations.CodeGroupLimitExceeded:
		statusCode = fiber.StatusUnprocessableEntity
	case registrations.CodeTokenInvalid, registrations.CodeUnauthorized:
		statusCode = fiber.StatusUnauthorized
	case registrations.CodeTokenExpired:
		statusCode = fiber.StatusGone
	case registrations.CodeDisabled, registrations.CodeClosed, registrations.CodeFull, registrations.CodeDuplicate, registrations.CodeNotEditable, registrations.CodeConflict:
		statusCode = fiber.StatusConflict
	}
	if len(domainErr.Fields) > 0 {
		return utils.CodedFieldErrorResponse(c, statusCode, string(domainErr.Code), domainErr.Message, domainErr.Fields)
	}
	return utils.CodedErrorResponse(c, statusCode, string(domainErr.Code), domainErr.Message)
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

// GetRegistrations - Admin: List all registrations with pagination and filters
func (h *RegistrationHandler) GetRegistrations(c *fiber.Ctx) error {
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "created_at",
		DefaultOrder: "desc",
		AllowedSort: map[string]string{
			"id":                  "id",
			"name":                "name",
			"event_title":         "event_title",
			"first_name":          "first_name",
			"last_name":           "last_name",
			"email":               "email",
			"registration_status": "registration_status",
			"status":              "registration_status",
			"created_at":          "created_at",
			"event_id":            "event_id",
		},
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	statuses := listquery.ExtractMulti(c, "status")
	eventIDStrs := listquery.ExtractMulti(c, "event_id")
	if len(eventIDStrs) == 0 {
		eventIDStrs = listquery.ExtractMulti(c, "event")
	}
	var eventIDs []int
	for _, evStr := range eventIDStrs {
		if id, parseErr := strconv.Atoi(evStr); parseErr == nil {
			eventIDs = append(eventIDs, id)
		}
	}

	options := services.RegistrationListOptions{
		Common:   common,
		Statuses: statuses,
		EventIDs: eventIDs,
	}

	registrations, total, err := h.registrationService.ListOptions(options)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch registrations")
	}

	return utils.PaginatedResponse(c, registrations, common.Page, common.Limit, int(total))
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

	validStatuses := map[string]bool{
		"pending":   true,
		"confirmed": true,
		"attended":  true,
		"cancelled": true,
	}
	if !validStatuses[body.Status] {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid registration status value")
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
