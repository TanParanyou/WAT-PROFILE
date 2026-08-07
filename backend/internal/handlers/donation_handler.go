package handlers

import (
	"bytes"
	"context"
	"crypto/sha256"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/config"
	donationvalidation "github.com/watloungporsai/wat-profile-backend/internal/donations"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type DonationHandler struct {
	donationService *services.DonationService
	store           privateDonationStore
	emails          *services.DonationEmailService
	documents       *services.DonationDocumentService
}

type privateDonationStore interface {
	UploadPrivate(context.Context, io.Reader, string, string) error
	OpenPrivate(context.Context, string) (io.ReadCloser, error)
	DeleteFile(context.Context, string) error
}

func NewDonationHandler(db *gorm.DB, deps ...interface{}) *DonationHandler {
	var store privateDonationStore
	var sender accountauth.EmailSender
	var outbox *services.OperationOutboxService
	for _, dep := range deps {
		switch value := dep.(type) {
		case privateDonationStore:
			store = value
		case accountauth.EmailSender:
			sender = value
		case *services.OperationOutboxService:
			outbox = value
		}
	}
	if outbox == nil && db != nil {
		outbox = services.NewOperationOutboxService(db)
	}
	// If email delivery is configured, reuse the existing Resend adapter. A
	// missing delivery configuration keeps local development usable; the record
	// is still accepted and can be retried after configuration is added.
	if sender == nil && os.Getenv("AUTH_EMAIL_DELIVERY_MODE") == "resend" {
		cfg := config.AccountAuthConfig{EmailMode: "resend", ResendAPIKey: os.Getenv("RESEND_API_KEY"), EmailFrom: os.Getenv("ACCOUNT_EMAIL_FROM")}
		if configured, err := services.NewAccountEmailSender(cfg); err == nil {
			sender = configured
		}
	}
	if sender == nil && os.Getenv("ENV") != "production" {
		sender, _ = services.NewAccountEmailSender(config.AccountAuthConfig{EmailMode: "capture", Environment: "development"})
	}
	return &DonationHandler{donationService: services.NewDonationServiceWithOutbox(db, outbox), store: store, emails: services.NewDonationEmailService(sender), documents: services.NewDonationDocumentService()}
}

// SubmitSelfReported accepts a public multipart report and keeps its proof in
// private storage. The proof is deleted if the database transaction fails.
func (h *DonationHandler) SubmitSelfReported(c *fiber.Ctx) error {
	if h.store == nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Private donation storage is not configured")
	}
	amountValue := strings.TrimSpace(c.FormValue("amount"))
	method := strings.ToLower(strings.TrimSpace(c.FormValue("donation_method")))
	email := strings.TrimSpace(c.FormValue("donor_email"))
	donationDate := strings.TrimSpace(c.FormValue("donation_date"))
	locale := strings.TrimSpace(c.FormValue("locale"))
	if err := donationvalidation.ValidatePublicInput(donationvalidation.PublicInput{Amount: amountValue, Currency: c.FormValue("currency"), DonationDate: donationDate, DonationMethod: method, DonorName: c.FormValue("donor_name"), DonorEmail: email, Locale: locale, HasProof: true}); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	amount, err := strconv.ParseFloat(amountValue, 64)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid amount")
	}
	proofHeader, err := c.FormFile("proof")
	if err != nil || proofHeader == nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Donation proof is required")
	}
	if proofHeader.Size <= 0 || proofHeader.Size > 10*1024*1024 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Proof must be smaller than 10 MB")
	}
	proofFile, err := proofHeader.Open()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Unable to read proof")
	}
	defer proofFile.Close()
	data, err := io.ReadAll(io.LimitReader(proofFile, 10*1024*1024+1))
	if err != nil || int64(len(data)) > 10*1024*1024 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Unable to read proof")
	}
	mimeType := http.DetectContentType(data)
	if len(data) >= 4 && string(data[:4]) == "%PDF" {
		mimeType = "application/pdf"
	}
	allowedProofTypes := map[string]bool{"application/pdf": true, "image/jpeg": true, "image/png": true, "image/webp": true}
	if !allowedProofTypes[mimeType] {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Proof must be a PDF or image")
	}
	key := "private/donations/" + uuid.NewString() + "/" + filepath.Base(proofHeader.Filename)
	if err := h.store.UploadPrivate(c.UserContext(), bytes.NewReader(data), key, mimeType); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadGateway, "Unable to store proof")
	}
	sum := sha256.Sum256(data)
	proof := &models.DonationProof{StorageKey: key, OriginalFilename: filepath.Base(proofHeader.Filename), MimeType: mimeType, Size: int64(len(data)), Checksum: fmt.Sprintf("%x", sum[:])}
	donationDateValue, _ := time.Parse("2006-01-02", donationDate)
	receiptRequested := c.FormValue("receipt_requested") == "true" || strings.EqualFold(c.FormValue("receipt_requested"), "on")
	donation := models.Donation{DonorType: "guest", DonorName: strings.TrimSpace(c.FormValue("donor_name")), DonorEmail: email, DonorPhone: strings.TrimSpace(c.FormValue("donor_phone")), Amount: amount, Currency: "EUR", DonationDate: donationDateValue, DonationMethod: method, DonorAddress: strings.TrimSpace(c.FormValue("donor_address")), CommunicationLocale: locale, ReceiptRequested: receiptRequested}
	created, err := h.donationService.CreateSelfReported(services.SelfReportedDonationInput{Donation: donation, Proof: proof})
	if err != nil {
		_ = h.store.DeleteFile(c.UserContext(), key)
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": created})
}

