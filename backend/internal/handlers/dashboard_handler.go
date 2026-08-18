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
	Type      string    `json:"type"` // "contact", "registration", "donation", "privacy"
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
	PendingPrivacy       int64                   `json:"pending_privacy"`
	Items                []AdminNotificationItem `json:"items"`
}

// GetAdminNotifications - Admin: สรุปการแจ้งเตือนงานที่รอตรวจสอบ
func (h *DashboardHandler) GetAdminNotifications(c *fiber.Ctx) error {
	var pendingContacts, pendingRegistrations, pendingDonations, pendingPrivacy int64

	h.db.Model(&models.ContactInquiry{}).Where("status = ? OR status = ?", "new", "pending").Count(&pendingContacts)
	h.db.Model(&models.EventRegistration{}).Where("registration_status = ?", "pending").Count(&pendingRegistrations)
	h.db.Model(&models.Donation{}).Where("status = ? OR status = ?", "pending", "pending_verification").Count(&pendingDonations)
	h.db.Model(&models.PersonalDataRequest{}).Where("status = ?", "open").Count(&pendingPrivacy)

	totalUnread := pendingContacts + pendingRegistrations + pendingDonations + pendingPrivacy

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

	// 4. Fetch latest open privacy requests
	var recentPrivacy []models.PersonalDataRequest
	h.db.Where("status = ?", "open").
		Order("created_at DESC").
		Limit(3).
		Find(&recentPrivacy)

	for _, req := range recentPrivacy {
		items = append(items, AdminNotificationItem{
			ID:        fmt.Sprintf("privacy-%s", req.ID.String()),
			Type:      "privacy",
			Title:     "คำขอข้อมูลส่วนบุคคล (PDPA/GDPR): " + req.RequestType,
			Message:   "อีเมลผู้ร้องขอ: " + req.SubjectEmail,
			Link:      "/admin/privacy-requests",
			CreatedAt: req.CreatedAt,
			IsNew:     req.VerificationStatus == "unverified",
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
		PendingPrivacy:       pendingPrivacy,
		Items:                items,
	})
}

type UpcomingEventSummary struct {
	ID                 int                  `json:"id"`
	Title              models.MultiLangText `json:"title"`
	Slug               string               `json:"slug"`
	StartDate          string               `json:"start_date"`
	StartTime          string               `json:"start_time"`
	Location           models.MultiLangText `json:"location"`
	PublishStatus      string               `json:"publish_status"`
	RegistrationsCount int64                `json:"registrations_count"`
}

type DashboardOverviewResponse struct {
	Stats struct {
		Events    int64 `json:"events"`
		Monks     int64 `json:"monks"`
		Gallery   int64 `json:"gallery"`
		Schedules int64 `json:"schedules"`
		Donations int64 `json:"donations"`
		Members   int64 `json:"members"`
		Contacts  int64 `json:"contacts"`
	} `json:"stats"`
	PendingTasks struct {
		TotalUnread          int64                   `json:"total_unread"`
		PendingDonations     int64                   `json:"pending_donations"`
		PendingRegistrations int64                   `json:"pending_registrations"`
		PendingContacts      int64                   `json:"pending_contacts"`
		PendingPrivacy       int64                   `json:"pending_privacy"`
		Items                []AdminNotificationItem `json:"items"`
	} `json:"pending_tasks"`
	UpcomingEvents []UpcomingEventSummary `json:"upcoming_events"`
}

// GetDashboardOverview - Admin: สรุปภาพรวมสำหรับหน้า Dashboard
func (h *DashboardHandler) GetDashboardOverview(c *fiber.Ctx) error {
	var resp DashboardOverviewResponse

	// 1. Stats
	h.db.Model(&models.Event{}).Count(&resp.Stats.Events)
	h.db.Model(&models.Monk{}).Count(&resp.Stats.Monks)
	h.db.Model(&models.Gallery{}).Count(&resp.Stats.Gallery)
	h.db.Model(&models.Schedule{}).Count(&resp.Stats.Schedules)
	h.db.Model(&models.Donation{}).Count(&resp.Stats.Donations)
	h.db.Model(&models.Member{}).Count(&resp.Stats.Members)
	h.db.Model(&models.ContactInquiry{}).Count(&resp.Stats.Contacts)

	// 2. Pending Tasks
	h.db.Model(&models.ContactInquiry{}).Where("status = ? OR status = ?", "new", "pending").Count(&resp.PendingTasks.PendingContacts)
	h.db.Model(&models.EventRegistration{}).Where("registration_status = ?", "pending").Count(&resp.PendingTasks.PendingRegistrations)
	h.db.Model(&models.Donation{}).Where("status = ? OR status = ?", "pending", "pending_verification").Count(&resp.PendingTasks.PendingDonations)
	h.db.Model(&models.PersonalDataRequest{}).Where("status = ?", "open").Count(&resp.PendingTasks.PendingPrivacy)

	resp.PendingTasks.TotalUnread = resp.PendingTasks.PendingContacts + resp.PendingTasks.PendingRegistrations + resp.PendingTasks.PendingDonations + resp.PendingTasks.PendingPrivacy

	// Recent pending items
	items := make([]AdminNotificationItem, 0)

	var recentContacts []models.ContactInquiry
	h.db.Where("status = ? OR status = ?", "new", "pending").Order("created_at DESC").Limit(5).Find(&recentContacts)
	for _, contact := range recentContacts {
		title := "ข้อความติดต่อ: " + contact.Name
		if contact.Subject != "" {
			title = contact.Subject
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

	var recentRegistrations []models.EventRegistration
	h.db.Preload("Event").Where("registration_status = ?", "pending").Order("created_at DESC").Limit(5).Find(&recentRegistrations)
	for _, reg := range recentRegistrations {
		eventName := "กิจกรรม"
		if reg.Event != nil && reg.Event.Title.Get("th") != "" {
			eventName = reg.Event.Title.Get("th")
		}
		items = append(items, AdminNotificationItem{
			ID:        fmt.Sprintf("reg-%d", reg.ID),
			Type:      "registration",
			Title:     reg.FirstName + " " + reg.LastName,
			Message:   "ลงทะเบียน: " + eventName,
			Link:      "/admin/registrations",
			CreatedAt: reg.CreatedAt,
			IsNew:     true,
		})
	}

	var recentDonations []models.Donation
	h.db.Where("status = ? OR status = ?", "pending", "pending_verification").Order("created_at DESC").Limit(5).Find(&recentDonations)
	for _, don := range recentDonations {
		items = append(items, AdminNotificationItem{
			ID:        fmt.Sprintf("don-%d", don.ID),
			Type:      "donation",
			Title:     fmt.Sprintf("สลิปทำบุญ: €%.2f (%s)", don.Amount, don.DonorName),
			Message:   "เลขที่: " + don.ReceiptNumber,
			Link:      "/admin/donations",
			CreatedAt: don.CreatedAt,
			IsNew:     true,
		})
	}

	var recentPrivacy []models.PersonalDataRequest
	h.db.Where("status = ?", "open").Order("created_at DESC").Limit(3).Find(&recentPrivacy)
	for _, req := range recentPrivacy {
		items = append(items, AdminNotificationItem{
			ID:        fmt.Sprintf("privacy-%s", req.ID.String()),
			Type:      "privacy",
			Title:     "คำขอข้อมูลส่วนบุคคล: " + req.RequestType,
			Message:   req.SubjectEmail,
			Link:      "/admin/privacy-requests",
			CreatedAt: req.CreatedAt,
			IsNew:     true,
		})
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].CreatedAt.After(items[j].CreatedAt)
	})
	if len(items) > 8 {
		items = items[:8]
	}
	resp.PendingTasks.Items = items

	// 3. Upcoming Events
	todayStr := time.Now().Format("2006-01-02")
	var upcomingEvents []models.Event
	h.db.Where("start_date >= ?", todayStr).
		Order("start_date ASC").
		Limit(4).
		Find(&upcomingEvents)

	resp.UpcomingEvents = make([]UpcomingEventSummary, 0)
	for _, ev := range upcomingEvents {
		var regCount int64
		h.db.Model(&models.EventRegistration{}).Where("event_id = ? AND registration_status <> ?", ev.ID, "cancelled").Count(&regCount)

		startTimeStr := ""
		if ev.StartTime != nil {
			startTimeStr = ev.StartTime.Format("15:04")
		}

		resp.UpcomingEvents = append(resp.UpcomingEvents, UpcomingEventSummary{
			ID:                 ev.ID,
			Title:              ev.Title,
			Slug:               ev.Slug,
			StartDate:          ev.StartDate.Format("2006-01-02"),
			StartTime:          startTimeStr,
			Location:           ev.Location,
			PublishStatus:      ev.PublishStatus,
			RegistrationsCount: regCount,
		})
	}

	return utils.SuccessResponse(c, resp)
}
