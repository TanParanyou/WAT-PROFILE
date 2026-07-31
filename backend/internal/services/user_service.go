package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
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

type UserListOptions struct {
	Common        listquery.Common
	Statuses      []string
	RoleIDs       []uuid.UUID
	EmailVerified []bool
}

var userSortColumns = map[string]string{
	"created_at": "users.created_at",
	"name":       "users.name",
	"email":      "users.email",
	"role":       "users.role_id",
}

// List returns a paginated list of users with search, filters, sorting, and roles preloaded
func (s *UserService) List(options UserListOptions) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	query := s.db.Model(&models.User{})

	if options.Common.Search != "" {
		searchTerm := "%" + options.Common.Search + "%"
		query = query.Where("users.name ILIKE ? OR users.email ILIKE ?", searchTerm, searchTerm)
	}

	if len(options.Statuses) > 0 {
		var activeFilter []bool
		for _, st := range options.Statuses {
			if st == "active" {
				activeFilter = append(activeFilter, true)
			} else if st == "inactive" {
				activeFilter = append(activeFilter, false)
			}
		}
		if len(activeFilter) > 0 {
			query = query.Where("users.is_active IN ?", activeFilter)
		}
	}

	if len(options.RoleIDs) > 0 {
		query = query.Where("users.role_id IN ?", options.RoleIDs)
	}

	if len(options.EmailVerified) > 0 {
		query = query.Where("users.email_verified IN ?", options.EmailVerified)
	}

	if options.Common.From != nil {
		query = query.Where("users.created_at >= ?", *options.Common.From)
	}
	if options.Common.To != nil {
		query = query.Where("users.created_at <= ?", *options.Common.To)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortCol, ok := userSortColumns[options.Common.Sort]
	if !ok {
		sortCol = "users.created_at"
	}
	orderDir := "DESC"
	if options.Common.Order == "asc" {
		orderDir = "ASC"
	}

	offset := (options.Common.Page - 1) * options.Common.Limit
	err := query.Preload("Role").
		Order(sortCol + " " + orderDir + ", users.id " + orderDir).
		Offset(offset).
		Limit(options.Common.Limit).
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

// BulkDelete removes multiple users by their IDs
func (s *UserService) BulkDelete(ids []uuid.UUID, currentUserID uuid.UUID) error {
	for _, id := range ids {
		if id == currentUserID {
			return errors.New("cannot delete yourself in a bulk operation")
		}
	}
	return s.db.Where("id IN ?", ids).Delete(&models.User{}).Error
}
