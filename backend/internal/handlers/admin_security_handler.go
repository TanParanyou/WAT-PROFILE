package handlers

import (
	"errors"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type AdminSecurityHandler struct {
	db           *gorm.DB
	totpService  *services.TOTPService
	alertService *services.SecurityAlertService
	auditService *services.AuditService
}

func NewAdminSecurityHandler(db *gorm.DB, sender accountauth.EmailSender) *AdminSecurityHandler {
	return &AdminSecurityHandler{
		db:           db,
		totpService:  services.NewTOTPService(db),
		alertService: services.NewSecurityAlertService(db, sender),
		auditService: services.NewAuditService(db),
	}
}

func (h *AdminSecurityHandler) getUser(c *fiber.Ctx) (*models.User, error) {
	val := c.Locals("user_id")
	if val == nil {
		return nil, errors.New("unauthorized")
	}

	var userID uuid.UUID
	switch v := val.(type) {
	case uuid.UUID:
		userID = v
	case string:
		var err error
		userID, err = uuid.Parse(v)
		if err != nil {
			return nil, errors.New("invalid user id")
		}
	default:
		return nil, errors.New("unauthorized")
	}

	var user models.User
	if err := h.db.Preload("Role").First(&user, userID).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// Setup2FA initiates the 2FA setup by generating a secret and otpauth URI
func (h *AdminSecurityHandler) Setup2FA(c *fiber.Ctx) error {
	user, err := h.getUser(c)
	if err != nil {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
	}

	secret, err := h.totpService.GenerateSecret()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to generate 2FA secret")
	}

	otpauthURI := h.totpService.GenerateOTPAuthURI(secret, user.Email)

	return utils.SuccessResponse(c, fiber.Map{
		"secret":      secret,
		"otpauth_uri": otpauthURI,
	})
}

// Verify2FASetup verifies the initial OTP from the authenticator app and activates 2FA
func (h *AdminSecurityHandler) Verify2FASetup(c *fiber.Ctx) error {
	user, err := h.getUser(c)
	if err != nil {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
	}

	var req struct {
		Secret string `json:"secret"`
		Code   string `json:"code"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if req.Secret == "" || req.Code == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Secret and verification code are required")
	}

	if !h.totpService.ValidateCode(req.Secret, req.Code) {
		return utils.CodedErrorResponse(c, fiber.StatusBadRequest, "INVALID_2FA_CODE", "Invalid verification code. Please check your app time.")
	}

	now := time.Now()
	var backupCodes []string

	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(user).Updates(map[string]interface{}{
			"totp_secret":      req.Secret,
			"totp_enabled":     true,
			"totp_verified_at": now,
		}).Error; err != nil {
			return err
		}

		codes, err := h.totpService.GenerateBackupCodes(tx, user.ID)
		if err != nil {
			return err
		}
		backupCodes = codes
		return nil
	})

	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to activate 2FA")
	}

	_ = h.auditService.LogSecurityEvent(c, "admin.2fa.enabled", "2fa_enabled", "user", user.ID.String())
	h.alertService.NotifySecurityChange(c.Context(), user, "2fa_enabled")

	return utils.SuccessResponse(c, fiber.Map{
		"message":      "Two-factor authentication enabled successfully",
		"backup_codes": backupCodes,
	})
}

// Disable2FA disables 2FA after confirming password and OTP
func (h *AdminSecurityHandler) Disable2FA(c *fiber.Ctx) error {
	user, err := h.getUser(c)
	if err != nil {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
	}

	var req struct {
		Password string `json:"password"`
		Code     string `json:"code"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if req.Password == "" || req.Code == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Password and verification code are required")
	}

	if user.PasswordHash == nil || !utils.CheckPasswordHash(req.Password, *user.PasswordHash) {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "INVALID_PASSWORD", "Invalid current password")
	}

	if user.TOTPSecret == nil || !h.totpService.ValidateCode(*user.TOTPSecret, req.Code) {
		used, err := h.totpService.ValidateAndConsumeBackupCode(user.ID, req.Code)
		if err != nil || !used {
			return utils.CodedErrorResponse(c, fiber.StatusBadRequest, "INVALID_2FA_CODE", "Invalid verification code")
		}
	}

	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(user).Updates(map[string]interface{}{
			"totp_secret":      nil,
			"totp_enabled":     false,
			"totp_verified_at": nil,
		}).Error; err != nil {
			return err
		}

		return tx.Where("user_id = ?", user.ID).Delete(&models.UserBackupCode{}).Error
	})

	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to disable 2FA")
	}

	_ = h.auditService.LogSecurityEvent(c, "admin.2fa.disabled", "2fa_disabled", "user", user.ID.String())
	h.alertService.NotifySecurityChange(c.Context(), user, "2fa_disabled")

	return utils.MessageResponse(c, "Two-factor authentication disabled successfully")
}

// RegenerateBackupCodes issues a new set of backup recovery codes
func (h *AdminSecurityHandler) RegenerateBackupCodes(c *fiber.Ctx) error {
	user, err := h.getUser(c)
	if err != nil {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
	}

	if !user.TOTPEnabled {
		return utils.CodedErrorResponse(c, fiber.StatusBadRequest, "2FA_NOT_ENABLED", "Two-factor authentication is not enabled")
	}

	var req struct {
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if req.Password == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Password is required")
	}

	if user.PasswordHash == nil || !utils.CheckPasswordHash(req.Password, *user.PasswordHash) {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "INVALID_PASSWORD", "Invalid current password")
	}

	var codes []string
	err = h.db.Transaction(func(tx *gorm.DB) error {
		c, err := h.totpService.GenerateBackupCodes(tx, user.ID)
		if err != nil {
			return err
		}
		codes = c
		return nil
	})

	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to regenerate backup codes")
	}

	_ = h.auditService.LogSecurityEvent(c, "admin.2fa.backup_codes_regenerated", "backup_codes_regenerated", "user", user.ID.String())
	h.alertService.NotifySecurityChange(c.Context(), user, "backup_codes_regenerated")

	return utils.SuccessResponse(c, fiber.Map{
		"message":      "Backup codes regenerated successfully",
		"backup_codes": codes,
	})
}

// GetSecurityPreferences returns current security notification preferences
func (h *AdminSecurityHandler) GetSecurityPreferences(c *fiber.Ctx) error {
	user, err := h.getUser(c)
	if err != nil {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
	}

	return utils.SuccessResponse(c, user.SecurityPreferences)
}

// UpdateSecurityPreferences updates user's notification preferences
func (h *AdminSecurityHandler) UpdateSecurityPreferences(c *fiber.Ctx) error {
	user, err := h.getUser(c)
	if err != nil {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
	}

	var prefs models.SecurityPreferences
	if err := c.BodyParser(&prefs); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.db.Model(user).Update("security_preferences", prefs).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update security preferences")
	}

	_ = h.auditService.LogSecurityEvent(c, "admin.security_preferences.updated", "security_preferences_updated", "user", user.ID.String())

	return utils.SuccessResponse(c, prefs)
}
