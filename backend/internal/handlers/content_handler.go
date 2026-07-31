package handlers

import (
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type ContentHandler struct {
	contentService *services.ContentService
	auditService   *services.AuditService
}

func NewContentHandler(db *gorm.DB) *ContentHandler {
	return &ContentHandler{
		contentService: services.NewContentService(db),
		auditService:   services.NewAuditService(db),
	}
}

// ListPages - Internal/Legacy list pages
func (h *ContentHandler) ListPages(c *fiber.Ctx) error {
	pages, err := h.contentService.ListPages()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch content pages")
	}
	return utils.SuccessResponse(c, pages)
}

// ListAdminPages - Admin: List website content pages with pagination and filters
func (h *ContentHandler) ListAdminPages(c *fiber.Ctx) error {
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "updated_at",
		DefaultOrder: "desc",
		AllowedSort: map[string]string{
			"updated_at": "updated_at",
			"title":      "title",
			"slug":       "slug",
			"status":     "status",
		},
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	statuses := listquery.ExtractMulti(c, "status")
	options := services.ContentPageListOptions{
		Common:   common,
		Statuses: statuses,
	}

	pages, total, err := h.contentService.ListPagesAdmin(options)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch content pages")
	}

	return utils.PaginatedResponse(c, pages, common.Page, common.Limit, int(total))
}

func (h *ContentHandler) GetPage(c *fiber.Ctx) error {
	pageKey := c.Params("pageKey")
	page, err := h.contentService.GetPageByKey(pageKey)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Content page not found")
	}
	return utils.SuccessResponse(c, page)
}

func (h *ContentHandler) GetPublicPage(c *fiber.Ctx) error {
	slug := c.Params("slug")
	page, err := h.contentService.GetPublishedPage(slug)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Content page not found")
	}
	return utils.SuccessResponse(c, page)
}

func (h *ContentHandler) UpdatePageDraft(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid page id")
	}

	var input models.ContentPage
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	page, err := h.contentService.UpdatePageDraft(id, input)
	if err != nil {
		if errors.Is(err, services.ErrInvalidContentBody) {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update content page")
	}

	_ = h.auditService.LogAction(c, "update", "content_pages", id.String(), map[string]interface{}{"page_key": page.PageKey})
	return utils.SuccessResponse(c, page)
}

func (h *ContentHandler) UpdateSectionDraft(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid section id")
	}

	var input models.ContentSection
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	section, err := h.contentService.UpdateSectionDraft(id, input)
	if err != nil {
		if errors.Is(err, services.ErrInvalidContentBody) {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update content section")
	}

	_ = h.auditService.LogAction(c, "update", "content_sections", id.String(), map[string]interface{}{"section_key": section.SectionKey})
	return utils.SuccessResponse(c, section)
}

type createSectionRequest struct {
	SectionType string `json:"section_type"`
	SectionKey  string `json:"section_key"`
}

type archiveSectionRequest struct {
	Archived bool `json:"archived"`
}

type duplicateSectionRequest struct {
	SectionKey string `json:"section_key"`
}

func (h *ContentHandler) ReorderSections(c *fiber.Ctx) error {
	pageID, err := uuid.Parse(c.Params("pageId"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid page id")
	}

	var body struct {
		SectionIDs []string `json:"section_ids"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	seen := make(map[string]bool)
	for _, id := range body.SectionIDs {
		if seen[id] {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "Duplicate section IDs are not allowed")
		}
		seen[id] = true
	}

	ids := make([]uuid.UUID, 0, len(body.SectionIDs))
	for _, id := range body.SectionIDs {
		parsed, err := uuid.Parse(id)
		if err != nil {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid section id in section_ids")
		}
		ids = append(ids, parsed)
	}

	page, err := h.contentService.ReorderSections(pageID, ids)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Content page not found")
		}
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	_ = h.auditService.LogAction(c, "reorder", "content_sections", pageID.String(), map[string]interface{}{"count": len(ids)})
	return utils.SuccessResponse(c, page)
}

func (h *ContentHandler) CreateSection(c *fiber.Ctx) error {
	pageID, err := uuid.Parse(c.Params("pageId"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid page id")
	}

	var req createSectionRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.SectionType == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Section type is required")
	}

	section, err := h.contentService.CreateSection(pageID, req.SectionType, req.SectionKey)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Content page not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create section")
	}

	_ = h.auditService.LogAction(c, "create", "content_sections", section.ID, map[string]interface{}{
		"page_id":      pageID.String(),
		"section_key":  section.SectionKey,
		"section_type": section.SectionType,
	})
	return utils.SuccessResponse(c, section)
}

func (h *ContentHandler) ArchiveSection(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid section id")
	}

	var req archiveSectionRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	section, err := h.contentService.SetSectionArchived(id, true)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Section not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to archive section")
	}

	_ = h.auditService.LogAction(c, "archive", "content_sections", id.String(), map[string]interface{}{
		"section_key": section.SectionKey,
	})
	return utils.SuccessResponse(c, section)
}

func (h *ContentHandler) RestoreSection(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid section id")
	}

	var req archiveSectionRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	section, err := h.contentService.SetSectionArchived(id, false)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Section not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to restore section")
	}

	_ = h.auditService.LogAction(c, "restore", "content_sections", id.String(), map[string]interface{}{
		"section_key": section.SectionKey,
	})
	return utils.SuccessResponse(c, section)
}

func (h *ContentHandler) DuplicateSection(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid section id")
	}

	var req duplicateSectionRequest
	if err := c.BodyParser(&req); err != nil {
		req = duplicateSectionRequest{}
	}

	section, err := h.contentService.DuplicateSection(id, req.SectionKey)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Section or associated page not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to duplicate section")
	}

	_ = h.auditService.LogAction(c, "duplicate", "content_sections", section.ID, map[string]interface{}{
		"section_key": section.SectionKey,
	})
	return utils.SuccessResponse(c, section)
}

func (h *ContentHandler) PublishPage(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid page id")
	}

	page, err := h.contentService.PublishPage(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to publish content page")
	}

	_ = h.auditService.LogAction(c, "publish", "content_pages", id.String(), map[string]interface{}{"page_key": page.PageKey})
	return utils.SuccessResponse(c, page)
}

func (h *ContentHandler) ListPagesQuery(c *fiber.Ctx) error {
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	_ = limit
	return h.ListPages(c)
}
