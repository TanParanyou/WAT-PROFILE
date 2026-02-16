package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
)

// AuthRequired middleware verifies JWT token
func AuthRequired(c *fiber.Ctx) error {
	// Get Authorization header
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "Missing authorization header",
		})
	}

	// Extract token from "Bearer <token>"
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid authorization format",
		})
	}

	tokenString := parts[1]

	// Verify token
	claims, err := utils.VerifyToken(tokenString)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid or expired token",
		})
	}

	// Get user from database
	var user models.User
	if err := config.DB.Preload("Role").First(&user, "id = ?", claims.UserID).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "User not found",
		})
	}

	// Check if user is active
	if !user.IsActive {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"error":   "Account is disabled",
		})
	}

	// Store user in context
	c.Locals("user", &user)
	c.Locals("userID", user.ID)

	return c.Next()
}

// GetCurrentUser retrieves the authenticated user from context
func GetCurrentUser(c *fiber.Ctx) (*models.User, error) {
	user, ok := c.Locals("user").(*models.User)
	if !ok || user == nil {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "User not authenticated")
	}
	return user, nil
}

// GetCurrentUserID retrieves the authenticated user ID from context
func GetCurrentUserID(c *fiber.Ctx) (uuid.UUID, error) {
	userID, ok := c.Locals("userID").(uuid.UUID)
	if !ok || userID == uuid.Nil {
		return uuid.Nil, fiber.NewError(fiber.StatusUnauthorized, "User ID not found")
	}
	return userID, nil
}
