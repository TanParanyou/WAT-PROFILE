package handlers

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type MediaHandler struct {
	mediaService *services.MediaService
}

func NewMediaHandler(db *gorm.DB) *MediaHandler {
	return &MediaHandler{
		mediaService: services.NewMediaService(db),
	}
}

// GetMedia - Admin: List media with pagination and filters
func (h *MediaHandler) GetMedia(c *fiber.Ctx) error {
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "created_at",
		DefaultOrder: "desc",
		AllowedSort: map[string]string{
			"created_at": "created_at",
			"filename":   "filename",
			"file_size":  "file_size",
			"mime_type":  "mime_type",
		},
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	mimeGroups := listquery.ExtractMulti(c, "mime")
	categories := listquery.ExtractMulti(c, "category")
	uploaderStrs := listquery.ExtractMulti(c, "uploader")
	var uploaderIDs []uuid.UUID
	for _, uStr := range uploaderStrs {
		if uid, parseErr := uuid.Parse(uStr); parseErr == nil {
			uploaderIDs = append(uploaderIDs, uid)
		}
	}

	options := services.MediaListOptions{
		Common:      common,
		MIMEGroups:  mimeGroups,
		Categories:  categories,
		UploaderIDs: uploaderIDs,
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
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update media")
	}

	return utils.SuccessResponse(c, media)
}

func (h *MediaHandler) DeleteMedia(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid media ID")
	}

	if err := h.mediaService.Delete(id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Media not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete media")
	}

	return utils.MessageResponse(c, "Media deleted successfully")
}
