package main

import (
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"
	"github.com/joho/godotenv"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/routes"
	"github.com/watloungporsai/wat-profile-backend/internal/storage"
	"github.com/watloungporsai/wat-profile-backend/pkg/logger"
)

func main() {
	// เริ่มต้น structured logger
	logger.Init()
	log := logger.Log

	// โหลด environment variables
	if err := godotenv.Load(); err != nil {
		log.Warn().Msg("No .env file found")
	}

	// ตรวจสอบ required env vars
	if os.Getenv("JWT_SECRET") == "" {
		log.Fatal().Msg("JWT_SECRET environment variable is required")
	}

	// เชื่อมต่อ database
	if err := config.InitDatabase(); err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}

	// ตั้งค่า connection pool
	config.ConfigureConnectionPool()
	log.Info().Msg("Database connection pool configured")

	// Auto-migrate models
	if err := config.MigrateModels(); err != nil {
		log.Fatal().Err(err).Msg("Failed to migrate database")
	}
	log.Info().Msg("Database migration completed")

	// สร้าง Fiber app
	app := fiber.New(fiber.Config{
		BodyLimit:    25 * 1024 * 1024, // 25 MiB, room for 20 MiB uploads + multipart overhead
		ReadTimeout:  60 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			message := "Internal Server Error"

			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
				message = e.Message
			}

			traceID, _ := c.Locals("trace_id").(string)
			if traceID == "" {
				traceID = c.GetRespHeader("X-Trace-Id")
			}

			// Log error ด้วย zerolog
			logger.Log.Error().
				Str("method", c.Method()).
				Str("path", c.Path()).
				Int("status", code).
				Str("error", message).
				Str("trace_id", traceID).
				Msg("request error")

			return c.Status(code).JSON(fiber.Map{
				"success":  false,
				"error":    message,
				"trace_id": traceID,
			})
		},
	})

	// Middleware
	app.Use(recover.New())
	app.Use(requestid.New(requestid.Config{
		Header:     "X-Trace-Id",
		ContextKey: "trace_id",
	}))
	app.Use(logger.FiberLogger()) // ใช้ zerolog แทน Fiber logger
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
	app.Use("/api/v1/auth/admin/login", limiter.New(limiter.Config{
		Max:        5,
		Expiration: 1 * time.Minute,
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"success": false,
				"error":   "Too many requests. Please try again later.",
			})
		},
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

	// API Documentation (Scalar)
	app.Get("/docs", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "text/html; charset=utf-8")
		return c.SendString(scalarHTML)
	})
	app.Static("/docs/openapi.yaml", "./docs/openapi.yaml")

	// Storage Service
	r2Service, err := storage.NewR2Service()
	if err != nil {
		log.Warn().Err(err).Msg("Failed to initialize R2 service, file uploads will not work")
	} else {
		log.Info().Msg("R2 storage service initialized")
	}

	// ตั้งค่า routes
	routes.SetupRoutes(app, config.DB, r2Service)

	// Graceful shutdown
	port := getEnv("PORT", "8080")
	go func() {
		log.Info().Str("port", port).Msg("Server starting")
		if err := app.Listen(":" + port); err != nil {
			log.Fatal().Err(err).Msg("Failed to start server")
		}
	}()

	// รอ signal เพื่อ shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutting down server...")
	if err := app.Shutdown(); err != nil {
		log.Fatal().Err(err).Msg("Server forced to shutdown")
	}

	// ปิด database connection
	config.CloseDatabase()
	log.Info().Msg("Server shutdown completed")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// scalarHTML — Scalar API Reference UI
const scalarHTML = `<!DOCTYPE html>
<html>
<head>
    <title>WAT Profile API Documentation</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
    <script id="api-reference" data-url="/docs/openapi.yaml"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`
