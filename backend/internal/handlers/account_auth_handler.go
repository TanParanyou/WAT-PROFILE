package handlers

import (
	"context"
	"errors"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/internal/storage"
	"github.com/watloungporsai/wat-profile-backend/pkg/logger"
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
	googleFlowCookie   = "wat_google_flow"
	googleCookiePath   = "/api/v1/accounts/google"
	maxAvatarFileSize  = 5 * 1024 * 1024
	maxAvatarDimension = 4096
)

// AccountAuthHandler exposes the public account API: registration, password
// sign-in, rotating sessions, recovery, profile, and Google sign-in.
type AccountAuthHandler struct {
	db            *gorm.DB
	registration  *services.AccountRegistrationService
	sessions      *services.AccountSessionService
	recovery      *services.AccountRecoveryService
	profile       *services.AccountProfileService
	credentials   *services.AccountCredentialsService
	lifecycle     *services.AccountLifecycleService
	google        *services.AccountGoogleService
	avatarStorage fileUploader
	cfg           config.AccountAuthConfig
	secret        []byte
}

// NewAccountAuthHandler wires the public account services into HTTP handlers.
func NewAccountAuthHandler(db *gorm.DB, cfg config.AccountAuthConfig, r2 *storage.R2Service) (*AccountAuthHandler, error) {
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
		db:            db,
		registration:  services.NewAccountRegistrationService(db, sender, clock, accountauth.NewOpaqueToken, security),
		sessions:      sessions,
		recovery:      services.NewAccountRecoveryService(db, sender, clock, accountauth.NewOpaqueToken, sessions, security),
		profile:       services.NewAccountProfileService(db, clock, sessions, security),
		credentials:   services.NewAccountCredentialsService(db, sender, clock, accountauth.NewOpaqueToken, sessions, security),
		lifecycle:     services.NewAccountLifecycleService(db, sender, clock, accountauth.NewOpaqueToken, security),
		google:        services.NewAccountGoogleService(db, clock, accountauth.NewOpaqueToken, sender, verifier, sessions, []byte(cfg.GoogleFlowSecret), cfg.FrontendURL, security),
		avatarStorage: avatarStorageFromR2(r2),
		cfg:           cfg,
		secret:        secret,
	}, nil
}

