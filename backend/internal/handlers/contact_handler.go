package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type ContactHandler struct {
	contactService *services.ContactService
}

func NewContactHandler(db *gorm.DB) *ContactHandler {
	return &ContactHandler{
		contactService: services.NewContactService(db),
	}
}

// SubmitContact - Public: Submit a contact inquiry (no auth required)
func (h *ContactHandler) SubmitContact(c *fiber.Ctx) error {
	var inquiry models.ContactInquiry
	if err := c.BodyParser(&inquiry); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if inquiry.Name == "" || inquiry.Email == "" || inquiry.Message == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Name, email, and message are required")
	}

	if !utils.ValidateEmail(inquiry.Email) {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid email format")
	}

	if err := h.contactService.Submit(&inquiry); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to submit contact inquiry")
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Thank you for your message. We will respond soon.",
		"data":    inquiry,
	})
}

// GetContacts - Admin: List all contact inquiries with pagination and filters
func (h *ContactHandler) GetContacts(c *fiber.Ctx) error {
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "created_at",
		DefaultOrder: "desc",
		AllowedSort: map[string]string{
			"id":           "id",
			"created_at":   "created_at",
			"name":         "name",
			"email":        "email",
			"subject":      "subject",
			"status":       "status",
			"inquiry_type": "inquiry_type",
		},
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	statuses := listquery.ExtractMulti(c, "status")
	types := listquery.ExtractMulti(c, "type")

	options := services.ContactListOptions{
		Common:       common,
		Statuses:     statuses,
		InquiryTypes: types,
	}

	inquiries, total, err := h.contactService.ListOptions(options)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch contacts")
	}

	return utils.PaginatedResponse(c, inquiries, common.Page, common.Limit, int(total))
}

// UpdateContactStatus - Admin: Update contact inquiry status / reply
func (h *ContactHandler) UpdateContactStatus(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	inquiry, err := h.contactService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Contact inquiry not found")
	}

	var body struct {
		Status       string `json:"status"`
		ReplyMessage string `json:"reply_message"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	validStatuses := map[string]bool{
		"new":      true,
		"read":     true,
		"replied":  true,
		"archived": true,
	}
	if body.Status != "" && !validStatuses[body.Status] {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid contact inquiry status value")
	}

	userID, userErr := middleware.GetCurrentUserID(c)
	if body.ReplyMessage != "" && userErr == nil {
		if err := h.contactService.UpdateStatus(inquiry, body.Status, body.ReplyMessage, &userID); err != nil {
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update contact inquiry")
		}
	} else {
		if err := h.contactService.UpdateStatus(inquiry, body.Status, body.ReplyMessage, nil); err != nil {
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update contact inquiry")
		}
	}

	return utils.SuccessResponse(c, inquiry)
}

// DeleteContact - Admin: Delete contact inquiry
func (h *ContactHandler) DeleteContact(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	if err := h.contactService.Delete(id); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete contact inquiry")
	}
	return utils.MessageResponse(c, "Contact inquiry deleted successfully")
}

// BulkDeleteContacts - Admin: Delete multiple contact inquiries
func (h *ContactHandler) BulkDeleteContacts(c *fiber.Ctx) error {
	var req models.BulkDeleteRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if len(req.IDs) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No IDs provided for deletion")
	}

	if err := h.contactService.BulkDelete(req.IDs); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete contact inquiries")
	}

	return utils.MessageResponse(c, "Contact inquiries deleted successfully")
}
