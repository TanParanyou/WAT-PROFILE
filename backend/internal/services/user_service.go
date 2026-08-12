package services

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
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
	"id":         "users.id",
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

// Create creates a new user, validating password policy and hashing password
func (s *UserService) Create(user *models.User, password string) error {
	// Check password strength policy
	if err := accountauth.ValidatePasswordPolicy(password); err != nil {
		return err
	}

	// Check if email already exists
	var existingUser models.User
	if err := s.db.Where("email = ?", user.Email).First(&existingUser).Error; err == nil {
		return errors.New("email already exists")
	}

	isAdmin := false
	if user.RoleID != nil {
		var role models.Role
		if err := s.db.Where("id = ?", user.RoleID).First(&role).Error; err == nil {
			isAdmin = role.AdminAccess
		}
	}

	var hashedPassword string
	var err error
	if isAdmin {
		hashedPassword, err = utils.HashAdminPassword(password)
	} else {
		hashedPassword, err = utils.HashPassword(password)
	}
	if err != nil {
		return err
	}
	user.PasswordHash = &hashedPassword

	return s.db.Create(user).Error
}

// Update saves changes to a user, conditionally hashing password if provided.
// Password changes and account disablement revoke all active Admin sessions in
// the same transaction.
func (s *UserService) Update(user *models.User, newPassword string) error {
	// Check email uniqueness if email changed
	var existingUser models.User
	if err := s.db.Where("email = ? AND id != ?", user.Email, user.ID).First(&existingUser).Error; err == nil {
		return errors.New("email already exists")
	}

	passwordChanged := false
	if newPassword != "" {
		if err := accountauth.ValidatePasswordPolicy(newPassword); err != nil {
			return err
		}

		isAdmin := false
		if user.RoleID != nil {
			var role models.Role
			if err := s.db.Where("id = ?", user.RoleID).First(&role).Error; err == nil {
				isAdmin = role.AdminAccess
			}
		} else if user.Role != nil {
			isAdmin = user.Role.AdminAccess
		}

		var hashedPassword string
		var err error
		if isAdmin {
			hashedPassword, err = utils.HashAdminPassword(newPassword)
		} else {
			hashedPassword, err = utils.HashPassword(newPassword)
		}
		if err != nil {
			return err
		}
		user.PasswordHash = &hashedPassword
		passwordChanged = true
	}

	var current models.User
	if err := s.db.Select("is_active").Where("id = ?", user.ID).First(&current).Error; err != nil {
		return err
	}

	reason := ""
	switch {
	case passwordChanged:
		reason = "password_changed"
	case current.IsActive && !user.IsActive:
		reason = "account_disabled"
	}

	if reason == "" {
		return s.db.Save(user).Error
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(user).Error; err != nil {
			return err
		}
		return revokeAllAdminSessionsTx(tx, user.ID, reason, time.Now())
	})
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

// UpdateProfile allows a user to update their own profile (name, email, avatar_url) and optionally their password
func (s *UserService) UpdateProfile(userID uuid.UUID, name, email string, avatarURL *string, currentPassword, newPassword string) (*models.User, error) {
	var user models.User
	if err := s.db.Preload("Role").Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, errors.New("user not found")
	}

	// Email uniqueness check if email is changed
	if email != "" && email != user.Email {
		var count int64
		if err := s.db.Model(&models.User{}).Where("email = ? AND id != ?", email, userID).Count(&count).Error; err != nil {
			return nil, err
		}
		if count > 0 {
			return nil, errors.New("email already in use")
		}
		user.Email = email
	}

	if name != "" {
		user.Name = name
	}

	if avatarURL != nil {
		user.AvatarURL = *avatarURL
	}

	// Handle password change if newPassword is provided
	passwordChanged := false
	if newPassword != "" {
		if currentPassword == "" {
			return nil, errors.New("current password is required to set a new password")
		}
		if user.PasswordHash == nil || !utils.CheckPasswordHash(currentPassword, *user.PasswordHash) {
			return nil, errors.New("incorrect current password")
		}
		if err := accountauth.ValidatePasswordPolicy(newPassword); err != nil {
			return nil, err
		}

		isAdmin := user.Role != nil && user.Role.AdminAccess

		var hashedPassword string
		var err error
		if isAdmin {
			hashedPassword, err = utils.HashAdminPassword(newPassword)
		} else {
			hashedPassword, err = utils.HashPassword(newPassword)
		}
		if err != nil {
			return nil, err
		}
		user.PasswordHash = &hashedPassword
		passwordChanged = true
	}

	if passwordChanged {
		// A password change revokes every active Admin session in the same
		// transaction so stolen refresh credentials stop working immediately.
		err := s.db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Save(&user).Error; err != nil {
				return err
			}
			return revokeAllAdminSessionsTx(tx, userID, "password_changed", time.Now())
		})
		if err != nil {
			return nil, err
		}
		return &user, nil
	}

	if err := s.db.Save(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}
