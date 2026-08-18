package handlers

import (
	"fmt"
	"sort"
	"time"

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

type AdminNotificationItem struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"` // "contact", "registration", "donation"
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Link      string    `json:"link"`
	CreatedAt time.Time `json:"created_at"`
	IsNew     bool      `json:"is_new"`
}

type AdminNotificationsResponse struct {
	TotalUnread          int64                   `json:"total_unread"`
	PendingContacts      int64                   `json:"pending_contacts"`
	PendingRegistrations int64                   `json:"pending_registrations"`
	PendingDonations     int64                   `json:"pending_donations"`
	Items                []AdminNotificationItem `json:"items"`
}

// GetAdminNotifications - Admin: สรุปการแจ้งเตือนงานที่รอตรวจสอบ
func (h *DashboardHandler) GetAdminNotifications(c *fiber.Ctx) error {
	var pendingContacts, pendingRegistrations, pendingDonations int64

	h.db.Model(&models.ContactInquiry{}).Where("status = ? OR status = ?", "new", "pending").Count(&pendingContacts)
	h.db.Model(&models.EventRegistration{}).Where("registration_status = ?", "pending").Count(&pendingRegistrations)
	h.db.Model(&models.Donation{}).Where("status = ? OR status = ?", "pending", "pending_verification").Count(&pendingDonations)

	totalUnread := pendingContacts + pendingRegistrations + pendingDonations

	items := make([]AdminNotificationItem, 0)

	// 1. Fetch latest pending contacts
	var recentContacts []models.ContactInquiry
	h.db.Where("status = ? OR status = ?", "new", "pending").
		Order("created_at DESC").
		Limit(5).
		Find(&recentContacts)

	for _, contact := range recentContacts {
		title := "ข้อความติดต่อใหม่: " + contact.Name
		if contact.Subject != "" {
			title = "ข้อความติดต่อ: " + contact.Subject
		}
		items = append(items, AdminNotificationItem{
			ID:        fmt.Sprintf("contact-%d", contact.ID),
			Type:      "contact",
			Title:     title,
			Message:   contact.Message,
			Link:      "/admin/contacts",
			CreatedAt: contact.CreatedAt,
			IsNew:     contact.Status == "new",
		})
	}

	// 2. Fetch latest pending registrations
	var recentRegistrations []models.EventRegistration
	h.db.Preload("Event").
		Where("registration_status = ?", "pending").
		Order("created_at DESC").
		Limit(5).
		Find(&recentRegistrations)

	for _, reg := range recentRegistrations {
		eventName := "กิจกรรม"
		if reg.Event != nil && reg.Event.Title.Get("th") != "" {
			eventName = reg.Event.Title.Get("th")
		}
		items = append(items, AdminNotificationItem{
			ID:        fmt.Sprintf("reg-%d", reg.ID),
			Type:      "registration",
			Title:     "ลงทะเบียนใหม่: " + reg.FirstName + " " + reg.LastName,
			Message:   "ลงทะเบียนเข้าร่วม: " + eventName,
			Link:      "/admin/registrations",
			CreatedAt: reg.CreatedAt,
			IsNew:     true,
		})
	}

	// 3. Fetch latest pending donations
	var recentDonations []models.Donation
	h.db.Where("status = ? OR status = ?", "pending", "pending_verification").
		Order("created_at DESC").
		Limit(5).
		Find(&recentDonations)

	for _, don := range recentDonations {
		items = append(items, AdminNotificationItem{
			ID:        fmt.Sprintf("don-%d", don.ID),
			Type:      "donation",
			Title:     fmt.Sprintf("เงินบริจาครอตรวจสอบ: €%.2f", don.Amount),
			Message:   "ผู้บริจาค: " + don.DonorName + " (" + don.ReceiptNumber + ")",
			Link:      "/admin/donations",
			CreatedAt: don.CreatedAt,
			IsNew:     true,
		})
	}

	// Sort items by CreatedAt DESC
	sort.Slice(items, func(i, j int) bool {
		return items[i].CreatedAt.After(items[j].CreatedAt)
	})

	if len(items) > 10 {
		items = items[:10]
	}

	return utils.SuccessResponse(c, AdminNotificationsResponse{
		TotalUnread:          totalUnread,
		PendingContacts:      pendingContacts,
		PendingRegistrations: pendingRegistrations,
		PendingDonations:     pendingDonations,
		Items:                items,
	})
}
