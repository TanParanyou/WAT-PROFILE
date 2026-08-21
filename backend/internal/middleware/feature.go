package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
)

// FeatureRequired middleware ensures a specific dynamic feature flag is enabled in settings
func FeatureRequired(settingsService *services.SettingsService, featureKey string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if !settingsService.IsFeatureEnabled(featureKey) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"error":   "This feature is currently disabled",
				"code":    "FEATURE_DISABLED",
			})
		}
		return c.Next()
	}
}
