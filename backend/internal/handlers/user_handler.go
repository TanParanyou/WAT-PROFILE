package handlers

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type UserHandler struct {
	userService *services.UserService
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{
		userService: services.NewUserService(db),
	}
}

// GetUsers - Admin: List users with pagination
func (h *UserHandler) GetUsers(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)

	users, total, err := h.userService.List(page, limit)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch users")
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    users,
		"total":   total,
		"page":    page,
		"limit":   limit,
	})
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
	user.RoleID = req.RoleID
	user.IsActive = req.IsActive

	if err := h.userService.Update(user, req.Password); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	return utils.SuccessResponse(c, user)
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
