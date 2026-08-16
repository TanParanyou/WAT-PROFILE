package routes

import (
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/handlers"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/internal/storage"
	"gorm.io/gorm"
)

func registrationLimiter() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        20,
		Expiration: time.Minute,
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{"success": false, "error": "Too many registration requests. Please try again later.", "code": "REGISTRATION_RATE_LIMITED"})
		},
	})
}

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
func SetupRoutes(app *fiber.App, db *gorm.DB, r2 *storage.R2Service, accountCfg config.AccountAuthConfig, communityCfg config.CommunityConfig) {
	// API v1
	api := app.Group("/api/v1")

	// Initialize handlers with DB injection
	authHandler := handlers.NewAuthHandler(db)
	eventHandler := handlers.NewEventHandler(db)
	calendarHandler := handlers.NewCalendarHandler(db)
	monkHandler := handlers.NewMonkHandler(db)
	galleryHandler := handlers.NewGalleryHandler(db)
	scheduleHandler := handlers.NewScheduleHandler(db)
	donationAudit := services.NewAuditService(db)
	donationHandler := handlers.NewDonationHandler(db, donationAudit)
	if r2 != nil {
		donationHandler = handlers.NewDonationHandler(db, r2, donationAudit)
	}
	memberHandler := handlers.NewMemberHandler(db)
	registrationHandler := handlers.NewRegistrationHandler(db)
	contactHandler := handlers.NewContactHandler(db)
	settingsHandler := handlers.NewSettingsHandler(db)
	contentHandler := handlers.NewContentHandler(db)
	publicContentHandler := handlers.NewPublicContentHandler(db)
	eventAlertHandler := handlers.NewEventAlertHandler(db)
	personalDataRequestHandler := handlers.NewPersonalDataRequestHandler(db)

	// ============ PUBLIC ROUTES (No Auth Required) ============
	public := api.Group("/public")
	if communityCfg.ReadEnabled {
		communityPublicHandler := handlers.NewCommunityPublicHandler(db, communityCfg)
		public.Get("/community/categories", communityPublicHandler.GetCategories)
		public.Get("/community/questions", communityPublicHandler.ListQuestions)
		public.Get("/community/questions/:id", communityPublicHandler.GetQuestion)
	}

	// Public Content Pages
	public.Get("/about", publicContentHandler.GetPublicAbout)
	public.Get("/contact", publicContentHandler.GetPublicContact)
	public.Get("/privacy", publicContentHandler.GetPublicPrivacy)
	public.Get("/impressum", publicContentHandler.GetPublicImpressum)

	// Events
	public.Get("/events", eventHandler.GetEvents)
	public.Get("/events/:slug", eventHandler.GetEvent)
	public.Get("/calendar", calendarHandler.GetPublic)

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
	public.Post("/donations", donationHandler.SubmitSelfReported)

	// Contact
	public.Post("/contact", contactHandler.SubmitContact)

	// Privacy Data Subject Requests (public - no auth)
	public.Post("/privacy-requests", personalDataRequestHandler.SubmitPublic)

	// Settings
	public.Get("/settings", settingsHandler.GetPublicSettings)
	public.Get("/event-alert", eventAlertHandler.Get)
	public.Get("/pages/:slug", contentHandler.GetPublicPage)

	// Event Registration (public - no auth)
	if accountCfg.Enabled {
		public.Post("/events/:id/register", registrationLimiter(), middleware.PublicAccountOptional(db, []byte(os.Getenv("JWT_SECRET"))), registrationHandler.RegisterForEvent)
	} else {
		public.Post("/events/:id/register", registrationLimiter(), registrationHandler.RegisterForEvent)
	}
	public.Post("/event-registrations/manage", registrationLimiter(), registrationHandler.ResolveGuestRegistration)
	public.Patch("/event-registrations/manage", registrationLimiter(), registrationHandler.UpdateGuestRegistration)
	public.Post("/event-registrations/cancel", registrationLimiter(), registrationHandler.CancelGuestRegistration)

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
		accountRegistrations := api.Group("/account", middleware.PublicAccountRequired(db, []byte(os.Getenv("JWT_SECRET"))))
		accountRegistrations.Get("/registrations", registrationHandler.GetAccountRegistrations)
		accountRegistrations.Patch("/registrations/:id", registrationHandler.UpdateAccountRegistration)
		accountRegistrations.Post("/registrations/:id/cancel", registrationHandler.CancelAccountRegistration)
	}

	if communityCfg.WriteEnabled {
		communityAccountHandler := handlers.NewCommunityAccountHandler(db, communityCfg)
		communityAccount := api.Group("/accounts/community", middleware.AccountOriginGuard(accountCfg.AllowedOrigins), middleware.PublicAccountRequired(db, []byte(os.Getenv("JWT_SECRET"))))
		communityAccount.Post("/questions", communityAccountHandler.CreateQuestion)
		communityAccount.Patch("/questions/:id", communityAccountHandler.UpdateQuestion)
		communityAccount.Delete("/questions/:id", communityAccountHandler.DeleteQuestion)
		communityAccount.Get("/activity", communityAccountHandler.ListMyActivity)
		communityAccount.Get("/questions/:id/viewer", communityAccountHandler.GetViewerState)
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

	// Member registrations
	member.Get("/registrations", registrationHandler.GetMyRegistrations)
	member.Get("/donations", donationHandler.GetMyDonations)

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
		{Method: fiber.MethodGet, Path: "/calendar", Resource: "events", Action: "read", HandlerKey: "calendar.admin"},
		{Method: fiber.MethodGet, Path: "/calendar-resources", Resource: "calendar_resources", Action: "read", HandlerKey: "calendarResources.list"},
		{Method: fiber.MethodGet, Path: "/calendar-resources/:id", Resource: "calendar_resources", Action: "read", HandlerKey: "calendarResources.get"},
		{Method: fiber.MethodPost, Path: "/calendar-resources", Resource: "calendar_resources", Action: "create", HandlerKey: "calendarResources.create"},
		{Method: fiber.MethodPut, Path: "/calendar-resources/:id", Resource: "calendar_resources", Action: "update", HandlerKey: "calendarResources.update"},
		{Method: fiber.MethodDelete, Path: "/calendar-resources/:id", Resource: "calendar_resources", Action: "delete", HandlerKey: "calendarResources.delete"},
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
		{Method: fiber.MethodPatch, Path: "/gallery/bulk-status", Resource: "gallery", Action: "update", HandlerKey: "gallery.bulkStatus"},
		{Method: fiber.MethodPatch, Path: "/gallery/bulk-category", Resource: "gallery", Action: "update", HandlerKey: "gallery.bulkCategory"},
		{Method: fiber.MethodPatch, Path: "/gallery/bulk-event", Resource: "gallery", Action: "update", HandlerKey: "gallery.bulkEvent"},
		{Method: fiber.MethodPost, Path: "/gallery/batch", Resource: "gallery", Action: "create", HandlerKey: "gallery.batchCreate"},
		{Method: fiber.MethodPut, Path: "/gallery/reorder", Resource: "gallery", Action: "update", HandlerKey: "gallery.reorder"},
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
		{Method: fiber.MethodGet, Path: "/media/trash", Resource: "gallery", Action: "read", HandlerKey: "media.trash"},
		{Method: fiber.MethodGet, Path: "/media", Resource: "gallery", Action: "read", HandlerKey: "media.list"},
		{Method: fiber.MethodGet, Path: "/media/:id/references", Resource: "gallery", Action: "read", HandlerKey: "media.references"},
		{Method: fiber.MethodPut, Path: "/media/:id", Resource: "gallery", Action: "update", HandlerKey: "media.update"},
		{Method: fiber.MethodPost, Path: "/media/:id/restore", Resource: "gallery", Action: "update", HandlerKey: "media.restore"},
		{Method: fiber.MethodPost, Path: "/media/:id/purge", Resource: "gallery", Action: "delete", HandlerKey: "media.purge"},
		{Method: fiber.MethodDelete, Path: "/media/:id", Resource: "gallery", Action: "delete", HandlerKey: "media.delete"},

		// Schedule Management
		{Method: fiber.MethodGet, Path: "/schedules", Resource: "schedules", Action: "read", HandlerKey: "schedules.list"},
		{Method: fiber.MethodGet, Path: "/schedules/:id", Resource: "schedules", Action: "read", HandlerKey: "schedules.get"},
		{Method: fiber.MethodPost, Path: "/schedules", Resource: "schedules", Action: "create", HandlerKey: "schedules.create"},
		{Method: fiber.MethodPut, Path: "/schedules/:id", Resource: "schedules", Action: "update", HandlerKey: "schedules.update"},
		{Method: fiber.MethodDelete, Path: "/schedules/bulk", Resource: "schedules", Action: "delete", HandlerKey: "schedules.bulkDelete"},
		{Method: fiber.MethodDelete, Path: "/schedules/:id", Resource: "schedules", Action: "delete", HandlerKey: "schedules.delete"},

		// Donation Management
		{Method: fiber.MethodPost, Path: "/donations", Resource: "donations", Action: "create", HandlerKey: "donations.create"},
		{Method: fiber.MethodGet, Path: "/donations/filter-options", Resource: "donations", Action: "read", HandlerKey: "donations.filterOptions"},
		{Method: fiber.MethodGet, Path: "/donations/stats", Resource: "donations", Action: "read", HandlerKey: "donations.stats"},
		{Method: fiber.MethodGet, Path: "/donations", Resource: "donations", Action: "read", HandlerKey: "donations.list"},
		{Method: fiber.MethodGet, Path: "/donations/:id", Resource: "donations", Action: "read", HandlerKey: "donations.get"},
		{Method: fiber.MethodGet, Path: "/donations/:id/proof", Resource: "donations", Action: "read", HandlerKey: "donations.proof"},
		{Method: fiber.MethodPost, Path: "/donations/:id/confirm", Resource: "donations", Action: "update", HandlerKey: "donations.confirm"},
		{Method: fiber.MethodPost, Path: "/donations/:id/cancel", Resource: "donations", Action: "update", HandlerKey: "donations.cancel"},
		{Method: fiber.MethodPost, Path: "/donations/:id/send-receipt", Resource: "donations", Action: "update", HandlerKey: "donations.sendReceipt"},
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
		{Method: fiber.MethodGet, Path: "/event-registrations", Resource: "events", Action: "read", HandlerKey: "registrations.adminList"},
		{Method: fiber.MethodGet, Path: "/event-registrations/:id", Resource: "events", Action: "read", HandlerKey: "registrations.adminGet"},
		{Method: fiber.MethodPatch, Path: "/event-registrations/:id", Resource: "events", Action: "update", HandlerKey: "registrations.adminUpdate"},
		{Method: fiber.MethodPut, Path: "/event-registrations/:id/status", Resource: "events", Action: "update", HandlerKey: "registrations.adminStatus"},
		{Method: fiber.MethodPatch, Path: "/event-registrations/:id/participants/:participantId/attendance", Resource: "events", Action: "update", HandlerKey: "registrations.adminAttendance"},
		{Method: fiber.MethodPost, Path: "/event-registrations/:id/manage-link", Resource: "events", Action: "update", HandlerKey: "registrations.adminRotateLink"},

		// Contact Management
		{Method: fiber.MethodGet, Path: "/contacts", Resource: "contacts", Action: "read", HandlerKey: "contacts.list"},
		{Method: fiber.MethodPut, Path: "/contacts/:id/status", Resource: "contacts", Action: "update", HandlerKey: "contacts.updateStatus"},
		{Method: fiber.MethodDelete, Path: "/contacts/bulk", Resource: "contacts", Action: "delete", HandlerKey: "contacts.bulkDelete"},
		{Method: fiber.MethodDelete, Path: "/contacts/:id", Resource: "contacts", Action: "delete", HandlerKey: "contacts.delete"},

		// Personal Data Requests
		{Method: fiber.MethodGet, Path: "/privacy-requests", Resource: "privacy_requests", Action: "read", HandlerKey: "privacy.list"},
		{Method: fiber.MethodPost, Path: "/privacy-requests", Resource: "privacy_requests", Action: "create", HandlerKey: "privacy.create"},
		{Method: fiber.MethodGet, Path: "/privacy-requests/search", Resource: "privacy_requests", Action: "read", HandlerKey: "privacy.search"},
		{Method: fiber.MethodGet, Path: "/privacy-requests/:id", Resource: "privacy_requests", Action: "read", HandlerKey: "privacy.get"},
		{Method: fiber.MethodPost, Path: "/privacy-requests/:id/verify", Resource: "privacy_requests", Action: "update", HandlerKey: "privacy.verify"},
		{Method: fiber.MethodPost, Path: "/privacy-requests/:id/send-verification", Resource: "privacy_requests", Action: "update", HandlerKey: "privacy.sendVerification"},
		{Method: fiber.MethodPost, Path: "/privacy-requests/:id/items", Resource: "privacy_requests", Action: "update", HandlerKey: "privacy.select"},
		{Method: fiber.MethodPost, Path: "/privacy-requests/:id/complete", Resource: "privacy_requests", Action: "update", HandlerKey: "privacy.complete"},
		{Method: fiber.MethodGet, Path: "/privacy-requests/:id/export", Resource: "privacy_requests", Action: "read", HandlerKey: "privacy.export"},
		{Method: fiber.MethodPost, Path: "/privacy-requests/:id/reject", Resource: "privacy_requests", Action: "update", HandlerKey: "privacy.reject"},

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

		// Public Account Operations
		{Method: fiber.MethodGet, Path: "/account-operations", Resource: "account_operations", Action: "read", HandlerKey: "accountOps.list"},
		{Method: fiber.MethodGet, Path: "/account-operations/:id/security-events", Resource: "account_operations", Action: "read", HandlerKey: "accountOps.securityEvents"},
		{Method: fiber.MethodGet, Path: "/account-operations/:id", Resource: "account_operations", Action: "read", HandlerKey: "accountOps.get"},
		{Method: fiber.MethodPost, Path: "/account-operations/:id/disable", Resource: "account_operations", Action: "update", HandlerKey: "accountOps.disable"},
		{Method: fiber.MethodPost, Path: "/account-operations/:id/enable", Resource: "account_operations", Action: "update", HandlerKey: "accountOps.enable"},
		{Method: fiber.MethodPost, Path: "/account-operations/:id/logout-all", Resource: "account_operations", Action: "update", HandlerKey: "accountOps.logoutAll"},

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
	calendarHandler := handlers.NewCalendarHandler(db)
	calendarResourceHandler := handlers.NewCalendarResourceHandler(db)
	monkHandler := handlers.NewMonkHandler(db)
	galleryHandler := handlers.NewGalleryHandler(db)
	scheduleHandler := handlers.NewScheduleHandler(db)
	donationAudit := services.NewAuditService(db)
	donationHandler := handlers.NewDonationHandler(db, donationAudit)
	if r2 != nil {
		donationHandler = handlers.NewDonationHandler(db, r2, donationAudit)
	}
	memberHandler := handlers.NewMemberHandler(db)
	registrationHandler := handlers.NewRegistrationHandler(db)
	contactHandler := handlers.NewContactHandler(db)
	settingsHandler := handlers.NewSettingsHandler(db)
	contentHandler := handlers.NewContentHandler(db)
	uploadHandler := handlers.NewUploadHandler(db, r2)
	mediaHandler := handlers.NewMediaHandler(db, r2)
	dashboardHandler := handlers.NewDashboardHandler(db)
	userHandler := handlers.NewUserHandler(db)
	accountOperationsHandler := handlers.NewAdminAccountOperationsHandler(db)
	roleHandler := handlers.NewRoleHandler(db)
	privacyHandler := handlers.NewPersonalDataRequestHandler(db)
	auditHandler := handlers.NewAuditLogHandler(db)
	richTextMigrationHandler := handlers.NewRichTextMigrationHandler(db)
	publicContentHandler := handlers.NewPublicContentHandler(db)
	eventAlertHandler := handlers.NewEventAlertHandler(db)

	return map[string]fiber.Handler{
		"calendar.admin":                calendarHandler.GetAdmin,
		"calendarResources.list":        calendarResourceHandler.GetAdminCalendarResources,
		"calendarResources.get":         calendarResourceHandler.GetCalendarResource,
		"calendarResources.create":      calendarResourceHandler.CreateCalendarResource,
		"calendarResources.update":      calendarResourceHandler.UpdateCalendarResource,
		"calendarResources.delete":      calendarResourceHandler.DeleteCalendarResource,
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
		"gallery.bulkStatus":            galleryHandler.BulkUpdateStatus,
		"gallery.bulkCategory":          galleryHandler.BulkUpdateCategory,
		"gallery.bulkEvent":             galleryHandler.BulkUpdateEvent,
		"gallery.batchCreate":           galleryHandler.BatchCreateGalleries,
		"gallery.reorder":               galleryHandler.ReorderGalleries,
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
		"media.trash":                   mediaHandler.GetTrash,
		"media.list":                    mediaHandler.GetMedia,
		"media.references":              mediaHandler.GetReferences,
		"media.update":                  mediaHandler.UpdateMedia,
		"media.restore":                 mediaHandler.RestoreMedia,
		"media.purge":                   mediaHandler.PurgeMedia,
		"media.delete":                  mediaHandler.DeleteMedia,
		"schedules.list":                scheduleHandler.GetAdminSchedules,
		"schedules.get":                 scheduleHandler.GetScheduleByID,
		"schedules.create":              scheduleHandler.CreateSchedule,
		"schedules.update":              scheduleHandler.UpdateSchedule,
		"schedules.bulkDelete":          scheduleHandler.BulkDeleteSchedules,
		"schedules.delete":              scheduleHandler.DeleteSchedule,
		"donations.filterOptions":       donationHandler.GetFilterOptions,
		"donations.create":              donationHandler.CreateStaffDonation,
		"donations.stats":               donationHandler.GetDonationStats,
		"donations.list":                donationHandler.GetDonations,
		"donations.get":                 donationHandler.GetDonationByID,
		"donations.proof":               donationHandler.GetDonationProof,
		"donations.confirm":             donationHandler.ConfirmDonation,
		"donations.cancel":              donationHandler.CancelDonation,
		"donations.sendReceipt":         donationHandler.SendDonationReceipt,
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
		"registrations.adminList":       registrationHandler.GetAdminRegistrationList,
		"registrations.adminGet":        registrationHandler.GetAdminRegistration,
		"registrations.adminUpdate":     registrationHandler.UpdateAdminRegistration,
		"registrations.adminStatus":     registrationHandler.SetAdminRegistrationStatus,
		"registrations.adminAttendance": registrationHandler.SetAdminParticipantAttendance,
		"registrations.adminRotateLink": registrationHandler.RotateAdminRegistrationManageLink,
		"contacts.list":                 contactHandler.GetContacts,
		"contacts.updateStatus":         contactHandler.UpdateContactStatus,
		"contacts.bulkDelete":           contactHandler.BulkDeleteContacts,
		"contacts.delete":               contactHandler.DeleteContact,
		"privacy.list":                  privacyHandler.List,
		"privacy.create":                privacyHandler.Create,
		"privacy.search":                privacyHandler.Search,
		"privacy.get":                   privacyHandler.Get,
		"privacy.verify":                privacyHandler.Verify,
		"privacy.sendVerification":      privacyHandler.SendVerification,
		"privacy.select":                privacyHandler.Select,
		"privacy.complete":              privacyHandler.Complete,
		"privacy.export":                privacyHandler.Export,
		"privacy.reject":                privacyHandler.Reject,
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
		"accountOps.list":               accountOperationsHandler.List,
		"accountOps.get":                accountOperationsHandler.Get,
		"accountOps.securityEvents":     accountOperationsHandler.ListSecurityEvents,
		"accountOps.disable":            accountOperationsHandler.Disable,
		"accountOps.enable":             accountOperationsHandler.Enable,
		"accountOps.logoutAll":          accountOperationsHandler.LogoutAll,
		"profile.update":                userHandler.UpdateAdminProfile,
		"roles.list":                    roleHandler.GetRoles,
		"roles.get":                     roleHandler.GetRole,
		"roles.create":                  roleHandler.CreateRole,
		"roles.update":                  roleHandler.UpdateRole,
		"roles.bulkDelete":              roleHandler.BulkDeleteRoles,
		"roles.delete":                  roleHandler.DeleteRole,
	}
}
