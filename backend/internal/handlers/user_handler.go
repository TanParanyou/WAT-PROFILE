package handlers

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type UserHandler struct {
	userService  *services.UserService
	auditService *services.AuditService
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{
		userService:  services.NewUserService(db),
		auditService: services.NewAuditService(db),
	}
}

// GetUsers - Admin: List users with pagination
func (h *UserHandler) GetUsers(c *fiber.Ctx) error {
	common, err := listquery.Parse(c, listquery.Config{
		DefaultSort:  "created_at",
		DefaultOrder: "desc",
		AllowedSort: map[string]string{
			"created_at": "created_at",
			"name":       "name",
			"email":      "email",
			"role":       "role_id",
		},
	})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	statuses := listquery.ExtractMulti(c, "status")
	roleIDStrs := listquery.ExtractMulti(c, "role")
	var roleIDs []uuid.UUID
	for _, idStr := range roleIDStrs {
		if uid, parseErr := uuid.Parse(idStr); parseErr == nil {
			roleIDs = append(roleIDs, uid)
		}
	}

	emailVerifiedStrs := listquery.ExtractMulti(c, "email_verified")
	var emailVerified []bool
	for _, ev := range emailVerifiedStrs {
		if ev == "true" {
			emailVerified = append(emailVerified, true)
		} else if ev == "false" {
			emailVerified = append(emailVerified, false)
		}
	}

	options := services.UserListOptions{
		Common:        common,
		Statuses:      statuses,
		RoleIDs:       roleIDs,
		EmailVerified: emailVerified,
	}

	users, total, err := h.userService.List(options)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch users")
	}

	return utils.PaginatedResponse(c, users, common.Page, common.Limit, int(total))
}

// GetUser - Admin: Get single user by id
func (h *UserHandler) GetUser(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid UUID")
	}

	user, err := h.userService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "User not found")
	}

	return utils.SuccessResponse(c, user)
}

// CreateUserRequest defines the request body for creating a user
type CreateUserRequest struct {
	Email    string     `json:"email"`
	Password string     `json:"password"`
	Name     string     `json:"name"`
	RoleID   *uuid.UUID `json:"role_id"`
	IsActive bool       `json:"is_active"`
}

// CreateUser - Admin: Create new user
func (h *UserHandler) CreateUser(c *fiber.Ctx) error {
	var req CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	req.Email = strings.TrimSpace(req.Email)
	req.Name = strings.TrimSpace(req.Name)

	if req.Email == "" || req.Password == "" || req.Name == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Email, password, and name are required")
	}

	user := models.User{
		Email:    req.Email,
		Name:     req.Name,
		RoleID:   req.RoleID,
		IsActive: req.IsActive,
	}

	if err := h.userService.Create(&user, req.Password); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": user})
}

// UpdateUserRequest defines the request body for updating a user
type UpdateUserRequest struct {
	Email    string     `json:"email"`
	Name     string     `json:"name"`
	Password string     `json:"password,omitempty"`
	RoleID   *uuid.UUID `json:"role_id"`
	IsActive bool       `json:"is_active"`
}

// UpdateUser - Admin: Update user
func (h *UserHandler) UpdateUser(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid UUID")
	}

	user, err := h.userService.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "User not found")
	}

	var req UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	req.Email = strings.TrimSpace(req.Email)
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Name != "" {
		user.Name = req.Name
	}
	wasActive := user.IsActive
	user.RoleID = req.RoleID
	user.IsActive = req.IsActive

	if err := h.userService.Update(user, req.Password); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	if req.Password != "" || (wasActive && !user.IsActive) {
		_ = h.auditService.LogSecurityEvent(c, "admin.sessions.revoked", "sessions_revoked", "admin_auth", user.ID.String())
	}

	return utils.SuccessResponse(c, user)
}

// UpdateAdminProfile - Admin: Update own profile (name/email/avatar/password).
// Password changes revoke all of the caller's admin sessions via the service.
func (h *UserHandler) UpdateAdminProfile(c *fiber.Ctx) error {
	user, err := middleware.GetCurrentUser(c)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Unauthorized")
	}

	var req UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(req.Email)
	if req.AvatarURL != nil {
		trimmed := strings.TrimSpace(*req.AvatarURL)
		req.AvatarURL = &trimmed
	}

	if req.Email != "" && !utils.ValidateEmail(req.Email) {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid email format")
	}

	if req.NewPassword != "" {
		if err := utils.ValidateMinLength(req.NewPassword, 8, "new_password"); err != nil {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
		}
	}

	updatedUser, err := h.userService.UpdateProfile(user.ID, req.Name, req.Email, req.AvatarURL, req.CurrentPassword, req.NewPassword)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	if req.NewPassword != "" {
		_ = h.auditService.LogSecurityEvent(c, "admin.sessions.revoked", "sessions_revoked", "admin_auth", user.ID.String())
	}

	return utils.SuccessResponse(c, updatedUser)
}

// DeleteUser - Admin: Delete user
func (h *UserHandler) DeleteUser(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid UUID")
	}

	// In a real app we'd get current userID from JWT context
	// For now we pass uuid.Nil to bypass the self-delete check or get it from context if available
	var currentUserID uuid.UUID
	if val := c.Locals("user_id"); val != nil {
		if uid, ok := val.(string); ok {
			currentUserID, _ = uuid.Parse(uid)
		} else if uid, ok := val.(uuid.UUID); ok {
			currentUserID = uid
		}
	}

	if err := h.userService.Delete(id, currentUserID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	return utils.MessageResponse(c, "User deleted successfully")
}

// BulkDeleteUsers - Admin: Delete multiple users
func (h *UserHandler) BulkDeleteUsers(c *fiber.Ctx) error {
	var req models.BulkDeleteUUIDRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if len(req.IDs) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No IDs provided for deletion")
	}

	var currentUserID uuid.UUID
	if val := c.Locals("user_id"); val != nil {
		if uid, ok := val.(string); ok {
			currentUserID, _ = uuid.Parse(uid)
		} else if uid, ok := val.(uuid.UUID); ok {
			currentUserID = uid
		}
	}

	if err := h.userService.BulkDelete(req.IDs, currentUserID); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, err.Error())
	}

	return utils.MessageResponse(c, "Users deleted successfully")
}
