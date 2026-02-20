package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/routes"
)

func main() {
	// โหลด environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// ตรวจสอบ required env vars
	if os.Getenv("JWT_SECRET") == "" {
		log.Fatal("JWT_SECRET environment variable is required")
	}

	// เชื่อมต่อ database
	if err := config.InitDatabase(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// ตั้งค่า connection pool
	config.ConfigureConnectionPool()

	// Auto-migrate models
	if err := config.MigrateModels(); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// สร้าง Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			message := "Internal Server Error"

			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
				message = e.Message
			}

			return c.Status(code).JSON(fiber.Map{
				"success": false,
				"error":   message,
			})
		},
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))

	// Rate limiting — ป้องกัน brute force
	app.Use("/api/v1/auth/login", limiter.New(limiter.Config{
		Max:        10,
		Expiration: 1 * time.Minute,
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"success": false,
				"error":   "Too many requests. Please try again later.",
			})
		},
	}))
	app.Use("/api/v1/auth/register", limiter.New(limiter.Config{
		Max:        5,
		Expiration: 1 * time.Minute,
	}))
	app.Use("/api/v1/public/contact", limiter.New(limiter.Config{
		Max:        5,
		Expiration: 1 * time.Minute,
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "Server is running",
		})
	})

	// ตั้งค่า routes
	routes.SetupRoutes(app, config.DB)

	// Graceful shutdown
	port := getEnv("PORT", "8080")
	go func() {
		log.Printf("Server starting on port %s", port)
		if err := app.Listen(":" + port); err != nil {
			log.Fatal("Failed to start server:", err)
		}
	}()

	// รอ signal เพื่อ shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	if err := app.Shutdown(); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	// ปิด database connection
	config.CloseDatabase()
	log.Println("Server shutdown completed")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
