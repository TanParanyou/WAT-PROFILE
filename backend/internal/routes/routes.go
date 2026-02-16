package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/handlers"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
)

func SetupRoutes(app *fiber.App) {
	// API v1
	api := app.Group("/api/v1")

	// Initialize handlers
	authHandler := handlers.NewAuthHandler()
	eventHandler := handlers.NewEventHandler()
	monkHandler := handlers.NewMonkHandler()
	galleryHandler := handlers.NewGalleryHandler()

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

	// ============ AUTH ROUTES ============
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.RefreshToken)
	auth.Get("/me", middleware.AuthRequired, authHandler.GetProfile)

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
	admin.Delete("/gallery/:id", galleryHandler.DeleteGallery)
	admin.Get("/gallery/categories", galleryHandler.GetCategories)
}
