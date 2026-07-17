package handlers

import (
	"encoding/json"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/publiccontent"
	"github.com/watloungporsai/wat-profile-backend/internal/richtext"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type PublicContentHandler struct {
	publicContentService *services.PublicContentService
	auditService         *services.AuditService
}

func NewPublicContentHandler(db *gorm.DB) *PublicContentHandler {
	return &PublicContentHandler{
		publicContentService: services.NewPublicContentService(db),
		auditService:         services.NewAuditService(db),
	}
}

// GET /api/v1/admin/about
func (h *PublicContentHandler) GetAbout(c *fiber.Ctx) error {
	res, err := h.publicContentService.GetAbout()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "About page not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to load About page")
	}
	return utils.SuccessResponse(c, res)
}

// PUT /api/v1/admin/about
func (h *PublicContentHandler) SaveAbout(c *fiber.Ctx) error {
	var input publiccontent.AboutContent
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid payload")
	}

	bodyRaw, _ := json.Marshal(input.Body)
	var bodyMap map[string]interface{}
	_ = json.Unmarshal(bodyRaw, &bodyMap)

	if err := richtext.ValidateContentPageBody("PAGE-ABOUT", bodyMap); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	res, err := h.publicContentService.SaveAbout(&input)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "About page not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to save About page")
	}

	_ = h.auditService.LogAction(c, "update", "public_content", "PAGE-ABOUT", map[string]interface{}{"resource": "about"})

	return utils.SuccessResponse(c, res)
}

// GET /api/v1/admin/contact
func (h *PublicContentHandler) GetContact(c *fiber.Ctx) error {
	res, err := h.publicContentService.GetContact()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Contact page not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to load Contact page")
	}
	return utils.SuccessResponse(c, res)
}

// PUT /api/v1/admin/contact
func (h *PublicContentHandler) SaveContact(c *fiber.Ctx) error {
	var input publiccontent.ContactContent
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid payload")
	}

	bodyRaw, _ := json.Marshal(input.Body)
	var bodyMap map[string]interface{}
	_ = json.Unmarshal(bodyRaw, &bodyMap)

	if err := richtext.ValidateContentPageBody("PAGE-CONTACT", bodyMap); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	res, err := h.publicContentService.SaveContact(&input)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Contact page not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to save Contact page")
	}

	_ = h.auditService.LogAction(c, "update", "public_content", "PAGE-CONTACT", map[string]interface{}{"resource": "contact"})

	return utils.SuccessResponse(c, res)
}

// GET /api/v1/admin/privacy
func (h *PublicContentHandler) GetPrivacy(c *fiber.Ctx) error {
	res, err := h.publicContentService.GetPrivacy()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Privacy page not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to load Privacy page")
	}
	return utils.SuccessResponse(c, res)
}

// PUT /api/v1/admin/privacy
func (h *PublicContentHandler) SavePrivacy(c *fiber.Ctx) error {
	var input publiccontent.PrivacyContent
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid payload")
	}

	bodyRaw, _ := json.Marshal(input.Body)
	var bodyMap map[string]interface{}
	_ = json.Unmarshal(bodyRaw, &bodyMap)

	if err := richtext.ValidateContentPageBody("PAGE-PRIVACY", bodyMap); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	res, err := h.publicContentService.SavePrivacy(&input)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Privacy page not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to save Privacy page")
	}

	_ = h.auditService.LogAction(c, "update", "public_content", "PAGE-PRIVACY", map[string]interface{}{"resource": "privacy"})

	return utils.SuccessResponse(c, res)
}

// GET /api/v1/admin/impressum
func (h *PublicContentHandler) GetImpressum(c *fiber.Ctx) error {
	res, err := h.publicContentService.GetImpressum()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Impressum page not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to load Impressum page")
	}
	return utils.SuccessResponse(c, res)
}

// PUT /api/v1/admin/impressum
func (h *PublicContentHandler) SaveImpressum(c *fiber.Ctx) error {
	var input publiccontent.ImpressumContent
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid payload")
	}

	bodyRaw, _ := json.Marshal(input.Body)
	var bodyMap map[string]interface{}
	_ = json.Unmarshal(bodyRaw, &bodyMap)

	if err := richtext.ValidateContentPageBody("PAGE-IMPRESSUM", bodyMap); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	res, err := h.publicContentService.SaveImpressum(&input)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Impressum page not found")
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to save Impressum page")
	}

	_ = h.auditService.LogAction(c, "update", "public_content", "PAGE-IMPRESSUM", map[string]interface{}{"resource": "impressum"})

	return utils.SuccessResponse(c, res)
}

// Public handlers (accessible without auth)

// GET /api/v1/public/about
func (h *PublicContentHandler) GetPublicAbout(c *fiber.Ctx) error {
	res, err := h.publicContentService.GetAbout()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "About page not found")
	}
	return utils.SuccessResponse(c, res)
}

// GET /api/v1/public/contact
func (h *PublicContentHandler) GetPublicContact(c *fiber.Ctx) error {
	res, err := h.publicContentService.GetContact()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Contact page not found")
	}
	return utils.SuccessResponse(c, res)
}

// GET /api/v1/public/privacy
func (h *PublicContentHandler) GetPublicPrivacy(c *fiber.Ctx) error {
	res, err := h.publicContentService.GetPrivacy()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Privacy page not found")
	}
	return utils.SuccessResponse(c, res)
}

// GET /api/v1/public/impressum
func (h *PublicContentHandler) GetPublicImpressum(c *fiber.Ctx) error {
	res, err := h.publicContentService.GetImpressum()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Impressum page not found")
	}
	return utils.SuccessResponse(c, res)
}
