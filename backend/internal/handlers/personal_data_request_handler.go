package handlers

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type PersonalDataRequestHandler struct {
	requests  *services.PersonalDataRequestService
	discovery *services.PersonalDataDiscoveryService
	actions   *services.PersonalDataActionService
	exports   *services.PersonalDataExportService
	audit     *services.AuditService
	sender    accountauth.EmailSender
}

func NewPersonalDataRequestHandler(db *gorm.DB) *PersonalDataRequestHandler {
	var sender accountauth.EmailSender
	if os.Getenv("AUTH_EMAIL_DELIVERY_MODE") == "resend" {
		cfg := config.AccountAuthConfig{EmailMode: "resend", ResendAPIKey: os.Getenv("RESEND_API_KEY"), EmailFrom: os.Getenv("ACCOUNT_EMAIL_FROM")}
		if configured, err := services.NewAccountEmailSender(cfg); err == nil {
			sender = configured
		}
	}
	if sender == nil && os.Getenv("ENV") != "production" {
		sender, _ = services.NewAccountEmailSender(config.AccountAuthConfig{EmailMode: "capture", Environment: "development"})
	}
	return &PersonalDataRequestHandler{requests: services.NewPersonalDataRequestService(db), discovery: services.NewPersonalDataDiscoveryService(db), actions: services.NewPersonalDataActionService(db), exports: services.NewPersonalDataExportService(db), audit: services.NewAuditService(db), sender: sender}
}

func currentAdminID(c *fiber.Ctx) (uuid.UUID, error) { return middleware.GetCurrentUserID(c) }

func (h *PersonalDataRequestHandler) List(c *fiber.Ctx) error {
	rows, err := h.requests.List()
	if err != nil {
		return utils.ErrorResponse(c, 500, "Failed to list privacy requests")
	}
	return utils.SuccessResponse(c, rows)
}

func (h *PersonalDataRequestHandler) Create(c *fiber.Ctx) error {
	var input services.PersonalDataRequestInput
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, 400, "Invalid request body")
	}
	actor, err := currentAdminID(c)
	if err != nil {
		return utils.ErrorResponse(c, 401, "Admin identity is required")
	}
	row, err := h.requests.Create(c.UserContext(), input, actor)
	if err != nil {
		return utils.ErrorResponse(c, 400, err.Error())
	}
	_ = h.audit.LogAction(c, "privacy_request_created", "personal_data_request", row.ID.String(), map[string]interface{}{"request_type": row.RequestType})
	return c.Status(201).JSON(fiber.Map{"success": true, "data": row})
}

// SubmitPublic - Public: Submit a data subject privacy request (no auth required)
func (h *PersonalDataRequestHandler) SubmitPublic(c *fiber.Ctx) error {
	if len(c.Body()) > 32*1024 {
		return utils.FieldErrorResponse(c, fiber.StatusBadRequest, "Request is too large", map[string]string{"message": "Request is too large"})
	}
	var input struct {
		SubjectEmail      string `json:"subject_email"`
		SubjectMemberCode string `json:"subject_member_code"`
		RequestType       string `json:"request_type"`
		Notes             string `json:"notes"`
		Website           string `json:"website"`
	}
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if strings.TrimSpace(input.Website) != "" {
		return utils.MessageResponseWithStatus(c, fiber.StatusCreated, "Privacy request received successfully")
	}
	reqInput := services.PersonalDataRequestInput{
		SubjectEmail:      strings.TrimSpace(input.SubjectEmail),
		SubjectMemberCode: strings.TrimSpace(input.SubjectMemberCode),
		RequestType:       strings.TrimSpace(input.RequestType),
		Notes:             strings.TrimSpace(input.Notes),
	}
	row, err := h.requests.CreatePublic(c.UserContext(), reqInput)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	_ = h.audit.LogAction(c, "privacy_request_created", "personal_data_request", row.ID.String(), map[string]interface{}{
		"request_type": row.RequestType,
		"source":       "public",
	})
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"id":           row.ID.String(),
			"request_type": row.RequestType,
			"created_at":   row.CreatedAt,
			"message":      "Privacy request received successfully",
		},
	})
}

func (h *PersonalDataRequestHandler) Get(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, 400, "Invalid request id")
	}
	row, err := h.requests.Get(id)
	if err != nil {
		return utils.ErrorResponse(c, 404, "Privacy request not found")
	}
	return utils.SuccessResponse(c, row)
}

