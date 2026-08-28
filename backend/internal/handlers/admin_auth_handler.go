package handlers

import (
	"errors"
	"os"
	"strings"
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

// AdminAuthResponse is the body returned by Admin login, refresh, and mfa verification.
type AdminAuthResponse struct {
	AccessToken string       `json:"access_token,omitempty"`
	User        *models.User `json:"user,omitempty"`
	MFARequired bool         `json:"mfa_required,omitempty"`
	MFAToken    string       `json:"mfa_token,omitempty"`
}

// AdminAuthHandler exposes Admin login, refresh, logout, and mfa verification.
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

func adminCookieSameSite() string {
	val := strings.ToLower(os.Getenv("ADMIN_COOKIE_SAMESITE"))
	switch val {
	case "none":
		return fiber.CookieSameSiteNoneMode
	case "lax":
		return fiber.CookieSameSiteLaxMode
	case "strict":
		return fiber.CookieSameSiteStrictMode
	default:
		// When running with HTTPS/Secure enabled (such as cross-domain Vercel to Render),
		// default to SameSite=None so modern browsers send credentials on refresh requests.
		if adminCookieSecure() {
			return fiber.CookieSameSiteNoneMode
		}
		return fiber.CookieSameSiteLaxMode
	}
}

// adminRefreshCookieOptions returns the shared cookie configuration so set and
// clear paths cannot drift.
func (h *AdminAuthHandler) adminRefreshCookieOptions() *fiber.Cookie {
	return &fiber.Cookie{
		Name:     adminRefreshCookie,
		Path:     adminCookiePath,
		HTTPOnly: true,
		Secure:   adminCookieSecure(),
		SameSite: adminCookieSameSite(),
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
// token in the body and stores the refresh credential in an HttpOnly cookie, or
// requires MFA challenge if 2FA is enabled.
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
		var loginErr *services.AdminLoginError
		if errors.As(err, &loginErr) {
			_ = h.auditService.LogSecurityEvent(c, "admin.login.failure", "credentials_or_eligibility", "admin_auth", "")
			details := map[string]interface{}{
				"remaining_attempts": loginErr.RemainingAttempts,
			}
			return utils.CodedErrorResponseWithDetails(c, fiber.StatusUnauthorized, "ADMIN_INVALID_CREDENTIALS", "Invalid email or password", details)
		}
		if errors.Is(err, services.ErrAdminAccountLocked) {
			_ = h.auditService.LogSecurityEvent(c, "admin.login.locked", "account_locked", "admin_auth", "")
			return utils.CodedErrorResponse(c, fiber.StatusForbidden, "ADMIN_ACCOUNT_LOCKED", "Account is temporarily locked due to too many failed login attempts. Please try again later.")
		}
		_ = h.auditService.LogSecurityEvent(c, "admin.login.failure", "credentials_or_eligibility", "admin_auth", "")
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "ADMIN_INVALID_CREDENTIALS", "Invalid email or password")
	}

	if result.MFARequired {
		_ = h.auditService.LogSecurityEvent(c, "admin.login.mfa_challenge", "mfa_challenge", "admin_auth", "")
		return utils.SuccessResponse(c, AdminAuthResponse{
			MFARequired: true,
			MFAToken:    result.MFAToken,
		})
	}

	_ = h.auditService.LogSecurityEvent(c, "admin.login.success", "login_success", "admin_auth", result.SessionID.String())
	h.setAdminRefreshCookie(c, result.RefreshCredential)
	return utils.SuccessResponse(c, AdminAuthResponse{
		AccessToken: result.AccessToken,
		User:        result.User,
	})
}

// MFAVerify handles 2FA TOTP code or backup code verification
func (h *AdminAuthHandler) MFAVerify(c *fiber.Ctx) error {
	var req struct {
		MFAToken string `json:"mfa_token"`
		Code     string `json:"code"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if req.MFAToken == "" || req.Code == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "MFA token and verification code are required")
	}

	result, err := h.adminService.VerifyAdminMFA(req.MFAToken, req.Code, c.IP(), c.Get("User-Agent"))
	if err != nil {
		_ = h.auditService.LogSecurityEvent(c, "admin.mfa.failure", "mfa_failure", "admin_auth", "")
		if errors.Is(err, services.ErrInvalidTOTPCode) {
			return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "ADMIN_MFA_INVALID_CODE", "Invalid or expired verification code")
		}
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "ADMIN_MFA_SESSION_INVALID", "MFA verification session is invalid or expired")
	}

	_ = h.auditService.LogSecurityEvent(c, "admin.mfa.success", "mfa_success", "admin_auth", result.SessionID.String())
	h.setAdminRefreshCookie(c, result.RefreshCredential)
	return utils.SuccessResponse(c, AdminAuthResponse{
		AccessToken: result.AccessToken,
		User:        result.User,
	})
}

// Refresh rotates the Admin session using the HttpOnly cookie. It never reads
// credentials from the JSON body.
func (h *AdminAuthHandler) Refresh(c *fiber.Ctx) error {
	credential := c.Cookies(adminRefreshCookie)
	if credential == "" {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "ADMIN_SESSION_INVALID", "Admin session is invalid or expired")
	}

	result, err := h.adminService.RefreshAdmin(credential, c.IP())
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
		User:        result.User,
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
