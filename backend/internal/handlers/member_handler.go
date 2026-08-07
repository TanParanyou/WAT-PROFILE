package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type MemberHandler struct {
	memberService *services.MemberService
}

func NewMemberHandler(db *gorm.DB) *MemberHandler {
	return &MemberHandler{
		memberService: services.NewMemberService(db),
	}
}

// RegisterMember - Auth: Create member profile for authenticated user
func (h *MemberHandler) RegisterMember(c *fiber.Ctx) error {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "User not authenticated")
	}

	var member models.Member
	if err := c.BodyParser(&member); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.memberService.Register(&member, userID); err != nil {
		if err.Error() == "member profile already exists" {
			return utils.ErrorResponse(c, fiber.StatusConflict, err.Error())
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create member profile")
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": member})
}

// GetMyProfile - Auth: Get current user's member profile
func (h *MemberHandler) GetMyProfile(c *fiber.Ctx) error {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "User not authenticated")
	}

	member, err := h.memberService.GetByUserID(userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Member profile not found")
	}
	return utils.SuccessResponse(c, member)
}

// UpdateMyProfile - Auth: Update current user's member profile
func (h *MemberHandler) UpdateMyProfile(c *fiber.Ctx) error {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "User not authenticated")
	}

	member, err := h.memberService.GetByUserID(userID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Member profile not found")
	}

	if err := c.BodyParser(member); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := h.memberService.UpdateByUserID(member, userID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update member profile")
	}
	return utils.SuccessResponse(c, member)
}

// GetMembers - Admin: List all members with pagination
func (h *MemberHandler) GetMembers(c *fiber.Ctx) error {
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "created_at",
		DefaultOrder: "desc",
		AllowedSort: map[string]string{
			"id":               "id",
			"created_at":      "created_at",
			"member_code":     "member_code",
			"first_name_th":   "first_name_th",
			"membership_date": "membership_date",
			"membership_type": "membership_type",
			"membership_status": "membership_status",
		},
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	statuses := listquery.ExtractMulti(c, "status")
	types := listquery.ExtractMulti(c, "type")

	options := services.MemberListOptions{
		Common:   common,
		Statuses: statuses,
		Types:    types,
	}

	members, total, err := h.memberService.List(options)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch members")
	}
	return utils.PaginatedResponse(c, members, common.Page, common.Limit, int(total))
}

// GetMember - Admin: Get single member by ID
func (h *MemberHandler) GetMember(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	member, err := h.memberService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Member not found")
	}
	return utils.SuccessResponse(c, member)
}

// UpdateMember - Admin: Update member
func (h *MemberHandler) UpdateMember(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	member, err := h.memberService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Member not found")
	}
	if err := c.BodyParser(member); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.memberService.Update(member); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update member")
	}
	return utils.SuccessResponse(c, member)
}

// BulkDeleteMembers - Admin: Delete multiple members
func (h *MemberHandler) BulkDeleteMembers(c *fiber.Ctx) error {
	var req models.BulkDeleteRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if len(req.IDs) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No IDs provided for deletion")
	}

	if err := h.memberService.BulkDelete(req.IDs); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete members")
	}

	return utils.MessageResponse(c, "Members deleted successfully")
}
