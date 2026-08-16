package handlers

import (
	"errors"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/community"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type CommunityAccountHandler struct {
	questions *services.CommunityQuestionService
}

func NewCommunityAccountHandler(db *gorm.DB, cfg config.CommunityConfig) *CommunityAccountHandler {
	return &CommunityAccountHandler{questions: services.NewCommunityQuestionService(db, cfg, nil)}
}

func (h *CommunityAccountHandler) CreateQuestion(c *fiber.Ctx) error {
	actor := mustLocalsUserID(c)
	var input community.CreateQuestionInput
	if err := c.BodyParser(&input); err != nil {
		return communityAccountError(c, community.NewDomainError(community.CodeValidation, "Question payload is invalid"))
	}
	requestID, err := idempotencyKey(c)
	if err != nil {
		return communityAccountError(c, err)
	}
	if input.ClientRequestID != uuid.Nil && input.ClientRequestID != requestID {
		return communityAccountError(c, community.NewDomainError(community.CodeValidation, "Idempotency-Key does not match client_request_id").WithField("client_request_id"))
	}
	input.ClientRequestID = requestID
	result, err := h.questions.CreateQuestion(c.UserContext(), actor, c.IP(), input)
	if err != nil {
		return communityAccountError(c, err)
	}
	status := fiber.StatusCreated
	if result.ReviewRequired {
		status = fiber.StatusAccepted
	}
	return c.Status(status).JSON(fiber.Map{"success": true, "data": result})
}

func (h *CommunityAccountHandler) UpdateQuestion(c *fiber.Ctx) error {
	questionID, err := parseCommunityID(c.Params("id"))
	if err != nil {
		return communityAccountError(c, err)
	}
	var input community.UpdateQuestionInput
	if err := c.BodyParser(&input); err != nil {
		return communityAccountError(c, community.NewDomainError(community.CodeValidation, "Question payload is invalid"))
	}
	result, err := h.questions.UpdateQuestion(c.UserContext(), mustLocalsUserID(c), questionID, input)
	if err != nil {
		return communityAccountError(c, err)
	}
	status := fiber.StatusOK
	if result.ReviewRequired {
		status = fiber.StatusAccepted
	}
	return c.Status(status).JSON(fiber.Map{"success": true, "data": result})
}

func (h *CommunityAccountHandler) DeleteQuestion(c *fiber.Ctx) error {
	questionID, err := parseCommunityID(c.Params("id"))
	if err != nil {
		return communityAccountError(c, err)
	}
	version, err := strconv.Atoi(strings.TrimSpace(c.Query("version")))
	if err != nil || version <= 0 {
		return communityAccountError(c, community.NewDomainError(community.CodeValidation, "A valid version is required").WithField("version"))
	}
	if err := h.questions.RequestQuestionDeletion(c.UserContext(), mustLocalsUserID(c), questionID, version); err != nil {
		return communityAccountError(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *CommunityAccountHandler) ListMyActivity(c *fiber.Ctx) error {
	activity, err := h.questions.ListMyActivity(c.UserContext(), mustLocalsUserID(c))
	if err != nil {
		return communityAccountError(c, err)
	}
	return utils.SuccessResponse(c, activity)
}

func (h *CommunityAccountHandler) GetViewerState(c *fiber.Ctx) error {
	questionID, err := parseCommunityID(c.Params("id"))
	if err != nil {
		return communityAccountError(c, err)
	}
	state, err := h.questions.ViewerState(c.UserContext(), mustLocalsUserID(c), questionID)
	if err != nil {
		return communityAccountError(c, err)
	}
	return utils.SuccessResponse(c, state)
}

func idempotencyKey(c *fiber.Ctx) (uuid.UUID, error) {
	raw := strings.TrimSpace(c.Get("Idempotency-Key"))
	if raw == "" {
		return uuid.Nil, community.NewDomainError(community.CodeValidation, "Idempotency-Key is required").WithField("idempotency_key")
	}
	id, err := uuid.Parse(raw)
	if err != nil {
		return uuid.Nil, community.NewDomainError(community.CodeValidation, "Idempotency-Key must be a UUID").WithField("idempotency_key")
	}
	return id, nil
}

func parseCommunityID(raw string) (uuid.UUID, error) {
	id, err := uuid.Parse(strings.TrimSpace(raw))
	if err != nil {
		return uuid.Nil, community.NewDomainError(community.CodeValidation, "Question ID is invalid")
	}
	return id, nil
}

func communityAccountError(c *fiber.Ctx, err error) error {
	var domainErr *community.DomainError
	if !errors.As(err, &domainErr) {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Community request failed")
	}
	status := fiber.StatusBadRequest
	switch domainErr.Code {
	case community.CodeAccountNotEligible, community.CodeForbidden, community.CodeQuestionLocked:
		status = fiber.StatusForbidden
	case community.CodeContentNotFound:
		status = fiber.StatusNotFound
	case community.CodeEditConflict, community.CodeIdempotencyConflict, community.CodeConflict:
		status = fiber.StatusConflict
	case community.CodeRateLimited:
		status = fiber.StatusTooManyRequests
		if domainErr.RetryAfter > 0 {
			c.Set(fiber.HeaderRetryAfter, strconv.FormatInt(int64(domainErr.RetryAfter.Seconds()), 10))
		}
	}
	if domainErr.CurrentVersion > 0 {
		return utils.CodedErrorResponseWithDetails(c, status, string(domainErr.Code), domainErr.Message, map[string]interface{}{"current_version": domainErr.CurrentVersion})
	}
	if domainErr.Field != "" {
		return utils.CodedFieldErrorResponse(c, status, string(domainErr.Code), domainErr.Message, domainErr.Fields)
	}
	return utils.CodedErrorResponse(c, status, string(domainErr.Code), domainErr.Message)
}
