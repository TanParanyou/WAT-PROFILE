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
	questions     *services.CommunityQuestionService
	interactions  *services.CommunityInteractionService
	moderation    *services.CommunityModerationService
	notifications *services.CommunityNotificationService
}

func NewCommunityAccountHandler(db *gorm.DB, cfg config.CommunityConfig) *CommunityAccountHandler {
	notifications := services.NewCommunityNotificationService(db, cfg, services.NewOperationOutboxService(db))
	return &CommunityAccountHandler{
		questions:     services.NewCommunityQuestionService(db, cfg, notifications),
		interactions:  services.NewCommunityInteractionService(db, cfg, notifications),
		moderation:    services.NewCommunityModerationService(db, cfg, notifications),
		notifications: notifications,
	}
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

func (h *CommunityAccountHandler) GetOwnedQuestion(c *fiber.Ctx) error {
	questionID, err := parseCommunityID(c.Params("id"))
	if err != nil {
		return communityAccountError(c, err)
	}
	result, err := h.questions.GetOwnedQuestion(c.UserContext(), mustLocalsUserID(c), questionID)
	if err != nil {
		return communityAccountError(c, err)
	}
	return utils.SuccessResponse(c, result)
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

func (h *CommunityAccountHandler) CreateAnswer(c *fiber.Ctx) error {
	questionID, err := parseCommunityID(c.Params("id"))
	if err != nil {
		return communityAccountError(c, err)
	}
	var input community.CreateAnswerInput
	if err := c.BodyParser(&input); err != nil {
		return communityAccountError(c, community.NewDomainError(community.CodeValidation, "Answer payload is invalid"))
	}
	requestID, err := idempotencyKey(c)
	if err != nil {
		return communityAccountError(c, err)
	}
	if input.ClientRequestID != uuid.Nil && input.ClientRequestID != requestID {
		return communityAccountError(c, community.NewDomainError(community.CodeValidation, "Idempotency-Key does not match client_request_id").WithField("client_request_id"))
	}
	input.ClientRequestID = requestID
	result, err := h.interactions.CreateAnswer(c.UserContext(), mustLocalsUserID(c), c.IP(), questionID, input)
	if err != nil {
		return communityAccountError(c, err)
	}
	status := fiber.StatusCreated
	if result.ReviewRequired {
		status = fiber.StatusAccepted
	}
	return c.Status(status).JSON(fiber.Map{"success": true, "data": result})
}

func (h *CommunityAccountHandler) UpdateAnswer(c *fiber.Ctx) error {
	answerID, err := parseCommunityID(c.Params("id"))
	if err != nil {
		return communityAccountError(c, err)
	}
	var input community.UpdateAnswerInput
	if err := c.BodyParser(&input); err != nil {
		return communityAccountError(c, community.NewDomainError(community.CodeValidation, "Answer payload is invalid"))
	}
	result, err := h.interactions.UpdateAnswer(c.UserContext(), mustLocalsUserID(c), answerID, input)
	if err != nil {
		return communityAccountError(c, err)
	}
	status := fiber.StatusOK
	if result.ReviewRequired {
		status = fiber.StatusAccepted
	}
	return c.Status(status).JSON(fiber.Map{"success": true, "data": result})
}

func (h *CommunityAccountHandler) CreateComment(c *fiber.Ctx) error {
	questionID, err := parseCommunityID(c.Params("id"))
	if err != nil {
		return communityAccountError(c, err)
	}
	var input community.CreateCommentInput
	if err := c.BodyParser(&input); err != nil {
		return communityAccountError(c, community.NewDomainError(community.CodeValidation, "Comment payload is invalid"))
	}
	requestID, err := idempotencyKey(c)
	if err != nil {
		return communityAccountError(c, err)
	}
	if input.ClientRequestID != uuid.Nil && input.ClientRequestID != requestID {
		return communityAccountError(c, community.NewDomainError(community.CodeValidation, "Idempotency-Key does not match client_request_id").WithField("client_request_id"))
	}
	input.ClientRequestID = requestID
	result, err := h.interactions.CreateComment(c.UserContext(), mustLocalsUserID(c), c.IP(), questionID, input)
	if err != nil {
		return communityAccountError(c, err)
	}
	status := fiber.StatusCreated
	if result.ReviewRequired {
		status = fiber.StatusAccepted
	}
	return c.Status(status).JSON(fiber.Map{"success": true, "data": result})
}

func (h *CommunityAccountHandler) UpdateComment(c *fiber.Ctx) error {
	commentID, err := parseCommunityID(c.Params("id"))
	if err != nil {
		return communityAccountError(c, err)
	}
	var input community.UpdateCommentInput
	if err := c.BodyParser(&input); err != nil {
		return communityAccountError(c, community.NewDomainError(community.CodeValidation, "Comment payload is invalid"))
	}
	result, err := h.interactions.UpdateComment(c.UserContext(), mustLocalsUserID(c), commentID, input)
	if err != nil {
		return communityAccountError(c, err)
	}
	return c.JSON(fiber.Map{"success": true, "data": result})
}

func (h *CommunityAccountHandler) AcceptAnswer(c *fiber.Ctx) error {
	answerID, err := parseCommunityID(c.Params("id"))
	if err != nil {
		return communityAccountError(c, err)
	}
	var input community.AcceptAnswerInput
	if err := c.BodyParser(&input); err != nil {
		return communityAccountError(c, community.NewDomainError(community.CodeValidation, "Acceptance payload is invalid"))
	}
	result, err := h.interactions.AcceptAnswer(c.UserContext(), mustLocalsUserID(c), answerID, input)
	if err != nil {
		return communityAccountError(c, err)
	}
	return utils.SuccessResponse(c, result)
}

func (h *CommunityAccountHandler) ToggleHelpful(c *fiber.Ctx) error {
	answerID, err := parseCommunityID(c.Params("id"))
	if err != nil {
		return communityAccountError(c, err)
	}
	result, err := h.interactions.ToggleHelpful(c.UserContext(), mustLocalsUserID(c), answerID, c.IP())
	if err != nil {
		return communityAccountError(c, err)
	}
	return utils.SuccessResponse(c, result)
}

func (h *CommunityAccountHandler) SetHelpful(c *fiber.Ctx) error {
	answerID, err := parseCommunityID(c.Params("id"))
	if err != nil {
		return communityAccountError(c, err)
	}
	result, err := h.interactions.SetHelpful(c.UserContext(), mustLocalsUserID(c), answerID, c.IP(), c.Method() == fiber.MethodPut)
	if err != nil {
		return communityAccountError(c, err)
	}
	return utils.SuccessResponse(c, result)
}

func (h *CommunityAccountHandler) CreateReport(c *fiber.Ctx) error {
	var input community.CreateReportInput
	if err := c.BodyParser(&input); err != nil {
		return communityAccountError(c, community.NewDomainError(community.CodeValidation, "Report payload is invalid"))
	}
	report, err := h.moderation.CreateReport(c.UserContext(), mustLocalsUserID(c), c.IP(), input)
	if err != nil {
		return communityAccountError(c, err)
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": report})
}

func (h *CommunityAccountHandler) ListNotifications(c *fiber.Ctx) error {
	limit := 20
	if raw := strings.TrimSpace(c.Query("limit")); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 1 || parsed > 50 {
			return communityAccountError(c, community.NewDomainError(community.CodeValidation, "Limit must be between 1 and 50").WithField("limit"))
		}
		limit = parsed
	}
	unreadOnly := strings.EqualFold(strings.TrimSpace(c.Query("unread_only")), "true")
	result, err := h.notifications.List(c.UserContext(), mustLocalsUserID(c), community.NotificationListInput{UnreadOnly: unreadOnly, Limit: limit, Cursor: strings.TrimSpace(c.Query("cursor"))})
	if err != nil {
		return communityAccountError(c, err)
	}
	return utils.SuccessResponse(c, result)
}

func (h *CommunityAccountHandler) MarkNotificationRead(c *fiber.Ctx) error {
	id, err := parseCommunityID(c.Params("id"))
	if err != nil {
		return communityAccountError(c, err)
	}
	if err := h.notifications.MarkRead(c.UserContext(), mustLocalsUserID(c), id); err != nil {
		return communityAccountError(c, err)
	}
	return c.JSON(fiber.Map{"success": true})
}

func (h *CommunityAccountHandler) MarkAllNotificationsRead(c *fiber.Ctx) error {
	if err := h.notifications.MarkAllRead(c.UserContext(), mustLocalsUserID(c)); err != nil {
		return communityAccountError(c, err)
	}
	return c.JSON(fiber.Map{"success": true})
}

func (h *CommunityAccountHandler) UpdateNotificationPreferences(c *fiber.Ctx) error {
	var input community.NotificationPreferencesInput
	if err := c.BodyParser(&input); err != nil {
		return communityAccountError(c, community.NewDomainError(community.CodeValidation, "Notification preferences payload is invalid"))
	}
	if err := h.notifications.UpdatePreferences(c.UserContext(), mustLocalsUserID(c), input); err != nil {
		return communityAccountError(c, err)
	}
	return c.JSON(fiber.Map{"success": true})
}

func (h *CommunityAccountHandler) GetNotificationPreferences(c *fiber.Ctx) error {
	preferences, err := h.notifications.GetPreferences(c.UserContext(), mustLocalsUserID(c))
	if err != nil {
		return communityAccountError(c, err)
	}
	return utils.SuccessResponse(c, preferences)
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
	case community.CodeContentPending:
		status = fiber.StatusUnprocessableEntity
	case community.CodeEditConflict, community.CodeIdempotencyConflict, community.CodeConflict:
		status = fiber.StatusConflict
	case community.CodeAlreadyReported:
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
