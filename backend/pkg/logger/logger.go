package logger

import (
	"io"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// Log เป็น global logger instance
var Log zerolog.Logger

// Init สร้าง zerolog logger ตาม environment
func Init() {
	env := os.Getenv("APP_ENV")

	var writer io.Writer
	if env == "production" {
		// Production: JSON format สำหรับ log aggregator
		writer = os.Stdout
	} else {
		// Development: อ่านง่ายแบบ console
		writer = zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: time.RFC3339,
		}
	}

	zerolog.TimeFieldFormat = time.RFC3339

	Log = zerolog.New(writer).
		With().
		Timestamp().
		Str("service", "wat-profile-api").
		Logger()
}

// FiberLogger สร้าง Fiber middleware ที่ log request ด้วย zerolog
func FiberLogger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// ดำเนินการ request
		err := c.Next()

		// Log request
		event := Log.Info()
		if c.Response().StatusCode() >= 400 {
			event = Log.Warn()
		}
		if c.Response().StatusCode() >= 500 {
			event = Log.Error()
		}

		event.
			Str("method", c.Method()).
			Str("path", c.Path()).
			Int("status", c.Response().StatusCode()).
			Str("ip", c.IP()).
			Dur("latency", time.Since(start)).
			Str("user_agent", c.Get("User-Agent")).
			Msg("request")

		return err
	}
}
