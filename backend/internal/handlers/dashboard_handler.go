package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type DashboardHandler struct {
	db *gorm.DB
}

func NewDashboardHandler(db *gorm.DB) *DashboardHandler {
	return &DashboardHandler{db: db}
}

// GetDashboardStats - Admin: นับจำนวน record ของแต่ละ entity
func (h *DashboardHandler) GetDashboardStats(c *fiber.Ctx) error {
	var events, monks, gallery, schedules, donations, members, contacts int64

	h.db.Model(&models.Event{}).Count(&events)
	h.db.Model(&models.Monk{}).Count(&monks)
	h.db.Model(&models.Gallery{}).Count(&gallery)
	h.db.Model(&models.Schedule{}).Count(&schedules)
	h.db.Model(&models.Donation{}).Count(&donations)
	h.db.Model(&models.Member{}).Count(&members)
	h.db.Model(&models.ContactInquiry{}).Count(&contacts)

	return utils.SuccessResponse(c, fiber.Map{
		"events":    events,
		"monks":     monks,
		"gallery":   gallery,
		"schedules": schedules,
		"donations": donations,
		"members":   members,
		"contacts":  contacts,
	})
}
