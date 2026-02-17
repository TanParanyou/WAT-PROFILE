package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
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
	// Check if member already exists
	var existing models.Member
	if err := s.db.Where("user_id = ?", userID).First(&existing).Error; err == nil {
		return errors.New("member profile already exists")
	}

	member.UserID = &userID
	member.MemberCode = s.generateMemberCode()
	member.MembershipDate = time.Now()

	if err := s.db.Create(member).Error; err != nil {
		return err
	}

	// Reload with user relation
	return s.db.Preload("User").First(member, member.ID).Error
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

// List returns paginated members with filters
func (s *MemberService) List(page, limit int, status, memberType, search string) ([]models.Member, int64, error) {
	var members []models.Member
	query := s.db.Order("created_at DESC")

	if status != "" {
		query = query.Where("membership_status = ?", status)
	}
	if memberType != "" {
		query = query.Where("membership_type = ?", memberType)
	}
	if search != "" {
		searchParam := "%" + search + "%"
		query = query.Where(
			"first_name_th ILIKE ? OR last_name_th ILIKE ? OR first_name_en ILIKE ? OR last_name_en ILIKE ? OR member_code ILIKE ?",
			searchParam, searchParam, searchParam, searchParam, searchParam,
		)
	}

	var total int64
	query.Model(&models.Member{}).Count(&total)

	offset := (page - 1) * limit
	err := query.Preload("User").Offset(offset).Limit(limit).Find(&members).Error

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

// generateMemberCode creates a unique member code
func (s *MemberService) generateMemberCode() string {
	now := time.Now()
	var count int64
	s.db.Model(&models.Member{}).
		Where("EXTRACT(YEAR FROM created_at) = ?", now.Year()).
		Count(&count)
	return fmt.Sprintf("WLP-%d-%03d", now.Year(), count+1)
}
