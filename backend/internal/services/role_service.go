package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type RoleService struct {
	db *gorm.DB
}

func NewRoleService(db *gorm.DB) *RoleService {
	return &RoleService{db: db}
}

type RoleListOptions struct {
	Common   listquery.Common
	Statuses []string
}

var roleSortColumns = map[string]string{
	"id":         "roles.id",
	"name":       "roles.name",
	"created_at": "roles.created_at",
}

// List returns a paginated list of roles with search, filter, and sorting
func (s *RoleService) List(options RoleListOptions) ([]models.Role, int64, error) {
	var roles []models.Role
	var total int64

	query := s.db.Model(&models.Role{})

	if options.Common.Search != "" {
		searchTerm := "%" + options.Common.Search + "%"
		query = query.Where("roles.name ILIKE ? OR roles.description ILIKE ?", searchTerm, searchTerm)
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
			query = query.Where("roles.is_active IN ?", activeFilter)
		}
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortCol, ok := roleSortColumns[options.Common.Sort]
	if !ok {
		sortCol = "roles.name"
	}
	orderDir := "ASC"
	if options.Common.Order == "desc" {
		orderDir = "DESC"
	}

	offset := (options.Common.Page - 1) * options.Common.Limit
	err := query.Order(sortCol + " " + orderDir + ", roles.id " + orderDir).
		Offset(offset).
		Limit(options.Common.Limit).
		Find(&roles).Error

	return roles, total, err
}

// GetByID returns an active role by ID
func (s *RoleService) GetByID(id uuid.UUID) (*models.Role, error) {
	var role models.Role
	err := s.db.Where("id = ?", id).First(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

// Create creates a new role
func (s *RoleService) Create(role *models.Role) error {
	return s.db.Create(role).Error
}

// Update saves changes to a role, preventing modification of system role constraints
func (s *RoleService) Update(role *models.Role) error {
	var existing models.Role
	if err := s.db.First(&existing, "id = ?", role.ID).Error; err != nil {
		return err
	}

	// Protect system roles
	if existing.IsSystem {
		if role.Name != existing.Name {
			return errors.New("cannot rename a system role")
		}
		if !role.IsActive {
			return errors.New("cannot deactivate a system role")
		}
		if existing.Name == "admin" && !role.AdminAccess {
			return errors.New("cannot revoke admin_access from the system admin role")
		}
		// Ensure is_system flag cannot be cleared
		role.IsSystem = true
	}

	return s.db.Save(role).Error
}

// Delete removes a role by ID, preventing deletion of system roles
func (s *RoleService) Delete(id uuid.UUID) error {
	// First fetch the role to check if it's a protected system role
	var role models.Role
	if err := s.db.First(&role, "id = ?", id).Error; err != nil {
		return err
	}

	if role.IsSystem || role.Name == "admin" {
		return errors.New("cannot delete a system role")
	}

	// Check if any users are assigned to this role
	var count int64
	if err := s.db.Model(&models.User{}).Where("role_id = ?", id).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return errors.New("cannot delete role because it is assigned to users")
	}

	return s.db.Delete(&models.Role{}, "id = ?", id).Error
}

// BulkDelete removes multiple roles by their IDs, skipping or rejecting system roles
func (s *RoleService) BulkDelete(ids []uuid.UUID) error {
	for _, id := range ids {
		var role models.Role
		if err := s.db.First(&role, "id = ?", id).Error; err != nil {
			continue // Skip if not found
		}
		if role.IsSystem || role.Name == "admin" {
			return errors.New("cannot delete system role '" + role.Name + "' in bulk operation")
		}

		var count int64
		if err := s.db.Model(&models.User{}).Where("role_id = ?", id).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return errors.New("cannot delete role '" + role.Name + "' because it is assigned to users")
		}
	}

	return s.db.Where("id IN ?", ids).Delete(&models.Role{}).Error
}
