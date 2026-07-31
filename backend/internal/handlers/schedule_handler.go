package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type ScheduleHandler struct {
	scheduleService *services.ScheduleService
}

func NewScheduleHandler(db *gorm.DB) *ScheduleHandler {
	return &ScheduleHandler{
		scheduleService: services.NewScheduleService(db),
	}
}

// GetSchedules - Public: List active schedules
func (h *ScheduleHandler) GetSchedules(c *fiber.Ctx) error {
	schedules, err := h.scheduleService.ListActive(c.Query("type"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch schedules")
	}
	return utils.SuccessResponse(c, schedules)
}

// GetAdminSchedules - Admin: List schedules with pagination and filters
func (h *ScheduleHandler) GetAdminSchedules(c *fiber.Ctx) error {
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "display_order",
		DefaultOrder: "asc",
		AllowedSort: map[string]string{
			"display_order": "display_order",
			"activity":      "activity",
			"day_of_week":   "day_of_week",
			"schedule_type": "schedule_type",
		},
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	statuses := listquery.ExtractMulti(c, "status")
	scheduleTypes := listquery.ExtractMulti(c, "type")
	weekdayStrs := listquery.ExtractMulti(c, "weekday")
	var weekdays []int
	for _, wStr := range weekdayStrs {
		if w, parseErr := strconv.Atoi(wStr); parseErr == nil {
			weekdays = append(weekdays, w)
		}
	}

	options := services.ScheduleListOptions{
		Common:        common,
		Statuses:      statuses,
		ScheduleTypes: scheduleTypes,
		Weekdays:      weekdays,
	}

	schedules, total, err := h.scheduleService.ListAdmin(options)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch schedules")
	}

	return utils.PaginatedResponse(c, schedules, common.Page, common.Limit, int(total))
}

func (h *ScheduleHandler) CreateSchedule(c *fiber.Ctx) error {
	var schedule models.Schedule
	if err := c.BodyParser(&schedule); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.scheduleService.Create(&schedule); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create schedule")
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": schedule})
}

// GetScheduleByID - Admin: Get single schedule by ID
func (h *ScheduleHandler) GetScheduleByID(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	item, err := h.scheduleService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Schedule not found")
	}
	return utils.SuccessResponse(c, item)
}

func (h *ScheduleHandler) UpdateSchedule(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	schedule, err := h.scheduleService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Schedule not found")
	}
	if err := c.BodyParser(schedule); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.scheduleService.Update(schedule); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update schedule")
	}
	return utils.SuccessResponse(c, schedule)
}

func (h *ScheduleHandler) DeleteSchedule(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	if err := h.scheduleService.Delete(id); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete schedule")
	}
	return utils.MessageResponse(c, "Schedule deleted successfully")
}

// BulkDeleteSchedules - Admin: Delete multiple schedules
func (h *ScheduleHandler) BulkDeleteSchedules(c *fiber.Ctx) error {
	var req models.BulkDeleteRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if len(req.IDs) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No IDs provided for deletion")
	}

	if err := h.scheduleService.BulkDelete(req.IDs); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete schedules")
	}

	return utils.MessageResponse(c, "Schedules deleted successfully")
}
