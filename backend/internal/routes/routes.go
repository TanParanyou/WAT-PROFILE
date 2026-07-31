package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/handlers"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/storage"
	"gorm.io/gorm"
)

func SetupRoutes(app *fiber.App, db *gorm.DB, r2 *storage.R2Service) {
	// API v1
	api := app.Group("/api/v1")

	// Initialize handlers with DB injection
	authHandler := handlers.NewAuthHandler(db)
	eventHandler := handlers.NewEventHandler(db)
	monkHandler := handlers.NewMonkHandler(db)
	galleryHandler := handlers.NewGalleryHandler(db)
	scheduleHandler := handlers.NewScheduleHandler(db)
	donationHandler := handlers.NewDonationHandler(db)
	memberHandler := handlers.NewMemberHandler(db)
	registrationHandler := handlers.NewRegistrationHandler(db)
	contactHandler := handlers.NewContactHandler(db)
	settingsHandler := handlers.NewSettingsHandler(db)
	contentHandler := handlers.NewContentHandler(db)
	uploadHandler := handlers.NewUploadHandler(db, r2)
	mediaHandler := handlers.NewMediaHandler(db)
	dashboardHandler := handlers.NewDashboardHandler(db)
	userHandler := handlers.NewUserHandler(db)
	roleHandler := handlers.NewRoleHandler(db)
	auditHandler := handlers.NewAuditLogHandler(db)
	richTextMigrationHandler := handlers.NewRichTextMigrationHandler(db)
	publicContentHandler := handlers.NewPublicContentHandler(db)
	eventAlertHandler := handlers.NewEventAlertHandler(db)

	// ============ PUBLIC ROUTES (No Auth Required) ============
	public := api.Group("/public")

	// Public Content Pages
	public.Get("/about", publicContentHandler.GetPublicAbout)
	public.Get("/contact", publicContentHandler.GetPublicContact)
	public.Get("/privacy", publicContentHandler.GetPublicPrivacy)
	public.Get("/impressum", publicContentHandler.GetPublicImpressum)

	// Events
	public.Get("/events", eventHandler.GetEvents)
	public.Get("/events/:slug", eventHandler.GetEvent)

	// Monks
	public.Get("/monks", monkHandler.GetMonks)
	public.Get("/monks/:slug", monkHandler.GetMonk)

	// Gallery
	public.Get("/gallery", galleryHandler.GetGalleries)
	public.Get("/gallery/categories", galleryHandler.GetCategories)

	// Schedules
	public.Get("/schedules", scheduleHandler.GetSchedules)

	// Donation categories
	public.Get("/donation-categories", donationHandler.GetDonationCategories)

	// Contact
	public.Post("/contact", contactHandler.SubmitContact)

	// Settings
	public.Get("/settings", settingsHandler.GetPublicSettings)
	public.Get("/event-alert", eventAlertHandler.Get)
	public.Get("/pages/:slug", contentHandler.GetPublicPage)

	// Event Registration (public - no auth)
	public.Post("/events/:id/register", registrationHandler.RegisterForEvent)

	// ============ AUTH ROUTES ============
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.RefreshToken)
	auth.Get("/me", middleware.AuthRequired, authHandler.GetProfile)

	// ============ MEMBER ROUTES (Auth Required, No Admin) ============
	member := api.Group("/member", middleware.AuthRequired)

	// Member profile
	member.Post("/register", memberHandler.RegisterMember)
	member.Get("/profile", memberHandler.GetMyProfile)
	member.Put("/profile", memberHandler.UpdateMyProfile)

	// Member donations
	member.Post("/donations", donationHandler.CreateDonation)

	// Member registrations
	member.Get("/registrations", registrationHandler.GetMyRegistrations)

	// ============ ADMIN ROUTES (Auth Required + Per-Resource Permissions) ============
	admin := api.Group("/admin", middleware.AuthRequired)

	// Dashboard Stats
	admin.Get("/dashboard/stats", dashboardHandler.GetDashboardStats)

	// Audit Logs
	admin.Get("/audit-logs/filter-options", middleware.PermissionRequired("audit_logs", "read"), auditHandler.GetFilterOptions)
	admin.Get("/audit-logs", middleware.PermissionRequired("audit_logs", "read"), auditHandler.GetAuditLogs)

	// Events Management
	admin.Get("/events", middleware.PermissionRequired("events", "read"), eventHandler.GetAdminEvents)
	admin.Get("/events/:id", middleware.PermissionRequired("events", "read"), eventHandler.GetEventByID)
	admin.Post("/events", middleware.PermissionRequired("events", "create"), eventHandler.CreateEvent)
	admin.Put("/events/:id", middleware.PermissionRequired("events", "update"), eventHandler.UpdateEvent)
	admin.Delete("/events/bulk", middleware.PermissionRequired("events", "delete"), eventHandler.BulkDeleteEvents)
	admin.Delete("/events/:id", middleware.PermissionRequired("events", "delete"), eventHandler.DeleteEvent)

	// Monks Management
	admin.Get("/monks", middleware.PermissionRequired("monks", "read"), monkHandler.GetAdminMonks)
	admin.Get("/monks/:id", middleware.PermissionRequired("monks", "read"), monkHandler.GetMonkByID)
	admin.Post("/monks", middleware.PermissionRequired("monks", "create"), monkHandler.CreateMonk)
	admin.Put("/monks/:id", middleware.PermissionRequired("monks", "update"), monkHandler.UpdateMonk)
	admin.Delete("/monks/bulk", middleware.PermissionRequired("monks", "delete"), monkHandler.BulkDeleteMonks)
	admin.Delete("/monks/:id", middleware.PermissionRequired("monks", "delete"), monkHandler.DeleteMonk)

	// Gallery Management
	admin.Get("/gallery", middleware.PermissionRequired("gallery", "read"), galleryHandler.GetAdminGalleries)
	admin.Get("/gallery/categories", middleware.PermissionRequired("gallery", "read"), galleryHandler.GetAdminCategories)
	admin.Get("/gallery/:id", middleware.PermissionRequired("gallery", "read"), galleryHandler.GetGalleryByID)
	admin.Post("/gallery", middleware.PermissionRequired("gallery", "create"), galleryHandler.CreateGallery)
	admin.Put("/gallery/:id", middleware.PermissionRequired("gallery", "update"), galleryHandler.UpdateGallery)
	admin.Delete("/gallery/bulk", middleware.PermissionRequired("gallery", "delete"), galleryHandler.BulkDeleteGalleries)
	admin.Delete("/gallery/:id", middleware.PermissionRequired("gallery", "delete"), galleryHandler.DeleteGallery)
	admin.Post("/gallery/categories", middleware.PermissionRequired("gallery", "create"), galleryHandler.CreateCategory)
	admin.Put("/gallery/categories/:id", middleware.PermissionRequired("gallery", "update"), galleryHandler.UpdateCategory)
	admin.Delete("/gallery/categories/bulk", middleware.PermissionRequired("gallery", "delete"), galleryHandler.BulkDeleteCategories)

	// Upload Management
	admin.Post("/upload", middleware.PermissionRequired("gallery", "create"), uploadHandler.UploadFile)
	admin.Get("/media", middleware.PermissionRequired("gallery", "read"), mediaHandler.GetMedia)
	admin.Put("/media/:id", middleware.PermissionRequired("gallery", "update"), mediaHandler.UpdateMedia)
	admin.Delete("/media/:id", middleware.PermissionRequired("gallery", "delete"), mediaHandler.DeleteMedia)

	// Schedule Management
	admin.Get("/schedules", middleware.PermissionRequired("schedules", "read"), scheduleHandler.GetAdminSchedules)
	admin.Get("/schedules/:id", middleware.PermissionRequired("schedules", "read"), scheduleHandler.GetScheduleByID)
	admin.Post("/schedules", middleware.PermissionRequired("schedules", "create"), scheduleHandler.CreateSchedule)
	admin.Put("/schedules/:id", middleware.PermissionRequired("schedules", "update"), scheduleHandler.UpdateSchedule)
	admin.Delete("/schedules/bulk", middleware.PermissionRequired("schedules", "delete"), scheduleHandler.BulkDeleteSchedules)
	admin.Delete("/schedules/:id", middleware.PermissionRequired("schedules", "delete"), scheduleHandler.DeleteSchedule)

	// Donation Management
	admin.Get("/donations", middleware.PermissionRequired("donations", "read"), donationHandler.GetDonations)
	admin.Get("/donations/:id", middleware.PermissionRequired("donations", "read"), donationHandler.GetDonationByID)
	admin.Get("/donations/stats", middleware.PermissionRequired("donations", "read"), donationHandler.GetDonationStats)
	admin.Put("/donations/:id", middleware.PermissionRequired("donations", "update"), donationHandler.UpdateDonation)
	admin.Delete("/donations/bulk", middleware.PermissionRequired("donations", "delete"), donationHandler.BulkDeleteDonations)
	admin.Delete("/donations/:id", middleware.PermissionRequired("donations", "delete"), donationHandler.DeleteDonation)
	admin.Get("/donation-categories", middleware.PermissionRequired("donations", "read"), donationHandler.GetDonationCategories)
	admin.Post("/donation-categories", middleware.PermissionRequired("donations", "create"), donationHandler.CreateDonationCategory)
	admin.Put("/donation-categories/:id", middleware.PermissionRequired("donations", "update"), donationHandler.UpdateDonationCategory)
	admin.Delete("/donation-categories/bulk", middleware.PermissionRequired("donations", "delete"), donationHandler.BulkDeleteDonationCategories)
	admin.Delete("/donation-categories/:id", middleware.PermissionRequired("donations", "delete"), donationHandler.DeleteDonationCategory)

	// Member Management
	admin.Get("/members", middleware.PermissionRequired("members", "read"), memberHandler.GetMembers)
	admin.Get("/members/:id", middleware.PermissionRequired("members", "read"), memberHandler.GetMember)
	admin.Put("/members/:id", middleware.PermissionRequired("members", "update"), memberHandler.UpdateMember)
	admin.Delete("/members/bulk", middleware.PermissionRequired("members", "delete"), memberHandler.BulkDeleteMembers)

	// Event Registration Management
	admin.Get("/registrations", middleware.PermissionRequired("events", "read"), registrationHandler.GetRegistrations)
	admin.Put("/registrations/:id/status", middleware.PermissionRequired("events", "update"), registrationHandler.UpdateRegistrationStatus)
	admin.Delete("/registrations/bulk", middleware.PermissionRequired("events", "delete"), registrationHandler.BulkDeleteRegistrations)

	// Contact Management
	admin.Get("/contacts", middleware.PermissionRequired("contacts", "read"), contactHandler.GetContacts)
	admin.Put("/contacts/:id/status", middleware.PermissionRequired("contacts", "update"), contactHandler.UpdateContactStatus)
	admin.Delete("/contacts/bulk", middleware.PermissionRequired("contacts", "delete"), contactHandler.BulkDeleteContacts)
	admin.Delete("/contacts/:id", middleware.PermissionRequired("contacts", "delete"), contactHandler.DeleteContact)

	// Settings Management
	admin.Get("/settings", middleware.PermissionRequired("settings", "read"), settingsHandler.GetAllSettings)
	admin.Put("/settings", middleware.PermissionRequired("settings", "update"), settingsHandler.UpdateSettings)
	admin.Post("/settings", middleware.PermissionRequired("settings", "create"), settingsHandler.UpsertSetting)
	admin.Get("/event-alert", middleware.PermissionRequired("settings", "read"), eventAlertHandler.Get)
	admin.Put("/event-alert", middleware.PermissionRequired("settings", "update"), eventAlertHandler.Save)

	// Public Content Pages Management
	admin.Get("/about", middleware.PermissionRequired("website", "read"), publicContentHandler.GetAbout)
	admin.Put("/about", middleware.PermissionRequired("website", "update"), publicContentHandler.SaveAbout)
	admin.Get("/contact", middleware.PermissionRequired("website", "read"), publicContentHandler.GetContact)
	admin.Put("/contact", middleware.PermissionRequired("website", "update"), publicContentHandler.SaveContact)
	admin.Get("/privacy", middleware.PermissionRequired("website", "read"), publicContentHandler.GetPrivacy)
	admin.Put("/privacy", middleware.PermissionRequired("website", "update"), publicContentHandler.SavePrivacy)
	admin.Get("/impressum", middleware.PermissionRequired("website", "read"), publicContentHandler.GetImpressum)
	admin.Put("/impressum", middleware.PermissionRequired("website", "update"), publicContentHandler.SaveImpressum)

	// Website CMS
	admin.Get("/website/pages", middleware.PermissionRequired("website", "read"), contentHandler.ListAdminPages)
	admin.Get("/website/pages/:pageKey", middleware.PermissionRequired("website", "read"), contentHandler.GetPage)
	admin.Put("/website/pages/:id", middleware.PermissionRequired("website", "update"), contentHandler.UpdatePageDraft)
	admin.Post("/website/pages/:id/publish", middleware.PermissionRequired("website", "update"), contentHandler.PublishPage)
	admin.Put("/website/pages/:pageId/sections/reorder", middleware.PermissionRequired("website", "update"), contentHandler.ReorderSections)
	admin.Post("/website/pages/:pageId/sections", middleware.PermissionRequired("website", "update"), contentHandler.CreateSection)
	admin.Put("/website/sections/:id", middleware.PermissionRequired("website", "update"), contentHandler.UpdateSectionDraft)
	admin.Post("/website/sections/:id/archive", middleware.PermissionRequired("website", "update"), contentHandler.ArchiveSection)
	admin.Post("/website/sections/:id/restore", middleware.PermissionRequired("website", "update"), contentHandler.RestoreSection)
	admin.Post("/website/sections/:id/duplicate", middleware.PermissionRequired("website", "update"), contentHandler.DuplicateSection)

	// RichText Migrations
	admin.Post("/rich-text/migrations", middleware.PermissionRequired("website", "update"), richTextMigrationHandler.Migrate)

	// User Management
	admin.Get("/users", middleware.PermissionRequired("users", "read"), userHandler.GetUsers)
	admin.Get("/users/:id", middleware.PermissionRequired("users", "read"), userHandler.GetUser)
	admin.Post("/users", middleware.PermissionRequired("users", "create"), userHandler.CreateUser)
	admin.Put("/users/:id", middleware.PermissionRequired("users", "update"), userHandler.UpdateUser)
	admin.Delete("/users/bulk", middleware.PermissionRequired("users", "delete"), userHandler.BulkDeleteUsers)
	admin.Delete("/users/:id", middleware.PermissionRequired("users", "delete"), userHandler.DeleteUser)

	// Role Management (reuse "users" permission resource)
	admin.Get("/roles", middleware.PermissionRequired("users", "read"), roleHandler.GetRoles)
	admin.Get("/roles/:id", middleware.PermissionRequired("users", "read"), roleHandler.GetRole)
	admin.Post("/roles", middleware.PermissionRequired("users", "create"), roleHandler.CreateRole)
	admin.Put("/roles/:id", middleware.PermissionRequired("users", "update"), roleHandler.UpdateRole)
	admin.Delete("/roles/bulk", middleware.PermissionRequired("users", "delete"), roleHandler.BulkDeleteRoles)
	admin.Delete("/roles/:id", middleware.PermissionRequired("users", "delete"), roleHandler.DeleteRole)
}
