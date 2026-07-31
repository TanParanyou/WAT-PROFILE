package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
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

// GetDonations - Admin: List all donations with pagination and filters
func (h *DonationHandler) GetDonations(c *fiber.Ctx) error {
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "donation_date",
		DefaultOrder: "desc",
		AllowedSort: map[string]string{
			"receipt_number": "receipt_number",
			"donor_name":     "donor_name",
			"amount":         "amount",
			"donation_date":  "donation_date",
			"payment_method": "payment_method",
			"status":         "status",
			"created_at":     "created_at",
		},
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	statuses := listquery.ExtractMulti(c, "status")
	categoryIDStrs := listquery.ExtractMulti(c, "category")
	var categoryIDs []int
	for _, catStr := range categoryIDStrs {
		if id, parseErr := strconv.Atoi(catStr); parseErr == nil {
			categoryIDs = append(categoryIDs, id)
		}
	}
	methods := listquery.ExtractMulti(c, "method")
	currencies := listquery.ExtractMulti(c, "currency")

	options := services.DonationListOptions{
		Common:      common,
		Statuses:    statuses,
		CategoryIDs: categoryIDs,
		Methods:     methods,
		Currencies:  currencies,
	}

	donations, total, err := h.donationService.ListDonationsOptions(options)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch donations")
	}

	return utils.PaginatedResponse(c, donations, common.Page, common.Limit, int(total))
}

// GetFilterOptions - Admin: Return distinct payment methods, currencies, and categories for filtering
func (h *DonationHandler) GetFilterOptions(c *fiber.Ctx) error {
	opts, err := h.donationService.GetFilterOptions()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch donation filter options")
	}
	return utils.SuccessResponse(c, opts)
}

// GetAdminDonationCategories - Admin: List donation categories with pagination and filters
func (h *DonationHandler) GetAdminDonationCategories(c *fiber.Ctx) error {
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "display_order",
		DefaultOrder: "asc",
		AllowedSort: map[string]string{
			"display_order": "display_order",
			"name":          "name",
			"created_at":    "created_at",
		},
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	statuses := listquery.ExtractMulti(c, "status")
	options := services.DonationCategoryListOptions{
		Common:   common,
		Statuses: statuses,
	}

	categories, total, err := h.donationService.ListCategoriesAdmin(options)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch donation categories")
	}

	return utils.PaginatedResponse(c, categories, common.Page, common.Limit, int(total))
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
// GetDonationByID - Admin: Get single donation by ID
func (h *DonationHandler) GetDonationByID(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	item, err := h.donationService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Donation not found")
	}
	return utils.SuccessResponse(c, item)
}

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

// BulkDeleteDonations - Admin: Delete multiple donations
func (h *DonationHandler) BulkDeleteDonations(c *fiber.Ctx) error {
	var req models.BulkDeleteRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if len(req.IDs) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No IDs provided for deletion")
	}

	if err := h.donationService.BulkDelete(req.IDs); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete donations")
	}

	return utils.MessageResponse(c, "Donations deleted successfully")
}

// BulkDeleteDonationCategories - Admin: Delete multiple donation categories
func (h *DonationHandler) BulkDeleteDonationCategories(c *fiber.Ctx) error {
	var req models.BulkDeleteRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if len(req.IDs) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No IDs provided for deletion")
	}

	if err := h.donationService.BulkDeleteCategories(req.IDs); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete donation categories")
	}

	return utils.MessageResponse(c, "Donation categories deleted successfully")
}
