package services

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type AuditService struct {
	db *gorm.DB
}

func NewAuditService(db *gorm.DB) *AuditService {
	return &AuditService{db: db}
}

// LogAction is a reusable function to record audit logs
func (s *AuditService) LogAction(c *fiber.Ctx, action string, entityType string, entityID string, changes map[string]interface{}) error {
	var userID *uuid.UUID
	ipAddress := ""
	userAgent := ""
	traceID := ""

	if c != nil {
		if val := c.Locals("user_id"); val != nil {
			if uidStr, ok := val.(string); ok {
				if uid, err := uuid.Parse(uidStr); err == nil {
					userID = &uid
				}
			} else if uid, ok := val.(uuid.UUID); ok {
				userID = &uid
			}
		}
		ipAddress = c.IP()
		userAgent = string(c.Request().Header.UserAgent())
		if val, ok := c.Locals("trace_id").(string); ok && val != "" {
			traceID = val
		} else {
			traceID = c.GetRespHeader("X-Trace-Id")
		}
	}

	auditLog := models.AuditLog{
		UserID:     userID,
		Action:     action,
		EntityType: entityType,
		EntityID:   entityID,
		Changes:    models.JSONMap(changes),
		IPAddress:  ipAddress,
		UserAgent:  userAgent,
		TraceID:    traceID,
		CreatedAt:  time.Now(),
	}

	return s.db.Create(&auditLog).Error
}

// List fetch paginated audit logs
func (s *AuditService) List(page, limit int, entityType string, action string) ([]models.AuditLog, int64, error) {
	var logs []models.AuditLog
	var total int64
	offset := (page - 1) * limit

	query := s.db.Model(&models.AuditLog{})

	if entityType != "" {
		query = query.Where("entity_type = ?", entityType)
	}
	if action != "" {
		query = query.Where("action = ?", action)
	}

	query.Count(&total)

	err := query.Preload("User").
		Order("created_at desc").
		Offset(offset).
		Limit(limit).
		Find(&logs).Error

	if err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}
