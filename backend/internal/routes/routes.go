package routes

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/handlers"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/storage"
	"gorm.io/gorm"
)

// adminAllowedOrigins returns the explicit origin allowlist for Admin auth
// cookie endpoints. It falls back to ALLOWED_ORIGINS when ADMIN_ALLOWED_ORIGINS
// is unset. Wildcard origins are rejected by the parser.
func adminAllowedOrigins() []string {
	value := os.Getenv("ADMIN_ALLOWED_ORIGINS")
	if strings.TrimSpace(value) == "" {
		value = os.Getenv("ALLOWED_ORIGINS")
	}
	if strings.TrimSpace(value) == "" {
		value = "http://localhost:3000"
	}
	origins, err := middleware.ParseAdminAllowedOrigins(value)
	if err != nil {
		return nil
	}
	return origins
}

// SetupRoutes registers all API routes. accountCfg controls whether the public
// account API is mounted; when disabled, account routes 404 and the legacy
// anonymous /auth/register stays enabled.
func SetupRoutes(app *fiber.App, db *gorm.DB, r2 *storage.R2Service, accountCfg config.AccountAuthConfig) {
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
	// While the public account module is enabled, the legacy anonymous
	// register endpoint is disabled; visitors register via /accounts/register.
	if !accountCfg.Enabled {
		auth.Post("/register", authHandler.Register)
	}
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.RefreshToken)
	auth.Get("/me", middleware.AuthRequired, authHandler.GetProfile)
	auth.Put("/me", middleware.AuthRequired, authHandler.UpdateProfile)

	// ============ PUBLIC ACCOUNT ROUTES ============
	if accountCfg.Enabled {
		accountHandler, err := handlers.NewAccountAuthHandler(db, accountCfg, r2)
		if err != nil {
			// Fail loudly: an enabled module that cannot build would otherwise
			// silently 404 every account route.
			panic("failed to build public account handler: " + err.Error())
		} else {
			handlers.RegisterAccountRoutes(api, accountHandler, accountCfg.AllowedOrigins)
		}
	}

	// ============ ADMIN AUTH ROUTES (Origin-Guarded, Cookie-Based) ============
	// These endpoints are deliberately separate from the member /auth group.
	// They never accept credentials from JSON; the refresh credential lives in
	// a path-restricted HttpOnly cookie.
	adminAuthHandler := handlers.NewAdminAuthHandler(db)
	adminAuth := api.Group("/auth/admin", middleware.AdminOriginGuard(adminAllowedOrigins()))
	adminAuth.Post("/login", adminAuthHandler.Login)
	adminAuth.Post("/refresh", adminAuthHandler.Refresh)
	adminAuth.Post("/logout", adminAuthHandler.Logout)

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

	// ============ ADMIN ROUTES (Admin Auth + Per-Resource Permissions) ============
	admin := api.Group("/admin", middleware.AdminAuthRequired(db), middleware.AdminSecurityHeaders())
	registerAdminRoutes(admin, adminRouteDefinitions(), adminHandlerMap(db, r2))
}

// AdminRouteDefinition declares one Admin endpoint together with its required
// resource/action permission and the handler key that resolves it. It is the
// single source of truth for the Admin route registry.
type AdminRouteDefinition struct {
	Method     string
	Path       string
	Resource   string
	Action     string
	HandlerKey string
}

// registerAdminRoutes registers every Admin route from the definition slice,
// always wrapping each handler with PermissionRequired. Unknown handler keys
// panic so a typo in the registry cannot silently drop protection.
func registerAdminRoutes(group fiber.Router, definitions []AdminRouteDefinition, handlers map[string]fiber.Handler) {
	for _, definition := range definitions {
		handler, ok := handlers[definition.HandlerKey]
		if !ok {
			panic("missing admin handler: " + definition.HandlerKey)
		}
		group.Add(definition.Method, definition.Path,
			middleware.PermissionRequired(definition.Resource, definition.Action), handler)
	}
}

