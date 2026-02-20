package handlers

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/watloungporsai/wat-profile-backend/internal/middleware"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{
		authService: services.NewAuthService(db),
	}
}

// Register godoc
// @Summary Register a new user
// @Tags auth
// @Accept json
// @Produce json
// @Success 201 {object} map[string]interface{}
// @Router /api/v1/auth/register [post]
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Name     string `json:"name"`
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// ตรวจสอบ required fields
	missing := utils.ValidateRequired(map[string]string{
		"email": req.Email, "password": req.Password, "name": req.Name,
	})
	if len(missing) > 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Missing required fields: "+strings.Join(missing, ", "))
	}

	// ตรวจสอบ email format
	if !utils.ValidateEmail(req.Email) {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid email format")
	}

	// ตรวจสอบความยาว password
	if err := utils.ValidateMinLength(req.Password, 8, "password"); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	user, err := h.authService.Register(req.Email, req.Password, req.Name)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "User registered successfully",
		"data":    user,
	})
}

// Login godoc
// @Summary Login user
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/auth/login [post]
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.Email == "" || req.Password == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Email and password are required")
	}

	accessToken, refreshToken, user, err := h.authService.Login(req.Email, req.Password)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, err.Error())
	}

	return utils.SuccessResponse(c, fiber.Map{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"user":          user,
	})
}

// RefreshToken godoc
// @Summary Refresh access token
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/auth/refresh [post]
func (h *AuthHandler) RefreshToken(c *fiber.Ctx) error {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.RefreshToken == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Refresh token is required")
	}

	accessToken, err := h.authService.RefreshAccessToken(req.RefreshToken)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, err.Error())
	}

	return utils.SuccessResponse(c, fiber.Map{
		"access_token": accessToken,
	})
}

// GetProfile godoc
// @Summary Get current user profile
// @Tags auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/auth/me [get]
func (h *AuthHandler) GetProfile(c *fiber.Ctx) error {
	user, err := middleware.GetCurrentUser(c)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, err.Error())
	}

	return utils.SuccessResponse(c, user)
}
