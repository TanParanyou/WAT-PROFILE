package handlers

import (
	"errors"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

const (
	// adminRefreshCookie is the HttpOnly cookie carrying the opaque Admin
	// refresh credential. It is restricted to the Admin auth path and never
	// leaves it.
	adminRefreshCookie = "wat_admin_refresh"
	adminCookiePath    = "/api/v1/auth/admin"
)

// AdminAuthResponse is the body returned by Admin login and refresh. It never
// contains the refresh credential, which travels only in the HttpOnly cookie.
type AdminAuthResponse struct {
	AccessToken string      `json:"access_token"`
	User        models.User `json:"user"`
}

// AdminAuthHandler exposes Admin login, refresh, and logout.
type AdminAuthHandler struct {
	adminService *services.AdminAuthService
	auditService *services.AuditService
}

// NewAdminAuthHandler wires the Admin session service into HTTP handlers.
func NewAdminAuthHandler(db *gorm.DB) *AdminAuthHandler {
	return &AdminAuthHandler{
		adminService: services.NewAdminAuthService(db, time.Now),
		auditService: services.NewAuditService(db),
	}
}

// adminSessionIDFromCredential extracts the session UUID from an opaque refresh
// credential for audit attribution. It returns an empty string when the
// credential is malformed.
func adminSessionIDFromCredential(credential string) string {
	sessionID, _, err := utils.ParseAdminRefreshCredential(credential)
	if err != nil {
		return ""
	}
	return sessionID.String()
}

func adminCookieSecure() bool {
	return os.Getenv("ADMIN_COOKIE_SECURE") == "true"
}

// adminRefreshCookieOptions returns the shared cookie configuration so set and
// clear paths cannot drift.
func (h *AdminAuthHandler) adminRefreshCookieOptions() *fiber.Cookie {
	return &fiber.Cookie{
		Name:     adminRefreshCookie,
		Path:     adminCookiePath,
		HTTPOnly: true,
		Secure:   adminCookieSecure(),
		SameSite: fiber.CookieSameSiteStrictMode,
	}
}

// setAdminRefreshCookie stores a new refresh credential, expiring with the
// server-side Admin session.
func (h *AdminAuthHandler) setAdminRefreshCookie(c *fiber.Ctx, value string) {
	cookie := h.adminRefreshCookieOptions()
	cookie.Value = value
	cookie.MaxAge = int(h.adminService.SessionTTL().Seconds())
	c.Cookie(cookie)
}

// clearAdminRefreshCookie removes the refresh cookie regardless of whether the
// presented credential was valid.
func (h *AdminAuthHandler) clearAdminRefreshCookie(c *fiber.Ctx) {
	cookie := h.adminRefreshCookieOptions()
	cookie.Value = ""
	cookie.Expires = time.Unix(1, 0)
	c.Cookie(cookie)
}

// Login authenticates an eligible Admin. Success returns a short-lived access
// token in the body and stores the refresh credential in an HttpOnly cookie.
func (h *AdminAuthHandler) Login(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if req.Email == "" || req.Password == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Email and password are required")
	}

	result, err := h.adminService.LoginAdmin(req.Email, req.Password, c.IP(), c.Get("User-Agent"))
	if err != nil {
		_ = h.auditService.LogSecurityEvent(c, "admin.login.failure", "credentials_or_eligibility", "admin_auth", "")
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "ADMIN_INVALID_CREDENTIALS", "Invalid email or password")
	}

	_ = h.auditService.LogSecurityEvent(c, "admin.login.success", "login_success", "admin_auth", result.SessionID.String())
	h.setAdminRefreshCookie(c, result.RefreshCredential)
	return utils.SuccessResponse(c, AdminAuthResponse{
		AccessToken: result.AccessToken,
		User:        *result.User,
	})
}

// Refresh rotates the Admin session using the HttpOnly cookie. It never reads
// credentials from the JSON body.
func (h *AdminAuthHandler) Refresh(c *fiber.Ctx) error {
	credential := c.Cookies(adminRefreshCookie)
	if credential == "" {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "ADMIN_SESSION_INVALID", "Admin session is invalid or expired")
	}

	result, err := h.adminService.RefreshAdmin(credential)
	if err != nil {
		h.clearAdminRefreshCookie(c)
		sessionID := adminSessionIDFromCredential(credential)
		if errors.Is(err, services.ErrAdminSessionReused) {
			_ = h.auditService.LogSecurityEvent(c, "admin.session.reuse_detected", "session_reuse", "admin_session", sessionID)
			return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "ADMIN_SESSION_REUSED", "Admin session reuse detected")
		}
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "ADMIN_SESSION_INVALID", "Admin session is invalid or expired")
	}

	h.setAdminRefreshCookie(c, result.RefreshCredential)
	return utils.SuccessResponse(c, AdminAuthResponse{
		AccessToken: result.AccessToken,
		User:        *result.User,
	})
}

// Logout revokes the Admin session and always clears the cookie, even when the
// presented credential is invalid or already expired.
func (h *AdminAuthHandler) Logout(c *fiber.Ctx) error {
	credential := c.Cookies(adminRefreshCookie)
	sessionID := adminSessionIDFromCredential(credential)
	if credential != "" {
		if err := h.adminService.RevokeAdminSession(credential, "logout"); err == nil {
			_ = h.auditService.LogSecurityEvent(c, "admin.session.revoked", "session_revoked", "admin_session", sessionID)
		}
	}
	_ = h.auditService.LogSecurityEvent(c, "admin.logout", "logout", "admin_auth", sessionID)
	h.clearAdminRefreshCookie(c)
	return utils.MessageResponse(c, "Logged out successfully")
}
