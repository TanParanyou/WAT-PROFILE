package handlers

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/logger"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type BackupHandler struct {
	backupService *services.BackupService
	auditService  *services.AuditService
}

func NewBackupHandler(db *gorm.DB) *BackupHandler {
	return &BackupHandler{
		backupService: services.NewBackupService(db),
		auditService:  services.NewAuditService(db),
	}
}

// ExportDatabaseDump - Admin: Export JSON database snapshot (super_admin only)
func (h *BackupHandler) ExportDatabaseDump(c *fiber.Ctx) error {
	user, _ := middleware.GetCurrentUser(c)
	if !isSuperAdmin(user) {
		if h.auditService != nil {
			_ = h.auditService.LogSecurityEvent(c, "admin.security.unauthorized_backup_export", "unauthorized_backup_export", "backup", "Non-super_admin attempted to export database backup")
		}
		return utils.ErrorResponse(c, fiber.StatusForbidden, "Only super_admin can export database backups")
	}

	snapshot, err := h.backupService.ExportSnapshot()
	if err != nil {
		logger.Log.Error().Err(err).Msg("Failed to export database snapshot")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to export database snapshot")
	}

	if h.auditService != nil {
		_ = h.auditService.LogAction(c, "export", "database_backup", "all", map[string]interface{}{
			"records": snapshot.Metadata.RecordCounts,
		})
	}

	filename := fmt.Sprintf("wat_profile_backup_%s.json", time.Now().Format("20060102_150405"))
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Set("Content-Type", "application/json")

	return c.JSON(snapshot)
}
