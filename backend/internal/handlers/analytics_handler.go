package handlers

import (
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type AnalyticsHandler struct {
	service *services.AnalyticsService
}

func NewAnalyticsHandler(db *gorm.DB) *AnalyticsHandler {
	return &AnalyticsHandler{
		service: services.NewAnalyticsService(db),
	}
}

// TrackPageView - Public: บันทึกการเข้าชมหน้าเว็บ
func (h *AnalyticsHandler) TrackPageView(c *fiber.Ctx) error {
	var req models.TrackPageViewRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request payload")
	}

	clientIP := c.IP()
	if xff := c.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		if len(parts) > 0 && strings.TrimSpace(parts[0]) != "" {
			clientIP = strings.TrimSpace(parts[0])
		}
	} else if xri := c.Get("X-Real-IP"); xri != "" {
		clientIP = strings.TrimSpace(xri)
	}

	userAgent := c.Get("User-Agent")

	// Run tracking in background goroutine to avoid blocking client
	go func(payload models.TrackPageViewRequest, ip, ua string) {
		if err := h.service.TrackView(payload, ip, ua); err != nil {
			log.Warn().Err(err).Msg("failed to log analytics page view")
		}
	}(req, clientIP, userAgent)

	return utils.SuccessResponse(c, fiber.Map{"tracked": true})
}

func parseDateRange(c *fiber.Ctx) (time.Time, time.Time) {
	now := time.Now().UTC()
	endDate := now

	if toParam := c.Query("to"); toParam != "" {
		if t, err := time.Parse("2006-01-02", toParam); err == nil {
			// Set to end of day
			endDate = time.Date(t.Year(), t.Month(), t.Day(), 23, 59, 59, 999999999, time.UTC)
		}
	}

	// Default to 30 days ago
	startDate := endDate.AddDate(0, 0, -29).Truncate(24 * time.Hour)
	if fromParam := c.Query("from"); fromParam != "" {
		if t, err := time.Parse("2006-01-02", fromParam); err == nil {
			startDate = t.Truncate(24 * time.Hour)
		}
	}

	return startDate, endDate
}

// GetOverview - Admin: สรุปภาพรวมสถิติผู้เข้าชม
func (h *AnalyticsHandler) GetOverview(c *fiber.Ctx) error {
	startDate, endDate := parseDateRange(c)

	overview, err := h.service.GetOverview(startDate, endDate)
	if err != nil {
		log.Error().Err(err).Msg("failed to get analytics overview")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch analytics overview")
	}

	return utils.SuccessResponse(c, overview)
}

// GetTrends - Admin: ดึงข้อมูล Time-series สำหรับวาดกราฟ
func (h *AnalyticsHandler) GetTrends(c *fiber.Ctx) error {
	startDate, endDate := parseDateRange(c)
	resourceType := c.Query("resource_type")

	trends, err := h.service.GetTrends(resourceType, startDate, endDate)
	if err != nil {
		log.Error().Err(err).Msg("failed to get analytics trends")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch analytics trends")
	}

	return utils.SuccessResponse(c, trends)
}

// GetTopResources - Admin: อันดับหน้าหรือเอนทิตียอดนิยม
func (h *AnalyticsHandler) GetTopResources(c *fiber.Ctx) error {
	startDate, endDate := parseDateRange(c)
	resourceType := c.Query("resource_type")
	limit, _ := strconv.Atoi(c.Query("limit", "10"))

	topItems, err := h.service.GetTopResources(resourceType, limit, startDate, endDate)
	if err != nil {
		log.Error().Err(err).Msg("failed to get top analytics resources")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch top resources")
	}

	return utils.SuccessResponse(c, topItems)
}

// GetResourceStats - Admin: สถิติเจาะลึกเฉพาะ Entity (เช่น Event, Monk, etc.)
func (h *AnalyticsHandler) GetResourceStats(c *fiber.Ctx) error {
	startDate, endDate := parseDateRange(c)
	resourceType := c.Params("type")
	resourceID := c.Params("id")

	if resourceType == "" || resourceID == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "resource type and id are required")
	}

	stats, err := h.service.GetResourceStats(resourceType, resourceID, startDate, endDate)
	if err != nil {
		log.Error().Err(err).Msg("failed to get resource analytics stats")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch resource stats")
	}

	return utils.SuccessResponse(c, stats)
}
