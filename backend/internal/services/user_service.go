package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type UserService struct {
	db *gorm.DB
}

func NewUserService(db *gorm.DB) *UserService {
	return &UserService{db: db}
}

// List returns a paginated list of users with their roles preloaded
func (s *UserService) List(page, limit int) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	query := s.db.Model(&models.User{})

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := query.Preload("Role").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&users).Error

	return users, total, err
}

// GetByID returns a user by ID with role preloaded
func (s *UserService) GetByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	err := s.db.Preload("Role").Where("id = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Create creates a new user, hashing their password
func (s *UserService) Create(user *models.User, password string) error {
	// Check if email already exists
	var existingUser models.User
	if err := s.db.Where("email = ?", user.Email).First(&existingUser).Error; err == nil {
		return errors.New("email already exists")
	}

	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return err
	}
	user.PasswordHash = hashedPassword

	return s.db.Create(user).Error
}

// Update saves changes to a user, conditionally hashing password if provided
func (s *UserService) Update(user *models.User, newPassword string) error {
	// Check email uniqueness if email changed
	var existingUser models.User
	if err := s.db.Where("email = ? AND id != ?", user.Email, user.ID).First(&existingUser).Error; err == nil {
		return errors.New("email already exists")
	}

	if newPassword != "" {
		hashedPassword, err := utils.HashPassword(newPassword)
		if err != nil {
			return err
		}
		user.PasswordHash = hashedPassword
	}

	return s.db.Save(user).Error
}

// Delete removes a user by ID, preventing self-deletion (handled in handler usually, but added protection here)
func (s *UserService) Delete(id, currentUserID uuid.UUID) error {
	if id == currentUserID {
		return errors.New("cannot delete yourself")
	}

	// Soft delete or hard delete? The model uses CASCADE constraints on related tables usually.
	return s.db.Delete(&models.User{}, "id = ?", id).Error
}
