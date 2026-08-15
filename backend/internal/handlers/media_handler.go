package handlers

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/logger"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type MediaHandler struct {
	mediaService     *services.MediaService
	referenceService *services.MediaReferenceService
	retentionService *services.MediaRetentionService
	auditService     *services.AuditService
}

func NewMediaHandler(db *gorm.DB, stores ...services.MediaObjectDeleter) *MediaHandler {
	var store services.MediaObjectDeleter
	if len(stores) > 0 {
		store = stores[0]
	}
	refs := services.NewMediaReferenceService(db)
	return &MediaHandler{
		mediaService:     services.NewMediaService(db),
		referenceService: refs,
		retentionService: services.NewMediaRetentionService(db, store, refs),
		auditService:     services.NewAuditService(db),
	}
}

// GetMedia - Admin: List media with pagination and filters
func (h *MediaHandler) GetMedia(c *fiber.Ctx) error {
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "created_at",
		DefaultOrder: "desc",
		AllowedSort: map[string]string{
			"id":         "id",
			"created_at": "created_at",
			"filename":   "filename",
			"file_size":  "file_size",
			"size":       "size",
			"mime_type":  "mime_type",
		},
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	mimeGroups := listquery.ExtractMulti(c, "mime")
	if len(mimeGroups) == 0 {
		mimeGroups = listquery.ExtractMulti(c, "mime_type")
	}
	categories := listquery.ExtractMulti(c, "category")
	if len(categories) == 0 {
		categories = listquery.ExtractMulti(c, "folder")
	}
	missingAltLocales := listquery.ExtractMulti(c, "alt_missing")
	for _, locale := range missingAltLocales {
		if locale != "th" && locale != "en" && locale != "de" {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "Unsupported alt text locale")
		}
	}
	uploaderStrs := listquery.ExtractMulti(c, "uploader")
	var uploaderIDs []uuid.UUID
	for _, uStr := range uploaderStrs {
		if uid, parseErr := uuid.Parse(uStr); parseErr == nil {
			uploaderIDs = append(uploaderIDs, uid)
		}
	}

	options := services.MediaListOptions{
		Common:            common,
		MIMEGroups:        mimeGroups,
		Categories:        categories,
		UploaderIDs:       uploaderIDs,
		MissingAltLocales: missingAltLocales,
	}

	media, total, err := h.mediaService.ListOptions(options)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch media")
	}

	return utils.PaginatedResponse(c, media, common.Page, common.Limit, int(total))
}

// GetFilterOptions - Admin: Return distinct media categories and mime types for filtering
func (h *MediaHandler) GetFilterOptions(c *fiber.Ctx) error {
	opts, err := h.mediaService.GetFilterOptions()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch media filter options")
	}
	return utils.SuccessResponse(c, opts)
}

func (h *MediaHandler) GetTrash(c *fiber.Ctx) error {
	items, err := h.retentionService.ListTrash()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch media trash")
	}
	return utils.SuccessResponse(c, items)
}

func (h *MediaHandler) GetReferences(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid media ID")
	}
	media, err := h.mediaService.GetByIDIncludingDeleted(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Media not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch media")
	}
	refs, err := h.referenceService.FindReferences(c.UserContext(), media.URL)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to find media references")
	}
	return utils.SuccessResponse(c, refs)
}

func (h *MediaHandler) RestoreMedia(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid media ID")
	}
	if err := h.mediaService.Restore(id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Deleted media not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to restore media")
	}
	if h.auditService != nil {
		_ = h.auditService.LogAction(c, "restore", "media", id.String(), map[string]interface{}{"entity": "media"})
	}
	return utils.MessageResponse(c, "Media restored successfully")
}

func (h *MediaHandler) UpdateMedia(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid media ID")
	}

	var req struct {
		Metadata map[string]interface{} `json:"metadata"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if req.Metadata == nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Metadata is required")
	}

	media, err := h.mediaService.UpdateMetadata(id, req.Metadata)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Media not found")
		}
		logger.Log.Error().Err(err).Str("media_id", id.String()).Msg("Failed to update media")
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update media")
	}

	if h.auditService != nil {
		_ = h.auditService.LogAction(c, "update", "media", id.String(), map[string]interface{}{"metadata": req.Metadata})
	}

	return utils.SuccessResponse(c, media)
}

func (h *MediaHandler) DeleteMedia(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid media ID")
	}

	actorID, actorErr := middleware.GetCurrentUserID(c)
	if actorErr != nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Admin identity is required")
	}
	if err := h.mediaService.SoftDelete(id, actorID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Media not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete media")
	}
	if h.auditService != nil {
		_ = h.auditService.LogAction(c, "delete", "media", id.String(), map[string]interface{}{"soft_delete": true})
	}

	return utils.MessageResponse(c, "Media deleted successfully")
}

func (h *MediaHandler) PurgeMedia(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid media ID")
	}
	var body struct {
		Confirm bool `json:"confirm"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.retentionService.PurgeOne(c.UserContext(), id, body.Confirm); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Deleted media not found")
		}
		if err.Error() == "permanent deletion requires confirmation" {
			return utils.ErrorResponse(c, fiber.StatusConflict, err.Error())
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to permanently delete media")
	}
	if h.auditService != nil {
		_ = h.auditService.LogAction(c, "delete", "media", id.String(), map[string]interface{}{"permanent": true})
	}
	return utils.MessageResponse(c, "Media permanently deleted successfully")
}
