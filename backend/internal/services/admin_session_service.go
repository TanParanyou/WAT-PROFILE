package services

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

var (
	ErrSessionNotFound = errors.New("session not found")
)

type AdminSessionDTO struct {
	ID         uuid.UUID `json:"id"`
	IPAddress  string    `json:"ip_address"`
	UserAgent  string    `json:"user_agent"`
	LastUsedAt time.Time `json:"last_used_at"`
	ExpiresAt  time.Time `json:"expires_at"`
	IsCurrent  bool      `json:"is_current"`
	CreatedAt  time.Time `json:"created_at"`
}

type AdminSessionService struct {
	db *gorm.DB
}

func NewAdminSessionService(db *gorm.DB) *AdminSessionService {
	return &AdminSessionService{db: db}
}

// ListUserSessions returns all active, non-expired, non-revoked sessions for the user
func (s *AdminSessionService) ListUserSessions(userID uuid.UUID, currentSessionID uuid.UUID) ([]AdminSessionDTO, error) {
	now := time.Now()
	var sessions []models.AdminSession
	err := s.db.Where("user_id = ? AND revoked_at IS NULL AND expires_at > ?", userID, now).
		Order("last_used_at DESC").
		Find(&sessions).Error
	if err != nil {
		return nil, err
	}

	result := make([]AdminSessionDTO, len(sessions))
	for i, sess := range sessions {
		result[i] = AdminSessionDTO{
			ID:         sess.ID,
			IPAddress:  sess.IPAddress,
			UserAgent:  sess.UserAgent,
			LastUsedAt: sess.LastUsedAt,
			ExpiresAt:  sess.ExpiresAt,
			IsCurrent:  sess.ID == currentSessionID,
			CreatedAt:  sess.CreatedAt,
		}
	}
	return result, nil
}

// RevokeUserSession marks a specific session as revoked
func (s *AdminSessionService) RevokeUserSession(userID uuid.UUID, sessionID uuid.UUID) error {
	now := time.Now()
	res := s.db.Model(&models.AdminSession{}).
		Where("id = ? AND user_id = ? AND revoked_at IS NULL", sessionID, userID).
		Updates(map[string]interface{}{
			"revoked_at":        now,
			"revocation_reason": "user_revoked_session",
		})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrSessionNotFound
	}
	return nil
}

// RevokeOtherUserSessions revokes all active sessions for the user except the current one
func (s *AdminSessionService) RevokeOtherUserSessions(userID uuid.UUID, currentSessionID uuid.UUID) (int64, error) {
	now := time.Now()
	query := s.db.Model(&models.AdminSession{}).
		Where("user_id = ? AND revoked_at IS NULL", userID)
	if currentSessionID != uuid.Nil {
		query = query.Where("id != ?", currentSessionID)
	}
	res := query.Updates(map[string]interface{}{
		"revoked_at":        now,
		"revocation_reason": "user_revoked_other_sessions",
	})
	return res.RowsAffected, res.Error
}
