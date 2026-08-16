package handlers

import (
	"errors"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/community"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type CommunityAdminHandler struct {
	moderation *services.CommunityModerationService
}

func NewCommunityAdminHandler(db *gorm.DB) *CommunityAdminHandler {
	return &CommunityAdminHandler{moderation: services.NewCommunityModerationService(db, config.CommunityConfig{})}
}

func (h *CommunityAdminHandler) ListQueue(c *fiber.Ctx) error {
	limit := 50
	if raw := strings.TrimSpace(c.Query("limit")); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 1 || parsed > 200 {
			return communityAdminError(c, community.NewDomainError(community.CodeValidation, "Limit must be between 1 and 200"))
		}
		limit = parsed
	}
	queue, err := h.moderation.ListQueue(c.UserContext(), limit)
	if err != nil {
		return communityAdminError(c, err)
	}
	return utils.SuccessResponse(c, queue)
}

func (h *CommunityAdminHandler) ListCategories(c *fiber.Ctx) error {
	categories, err := h.moderation.ListCategories(c.UserContext())
	if err != nil {
		return communityAdminError(c, err)
	}
	return utils.SuccessResponse(c, categories)
}

func (h *CommunityAdminHandler) SaveCategory(c *fiber.Ctx) error {
	var input community.CategoryInput
	var pathID *uuid.UUID
	if rawID := strings.TrimSpace(c.Params("id")); rawID != "" {
		id, err := uuid.Parse(rawID)
		if err != nil {
			return communityAdminError(c, community.NewDomainError(community.CodeValidation, "Category ID is invalid"))
		}
		pathID = &id
	}
	if err := c.BodyParser(&input); err != nil {
		return communityAdminError(c, community.NewDomainError(community.CodeValidation, "Category payload is invalid"))
	}
	if pathID != nil {
		input.ID = pathID
	}
	category, err := h.moderation.SaveCategory(c.UserContext(), mustLocalsUserID(c), input)
	if err != nil {
		return communityAdminError(c, err)
	}
	status := fiber.StatusOK
	if input.ID == nil {
		status = fiber.StatusCreated
	}
	return c.Status(status).JSON(fiber.Map{"success": true, "data": category})
}

