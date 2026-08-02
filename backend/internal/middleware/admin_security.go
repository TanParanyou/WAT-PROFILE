package middleware

import (
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// AdminOriginGuard rejects admin auth requests whose Origin header is not
// explicitly allowed. Requests without an Origin header are assumed to come
// from trusted non-browser clients and are accepted.
func AdminOriginGuard(allowed []string) fiber.Handler {
	allowedSet := make(map[string]struct{}, len(allowed))
	for _, o := range allowed {
		allowedSet[strings.TrimSpace(o)] = struct{}{}
	}
	return func(c *fiber.Ctx) error {
		origin := c.Get("Origin")
		if origin == "" {
			return c.Next()
		}
		if _, ok := allowedSet[origin]; ok {
			return c.Next()
		}
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"error":   "Origin not allowed",
		})
	}
}

// ParseAdminAllowedOrigins parses a comma-separated list of explicit origins.
// Wildcard origins are rejected because they cannot be combined safely with
// credentialed requests.
func ParseAdminAllowedOrigins(value string) ([]string, error) {
	var origins []string
	for _, part := range strings.Split(value, ",") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		if strings.Contains(part, "*") {
			return nil, errors.New("wildcard origins are not allowed for credentialed admin auth")
		}
		origins = append(origins, part)
	}
	return origins, nil
}