// adminRouteDefinitions returns every Admin route as data. Registration order
// is significant: static paths (for example /gallery/categories) and /bulk
// routes must be declared before their parameterized siblings.
func adminRouteDefinitions() []AdminRouteDefinition {
	return []AdminRouteDefinition{
		// Dashboard
		{Method: fiber.MethodGet, Path: "/dashboard/stats", Resource: "dashboard", Action: "read", HandlerKey: "dashboard.stats"},

		// Admin Self-Profile
		{Method: fiber.MethodPut, Path: "/me", Resource: "profile", Action: "update", HandlerKey: "profile.update"},

		// Audit Logs
		{Method: fiber.MethodGet, Path: "/audit-logs/filter-options", Resource: "audit_logs", Action: "read", HandlerKey: "audit.filterOptions"},
		{Method: fiber.MethodGet, Path: "/audit-logs", Resource: "audit_logs", Action: "read", HandlerKey: "audit.list"},

		// Events Management
		{Method: fiber.MethodGet, Path: "/events", Resource: "events", Action: "read", HandlerKey: "events.list"},
		{Method: fiber.MethodGet, Path: "/events/:id", Resource: "events", Action: "read", HandlerKey: "events.get"},
		{Method: fiber.MethodPost, Path: "/events", Resource: "events", Action: "create", HandlerKey: "events.create"},
		{Method: fiber.MethodPut, Path: "/events/:id", Resource: "events", Action: "update", HandlerKey: "events.update"},
		{Method: fiber.MethodDelete, Path: "/events/bulk", Resource: "events", Action: "delete", HandlerKey: "events.bulkDelete"},
		{Method: fiber.MethodDelete, Path: "/events/:id", Resource: "events", Action: "delete", HandlerKey: "events.delete"},

		// Monks Management
		{Method: fiber.MethodGet, Path: "/monks", Resource: "monks", Action: "read", HandlerKey: "monks.list"},
		{Method: fiber.MethodGet, Path: "/monks/:id", Resource: "monks", Action: "read", HandlerKey: "monks.get"},
		{Method: fiber.MethodPost, Path: "/monks", Resource: "monks", Action: "create", HandlerKey: "monks.create"},
		{Method: fiber.MethodPut, Path: "/monks/:id", Resource: "monks", Action: "update", HandlerKey: "monks.update"},
		{Method: fiber.MethodDelete, Path: "/monks/bulk", Resource: "monks", Action: "delete", HandlerKey: "monks.bulkDelete"},
		{Method: fiber.MethodDelete, Path: "/monks/:id", Resource: "monks", Action: "delete", HandlerKey: "monks.delete"},

		// Gallery Management
		{Method: fiber.MethodGet, Path: "/gallery", Resource: "gallery", Action: "read", HandlerKey: "gallery.list"},
		{Method: fiber.MethodGet, Path: "/gallery/categories", Resource: "gallery", Action: "read", HandlerKey: "gallery.categories.list"},
		{Method: fiber.MethodGet, Path: "/gallery/:id", Resource: "gallery", Action: "read", HandlerKey: "gallery.get"},
		{Method: fiber.MethodPost, Path: "/gallery", Resource: "gallery", Action: "create", HandlerKey: "gallery.create"},
		{Method: fiber.MethodPut, Path: "/gallery/:id", Resource: "gallery", Action: "update", HandlerKey: "gallery.update"},
		{Method: fiber.MethodDelete, Path: "/gallery/bulk", Resource: "gallery", Action: "delete", HandlerKey: "gallery.bulkDelete"},
		{Method: fiber.MethodDelete, Path: "/gallery/:id", Resource: "gallery", Action: "delete", HandlerKey: "gallery.delete"},
		{Method: fiber.MethodPost, Path: "/gallery/categories", Resource: "gallery", Action: "create", HandlerKey: "gallery.categories.create"},
		{Method: fiber.MethodPut, Path: "/gallery/categories/:id", Resource: "gallery", Action: "update", HandlerKey: "gallery.categories.update"},
		{Method: fiber.MethodDelete, Path: "/gallery/categories/bulk", Resource: "gallery", Action: "delete", HandlerKey: "gallery.categories.bulkDelete"},

		// Upload Management
		{Method: fiber.MethodPost, Path: "/upload", Resource: "gallery", Action: "create", HandlerKey: "upload.create"},
		{Method: fiber.MethodGet, Path: "/media/filter-options", Resource: "gallery", Action: "read", HandlerKey: "media.filterOptions"},
		{Method: fiber.MethodGet, Path: "/media", Resource: "gallery", Action: "read", HandlerKey: "media.list"},
		{Method: fiber.MethodPut, Path: "/media/:id", Resource: "gallery", Action: "update", HandlerKey: "media.update"},
		{Method: fiber.MethodDelete, Path: "/media/:id", Resource: "gallery", Action: "delete", HandlerKey: "media.delete"},

		// Schedule Management
		{Method: fiber.MethodGet, Path: "/schedules", Resource: "schedules", Action: "read", HandlerKey: "schedules.list"},
		{Method: fiber.MethodGet, Path: "/schedules/:id", Resource: "schedules", Action: "read", HandlerKey: "schedules.get"},
		{Method: fiber.MethodPost, Path: "/schedules", Resource: "schedules", Action: "create", HandlerKey: "schedules.create"},
		{Method: fiber.MethodPut, Path: "/schedules/:id", Resource: "schedules", Action: "update", HandlerKey: "schedules.update"},
		{Method: fiber.MethodDelete, Path: "/schedules/bulk", Resource: "schedules", Action: "delete", HandlerKey: "schedules.bulkDelete"},
		{Method: fiber.MethodDelete, Path: "/schedules/:id", Resource: "schedules", Action: "delete", HandlerKey: "schedules.delete"},

		// Donation Management
		{Method: fiber.MethodGet, Path: "/donations/filter-options", Resource: "donations", Action: "read", HandlerKey: "donations.filterOptions"},
		{Method: fiber.MethodGet, Path: "/donations/stats", Resource: "donations", Action: "read", HandlerKey: "donations.stats"},
		{Method: fiber.MethodGet, Path: "/donations", Resource: "donations", Action: "read", HandlerKey: "donations.list"},
		{Method: fiber.MethodGet, Path: "/donations/:id", Resource: "donations", Action: "read", HandlerKey: "donations.get"},
		{Method: fiber.MethodPut, Path: "/donations/:id", Resource: "donations", Action: "update", HandlerKey: "donations.update"},
		{Method: fiber.MethodDelete, Path: "/donations/bulk", Resource: "donations", Action: "delete", HandlerKey: "donations.bulkDelete"},
		{Method: fiber.MethodDelete, Path: "/donations/:id", Resource: "donations", Action: "delete", HandlerKey: "donations.delete"},
		{Method: fiber.MethodGet, Path: "/donation-categories", Resource: "donations", Action: "read", HandlerKey: "donationCategories.list"},
		{Method: fiber.MethodPost, Path: "/donation-categories", Resource: "donations", Action: "create", HandlerKey: "donationCategories.create"},
		{Method: fiber.MethodPut, Path: "/donation-categories/:id", Resource: "donations", Action: "update", HandlerKey: "donationCategories.update"},
		{Method: fiber.MethodDelete, Path: "/donation-categories/bulk", Resource: "donations", Action: "delete", HandlerKey: "donationCategories.bulkDelete"},
		{Method: fiber.MethodDelete, Path: "/donation-categories/:id", Resource: "donations", Action: "delete", HandlerKey: "donationCategories.delete"},

		// Member Management
		{Method: fiber.MethodGet, Path: "/members", Resource: "members", Action: "read", HandlerKey: "members.list"},
		{Method: fiber.MethodGet, Path: "/members/:id", Resource: "members", Action: "read", HandlerKey: "members.get"},
		{Method: fiber.MethodPut, Path: "/members/:id", Resource: "members", Action: "update", HandlerKey: "members.update"},
		{Method: fiber.MethodDelete, Path: "/members/bulk", Resource: "members", Action: "delete", HandlerKey: "members.bulkDelete"},

		// Event Registration Management
		{Method: fiber.MethodGet, Path: "/registrations", Resource: "events", Action: "read", HandlerKey: "registrations.list"},
		{Method: fiber.MethodPut, Path: "/registrations/:id/status", Resource: "events", Action: "update", HandlerKey: "registrations.updateStatus"},
		{Method: fiber.MethodDelete, Path: "/registrations/bulk", Resource: "events", Action: "delete", HandlerKey: "registrations.bulkDelete"},

		// Contact Management
		{Method: fiber.MethodGet, Path: "/contacts", Resource: "contacts", Action: "read", HandlerKey: "contacts.list"},
		{Method: fiber.MethodPut, Path: "/contacts/:id/status", Resource: "contacts", Action: "update", HandlerKey: "contacts.updateStatus"},
		{Method: fiber.MethodDelete, Path: "/contacts/bulk", Resource: "contacts", Action: "delete", HandlerKey: "contacts.bulkDelete"},
		{Method: fiber.MethodDelete, Path: "/contacts/:id", Resource: "contacts", Action: "delete", HandlerKey: "contacts.delete"},

		// Settings Management
		{Method: fiber.MethodGet, Path: "/settings", Resource: "settings", Action: "read", HandlerKey: "settings.list"},
		{Method: fiber.MethodPut, Path: "/settings", Resource: "settings", Action: "update", HandlerKey: "settings.update"},
		{Method: fiber.MethodPost, Path: "/settings", Resource: "settings", Action: "create", HandlerKey: "settings.create"},
		{Method: fiber.MethodGet, Path: "/event-alert", Resource: "settings", Action: "read", HandlerKey: "settings.eventAlert.get"},
		{Method: fiber.MethodPut, Path: "/event-alert", Resource: "settings", Action: "update", HandlerKey: "settings.eventAlert.save"},

		// Public Content Pages Management
		{Method: fiber.MethodGet, Path: "/about", Resource: "website", Action: "read", HandlerKey: "website.about.get"},
		{Method: fiber.MethodPut, Path: "/about", Resource: "website", Action: "update", HandlerKey: "website.about.save"},
		{Method: fiber.MethodGet, Path: "/contact", Resource: "website", Action: "read", HandlerKey: "website.contact.get"},
		{Method: fiber.MethodPut, Path: "/contact", Resource: "website", Action: "update", HandlerKey: "website.contact.save"},
		{Method: fiber.MethodGet, Path: "/privacy", Resource: "website", Action: "read", HandlerKey: "website.privacy.get"},
		{Method: fiber.MethodPut, Path: "/privacy", Resource: "website", Action: "update", HandlerKey: "website.privacy.save"},
		{Method: fiber.MethodGet, Path: "/impressum", Resource: "website", Action: "read", HandlerKey: "website.impressum.get"},
		{Method: fiber.MethodPut, Path: "/impressum", Resource: "website", Action: "update", HandlerKey: "website.impressum.save"},

		// Website CMS
		{Method: fiber.MethodGet, Path: "/website/pages", Resource: "website", Action: "read", HandlerKey: "cms.pages.list"},
		{Method: fiber.MethodGet, Path: "/website/pages/:pageKey", Resource: "website", Action: "read", HandlerKey: "cms.pages.get"},
		{Method: fiber.MethodPut, Path: "/website/pages/:id", Resource: "website", Action: "update", HandlerKey: "cms.pages.update"},
		{Method: fiber.MethodPost, Path: "/website/pages/:id/publish", Resource: "website", Action: "update", HandlerKey: "cms.pages.publish"},
		{Method: fiber.MethodPut, Path: "/website/pages/:pageId/sections/reorder", Resource: "website", Action: "update", HandlerKey: "cms.pages.reorder"},
		{Method: fiber.MethodPost, Path: "/website/pages/:pageId/sections", Resource: "website", Action: "update", HandlerKey: "cms.sections.create"},
		{Method: fiber.MethodPut, Path: "/website/sections/:id", Resource: "website", Action: "update", HandlerKey: "cms.sections.update"},
		{Method: fiber.MethodPost, Path: "/website/sections/:id/archive", Resource: "website", Action: "update", HandlerKey: "cms.sections.archive"},
		{Method: fiber.MethodPost, Path: "/website/sections/:id/restore", Resource: "website", Action: "update", HandlerKey: "cms.sections.restore"},
		{Method: fiber.MethodPost, Path: "/website/sections/:id/duplicate", Resource: "website", Action: "update", HandlerKey: "cms.sections.duplicate"},

		// RichText Migrations
		{Method: fiber.MethodPost, Path: "/rich-text/migrations", Resource: "website", Action: "update", HandlerKey: "richtext.migrate"},

		// User Management
		{Method: fiber.MethodGet, Path: "/users", Resource: "users", Action: "read", HandlerKey: "users.list"},
		{Method: fiber.MethodGet, Path: "/users/:id", Resource: "users", Action: "read", HandlerKey: "users.get"},
		{Method: fiber.MethodPost, Path: "/users", Resource: "users", Action: "create", HandlerKey: "users.create"},
		{Method: fiber.MethodPut, Path: "/users/:id", Resource: "users", Action: "update", HandlerKey: "users.update"},
		{Method: fiber.MethodDelete, Path: "/users/bulk", Resource: "users", Action: "delete", HandlerKey: "users.bulkDelete"},
		{Method: fiber.MethodDelete, Path: "/users/:id", Resource: "users", Action: "delete", HandlerKey: "users.delete"},

		// Role Management (reuse "users" permission resource)
		{Method: fiber.MethodGet, Path: "/roles", Resource: "users", Action: "read", HandlerKey: "roles.list"},
		{Method: fiber.MethodGet, Path: "/roles/:id", Resource: "users", Action: "read", HandlerKey: "roles.get"},
		{Method: fiber.MethodPost, Path: "/roles", Resource: "users", Action: "create", HandlerKey: "roles.create"},
		{Method: fiber.MethodPut, Path: "/roles/:id", Resource: "users", Action: "update", HandlerKey: "roles.update"},
		{Method: fiber.MethodDelete, Path: "/roles/bulk", Resource: "users", Action: "delete", HandlerKey: "roles.bulkDelete"},
		{Method: fiber.MethodDelete, Path: "/roles/:id", Resource: "users", Action: "delete", HandlerKey: "roles.delete"},
	}
}