func timeFromForm(value string) time.Time {
	if parsed, err := time.Parse("2006-01-02", value); err == nil {
		return parsed
	}
	return time.Now()
}

func (h *DonationHandler) CreateStaffDonation(c *fiber.Ctx) error {
	var donation models.Donation
	if err := c.BodyParser(&donation); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := donationvalidation.ValidateStaffInput(donationvalidation.StaffInput{Amount: strconv.FormatFloat(donation.Amount, 'f', -1, 64), Currency: donation.Currency, DonationDate: donation.DonationDate.Format("2006-01-02"), DonationMethod: donation.DonationMethod, DonorEmail: donation.DonorEmail, ReceiptRequested: donation.ReceiptRequested}); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	actor, err := middleware.GetCurrentUserID(c)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Admin identity is required")
	}
	if err := h.donationService.CreateStaffRecorded(&donation, actor); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": donation})
}

func (h *DonationHandler) ConfirmDonation(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	actor, err := middleware.GetCurrentUserID(c)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Admin identity is required")
	}
	donation, err := h.donationService.Confirm(id, actor)
	if err != nil {
		if strings.Contains(err.Error(), "not pending") {
			return utils.ErrorResponse(c, fiber.StatusConflict, err.Error())
		}
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Donation not found")
	}
	return utils.SuccessResponse(c, donation)
}

func (h *DonationHandler) CancelDonation(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	var request struct {
		Reason string `json:"reason"`
	}
	if err := c.BodyParser(&request); err != nil || strings.TrimSpace(request.Reason) == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Cancellation reason is required")
	}
	actor, err := middleware.GetCurrentUserID(c)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Admin identity is required")
	}
	donation, err := h.donationService.Cancel(id, actor, request.Reason)
	if err != nil {
		if strings.Contains(err.Error(), "already cancelled") {
			return utils.ErrorResponse(c, fiber.StatusConflict, err.Error())
		}
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Donation not found")
	}
	return utils.SuccessResponse(c, donation)
}

func (h *DonationHandler) GetDonationProof(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	var proof models.DonationProof
	if err := h.donationService.GetProof(id, &proof); err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Proof not found")
	}
	if h.store == nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Private donation storage is not configured")
	}
	body, err := h.store.OpenPrivate(c.UserContext(), proof.StorageKey)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Proof not found")
	}
	defer body.Close()
	c.Set(fiber.HeaderContentType, proof.MimeType)
	c.Set(fiber.HeaderContentDisposition, `attachment; filename="`+proof.OriginalFilename+`"`)
	return c.SendStream(body)
}

func (h *DonationHandler) SendDonationReceipt(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	actor, err := middleware.GetCurrentUserID(c)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Admin identity is required")
	}
	donation, err := h.donationService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Donation not found")
	}
	if donation.Status != "confirmed" {
		return utils.ErrorResponse(c, fiber.StatusConflict, "Donation must be confirmed before receipt dispatch")
	}
	if !donation.ReceiptRequested {
		return utils.ErrorResponse(c, fiber.StatusConflict, "Receipt was not requested")
	}
	if strings.TrimSpace(donation.DonorEmail) == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Donor email is required for receipt dispatch")
	}
	if donation.ReceiptDispatchedAt != nil {
		return utils.SuccessResponse(c, fiber.Map{"donation": donation, "already_dispatched": true})
	}
	key := donation.ReceiptObjectKey
	checksum := donation.ReceiptChecksum
	if key == "" {
		if h.store == nil {
			return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Private donation storage is not configured")
		}
		pdf, renderedChecksum, renderErr := h.documents.RenderReceipt(donation)
		if renderErr != nil {
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Unable to render receipt")
		}
		checksum = renderedChecksum
		key = "private/donations/receipts/" + donation.ReceiptNumber + ".pdf"
		if uploadErr := h.store.UploadPrivate(c.UserContext(), bytes.NewReader(pdf), key, "application/pdf"); uploadErr != nil {
			return utils.ErrorResponse(c, fiber.StatusBadGateway, "Unable to store receipt")
		}
	}
	updated, alreadyQueued, err := h.donationService.QueueReceiptDispatch(id, actor, key, checksum)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Unable to queue receipt dispatch")
	}
	return utils.SuccessResponse(c, fiber.Map{"donation": updated, "queued": !alreadyQueued})
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
			"id":              "id",
			"receipt_number":  "receipt_number",
			"donor_name":      "donor_name",
			"amount":          "amount",
			"donation_date":   "donation_date",
			"payment_method":  "payment_method",
			"donation_method": "donation_method",
			"status":          "status",
			"created_at":      "created_at",
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
	if len(methods) == 0 {
		methods = listquery.ExtractMulti(c, "channel")
	}
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
			"id":            "id",
			"display_order": "display_order",
			"name":          "name",
			"is_active":     "is_active",
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
