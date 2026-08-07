package services

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
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

// allowedSecurityAuditCategories is the allowlist of reason categories that may
// be stored for security-relevant Admin authentication events. Free-form or
// secret-bearing data must never be written through this path.
var allowedSecurityAuditCategories = map[string]bool{
	"credentials_or_eligibility": true,
	"login_success":              true,
	"logout":                     true,
	"session_revoked":            true,
	"session_reuse":              true,
	"sessions_revoked":           true,
}

const maxSecurityAuditUserAgentLength = 512

// LogSecurityEvent records a security-relevant Admin authentication event with a
// bounded, allowlisted reason category. Credentials, passwords, JWTs, cookie
// values, credential hashes, and secret-bearing request bodies are never
// persisted.
func (s *AuditService) LogSecurityEvent(c *fiber.Ctx, action, category, entityType, entityID string) error {
	if !allowedSecurityAuditCategories[category] {
		return fmt.Errorf("security audit category not allowed: %s", category)
	}

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
		userAgent = truncateString(string(c.Request().Header.UserAgent()), maxSecurityAuditUserAgentLength)
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
		Changes:    models.JSONMap{"category": category},
		IPAddress:  ipAddress,
		UserAgent:  userAgent,
		TraceID:    traceID,
		CreatedAt:  time.Now(),
	}

	return s.db.Create(&auditLog).Error
}

type AuditListOptions struct {
	Common      listquery.Common
	Actions     []string
	EntityTypes []string
	UserIDs     []uuid.UUID
}

var auditSortColumns = map[string]string{
	"id":          "audit_logs.id",
	"created_at":  "audit_logs.created_at",
	"action":      "audit_logs.action",
	"entity_type": "audit_logs.entity_type",
}

// List fetch paginated audit logs with search, filters, and user details
func (s *AuditService) List(options AuditListOptions) ([]models.AuditLog, int64, error) {
	var logs []models.AuditLog
	var total int64

	query := s.db.Model(&models.AuditLog{}).
		Joins("LEFT JOIN users ON users.id = audit_logs.user_id")

	if options.Common.Search != "" {
		searchTerm := "%" + options.Common.Search + "%"
		query = query.Where(
			"audit_logs.entity_id ILIKE ? OR audit_logs.trace_id ILIKE ? OR audit_logs.ip_address ILIKE ? OR users.name ILIKE ? OR users.email ILIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	if len(options.Actions) > 0 {
		query = query.Where("audit_logs.action IN ?", options.Actions)
	}

	if len(options.EntityTypes) > 0 {
		query = query.Where("audit_logs.entity_type IN ?", options.EntityTypes)
	}

	if len(options.UserIDs) > 0 {
		query = query.Where("audit_logs.user_id IN ?", options.UserIDs)
	}

	if options.Common.From != nil {
		query = query.Where("audit_logs.created_at >= ?", *options.Common.From)
	}
	if options.Common.To != nil {
		query = query.Where("audit_logs.created_at <= ?", *options.Common.To)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortCol, ok := auditSortColumns[options.Common.Sort]
	if !ok {
		sortCol = "audit_logs.created_at"
	}
	orderDir := "DESC"
	if options.Common.Order == "asc" {
		orderDir = "ASC"
	}

	offset := (options.Common.Page - 1) * options.Common.Limit
	err := query.Preload("User").
		Order(sortCol + " " + orderDir + ", audit_logs.id " + orderDir).
		Offset(offset).
		Limit(options.Common.Limit).
		Find(&logs).Error

	if err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

type AuditFilterOptions struct {
	Actions     []string `json:"actions"`
	EntityTypes []string `json:"entityTypes"`
}

func (s *AuditService) GetFilterOptions() (*AuditFilterOptions, error) {
	var actions []string
	var entityTypes []string

	if err := s.db.Model(&models.AuditLog{}).Where("action IS NOT NULL AND action != ''").Distinct("action").Order("action ASC").Pluck("action", &actions).Error; err != nil {
		return nil, err
	}

	if err := s.db.Model(&models.AuditLog{}).Where("entity_type IS NOT NULL AND entity_type != ''").Distinct("entity_type").Order("entity_type ASC").Pluck("entity_type", &entityTypes).Error; err != nil {
		return nil, err
	}

	return &AuditFilterOptions{
		Actions:     actions,
		EntityTypes: entityTypes,
	}, nil
}