func avatarStorageFromR2(r2 *storage.R2Service) fileUploader {
	if r2 == nil {
		return nil
	}
	return r2
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
	if code == accountauth.CodeUnknown || code == accountauth.CodeInternal {
		logger.Log.Error().
			Err(err).
			Str("trace_id", traceID(c)).
			Str("method", c.Method()).
			Str("path", c.Path()).
			Msg("public account auth operation failed")
	}

	status := fiber.StatusInternalServerError
	switch code {
	case accountauth.CodeInvalidCredentials, accountauth.CodeVerificationRequired, accountauth.CodeTokenInvalid:
		status = fiber.StatusUnauthorized
	case accountauth.CodeAccountDisabled, accountauth.CodeReauthRequired:
		status = fiber.StatusForbidden
	case accountauth.CodeValidation:
		status = fiber.StatusBadRequest
	case accountauth.CodeEmailAlreadyRegistered, accountauth.CodeGoogleIdentityInUse, accountauth.CodeGoogleAlreadyLinked:
		status = fiber.StatusConflict
	case accountauth.CodeRateLimited, accountauth.CodeGoogleLinkPending:
		status = fiber.StatusTooManyRequests
	case accountauth.CodeGoogleEmailMismatch:
		status = fiber.StatusBadRequest
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
	var ae *accountauth.Error
	if errors.As(err, &ae) && ae.RetryAfter > 0 {
		envelope["retry_after_seconds"] = int64(ae.RetryAfter.Seconds())
	}
	if code == accountauth.CodeValidation {
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

// Reauthenticate verifies the current password and returns a fresh access
// token for the existing session. It does not rotate or create a refresh
// session; it only updates the token's auth_time for sensitive actions.
func (h *AccountAuthHandler) Reauthenticate(c *fiber.Ctx) error {
	var req struct {
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	rawSessionID, ok := c.Locals("session_id").(string)
	sessionID, err := uuid.Parse(rawSessionID)
	if !ok || err != nil {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, string(accountauth.CodeTokenInvalid), "The session is invalid or has expired.")
	}
	result, err := h.sessions.ReauthenticatePassword(c.UserContext(), mustLocalsUserID(c), sessionID, req.Password)
	if err != nil {
		return h.respondAccountError(c, err)
	}
	return utils.SuccessResponse(c, fiber.Map{
		"access_token": result.AccessToken,
		"expires_in":   int64(result.ExpiresIn / time.Second),
	})
}

// ChangePassword adds or replaces the current account password identity.
func (h *AccountAuthHandler) ChangePassword(c *fiber.Ctx) error {
	var req struct {
		NewPassword string `json:"new_password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	rawSessionID, ok := c.Locals("session_id").(string)
	sessionID, err := uuid.Parse(rawSessionID)
	if !ok || err != nil {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, string(accountauth.CodeTokenInvalid), "The session is invalid or has expired.")
	}
	authTime, _ := c.Locals("auth_time").(time.Time)
	result, err := h.sessions.ChangePassword(c.UserContext(), mustLocalsUserID(c), sessionID, authTime, req.NewPassword)
	if err != nil {
		return h.respondAccountError(c, err)
	}
	return utils.SuccessResponse(c, fiber.Map{"access_token": result.AccessToken, "expires_in": int64(result.ExpiresIn / time.Second)})
}

func (h *AccountAuthHandler) RequestEmailChange(c *fiber.Ctx) error {
	var req struct {
		NewEmail string `json:"new_email"`
		Locale   string `json:"locale"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	authTime, _ := c.Locals("auth_time").(time.Time)
	if err := h.credentials.RequestEmailChange(c.UserContext(), mustLocalsUserID(c), authTime, req.NewEmail, req.Locale); err != nil {
		return h.respondAccountError(c, err)
	}
	return utils.MessageResponse(c, "Email confirmation sent")
}

func (h *AccountAuthHandler) ConfirmEmailChange(c *fiber.Ctx) error {
	var req struct {
		Token string `json:"token"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.credentials.ConfirmEmailChange(c.UserContext(), req.Token); err != nil {
		return h.respondAccountError(c, err)
	}
	h.clearRefreshCookie(c)
	return utils.MessageResponse(c, "Email changed")
}

func (h *AccountAuthHandler) RequestReopen(c *fiber.Ctx) error {
	var req struct {
		Email  string `json:"email"`
		Locale string `json:"locale"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.lifecycle.RequestReopen(c.UserContext(), req.Email, req.Locale); err != nil {
		return h.respondAccountError(c, err)
	}
	return utils.MessageResponse(c, "If the account can be restored, a recovery link has been sent")
}

func (h *AccountAuthHandler) ConfirmReopen(c *fiber.Ctx) error {
	var req struct {
		Token string `json:"token"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.lifecycle.ConfirmReopen(c.UserContext(), req.Token); err != nil {
		return h.respondAccountError(c, err)
	}
	return utils.MessageResponse(c, "Account restored")
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

type fileDeleter interface {
	DeleteFile(ctx context.Context, filename string) error
}

// UploadAvatar handles POST /api/v1/account/avatar. The account endpoint has
// its own validation and storage namespace; it must never reuse the admin
// gallery upload route.
func (h *AccountAuthHandler) UploadAvatar(c *fiber.Ctx) error {
	if h.avatarStorage == nil {
		return h.respondAccountError(c, accountauth.NewError(accountauth.CodeInternal, "Avatar storage is not configured."))
	}

	file, err := c.FormFile("file")
	if err != nil {
		return h.respondAccountError(c, accountauth.NewFieldError(accountauth.CodeValidation, "file", "An avatar image is required."))
	}
	if file.Size <= 0 || file.Size > maxAvatarFileSize {
		return h.respondAccountError(c, accountauth.NewFieldError(accountauth.CodeValidation, "file", fmt.Sprintf("Avatar image must be smaller than %d MB.", maxAvatarFileSize/(1024*1024))))
	}

	src, err := file.Open()
	if err != nil {
		return h.respondAccountError(c, accountauth.NewError(accountauth.CodeInternal, "Failed to open avatar image."))
	}
	defer src.Close()

	contentType, format, err := inspectAvatar(src)
	if err != nil {
		return h.respondAccountError(c, accountauth.NewFieldError(accountauth.CodeValidation, "file", "Use a valid JPEG or PNG image."))
	}
	if format != "jpeg" && format != "png" {
		return h.respondAccountError(c, accountauth.NewFieldError(accountauth.CodeValidation, "file", "Use a valid JPEG or PNG image."))
	}

	if _, err := src.Seek(0, io.SeekStart); err != nil {
		return h.respondAccountError(c, accountauth.NewError(accountauth.CodeInternal, "Failed to read avatar image."))
	}
	config, _, err := image.DecodeConfig(src)
	if err != nil || config.Width <= 0 || config.Height <= 0 || config.Width > maxAvatarDimension || config.Height > maxAvatarDimension {
		return h.respondAccountError(c, accountauth.NewFieldError(accountauth.CodeValidation, "file", fmt.Sprintf("Avatar dimensions must be no larger than %d×%d pixels.", maxAvatarDimension, maxAvatarDimension)))
	}
	if _, err := src.Seek(0, io.SeekStart); err != nil {
		return h.respondAccountError(c, accountauth.NewError(accountauth.CodeInternal, "Failed to read avatar image."))
	}

	userID := mustLocalsUserID(c)
	extension := "." + format
	if format == "jpeg" {
		extension = ".jpg"
	}
	objectKey := fmt.Sprintf("accounts/%s/avatar/%s%s", userID.String(), uuid.NewString(), extension)
	avatarURL, err := h.avatarStorage.UploadFile(c.UserContext(), src, objectKey, contentType)
	if err != nil {
		logger.Log.Error().Err(err).Str("user_id", userID.String()).Msg("failed to upload account avatar")
		return h.respondAccountError(c, accountauth.NewError(accountauth.CodeInternal, "Failed to upload avatar image."))
	}

	account, err := h.profile.SetAvatar(c.UserContext(), userID, avatarURL, objectKey)
	if err != nil {
		if deleter, ok := h.avatarStorage.(fileDeleter); ok {
			if deleteErr := deleter.DeleteFile(c.UserContext(), objectKey); deleteErr != nil {
				logger.Log.Error().Err(deleteErr).Str("object_key", objectKey).Msg("failed to clean up account avatar object")
			}
		}
		return h.respondAccountError(c, err)
	}
	h.cleanupPendingAvatarObjects(c.UserContext(), userID)

	return utils.SuccessResponse(c, account)
}

// cleanupPendingAvatarObjects retries replacement deletes without making a
// successful avatar upload fail when the object store is temporarily down.
// Failed rows deliberately remain for the next upload or retention command.
func (h *AccountAuthHandler) cleanupPendingAvatarObjects(ctx context.Context, userID uuid.UUID) {
	deleter, ok := h.avatarStorage.(fileDeleter)
	if !ok {
		return
	}
	pending, err := h.profile.PendingAvatarCleanup(ctx, userID)
	if err != nil {
		logger.Log.Warn().Err(err).Str("user_id", userID.String()).Msg("failed to load pending account avatar cleanup")
		return
	}
	for _, item := range pending {
		if err := deleter.DeleteFile(ctx, item.ObjectKey); err != nil {
			logger.Log.Warn().Err(err).Str("object_key", item.ObjectKey).Msg("failed to delete previous account avatar")
			continue
		}
		if err := h.profile.MarkAvatarCleanupDeleted(ctx, userID, item.ID); err != nil {
			logger.Log.Warn().Err(err).Str("object_key", item.ObjectKey).Msg("failed to mark account avatar cleanup complete")
		}
	}
}

func inspectAvatar(src multipart.File) (string, string, error) {
	header := make([]byte, 512)
	n, err := src.Read(header)
	if err != nil && err != io.EOF && err != io.ErrUnexpectedEOF {
		return "", "", err
	}
	if n == 0 {
		return "", "", errors.New("empty avatar image")
	}
	contentType := http.DetectContentType(header[:n])
	switch contentType {
	case "image/jpeg", "image/png":
	default:
		return "", "", errors.New("unsupported avatar content type")
	}
	if _, err := src.Seek(0, io.SeekStart); err != nil {
		return "", "", err
	}
	_, format, err := image.DecodeConfig(src)
	if err != nil {
		return "", "", err
	}
	return contentType, format, nil
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
	authTime, _ := c.Locals("auth_time").(time.Time)
	userID := mustLocalsUserID(c)
	var profile models.AccountProfile
	_ = h.db.WithContext(c.UserContext()).Where("user_id = ?", userID).First(&profile).Error
	previousObjectKey := profile.AvatarObjectKey
	if err := h.profile.CloseAccount(c.UserContext(), userID, authTime); err != nil {
		return h.respondAccountError(c, err)
	}
	if previousObjectKey != "" && strings.HasPrefix(previousObjectKey, "accounts/"+userID.String()+"/avatar/") {
		if deleter, ok := h.avatarStorage.(fileDeleter); ok {
			if err := deleter.DeleteFile(c.UserContext(), previousObjectKey); err != nil {
				logger.Log.Warn().Err(err).Str("object_key", previousObjectKey).Msg("failed to delete account avatar during closure")
			} else {
				// The profile URL is already blanked by CloseAccount. Clear the
				// internal key only after the object store confirms deletion so the
				// retention command can retry a failed delete.
				_ = h.profile.ClearAvatarObjectKey(c.UserContext(), userID)
			}
		}
	}
	h.cleanupPendingAvatarObjects(c.UserContext(), userID)
	var user models.User
	if err := h.db.WithContext(c.UserContext()).First(&user, "id = ?", userID).Error; err != nil {
		return h.respondAccountError(c, err)
	}
	h.clearRefreshCookie(c)
	return utils.SuccessResponse(c, fiber.Map{"purge_after": user.PurgeAfter})
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

// GoogleLinkStart handles GET /api/v1/accounts/google/link/start. It binds the
// OAuth state to the currently authenticated public account.
func (h *AccountAuthHandler) GoogleLinkStart(c *fiber.Ctx) error {
	locale := c.Query("locale", "en")
	returnTo := c.Query("return_to")
	authTime := time.Now()
	if raw, ok := c.Locals("auth_time").(time.Time); ok {
		authTime = raw
	}
	result, err := h.google.StartGoogleLink(c.UserContext(), mustLocalsUserID(c), authTime, locale, returnTo)
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

// GoogleReauthStart handles GET /api/v1/accounts/google/reauth/start. It
// binds the OAuth assertion to the current account so a different Google
// identity cannot accidentally close another account after the callback.
func (h *AccountAuthHandler) GoogleReauthStart(c *fiber.Ctx) error {
	locale := c.Query("locale", "en")
	returnTo := c.Query("return_to")
	result, err := h.google.StartGoogleReauthentication(c.UserContext(), mustLocalsUserID(c), locale, returnTo)
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

// GoogleLinkStatus handles GET /api/v1/accounts/google/link/status.
func (h *AccountAuthHandler) GoogleLinkStatus(c *fiber.Ctx) error {
	status, err := h.google.GoogleLinkStatus(c.UserContext(), mustLocalsUserID(c))
	if err != nil {
		return h.respondAccountError(c, err)
	}
	return utils.SuccessResponse(c, fiber.Map{
		"connected":           status.Connected,
		"pending":             status.Pending,
		"retry_after_seconds": int64(status.RetryAfter.Seconds()),
	})
}

// GoogleUnlink handles DELETE /api/v1/account/providers/google after recent
// authentication. The endpoint has no credential payload.
func (h *AccountAuthHandler) GoogleUnlink(c *fiber.Ctx) error {
	authTime := time.Now()
	if raw, ok := c.Locals("auth_time").(time.Time); ok {
		authTime = raw
	}
	if err := h.profile.UnlinkGoogle(c.UserContext(), mustLocalsUserID(c), authTime); err != nil {
		return h.respondAccountError(c, err)
	}
	return utils.MessageResponse(c, "Google identity disconnected")
}

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
	accounts.Post("/reauthenticate", middleware.AccountOriginGuard(allowedOrigins), middleware.PublicAccountRequired(h.db, h.secret), h.Reauthenticate)
	accounts.Post("/forgot-password", h.ForgotPassword)
	accounts.Post("/reset-password", h.ResetPassword)
	accounts.Post("/confirm-email-change", h.ConfirmEmailChange)
	accounts.Post("/reopen-request", h.RequestReopen)
	accounts.Post("/reopen-confirm", h.ConfirmReopen)
	accounts.Post("/logout", middleware.AccountOriginGuard(allowedOrigins), middleware.PublicAccountRequired(h.db, h.secret), h.Logout)
	accounts.Post("/logout-all", middleware.AccountOriginGuard(allowedOrigins), middleware.PublicAccountRequired(h.db, h.secret), h.LogoutAll)
	accounts.Get("/google/start", h.GoogleStart)
	accounts.Get("/google/link/start", middleware.AccountOriginGuard(allowedOrigins), middleware.PublicAccountRequired(h.db, h.secret), h.GoogleLinkStart)
	accounts.Get("/google/reauth/start", middleware.AccountOriginGuard(allowedOrigins), middleware.PublicAccountRequired(h.db, h.secret), h.GoogleReauthStart)
	accounts.Get("/google/link/status", middleware.PublicAccountRequired(h.db, h.secret), h.GoogleLinkStatus)
	accounts.Get("/google/callback", middleware.AccountOriginGuard(allowedOrigins), h.GoogleCallback)
	accounts.Post("/google/link/confirm", h.GoogleLinkConfirm)

	account := api.Group("/account", middleware.PublicAccountRequired(h.db, h.secret))
	account.Get("/", h.GetAccount)
	account.Patch("/profile", h.UpdateProfile)
	account.Post("/avatar", h.UploadAvatar)
	account.Get("/sessions", h.ListSessions)
	account.Delete("/sessions/:id", h.RevokeSession)
	account.Delete("/providers/google", h.GoogleUnlink)
	account.Post("/close", h.CloseAccount)
	account.Post("/password", h.ChangePassword)
	account.Post("/email-change", h.RequestEmailChange)
}

func mustLocalsUserID(c *fiber.Ctx) uuid.UUID {
	if id, ok := c.Locals("userID").(uuid.UUID); ok {
		return id
	}
	return uuid.UUID{}
}
