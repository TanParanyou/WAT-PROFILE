package handlers

import (
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/calendar"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type CalendarHandler struct {
	source calendar.Source
}

func NewCalendarHandler(db *gorm.DB) *CalendarHandler {
	return &CalendarHandler{source: calendar.NewEventSource(db)}
}

func (h *CalendarHandler) GetPublic(c *fiber.Ctx) error {
	return h.getFeed(c, false)
}

func (h *CalendarHandler) GetAdmin(c *fiber.Ctx) error {
	return h.getFeed(c, true)
}

func (h *CalendarHandler) getFeed(c *fiber.Ctx, canEdit bool) error {
	request, err := parseCalendarRequest(c)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	entries, err := h.source.List(c.Context(), request, canEdit)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch calendar")
	}
	return utils.SuccessResponse(c, calendar.Feed{
		Scope:    map[bool]string{true: "admin", false: "public"}[canEdit],
		Locale:   request.Locale,
		Timezone: "Europe/Berlin",
		Range: calendar.Range{
			StartDate: request.From.Format("2006-01-02"),
			EndDate:   request.To.Format("2006-01-02"),
		},
		Entries:   entries,
		Resources: []calendar.Resource{{ID: "default", Title: "Calendar"}},
	})
}

func parseCalendarRequest(c *fiber.Ctx) (calendar.Request, error) {
	rawFrom := strings.TrimSpace(c.Query("from"))
	rawTo := strings.TrimSpace(c.Query("to"))
	if rawFrom == "" || rawTo == "" {
		return calendar.Request{}, fmt.Errorf("from and to are required")
	}
	from, err := time.Parse("2006-01-02", rawFrom)
	if err != nil {
		return calendar.Request{}, fmt.Errorf("from must use yyyy-mm-dd")
	}
	to, err := time.Parse("2006-01-02", rawTo)
	if err != nil {
		return calendar.Request{}, fmt.Errorf("to must use yyyy-mm-dd")
	}
	if from.After(to) {
		return calendar.Request{}, fmt.Errorf("from must not be after to")
	}
	locale := calendar.Locale(strings.TrimSpace(c.Query("locale")))
	if !locale.Valid() {
		return calendar.Request{}, fmt.Errorf("locale must be one of th, en, de")
	}
	return calendar.Request{From: from, To: to, Locale: locale}, nil
}
