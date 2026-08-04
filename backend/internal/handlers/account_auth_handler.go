package handlers

import (
	"errors"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

const (
	// publicRefreshCookie is the HttpOnly cookie carrying the rotating public
	// account refresh token. It is restricted to the account API path and
	// never read from the JSON body.
	publicRefreshCookie = "wat_public_refresh"
	publicCookiePath    = "/api/v1/accounts"
	// googleFlowCookie carries the signed short-lived Google OAuth flow state.
	googleFlowCookie = "wat_google_flow"
	googleCookiePath = "/api/v1/accounts/google"
)

// AccountAuthHandler exposes the public account API: registration, password
// sign-in, rotating sessions, recovery, profile, and Google sign-in.
type AccountAuthHandler struct {
	db           *gorm.DB
	registration *services.AccountRegistrationService
	sessions     *services.AccountSessionService
	recovery     *services.AccountRecoveryService
	profile      *services.AccountProfileService
	google       *services.AccountGoogleService
	cfg          config.AccountAuthConfig
	secret       []byte
}

// NewAccountAuthHandler wires the public account services into HTTP handlers.
func NewAccountAuthHandler(db *gorm.DB, cfg config.AccountAuthConfig) (*AccountAuthHandler, error) {
	sender, err := services.NewAccountEmailSender(cfg)
	if err != nil {
		return nil, err
	}
	verifier, err := accountauth.NewGoogleVerifier(cfg.GoogleClientID, cfg.GoogleSecret, cfg.GoogleRedirectURL)
	if err != nil {
		return nil, err
	}

	secret := []byte(os.Getenv("JWT_SECRET"))
	clock := accountauth.SystemClock{}
	issuer := accountauth.NewAccessTokenIssuer(secret, clock, cfg.AccessTTL)
	security := services.NewAccountSecurityService(db, clock)
	sessions := services.NewAccountSessionService(db, clock, accountauth.NewOpaqueToken, issuer, cfg.RefreshTTL, security)

	return &AccountAuthHandler{
		db:           db,
		registration: services.NewAccountRegistrationService(db, sender, clock, accountauth.NewOpaqueToken, security),
		sessions:     sessions,
		recovery:     services.NewAccountRecoveryService(db, sender, clock, accountauth.NewOpaqueToken, sessions, security),
		profile:      services.NewAccountProfileService(db, clock, sessions, security),
		google:       services.NewAccountGoogleService(db, clock, accountauth.NewOpaqueToken, sender, verifier, sessions, []byte(cfg.GoogleFlowSecret), cfg.FrontendURL, security),
		cfg:          cfg,
		secret:       secret,
	}, nil
}

func (h *AccountAuthHandler) clientInfo(c *fiber.Ctx) accountauth.ClientInfo {
	return accountauth.ClientInfo{
		IP:        c.IP(),
		UserAgent: c.Get("User-Agent"),
		TraceID:   traceID(c),
	}
}

func traceID(c *fiber.Ctx) string {
	if id, ok := c.Locals("trace_id").(string); ok && id != "" {
		return id
	}
	return c.GetRespHeader("X-Trace-Id")
}

// publicRefreshCookieOptions returns the shared cookie configuration so set and
// clear paths cannot drift.
func (h *AccountAuthHandler) publicRefreshCookieOptions() *fiber.Cookie {
	return &fiber.Cookie{
		Name:     publicRefreshCookie,
		Path:     publicCookiePath,
		HTTPOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: fiber.CookieSameSiteLaxMode,
	}
}

func (h *AccountAuthHandler) setRefreshCookie(c *fiber.Ctx, value string) {
	cookie := h.publicRefreshCookieOptions()
	cookie.Value = value
	cookie.MaxAge = int(h.cfg.RefreshTTL.Seconds())
	c.Cookie(cookie)
}

func (h *AccountAuthHandler) clearRefreshCookie(c *fiber.Ctx) {
	cookie := h.publicRefreshCookieOptions()
	cookie.Value = ""
	cookie.Expires = time.Unix(1, 0)
	c.Cookie(cookie)
}

func (h *AccountAuthHandler) clearGoogleFlowCookie(c *fiber.Ctx) {
	c.Cookie(&fiber.Cookie{
		Name:     googleFlowCookie,
		Path:     googleCookiePath,
		HTTPOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: fiber.CookieSameSiteLaxMode,
		Value:    "",
		Expires:  time.Unix(1, 0),
	})
}

// fieldError mirrors the typed validation error in the response envelope.
type fieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// respondAccountError maps a service error into the standard envelope with the
// stable auth code. Internal/unknown errors never leak details.
func (h *AccountAuthHandler) respondAccountError(c *fiber.Ctx, err error) error {
	code := accountauth.ErrorCode(err)
	msg := err.Error()

	status := fiber.StatusInternalServerError
	switch code {
	case accountauth.CodeInvalidCredentials, accountauth.CodeVerificationRequired, accountauth.CodeTokenInvalid:
		status = fiber.StatusUnauthorized
	case accountauth.CodeAccountDisabled, accountauth.CodeReauthRequired:
		status = fiber.StatusForbidden
	case accountauth.CodeValidation:
		status = fiber.StatusBadRequest
	case accountauth.CodeEmailAlreadyRegistered:
		status = fiber.StatusConflict
	case accountauth.CodeRateLimited:
		status = fiber.StatusTooManyRequests
	case accountauth.CodeInternal, accountauth.CodeUnknown:
		msg = "An internal error occurred"
	default:
		code = accountauth.CodeInternal
		msg = "An internal error occurred"
	}

	envelope := fiber.Map{
		"success":  false,
		"error":    msg,
		"code":     code,
		"trace_id": traceID(c),
	}
	if code == accountauth.CodeValidation {
		var ae *accountauth.Error
		if errors.As(err, &ae) && ae.Field != "" {
			envelope["field_errors"] = []fieldError{{Field: ae.Field, Message: ae.Message}}
		} else {
			envelope["field_errors"] = []fieldError{}
		}
	}
	return c.Status(status).JSON(envelope)
}

// Register handles POST /api/v1/accounts/register.
func (h *AccountAuthHandler) Register(c *fiber.Ctx) error {
	var req struct {
		Email       string `json:"email"`
		Password    string `json:"password"`
		DisplayName string `json:"display_name"`
		Locale      string `json:"locale"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	err := h.registration.RegisterPassword(c.UserContext(), services.RegisterPasswordInput{
		Email:       req.Email,
		Password:    req.Password,
		DisplayName: req.DisplayName,
		Locale:      req.Locale,
		Client:      h.clientInfo(c),
	})
	if err != nil {
		return h.respondAccountError(c, err)
	}
	return utils.MessageResponse(c, "Verification email sent")
}

// VerifyEmail handles POST /api/v1/accounts/verify-email.
func (h *AccountAuthHandler) VerifyEmail(c *fiber.Ctx) error {
	var req struct {
		Token string `json:"token"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.registration.VerifyEmail(c.UserContext(), req.Token); err != nil {
		return h.respondAccountError(c, err)
	}
	return utils.MessageResponse(c, "Email verified")
}

// ResendVerification handles POST /api/v1/accounts/resend-verification.
func (h *AccountAuthHandler) ResendVerification(c *fiber.Ctx) error {
	var req struct {
		Email  string `json:"email"`
		Locale string `json:"locale"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.registration.ResendVerification(c.UserContext(), req.Email, req.Locale); err != nil {
		return h.respondAccountError(c, err)
	}
	return utils.MessageResponse(c, "Verification email sent")
}

// Login handles POST /api/v1/accounts/login. Success returns the access token
// in the body and stores the rotating refresh token in an HttpOnly cookie.
func (h *AccountAuthHandler) Login(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	result, err := h.sessions.LoginPassword(c.UserContext(), accountauth.LoginPasswordInput{
		Email:    req.Email,
		Password: req.Password,
		Client:   h.clientInfo(c),
	})
	if err != nil {
		return h.respondAccountError(c, err)
	}

	h.setRefreshCookie(c, result.RefreshToken)
	return utils.SuccessResponse(c, fiber.Map{
		"access_token": result.AccessToken,
		"expires_in":   int64(result.ExpiresIn / time.Second),
	})
}

// Refresh handles POST /api/v1/accounts/refresh using the HttpOnly cookie.
func (h *AccountAuthHandler) Refresh(c *fiber.Ctx) error {
	credential := c.Cookies(publicRefreshCookie)
	if credential == "" {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, string(accountauth.CodeTokenInvalid), "Session is invalid or expired")
	}
	result, err := h.sessions.Refresh(c.UserContext(), credential, h.clientInfo(c))
	if err != nil {
		h.clearRefreshCookie(c)
		return h.respondAccountError(c, err)
	}
	h.setRefreshCookie(c, result.RefreshToken)
	return utils.SuccessResponse(c, fiber.Map{
		"access_token": result.AccessToken,
		"expires_in":   int64(result.ExpiresIn / time.Second),
	})
}

// ForgotPassword handles POST /api/v1/accounts/forgot-password.
func (h *AccountAuthHandler) ForgotPassword(c *fiber.Ctx) error {
	var req struct {
		Email  string `json:"email"`
		Locale string `json:"locale"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.recovery.RequestPasswordReset(c.UserContext(), req.Email, req.Locale, h.clientInfo(c)); err != nil {
		return h.respondAccountError(c, err)
	}
	return utils.MessageResponse(c, "If that email is registered, a reset link has been sent")
}

// ResetPassword handles POST /api/v1/accounts/reset-password.
func (h *AccountAuthHandler) ResetPassword(c *fiber.Ctx) error {
	var req struct {
		Token       string `json:"token"`
		NewPassword string `json:"new_password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.recovery.ResetPassword(c.UserContext(), req.Token, req.NewPassword, h.clientInfo(c)); err != nil {
		return h.respondAccountError(c, err)
	}
	return utils.MessageResponse(c, "Password reset")
}

// Logout handles POST /api/v1/accounts/logout.
func (h *AccountAuthHandler) Logout(c *fiber.Ctx) error {
	userID := mustLocalsUserID(c)
	credential := c.Cookies(publicRefreshCookie)
	if credential != "" {
		_ = h.sessions.Logout(c.UserContext(), userID, credential)
	}
	h.clearRefreshCookie(c)
	return utils.MessageResponse(c, "Logged out")
}

// LogoutAll handles POST /api/v1/accounts/logout-all.
func (h *AccountAuthHandler) LogoutAll(c *fiber.Ctx) error {
	userID := mustLocalsUserID(c)
	if err := h.sessions.LogoutAll(c.UserContext(), userID); err != nil {
		return h.respondAccountError(c, err)
	}
	h.clearRefreshCookie(c)
	return utils.MessageResponse(c, "Logged out everywhere")
}

// GetAccount handles GET /api/v1/account.
func (h *AccountAuthHandler) GetAccount(c *fiber.Ctx) error {
	account, err := h.profile.GetAccount(c.UserContext(), mustLocalsUserID(c))
	if err != nil {
		return h.respondAccountError(c, err)
	}
	return utils.SuccessResponse(c, account)
}

// UpdateProfile handles PATCH /api/v1/account/profile.
func (h *AccountAuthHandler) UpdateProfile(c *fiber.Ctx) error {
	var req services.UpdateProfileInput
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	account, err := h.profile.UpdateProfile(c.UserContext(), mustLocalsUserID(c), req)
	if err != nil {
		return h.respondAccountError(c, err)
	}
	return utils.SuccessResponse(c, account)
}

// ListSessions handles GET /api/v1/account/sessions.
func (h *AccountAuthHandler) ListSessions(c *fiber.Ctx) error {
	currentID := uuid.UUID{}
	if raw, ok := c.Locals("session_id").(string); ok {
		if id, err := uuid.Parse(raw); err == nil {
			currentID = id
		}
	}
	sessions, err := h.sessions.ListSessions(c.UserContext(), mustLocalsUserID(c), currentID)
	if err != nil {
		return h.respondAccountError(c, err)
	}
	return utils.SuccessResponse(c, fiber.Map{"sessions": sessions})
}

// RevokeSession handles DELETE /api/v1/account/sessions/:id.
func (h *AccountAuthHandler) RevokeSession(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.CodedErrorResponse(c, fiber.StatusBadRequest, string(accountauth.CodeValidation), "Invalid session id")
	}
	if err := h.sessions.RevokeSession(c.UserContext(), mustLocalsUserID(c), sessionID); err != nil {
		return h.respondAccountError(c, err)
	}
	return utils.MessageResponse(c, "Session revoked")
}

// CloseAccount handles POST /api/v1/account/close.
func (h *AccountAuthHandler) CloseAccount(c *fiber.Ctx) error {
	var req struct {
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	authTime := time.Now()
	if raw, ok := c.Locals("auth_time").(time.Time); ok {
		authTime = raw
	}
	if err := h.profile.CloseAccount(c.UserContext(), mustLocalsUserID(c), authTime, req.Password); err != nil {
		return h.respondAccountError(c, err)
	}
	h.clearRefreshCookie(c)
	return utils.MessageResponse(c, "Account closed")
}

// GoogleStart handles GET /api/v1/accounts/google/start.
func (h *AccountAuthHandler) GoogleStart(c *fiber.Ctx) error {
	locale := c.Query("locale", "en")
	returnTo := c.Query("return_to")
	result, err := h.google.StartGoogle(c.UserContext(), locale, returnTo)
	if err != nil {
		return h.respondAccountError(c, err)
	}
	c.Cookie(&fiber.Cookie{
		Name:     googleFlowCookie,
		Value:    result.FlowCookie,
		Path:     googleCookiePath,
		HTTPOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: fiber.CookieSameSiteLaxMode,
		MaxAge:   int((10 * time.Minute).Seconds()),
	})
	return utils.SuccessResponse(c, fiber.Map{"authorization_url": result.AuthorizationURL})
}

// GoogleCallback handles GET /api/v1/accounts/google/callback. Success and
// error outcomes both redirect to the frontend; tokens never appear in URLs.
func (h *AccountAuthHandler) GoogleCallback(c *fiber.Ctx) error {
	code := c.Query("code")
	flowCookie := c.Cookies(googleFlowCookie)

	completion, err := h.google.CompleteGoogle(c.UserContext(), code, c.Query("state"), flowCookie, h.clientInfo(c))
	h.clearGoogleFlowCookie(c)
	if err != nil {
		authCode := accountauth.ErrorCode(err)
		return c.Redirect(h.cfg.FrontendURL + "/en/account/login?error=" + string(authCode))
	}

	if completion.Status == services.GoogleCompletionApprovalSent {
		return c.Redirect(h.cfg.FrontendURL + "/" + completion.Locale + "/account/link?status=approval_sent")
	}

	locale := completion.Locale
	if locale == "" {
		locale = "en"
	}
	returnTo := completion.ReturnTo
	if returnTo == "" || returnTo[0] != '/' {
		returnTo = "/account"
	}
	h.setRefreshCookie(c, completion.Session.RefreshToken)
	return c.Redirect(h.cfg.FrontendURL + "/" + locale + returnTo)
}

// GoogleLinkConfirm handles POST /api/v1/accounts/google/link/confirm.
func (h *AccountAuthHandler) GoogleLinkConfirm(c *fiber.Ctx) error {
	var req struct {
		Token string `json:"token"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	result, err := h.google.ConfirmGoogleLink(c.UserContext(), req.Token, h.clientInfo(c))
	if err != nil {
		return h.respondAccountError(c, err)
	}
	h.setRefreshCookie(c, result.RefreshToken)
	return utils.SuccessResponse(c, fiber.Map{
		"access_token": result.AccessToken,
		"expires_in":   int64(result.ExpiresIn / time.Second),
	})
}

// RegisterAccountRoutes mounts the public account API on the given router.
// It is a no-op when the handler or the feature flag is disabled, so callers
// (routes.go and tests) get consistent 404 behavior.
func RegisterAccountRoutes(api fiber.Router, h *AccountAuthHandler, allowedOrigins []string) {
	if h == nil || !h.cfg.Enabled {
		return
	}

	accounts := api.Group("/accounts")
	accounts.Post("/register", h.Register)
	accounts.Post("/verify-email", h.VerifyEmail)
	accounts.Post("/resend-verification", h.ResendVerification)
	accounts.Post("/login", h.Login)
	accounts.Post("/refresh", middleware.AccountOriginGuard(allowedOrigins), h.Refresh)
	accounts.Post("/forgot-password", h.ForgotPassword)
	accounts.Post("/reset-password", h.ResetPassword)
	accounts.Post("/logout", middleware.AccountOriginGuard(allowedOrigins), middleware.PublicAccountRequired(h.db, h.secret), h.Logout)
	accounts.Post("/logout-all", middleware.AccountOriginGuard(allowedOrigins), middleware.PublicAccountRequired(h.db, h.secret), h.LogoutAll)
	accounts.Get("/google/start", h.GoogleStart)
	accounts.Get("/google/callback", middleware.AccountOriginGuard(allowedOrigins), h.GoogleCallback)
	accounts.Post("/google/link/confirm", h.GoogleLinkConfirm)

	account := api.Group("/account", middleware.PublicAccountRequired(h.db, h.secret))
	account.Get("/", h.GetAccount)
	account.Patch("/profile", h.UpdateProfile)
	account.Get("/sessions", h.ListSessions)
	account.Delete("/sessions/:id", h.RevokeSession)
	account.Post("/close", h.CloseAccount)
}

func mustLocalsUserID(c *fiber.Ctx) uuid.UUID {
	if id, ok := c.Locals("userID").(uuid.UUID); ok {
		return id
	}
	return uuid.UUID{}
}
