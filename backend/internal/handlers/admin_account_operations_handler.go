package handlers

import (
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type AdminAccountOperationsHandler struct {
	service      *services.AdminAccountOperationsService
	auditService *services.AuditService
}

func NewAdminAccountOperationsHandler(db *gorm.DB) *AdminAccountOperationsHandler {
	return &AdminAccountOperationsHandler{
		service:      services.NewAdminAccountOperationsService(db),
		auditService: services.NewAuditService(db),
	}
}

type adminAccountMutationRequest struct {
	Reason string `json:"reason"`
}

var adminAccountStatuses = map[string]struct{}{
	"pending_verification": {},
	"active":               {},
	"disabled":             {},
	"closed":               {},
}

var adminAccountProviders = map[string]struct{}{
	"password": {},
	"google":   {},
}

func (h *AdminAccountOperationsHandler) List(c *fiber.Ctx) error {
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "created_at",
		DefaultOrder: "desc",
		AllowedSort: map[string]string{
			"created_at":    "users.created_at",
			"last_login_at": "users.last_login_at",
			"email":         "users.email",
			"display_name":  "account_profiles.display_name",
			"purge_after":   "users.purge_after",
		},
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	statuses := listquery.ExtractMulti(c, "status")
	if err := listquery.AllowedValues(statuses, adminAccountStatuses); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	providers := listquery.ExtractMulti(c, "provider")
	if err := listquery.AllowedValues(providers, adminAccountProviders); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	items, total, err := h.service.List(services.AdminAccountListOptions{
		Common:    common,
		Statuses:  statuses,
		Providers: providers,
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch public accounts")
	}
	return utils.PaginatedResponse(c, items, common.Page, common.Limit, int(total))
}

func (h *AdminAccountOperationsHandler) Get(c *fiber.Ctx) error {
	id, err := parseAdminAccountID(c)
	if err != nil {
		return err
	}
	item, err := h.service.Get(id)
	if err != nil {
		return h.serviceError(c, err)
	}
	return utils.SuccessResponse(c, item)
}

func (h *AdminAccountOperationsHandler) ListSecurityEvents(c *fiber.Ctx) error {
	id, err := parseAdminAccountID(c)
	if err != nil {
		return err
	}
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "created_at",
		DefaultOrder: "desc",
		AllowedSort: map[string]string{
			"created_at": "auth_security_events.created_at",
			"event_type": "auth_security_events.event_type",
		},
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	items, total, err := h.service.ListSecurityEvents(id, common)
	if err != nil {
		return h.serviceError(c, err)
	}
	return utils.PaginatedResponse(c, items, common.Page, common.Limit, int(total))
}

func (h *AdminAccountOperationsHandler) Disable(c *fiber.Ctx) error {
	id, req, err := h.parseMutation(c)
	if err != nil {
		return err
	}
	item, err := h.service.Disable(id, req.Reason)
	if err != nil {
		return h.serviceError(c, err)
	}
	if err := h.auditService.LogAction(c, "account_operations.disable", "public_account", id.String(), map[string]interface{}{
		"reason":      req.Reason,
		"from_status": "active",
		"to_status":   "disabled",
	}); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Account action completed but audit logging failed")
	}
	return utils.SuccessResponse(c, item)
}

func (h *AdminAccountOperationsHandler) Enable(c *fiber.Ctx) error {
	id, req, err := h.parseMutation(c)
	if err != nil {
		return err
	}
	item, err := h.service.Enable(id, req.Reason)
	if err != nil {
		return h.serviceError(c, err)
	}
	if err := h.auditService.LogAction(c, "account_operations.enable", "public_account", id.String(), map[string]interface{}{
		"reason":      req.Reason,
		"from_status": "disabled",
		"to_status":   "active",
	}); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Account action completed but audit logging failed")
	}
	return utils.SuccessResponse(c, item)
}

func (h *AdminAccountOperationsHandler) LogoutAll(c *fiber.Ctx) error {
	id, req, err := h.parseMutation(c)
	if err != nil {
		return err
	}
	item, err := h.service.LogoutAll(id, req.Reason)
	if err != nil {
		return h.serviceError(c, err)
	}
	if err := h.auditService.LogAction(c, "account_operations.logout_all", "public_account", id.String(), map[string]interface{}{
		"reason": req.Reason,
	}); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Account action completed but audit logging failed")
	}
	return utils.SuccessResponse(c, item)
}

func (h *AdminAccountOperationsHandler) parseMutation(c *fiber.Ctx) (uuid.UUID, adminAccountMutationRequest, error) {
	id, err := parseAdminAccountID(c)
	if err != nil {
		return uuid.Nil, adminAccountMutationRequest{}, err
	}
	var req adminAccountMutationRequest
	if err := c.BodyParser(&req); err != nil {
		return uuid.Nil, adminAccountMutationRequest{}, utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	req.Reason = strings.TrimSpace(req.Reason)
	if !services.ValidateAccountOperationReason(req.Reason) {
		return uuid.Nil, adminAccountMutationRequest{}, utils.CodedErrorResponse(c, fiber.StatusBadRequest, "ADMIN_ACCOUNT_INVALID_REASON", "A valid operation reason is required")
	}
	return id, req, nil
}

func parseAdminAccountID(c *fiber.Ctx) (uuid.UUID, error) {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return uuid.Nil, utils.CodedErrorResponse(c, fiber.StatusBadRequest, "ADMIN_ACCOUNT_INVALID_ID", "Invalid account ID")
	}
	return id, nil
}

func (h *AdminAccountOperationsHandler) serviceError(c *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, services.ErrAdminAccountNotFound):
		return utils.CodedErrorResponse(c, fiber.StatusNotFound, "ADMIN_ACCOUNT_NOT_FOUND", "Public account not found")
	case errors.Is(err, services.ErrAdminAccountInvalidReason):
		return utils.CodedErrorResponse(c, fiber.StatusBadRequest, "ADMIN_ACCOUNT_INVALID_REASON", "A valid operation reason is required")
	case errors.Is(err, services.ErrAdminAccountConflict):
		return utils.CodedErrorResponse(c, fiber.StatusConflict, "ADMIN_ACCOUNT_OPERATION_CONFLICT", "This operation is not allowed for the account's current status")
	default:
		return utils.CodedErrorResponse(c, fiber.StatusInternalServerError, "ADMIN_ACCOUNT_OPERATION_FAILED", "Unable to complete account operation")
	}
}
