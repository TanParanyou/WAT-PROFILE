package middleware

import (
	"github.com/gofiber/fiber/v2"
)

// AdminOnly middleware ensures user has admin role
func AdminOnly(c *fiber.Ctx) error {
	user, err := GetCurrentUser(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "User not authenticated",
		})
	}

	// Check if user is admin
	if !user.IsAdmin() {
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
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"error":   "Insufficient permissions",
			})
		}

		return c.Next()
	}
}
