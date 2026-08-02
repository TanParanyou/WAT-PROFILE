package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

// AdminAuthRequired verifies an Admin access token (aud=admin) and loads the
// user and role from the injected database. It rejects inactive users, inactive
// roles, and accounts whose role lacks admin_access. Unlike AuthRequired, the
// database handle is injected so tests never depend on config.DB.
func AdminAuthRequired(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "Missing authorization header",
			})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "Invalid authorization format",
			})
		}

		claims, err := utils.VerifyAdminAccessToken(parts[1])
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "Invalid or expired admin token",
			})
		}

		userID, err := uuid.Parse(claims.Subject)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "Invalid admin token subject",
			})
		}

		var user models.User
		if err := db.Preload("Role").First(&user, "id = ?", userID).Error; err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "User not found",
			})
		}

		if !user.IsActive || user.Role == nil || !user.Role.IsActive || !user.Role.AdminAccess {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"error":   "Admin access required",
			})
		}

		// Same locals contract as AuthRequired, plus the string "user_id" used by
		// audit logging, the upload handler, and the user handler.
		c.Locals("user", &user)
		c.Locals("userID", user.ID)
		c.Locals("user_id", user.ID.String())

		return c.Next()
	}
}
