package middleware

import (
	"errors"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

// PublicAccountRequired verifies a public-account access token (aud=public-account)
// and loads the user. It rejects tokens issued for other audiences, inactive
// users, and accounts whose status is not active. The database handle is
// injected so tests never depend on config.DB.
func PublicAccountRequired(db *gorm.DB, secret []byte) fiber.Handler {
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

		claims, err := accountauth.VerifyPublicAccountToken(parts[1], secret)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "Invalid or expired access token",
			})
		}

		userID, err := uuid.Parse(claims.Subject)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "Invalid access token subject",
			})
		}

		var user models.User
		if err := db.First(&user, "id = ?", userID).Error; err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "User not found",
			})
		}

		if !user.IsActive || user.AccountStatus != models.AccountStatusActive {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"error":   "This account is not allowed to sign in.",
				"code":    string(accountauth.CodeAccountDisabled),
			})
		}

		sessionID, err := uuid.Parse(claims.SessionID)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "Invalid or expired access token",
				"code":    string(accountauth.CodeTokenInvalid),
			})
		}
		var session models.AuthSession
		if err := db.Where("id = ? AND user_id = ? AND revoked_at IS NULL AND expires_at > ?", sessionID, user.ID, time.Now()).First(&session).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"success": false,
					"error":   "Invalid or expired access token",
					"code":    string(accountauth.CodeTokenInvalid),
				})
			}
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"error":   "Authentication service unavailable",
				"code":    string(accountauth.CodeInternal),
			})
		}

		// Same locals contract as the admin middleware, plus the public session
		// id and auth time carried by the access token.
		c.Locals("user", &user)
		c.Locals("userID", user.ID)
		c.Locals("user_id", user.ID.String())
		c.Locals("session_id", claims.SessionID)
		c.Locals("auth_time", time.Unix(claims.AuthTime, 0))

		return c.Next()
	}
}

// PublicAccountOptional authenticates a supplied public-account bearer token
// while allowing anonymous requests to continue. A malformed or expired token
// is still rejected; an attempted authenticated request never silently becomes
// a guest request.
func PublicAccountOptional(db *gorm.DB, secret []byte) fiber.Handler {
	required := PublicAccountRequired(db, secret)
	return func(c *fiber.Ctx) error {
		if strings.TrimSpace(c.Get("Authorization")) == "" {
			return c.Next()
		}
		return required(c)
	}
}

// AccountOriginGuard restricts cookie-bearing account endpoints to the same
// origin or an explicit allowlist. Requests without an Origin header pass
// through (server-to-server and same-origin navigation).
func AccountOriginGuard(allowed []string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		origin := c.Get("Origin")
		if origin == "" {
			return c.Next()
		}
		for _, a := range allowed {
			if origin == a {
				return c.Next()
			}
		}
		if sameOrigin(c, origin) {
			return c.Next()
		}
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"error":   "Origin not allowed",
		})
	}
}
