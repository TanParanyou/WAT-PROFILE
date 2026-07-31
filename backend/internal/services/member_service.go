package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type MemberService struct {
	db *gorm.DB
}

func NewMemberService(db *gorm.DB) *MemberService {
	return &MemberService{db: db}
}

// Register creates a member profile for a user
func (s *MemberService) Register(member *models.Member, userID uuid.UUID) error {
	err := s.db.Transaction(func(tx *gorm.DB) error {
		// Check if member already exists (ภายใน transaction)
		var existing models.Member
		if err := tx.Where("user_id = ?", userID).First(&existing).Error; err == nil {
			return errors.New("member profile already exists")
		}

		member.UserID = &userID
		member.MemberCode = generateMemberCode(tx)
		member.MembershipDate = time.Now()

		if err := tx.Create(member).Error; err != nil {
			return err
		}

		// Reload with user relation
		return tx.Preload("User").First(member, member.ID).Error
	})

	return err
}

// GetByUserID returns a member by user ID
func (s *MemberService) GetByUserID(userID uuid.UUID) (*models.Member, error) {
	var member models.Member
	err := s.db.Preload("User").Where("user_id = ?", userID).First(&member).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

// UpdateByUserID updates the member profile for a given user
func (s *MemberService) UpdateByUserID(member *models.Member, userID uuid.UUID) error {
	member.UserID = &userID
	return s.db.Save(member).Error
}

type MemberListOptions struct {
	Common   listquery.Common
	Statuses []string
	Types    []string
}

var memberSortColumns = map[string]string{
	"created_at":      "members.created_at",
	"member_code":     "members.member_code",
	"membership_date": "members.membership_date",
	"membership_type": "members.membership_type",
}

// List returns paginated members with search, filters, sorting, and user details
func (s *MemberService) List(options MemberListOptions) ([]models.Member, int64, error) {
	var members []models.Member
	var total int64

	query := s.db.Model(&models.Member{}).
		Joins("LEFT JOIN users ON users.id = members.user_id")

	if options.Common.Search != "" {
		searchTerm := "%" + options.Common.Search + "%"
		query = query.Where(
			"members.first_name_th ILIKE ? OR members.last_name_th ILIKE ? OR members.first_name_en ILIKE ? OR members.last_name_en ILIKE ? OR members.member_code ILIKE ? OR members.phone ILIKE ? OR users.email ILIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	if len(options.Statuses) > 0 {
		query = query.Where("members.membership_status IN ?", options.Statuses)
	}

	if len(options.Types) > 0 {
		query = query.Where("members.membership_type IN ?", options.Types)
	}

	if options.Common.From != nil {
		query = query.Where("members.membership_date >= ?", *options.Common.From)
	}
	if options.Common.To != nil {
		query = query.Where("members.membership_date <= ?", *options.Common.To)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortCol, ok := memberSortColumns[options.Common.Sort]
	if !ok {
		sortCol = "members.created_at"
	}
	orderDir := "DESC"
	if options.Common.Order == "asc" {
		orderDir = "ASC"
	}

	offset := (options.Common.Page - 1) * options.Common.Limit
	err := query.Preload("User").
		Order(sortCol + " " + orderDir + ", members.id " + orderDir).
		Offset(offset).
		Limit(options.Common.Limit).
		Find(&members).Error

	return members, total, err
}

// GetByID returns a member by ID
func (s *MemberService) GetByID(id int) (*models.Member, error) {
	var member models.Member
	err := s.db.Preload("User").First(&member, id).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

// Update saves changes to a member
func (s *MemberService) Update(member *models.Member) error {
	return s.db.Save(member).Error
}

// generateMemberCode creates a unique member code (ใช้ tx เพื่อให้อยู่ใน transaction เดียวกัน)
func generateMemberCode(tx *gorm.DB) string {
	now := time.Now()
	var count int64
	tx.Model(&models.Member{}).
		Where("EXTRACT(YEAR FROM created_at) = ?", now.Year()).
		Count(&count)
	return fmt.Sprintf("WLP-%d-%03d", now.Year(), count+1)
}

// BulkDelete removes multiple members by their IDs
func (s *MemberService) BulkDelete(ids []int) error {
	return s.db.Where("id IN ?", ids).Delete(&models.Member{}).Error
}