// adminHandlerMap resolves every Admin route handler key to the handler
// function that backs it.
func adminHandlerMap(db *gorm.DB, r2 *storage.R2Service) map[string]fiber.Handler {
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

	return map[string]fiber.Handler{
		"dashboard.stats":               dashboardHandler.GetDashboardStats,
		"audit.filterOptions":           auditHandler.GetFilterOptions,
		"audit.list":                    auditHandler.GetAuditLogs,
		"events.list":                   eventHandler.GetAdminEvents,
		"events.get":                    eventHandler.GetEventByID,
		"events.create":                 eventHandler.CreateEvent,
		"events.update":                 eventHandler.UpdateEvent,
		"events.bulkDelete":             eventHandler.BulkDeleteEvents,
		"events.delete":                 eventHandler.DeleteEvent,
		"monks.list":                    monkHandler.GetAdminMonks,
		"monks.get":                     monkHandler.GetMonkByID,
		"monks.create":                  monkHandler.CreateMonk,
		"monks.update":                  monkHandler.UpdateMonk,
		"monks.bulkDelete":              monkHandler.BulkDeleteMonks,
		"monks.delete":                  monkHandler.DeleteMonk,
		"gallery.list":                  galleryHandler.GetAdminGalleries,
		"gallery.categories.list":       galleryHandler.GetAdminCategories,
		"gallery.get":                   galleryHandler.GetGalleryByID,
		"gallery.create":                galleryHandler.CreateGallery,
		"gallery.update":                galleryHandler.UpdateGallery,
		"gallery.bulkDelete":            galleryHandler.BulkDeleteGalleries,
		"gallery.delete":                galleryHandler.DeleteGallery,
		"gallery.categories.create":     galleryHandler.CreateCategory,
		"gallery.categories.update":     galleryHandler.UpdateCategory,
		"gallery.categories.bulkDelete": galleryHandler.BulkDeleteCategories,
		"upload.create":                 uploadHandler.UploadFile,
		"media.filterOptions":           mediaHandler.GetFilterOptions,
		"media.list":                    mediaHandler.GetMedia,
		"media.update":                  mediaHandler.UpdateMedia,
		"media.delete":                  mediaHandler.DeleteMedia,
		"schedules.list":                scheduleHandler.GetAdminSchedules,
		"schedules.get":                 scheduleHandler.GetScheduleByID,
		"schedules.create":              scheduleHandler.CreateSchedule,
		"schedules.update":              scheduleHandler.UpdateSchedule,
		"schedules.bulkDelete":          scheduleHandler.BulkDeleteSchedules,
		"schedules.delete":              scheduleHandler.DeleteSchedule,
		"donations.filterOptions":       donationHandler.GetFilterOptions,
		"donations.stats":               donationHandler.GetDonationStats,
		"donations.list":                donationHandler.GetDonations,
		"donations.get":                 donationHandler.GetDonationByID,
		"donations.update":              donationHandler.UpdateDonation,
		"donations.bulkDelete":          donationHandler.BulkDeleteDonations,
		"donations.delete":              donationHandler.DeleteDonation,
		"donationCategories.list":       donationHandler.GetAdminDonationCategories,
		"donationCategories.create":     donationHandler.CreateDonationCategory,
		"donationCategories.update":     donationHandler.UpdateDonationCategory,
		"donationCategories.bulkDelete": donationHandler.BulkDeleteDonationCategories,
		"donationCategories.delete":     donationHandler.DeleteDonationCategory,
		"members.list":                  memberHandler.GetMembers,
		"members.get":                   memberHandler.GetMember,
		"members.update":                memberHandler.UpdateMember,
		"members.bulkDelete":            memberHandler.BulkDeleteMembers,
		"registrations.list":            registrationHandler.GetRegistrations,
		"registrations.updateStatus":    registrationHandler.UpdateRegistrationStatus,
		"registrations.bulkDelete":      registrationHandler.BulkDeleteRegistrations,
		"contacts.list":                 contactHandler.GetContacts,
		"contacts.updateStatus":         contactHandler.UpdateContactStatus,
		"contacts.bulkDelete":           contactHandler.BulkDeleteContacts,
		"contacts.delete":               contactHandler.DeleteContact,
		"settings.list":                 settingsHandler.GetAllSettings,
		"settings.update":               settingsHandler.UpdateSettings,
		"settings.create":               settingsHandler.UpsertSetting,
		"settings.eventAlert.get":       eventAlertHandler.Get,
		"settings.eventAlert.save":      eventAlertHandler.Save,
		"website.about.get":             publicContentHandler.GetAbout,
		"website.about.save":            publicContentHandler.SaveAbout,
		"website.contact.get":           publicContentHandler.GetContact,
		"website.contact.save":          publicContentHandler.SaveContact,
		"website.privacy.get":           publicContentHandler.GetPrivacy,
		"website.privacy.save":          publicContentHandler.SavePrivacy,
		"website.impressum.get":         publicContentHandler.GetImpressum,
		"website.impressum.save":        publicContentHandler.SaveImpressum,
		"cms.pages.list":                contentHandler.ListAdminPages,
		"cms.pages.get":                 contentHandler.GetPage,
		"cms.pages.update":              contentHandler.UpdatePageDraft,
		"cms.pages.publish":             contentHandler.PublishPage,
		"cms.pages.reorder":             contentHandler.ReorderSections,
		"cms.sections.create":           contentHandler.CreateSection,
		"cms.sections.update":           contentHandler.UpdateSectionDraft,
		"cms.sections.archive":          contentHandler.ArchiveSection,
		"cms.sections.restore":          contentHandler.RestoreSection,
		"cms.sections.duplicate":        contentHandler.DuplicateSection,
		"richtext.migrate":              richTextMigrationHandler.Migrate,
		"users.list":                    userHandler.GetUsers,
		"users.get":                     userHandler.GetUser,
		"users.create":                  userHandler.CreateUser,
		"users.update":                  userHandler.UpdateUser,
		"users.bulkDelete":              userHandler.BulkDeleteUsers,
		"users.delete":                  userHandler.DeleteUser,
		"profile.update":                userHandler.UpdateAdminProfile,
		"roles.list":                    roleHandler.GetRoles,
		"roles.get":                     roleHandler.GetRole,
		"roles.create":                  roleHandler.CreateRole,
		"roles.update":                  roleHandler.UpdateRole,
		"roles.bulkDelete":              roleHandler.BulkDeleteRoles,
		"roles.delete":                  roleHandler.DeleteRole,
	}
}
