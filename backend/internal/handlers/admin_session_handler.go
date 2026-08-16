package handlers

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type AdminSessionHandler struct {
	sessionService *services.AdminSessionService
	auditService   *services.AuditService
}

func NewAdminSessionHandler(db *gorm.DB) *AdminSessionHandler {
	return &AdminSessionHandler{
		sessionService: services.NewAdminSessionService(db),
		auditService:   services.NewAuditService(db),
	}
}

// currentSessionID extracts the active session UUID from the HttpOnly refresh cookie if present
func currentSessionID(c *fiber.Ctx) uuid.UUID {
	credential := c.Cookies(adminRefreshCookie)
	if credential == "" {
		return uuid.Nil
	}
	sessionID, _, err := utils.ParseAdminRefreshCredential(credential)
	if err != nil {
		return uuid.Nil
	}
	return sessionID
}

// GetSessions returns all active sessions for the currently authenticated admin
func (h *AdminSessionHandler) GetSessions(c *fiber.Ctx) error {
	val := c.Locals("user_id")
	if val == nil {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
	}

	var userID uuid.UUID
	switch v := val.(type) {
	case uuid.UUID:
		userID = v
	case string:
		var err error
		userID, err = uuid.Parse(v)
		if err != nil {
			return utils.CodedErrorResponse(c, fiber.StatusBadRequest, "INVALID_USER_ID", "Invalid user ID")
		}
	default:
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
	}

	currID := currentSessionID(c)
	sessions, err := h.sessionService.ListUserSessions(userID, currID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to retrieve active sessions")
	}

	return utils.SuccessResponse(c, sessions)
}

// RevokeSession revokes a single session belonging to the authenticated admin
func (h *AdminSessionHandler) RevokeSession(c *fiber.Ctx) error {
	val := c.Locals("user_id")
	if val == nil {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
	}

	var userID uuid.UUID
	switch v := val.(type) {
	case uuid.UUID:
		userID = v
	case string:
		var err error
		userID, err = uuid.Parse(v)
		if err != nil {
			return utils.CodedErrorResponse(c, fiber.StatusBadRequest, "INVALID_USER_ID", "Invalid user ID")
		}
	default:
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
	}

	targetIDStr := c.Params("id")
	targetID, err := uuid.Parse(targetIDStr)
	if err != nil {
		return utils.CodedErrorResponse(c, fiber.StatusBadRequest, "INVALID_SESSION_ID", "Invalid session ID")
	}

	if err := h.sessionService.RevokeUserSession(userID, targetID); err != nil {
		if errors.Is(err, services.ErrSessionNotFound) {
			return utils.CodedErrorResponse(c, fiber.StatusNotFound, "SESSION_NOT_FOUND", "Session not found or already revoked")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to revoke session")
	}

	_ = h.auditService.LogSecurityEvent(c, "admin.session.revoked", "session_revoked", "admin_session", targetID.String())
	return utils.MessageResponse(c, "Session revoked successfully")
}

// RevokeOtherSessions revokes all sessions for the admin except the current session
func (h *AdminSessionHandler) RevokeOtherSessions(c *fiber.Ctx) error {
	val := c.Locals("user_id")
	if val == nil {
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
	}

	var userID uuid.UUID
	switch v := val.(type) {
	case uuid.UUID:
		userID = v
	case string:
		var err error
		userID, err = uuid.Parse(v)
		if err != nil {
			return utils.CodedErrorResponse(c, fiber.StatusBadRequest, "INVALID_USER_ID", "Invalid user ID")
		}
	default:
		return utils.CodedErrorResponse(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
	}

	currID := currentSessionID(c)
	count, err := h.sessionService.RevokeOtherUserSessions(userID, currID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to revoke other sessions")
	}

	_ = h.auditService.LogSecurityEvent(c, "admin.sessions.revoked_other", "sessions_revoked", "admin_session", "")
	return utils.SuccessResponse(c, fiber.Map{
		"revoked_count": count,
		"message":       "Other sessions revoked successfully",
	})
}
