package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/handlers"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"gorm.io/gorm"
)

func SetupRoutes(app *fiber.App, db *gorm.DB) {
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

	// ============ PUBLIC ROUTES (No Auth Required) ============
	public := api.Group("/public")

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

	// ============ ADMIN ROUTES (Auth + Admin Role Required) ============
	admin := api.Group("/admin", middleware.AuthRequired, middleware.AdminOnly)

	// Events Management
	admin.Get("/events", eventHandler.GetEvents)
	admin.Post("/events", eventHandler.CreateEvent)
	admin.Put("/events/:id", eventHandler.UpdateEvent)
	admin.Delete("/events/:id", eventHandler.DeleteEvent)

	// Monks Management
	admin.Get("/monks", monkHandler.GetMonks)
	admin.Post("/monks", monkHandler.CreateMonk)
	admin.Put("/monks/:id", monkHandler.UpdateMonk)
	admin.Delete("/monks/:id", monkHandler.DeleteMonk)

	// Gallery Management
	admin.Get("/gallery", galleryHandler.GetGalleries)
	admin.Post("/gallery", galleryHandler.CreateGallery)
	admin.Put("/gallery/:id", galleryHandler.UpdateGallery)
	admin.Delete("/gallery/:id", galleryHandler.DeleteGallery)
	admin.Get("/gallery/categories", galleryHandler.GetCategories)
	admin.Post("/gallery/categories", galleryHandler.CreateCategory)
	admin.Put("/gallery/categories/:id", galleryHandler.UpdateCategory)

	// Schedule Management
	admin.Get("/schedules", scheduleHandler.GetSchedules)
	admin.Post("/schedules", scheduleHandler.CreateSchedule)
	admin.Put("/schedules/:id", scheduleHandler.UpdateSchedule)
	admin.Delete("/schedules/:id", scheduleHandler.DeleteSchedule)

	// Donation Management
	admin.Get("/donations", donationHandler.GetDonations)
	admin.Get("/donations/stats", donationHandler.GetDonationStats)
	admin.Put("/donations/:id", donationHandler.UpdateDonation)
	admin.Delete("/donations/:id", donationHandler.DeleteDonation)
	admin.Get("/donation-categories", donationHandler.GetDonationCategories)
	admin.Post("/donation-categories", donationHandler.CreateDonationCategory)
	admin.Put("/donation-categories/:id", donationHandler.UpdateDonationCategory)
	admin.Delete("/donation-categories/:id", donationHandler.DeleteDonationCategory)

	// Member Management
	admin.Get("/members", memberHandler.GetMembers)
	admin.Get("/members/:id", memberHandler.GetMember)
	admin.Put("/members/:id", memberHandler.UpdateMember)

	// Event Registration Management
	admin.Get("/registrations", registrationHandler.GetRegistrations)
	admin.Put("/registrations/:id/status", registrationHandler.UpdateRegistrationStatus)

	// Contact Management
	admin.Get("/contacts", contactHandler.GetContacts)
	admin.Put("/contacts/:id/status", contactHandler.UpdateContactStatus)
	admin.Delete("/contacts/:id", contactHandler.DeleteContact)

	// Settings Management
	admin.Get("/settings", settingsHandler.GetAllSettings)
	admin.Put("/settings", settingsHandler.UpdateSettings)
	admin.Post("/settings", settingsHandler.UpsertSetting)
}
