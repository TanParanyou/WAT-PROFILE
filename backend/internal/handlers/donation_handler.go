package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type DonationHandler struct {
	donationService *services.DonationService
}

func NewDonationHandler(db *gorm.DB) *DonationHandler {
	return &DonationHandler{
		donationService: services.NewDonationService(db),
	}
}

// GetDonationCategories - Public: List active donation categories
func (h *DonationHandler) GetDonationCategories(c *fiber.Ctx) error {
	categories, err := h.donationService.ListCategories()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch donation categories")
	}
	return utils.SuccessResponse(c, categories)
}

// CreateDonation - Auth: Create a donation record
func (h *DonationHandler) CreateDonation(c *fiber.Ctx) error {
	var donation models.Donation
	if err := c.BodyParser(&donation); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	userID, err := middleware.GetCurrentUserID(c)
	if err == nil {
		if err := h.donationService.CreateDonation(&donation, &userID); err != nil {
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create donation")
		}
	} else {
		if err := h.donationService.CreateDonation(&donation, nil); err != nil {
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create donation")
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": donation})
}

// GetDonations - Admin: List all donations with filters
func (h *DonationHandler) GetDonations(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	page, limit = utils.ClampPagination(page, limit)

	donations, total, err := h.donationService.ListDonations(
		page, limit, c.Query("status"), c.Query("category_id"), c.Query("from"), c.Query("to"),
	)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch donations")
	}
	return utils.PaginatedResponse(c, donations, page, limit, int(total))
}

// GetDonationStats - Admin: Get donation statistics
func (h *DonationHandler) GetDonationStats(c *fiber.Ctx) error {
	stats, err := h.donationService.GetStats()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch donation stats")
	}
	return utils.SuccessResponse(c, stats)
}

// UpdateDonation - Admin: Update donation
func (h *DonationHandler) UpdateDonation(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	donation, err := h.donationService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Donation not found")
	}
	if err := c.BodyParser(donation); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.donationService.Update(donation); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update donation")
	}
	return utils.SuccessResponse(c, donation)
}

// DeleteDonation - Admin: Delete donation
func (h *DonationHandler) DeleteDonation(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	if err := h.donationService.Delete(id); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete donation")
	}
	return utils.MessageResponse(c, "Donation deleted successfully")
}

func (h *DonationHandler) CreateDonationCategory(c *fiber.Ctx) error {
	var category models.DonationCategory
	if err := c.BodyParser(&category); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.donationService.CreateCategory(&category); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create category")
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": category})
}

func (h *DonationHandler) UpdateDonationCategory(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	category, err := h.donationService.GetCategoryByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Category not found")
	}
	if err := c.BodyParser(category); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.donationService.UpdateCategory(category); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update category")
	}
	return utils.SuccessResponse(c, category)
}

func (h *DonationHandler) DeleteDonationCategory(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	if err := h.donationService.DeleteCategory(id); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete category")
	}
	return utils.MessageResponse(c, "Category deleted successfully")
}
