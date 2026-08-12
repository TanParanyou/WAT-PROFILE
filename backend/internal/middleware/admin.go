package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"gorm.io/gorm"
)

// AdminOnly middleware ensures the user's role grants admin access. Eligibility
// is determined by roles.admin_access, never by role name.
func AdminOnly(c *fiber.Ctx) error {
	user, err := GetCurrentUser(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "User not authenticated",
		})
	}

	if user.Role == nil || !user.Role.AdminAccess {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"error":   "Admin access required",
		})
	}

	return c.Next()
}

// RoleRequired middleware ensures user has specific role
func RoleRequired(role string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, err := GetCurrentUser(c)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "User not authenticated",
			})
		}

		if user.Role == nil || user.Role.Name != role {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"error":   "Insufficient permissions",
			})
		}

		return c.Next()
	}
}

// PermissionRequired middleware ensures user has specific permission
func PermissionRequired(resource, action string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, err := GetCurrentUser(c)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "User not authenticated",
			})
		}

		if user.Role == nil {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"error":   "No role assigned",
			})
		}

		if !user.Role.HasPermission(resource, action) {
			if db, ok := c.Locals("db").(*gorm.DB); ok && db != nil {
				auditService := services.NewAuditService(db)
				_ = auditService.LogSecurityEvent(c, "admin.permission.denied", "permission_denied", resource, "")
			}
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"error":   "Insufficient permissions",
			})
		}

		return c.Next()
	}
}