func (h *CommunityAdminHandler) DeleteCategory(c *fiber.Ctx) error {
	id, err := uuid.Parse(strings.TrimSpace(c.Params("id")))
	if err != nil {
		return communityAdminError(c, community.NewDomainError(community.CodeValidation, "Category ID is invalid"))
	}
	var input community.ReportDecisionInput
	if err := c.BodyParser(&input); err != nil {
		return communityAdminError(c, community.NewDomainError(community.CodeValidation, "Category deletion reason is required"))
	}
	if err := h.moderation.DeleteCategory(c.UserContext(), mustLocalsUserID(c), id, input.Reason); err != nil {
		return communityAdminError(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *CommunityAdminHandler) ReorderCategories(c *fiber.Ctx) error {
	var input community.CategoryReorderInput
	if err := c.BodyParser(&input); err != nil {
		return communityAdminError(c, community.NewDomainError(community.CodeValidation, "Category reorder payload is invalid"))
	}
	if err := h.moderation.ReorderCategories(c.UserContext(), mustLocalsUserID(c), input); err != nil {
		return communityAdminError(c, err)
	}
	return c.JSON(fiber.Map{"success": true})
}

func (h *CommunityAdminHandler) DecideRevision(c *fiber.Ctx) error {
	id, err := uuid.Parse(strings.TrimSpace(c.Params("id")))
	if err != nil {
		return communityAdminError(c, community.NewDomainError(community.CodeValidation, "Revision ID is invalid"))
	}
	var input community.RevisionDecisionInput
	if err := c.BodyParser(&input); err != nil {
		return communityAdminError(c, community.NewDomainError(community.CodeValidation, "Revision decision payload is invalid"))
	}
	if err := h.moderation.DecideRevision(c.UserContext(), mustLocalsUserID(c), id, input, traceID(c)); err != nil {
		return communityAdminError(c, err)
	}
	return c.JSON(fiber.Map{"success": true, "approved": input.Approve})
}

func (h *CommunityAdminHandler) Moderate(c *fiber.Ctx) error {
	targetType := strings.ToLower(strings.TrimSpace(c.Params("target")))
	targetID, err := uuid.Parse(strings.TrimSpace(c.Params("id")))
	if err != nil {
		return communityAdminError(c, community.NewDomainError(community.CodeValidation, "Target ID is invalid"))
	}
	var input community.ModerationInput
	if err := c.BodyParser(&input); err != nil {
		return communityAdminError(c, community.NewDomainError(community.CodeValidation, "Moderation payload is invalid"))
	}
	if err := h.moderation.Moderate(c.UserContext(), mustLocalsUserID(c), targetType, targetID, input, traceID(c)); err != nil {
		return communityAdminError(c, err)
	}
	return c.JSON(fiber.Map{"success": true})
}

func (h *CommunityAdminHandler) OfficialAnswer(c *fiber.Ctx) error {
	return h.moderateFixedTarget(c, "answer", "official")
}

func (h *CommunityAdminHandler) MemberRestriction(c *fiber.Ctx) error {
	var input community.ModerationInput
	if err := c.BodyParser(&input); err != nil {
		return communityAdminError(c, community.NewDomainError(community.CodeValidation, "Member restriction payload is invalid"))
	}
	targetID, err := uuid.Parse(strings.TrimSpace(c.Params("id")))
	if err != nil {
		return communityAdminError(c, community.NewDomainError(community.CodeValidation, "Member ID is invalid"))
	}
	if err := h.moderation.Moderate(c.UserContext(), mustLocalsUserID(c), "member", targetID, input, traceID(c)); err != nil {
		return communityAdminError(c, err)
	}
	return c.JSON(fiber.Map{"success": true})
}

func (h *CommunityAdminHandler) moderateFixedTarget(c *fiber.Ctx, targetType, action string) error {
	targetID, err := uuid.Parse(strings.TrimSpace(c.Params("id")))
	if err != nil {
		return communityAdminError(c, community.NewDomainError(community.CodeValidation, "Target ID is invalid"))
	}
	var input community.ModerationInput
	if err := c.BodyParser(&input); err != nil {
		return communityAdminError(c, community.NewDomainError(community.CodeValidation, "Moderation payload is invalid"))
	}
	input.Action = action
	if err := h.moderation.Moderate(c.UserContext(), mustLocalsUserID(c), targetType, targetID, input, traceID(c)); err != nil {
		return communityAdminError(c, err)
	}
	return c.JSON(fiber.Map{"success": true})
}

func (h *CommunityAdminHandler) ResolveReport(c *fiber.Ctx) error {
	return h.decideReport(c, models.CommunityReportResolved)
}

func (h *CommunityAdminHandler) DismissReport(c *fiber.Ctx) error {
	return h.decideReport(c, models.CommunityReportDismissed)
}

func (h *CommunityAdminHandler) decideReport(c *fiber.Ctx, state models.CommunityReportState) error {
	reportID, err := uuid.Parse(strings.TrimSpace(c.Params("id")))
	if err != nil {
		return communityAdminError(c, community.NewDomainError(community.CodeValidation, "Report ID is invalid"))
	}
	var input community.ReportDecisionInput
	if err := c.BodyParser(&input); err != nil {
		return communityAdminError(c, community.NewDomainError(community.CodeValidation, "Report decision payload is invalid"))
	}
	if err := h.moderation.ResolveReport(c.UserContext(), mustLocalsUserID(c), reportID, state, input.Reason, traceID(c)); err != nil {
		return communityAdminError(c, err)
	}
	return c.JSON(fiber.Map{"success": true, "state": state})
}

func communityAdminError(c *fiber.Ctx, err error) error {
	var domainErr *community.DomainError
	if !errors.As(err, &domainErr) {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Community moderation request failed")
	}
	status := fiber.StatusBadRequest
	switch domainErr.Code {
	case community.CodeForbidden, community.CodeAccountNotEligible:
		status = fiber.StatusForbidden
	case community.CodeContentNotFound:
		status = fiber.StatusNotFound
	case community.CodeContentPending:
		status = fiber.StatusUnprocessableEntity
	case community.CodeConflict, community.CodeAlreadyReported, community.CodeEditConflict:
		status = fiber.StatusConflict
	case community.CodeRateLimited:
		status = fiber.StatusTooManyRequests
		if domainErr.RetryAfter > 0 {
			c.Set(fiber.HeaderRetryAfter, strconv.FormatInt(int64(domainErr.RetryAfter.Seconds()), 10))
		}
	}
	if domainErr.Field != "" {
		return utils.CodedFieldErrorResponse(c, status, string(domainErr.Code), domainErr.Message, domainErr.Fields)
	}
	return utils.CodedErrorResponse(c, status, string(domainErr.Code), domainErr.Message)
}
