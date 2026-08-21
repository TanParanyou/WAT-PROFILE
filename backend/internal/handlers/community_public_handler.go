package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
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

type CommunityPublicHandler struct {
	query       *services.CommunityQueryService
	rateLimiter *services.CommunityRateLimitService
	settings    *services.SettingsService
	cfg         config.CommunityConfig
}

func NewCommunityPublicHandler(db *gorm.DB, cfg config.CommunityConfig, settings *services.SettingsService) *CommunityPublicHandler {
	return &CommunityPublicHandler{
		query: services.NewCommunityQueryService(db), rateLimiter: services.NewCommunityRateLimitService(db), settings: settings, cfg: cfg,
	}
}

func (h *CommunityPublicHandler) GetCategories(c *fiber.Ctx) error {
	if err := h.ensureRead(c); err != nil {
		return err
	}
	categories, err := h.query.ListCategories(c.UserContext())
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to load Community categories")
	}
	return h.cacheableSuccess(c, categories)
}

func (h *CommunityPublicHandler) ListQuestions(c *fiber.Ctx) error {
	if err := h.ensureRead(c); err != nil {
		return err
	}
	input, err := parseCommunityQuestionList(c)
	if err != nil {
		return utils.CodedErrorResponse(c, fiber.StatusBadRequest, string(community.CodeValidation), err.Error())
	}
	if strings.TrimSpace(input.Search) != "" {
		if err := h.rateLimiter.Consume(c.UserContext(), services.RateLimitRequest{
			SubjectType: "ip", Subject: c.IP(), Surface: "search",
			Limit: h.cfg.SearchLimit.Limit, Window: h.cfg.SearchLimit.Window,
		}); err != nil {
			return communityHandlerError(c, err)
		}
	}
	questions, err := h.query.ListQuestions(c.UserContext(), input)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to load Community questions")
	}
	return h.cacheableSuccess(c, questions)
}

func (h *CommunityPublicHandler) GetQuestion(c *fiber.Ctx) error {
	if err := h.ensureRead(c); err != nil {
		return err
	}
	id, err := uuid.Parse(strings.TrimSpace(c.Params("id")))
	if err != nil {
		return utils.CodedErrorResponse(c, fiber.StatusBadRequest, string(community.CodeValidation), "Question ID is invalid")
	}
	detail, err := h.query.GetQuestion(c.UserContext(), id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.CodedErrorResponse(c, fiber.StatusNotFound, string(community.CodeContentNotFound), "Question not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to load Community question")
	}
	return h.cacheableSuccess(c, detail)
}

func (h *CommunityPublicHandler) ensureRead(c *fiber.Ctx) error {
	if h.cfg.ReadEnabled || (h.settings != nil && h.settings.IsFeatureEnabled("feature_public_community_read")) {
		return nil
	}
	return utils.CodedErrorResponse(c, fiber.StatusNotFound, "COMMUNITY_DISABLED", "Community is not available")
}

func (h *CommunityPublicHandler) cacheableSuccess(c *fiber.Ctx, value any) error {
	payload, err := json.Marshal(value)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to encode Community response")
	}
	digest := sha256.Sum256(payload)
	etag := `"` + hex.EncodeToString(digest[:]) + `"`
	c.Set(fiber.HeaderETag, etag)
	c.Set(fiber.HeaderCacheControl, "public, max-age=60, stale-while-revalidate=300")
	if strings.TrimSpace(c.Get(fiber.HeaderIfNoneMatch)) == etag {
		return c.SendStatus(fiber.StatusNotModified)
	}
	return utils.SuccessResponse(c, value)
}

func parseCommunityQuestionList(c *fiber.Ctx) (community.QuestionListInput, error) {
	input := community.QuestionListInput{
		Locale:    strings.ToLower(strings.TrimSpace(c.Query("locale"))),
		Lifecycle: strings.ToLower(strings.TrimSpace(c.Query("lifecycle"))),
		Search:    strings.TrimSpace(c.Query("search")),
		Cursor:    strings.TrimSpace(c.Query("cursor")),
		Limit:     20,
	}
	if input.Locale != "" && input.Locale != "all" && input.Locale != "th" && input.Locale != "en" && input.Locale != "de" {
		return community.QuestionListInput{}, fmt.Errorf("locale must be th, en, de, or all")
	}
	if input.Lifecycle != "" {
		switch input.Lifecycle {
		case "open", "answered", "resolved", "locked", "archived":
		default:
			return community.QuestionListInput{}, fmt.Errorf("lifecycle is invalid")
		}
	}
	if raw := c.Query("limit"); raw != "" {
		limit, err := strconv.Atoi(raw)
		if err != nil || limit < 1 || limit > 50 {
			return community.QuestionListInput{}, fmt.Errorf("limit must be between 1 and 50")
		}
		input.Limit = limit
	}
	if raw := strings.TrimSpace(c.Query("category_id")); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			return community.QuestionListInput{}, fmt.Errorf("category_id is invalid")
		}
		input.CategoryID = &id
	}
	if len([]rune(input.Search)) > 200 {
		return community.QuestionListInput{}, fmt.Errorf("search is too long")
	}
	return input, nil
}

func communityHandlerError(c *fiber.Ctx, err error) error {
	var domainErr *community.DomainError
	if errors.As(err, &domainErr) {
		if domainErr.RetryAfter > 0 {
			c.Set(fiber.HeaderRetryAfter, strconv.FormatInt(int64(domainErr.RetryAfter.Seconds()), 10))
		}
		return utils.CodedErrorResponse(c, fiber.StatusTooManyRequests, string(domainErr.Code), domainErr.Message)
	}
	return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Community request failed")
}
