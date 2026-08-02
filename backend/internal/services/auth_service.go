package services

import (
	"errors"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type AuthService struct {
	db *gorm.DB
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{db: db}
}

// Register creates a new user
func (s *AuthService) Register(email, password, name string) (*models.User, error) {
	// Check if user exists
	var existingUser models.User
	if err := s.db.Where("email = ?", email).First(&existingUser).Error; err == nil {
		return nil, errors.New("email already exists")
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return nil, err
	}

	// Create user
	hashedPasswordValue := hashedPassword
	user := models.User{
		Email:        email,
		PasswordHash: &hashedPasswordValue,
		Name:         name,
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

// Login authenticates a user
func (s *AuthService) Login(email, password string) (string, string, *models.User, error) {
	// Find user
	var user models.User
	if err := s.db.Preload("Role").Where("email = ?", email).First(&user).Error; err != nil {
		return "", "", nil, errors.New("invalid credentials")
	}

	// Check if account is active
	if !user.IsActive {
		return "", "", nil, errors.New("account is disabled")
	}

	// Verify password
	if user.PasswordHash == nil || !utils.CheckPasswordHash(password, *user.PasswordHash) {
		return "", "", nil, errors.New("invalid credentials")
	}

	// Generate tokens
	role := ""
	if user.Role != nil {
		role = user.Role.Name
	}

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Email, role)
	if err != nil {
		return "", "", nil, err
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID)
	if err != nil {
		return "", "", nil, err
	}

	// Save refresh token
	rt := models.RefreshToken{
		UserID:    user.ID,
		Token:     refreshToken,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	}
	s.db.Create(&rt)

	// Update last login
	now := time.Now()
	user.LastLoginAt = &now
	s.db.Save(&user)

	return accessToken, refreshToken, &user, nil
}

// RefreshAccessToken generates new access token from refresh token
func (s *AuthService) RefreshAccessToken(refreshToken string) (string, error) {
	// Verify refresh token
	userID, err := utils.VerifyRefreshToken(refreshToken)
	if err != nil {
		return "", errors.New("invalid refresh token")
	}

	// Check if refresh token exists in database
	var rt models.RefreshToken
	if err := s.db.Where("token = ? AND user_id = ?", refreshToken, userID).First(&rt).Error; err != nil {
		return "", errors.New("refresh token not found")
	}

	// Check if expired
	if rt.IsExpired() {
		return "", errors.New("refresh token expired")
	}

	// Get user
	var user models.User
	if err := s.db.Preload("Role").First(&user, userID).Error; err != nil {
		return "", errors.New("user not found")
	}

	// Generate new access token
	role := ""
	if user.Role != nil {
		role = user.Role.Name
	}

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Email, role)
	if err != nil {
		return "", err
	}

	return accessToken, nil
}