func (h *PersonalDataRequestHandler) Search(c *fiber.Ctx) error {
	rows, err := h.discovery.Discover(c.UserContext(), services.PersonalDataSearch{Email: c.Query("email"), MemberCode: c.Query("member_code")})
	if err != nil {
		return utils.ErrorResponse(c, 400, err.Error())
	}
	return utils.SuccessResponse(c, rows)
}

func (h *PersonalDataRequestHandler) Verify(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, 400, "Invalid request id")
	}
	var input struct {
		Method   string `json:"method"`
		Evidence string `json:"evidence"`
	}
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, 400, "Invalid request body")
	}
	actor, err := currentAdminID(c)
	if err != nil {
		return utils.ErrorResponse(c, 401, "Admin identity is required")
	}
	row, err := h.requests.Verify(id, actor, input.Method, input.Evidence)
	if err != nil {
		return utils.ErrorResponse(c, 400, err.Error())
	}
	_ = h.audit.LogAction(c, "privacy_request_verified", "personal_data_request", id.String(), map[string]interface{}{"method": input.Method})
	return utils.SuccessResponse(c, row)
}

func (h *PersonalDataRequestHandler) SendVerification(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, 400, "Invalid request id")
	}
	if h.sender == nil {
		return utils.ErrorResponse(c, 503, "Email delivery is not configured")
	}
	token, row, err := h.requests.IssueEmailVerification(id)
	if err != nil {
		return utils.ErrorResponse(c, 400, err.Error())
	}
	body := "Your personal-data verification code is: " + token + " (expires in 30 minutes)."
	if err := h.sender.Send(c.UserContext(), accountauth.EmailMessage{To: row.SubjectEmail, Locale: "en", Subject: "Personal data request verification", Body: body}); err != nil {
		return utils.ErrorResponse(c, 502, "Unable to send verification email")
	}
	if os.Getenv("ENV") == "development" {
		return utils.SuccessResponse(c, fiber.Map{"message": "Verification email sent", "development_token": token})
	}
	return utils.MessageResponse(c, "Verification email sent")
}

func (h *PersonalDataRequestHandler) Select(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, 400, "Invalid request id")
	}
	var input struct {
		Items []models.PersonalDataRequestItem `json:"items"`
	}
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, 400, "Invalid request body")
	}
	for i := range input.Items {
		input.Items[i].Domain = strings.TrimSpace(input.Items[i].Domain)
		input.Items[i].RecordID = strings.TrimSpace(input.Items[i].RecordID)
	}
	if err := h.requests.SelectItems(id, input.Items); err != nil {
		return utils.ErrorResponse(c, 400, err.Error())
	}
	_ = h.audit.LogAction(c, "privacy_request_items_selected", "personal_data_request", id.String(), map[string]interface{}{"affected_count": len(input.Items)})
	return h.Get(c)
}

func (h *PersonalDataRequestHandler) Complete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, 400, "Invalid request id")
	}
	actor, err := currentAdminID(c)
	if err != nil {
		return utils.ErrorResponse(c, 401, "Admin identity is required")
	}
	count, err := h.actions.AnonymiseSelected(c.UserContext(), id, actor)
	if err != nil {
		if strings.Contains(err.Error(), "verified") {
			return utils.ErrorResponse(c, 409, err.Error())
		}
		return utils.ErrorResponse(c, 400, err.Error())
	}
	_ = h.audit.LogAction(c, "privacy_request_completed", "personal_data_request", id.String(), map[string]interface{}{"affected_count": count})
	return utils.SuccessResponse(c, fiber.Map{"affected_count": count})
}

func (h *PersonalDataRequestHandler) Export(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, 400, "Invalid request id")
	}
	data, err := h.exports.Export(id)
	if err != nil {
		return utils.ErrorResponse(c, 409, err.Error())
	}
	c.Set(fiber.HeaderContentType, "application/json")
	c.Set(fiber.HeaderContentDisposition, `attachment; filename="personal-data-export.json"`)
	return c.Send(data)
}

func (h *PersonalDataRequestHandler) Reject(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, 400, "Invalid request id")
	}
	if err := h.requests.Reject(id); err != nil {
		return utils.ErrorResponse(c, 400, err.Error())
	}
	_ = h.audit.LogAction(c, "privacy_request_rejected", "personal_data_request", id.String(), map[string]interface{}{})
	return utils.MessageResponse(c, "Privacy request rejected")
}
