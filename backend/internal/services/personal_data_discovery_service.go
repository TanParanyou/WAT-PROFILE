package services

import (
	"context"
	"fmt"
	"strings"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type PersonalDataSearch struct {
	Email      string
	MemberCode string
}

type PersonalDataCandidate struct {
	Domain      string `json:"domain"`
	RecordID    string `json:"record_id"`
	MatchBasis  string `json:"match_basis"`
	DisplayName string `json:"display_name"`
	MaskedEmail string `json:"masked_email"`
}

type PersonalDataDiscoveryService struct{ db *gorm.DB }

func NewPersonalDataDiscoveryService(db *gorm.DB) *PersonalDataDiscoveryService {
	return &PersonalDataDiscoveryService{db: db}
}

func (s *PersonalDataDiscoveryService) Discover(_ context.Context, search PersonalDataSearch) ([]PersonalDataCandidate, error) {
	email := strings.ToLower(strings.TrimSpace(search.Email))
	code := strings.TrimSpace(search.MemberCode)
	if email == "" && code == "" {
		return nil, fmt.Errorf("email or member code is required")
	}
	result := make([]PersonalDataCandidate, 0)
	var contacts []models.ContactInquiry
	q := s.db
	if email != "" {
		q = q.Where("LOWER(email) = ?", email)
	}
	if err := q.Find(&contacts).Error; err != nil {
		return nil, err
	}
	for _, item := range contacts {
		result = append(result, PersonalDataCandidate{"contact_inquiry", fmt.Sprint(item.ID), "email", item.Name, maskEmail(item.Email)})
	}

	q = s.db
	if email != "" {
		q = q.Where("LOWER(email) = ?", email)
	}
	var registrations []models.EventRegistration
	if err := q.Find(&registrations).Error; err != nil {
		return nil, err
	}
	for _, item := range registrations {
		result = append(result, PersonalDataCandidate{"event_registration", fmt.Sprint(item.ID), "email", strings.TrimSpace(item.FirstName + " " + item.LastName), maskEmail(item.Email)})
	}

	q = s.db
	if email != "" {
		q = q.Where("LOWER(donor_email) = ?", email)
	}
	var donations []models.Donation
	if err := q.Find(&donations).Error; err != nil {
		return nil, err
	}
	for _, item := range donations {
		result = append(result, PersonalDataCandidate{"donation", fmt.Sprint(item.ID), "donor_email", item.DonorName, maskEmail(item.DonorEmail)})
	}

	var members []models.Member
	q = s.db
	if code != "" {
		q = q.Where("member_code = ?", code)
	}
	if email != "" {
		q = q.Joins("LEFT JOIN users ON users.id = members.user_id").Where("LOWER(users.email) = ?", email)
	}
	if err := q.Find(&members).Error; err != nil {
		return nil, err
	}
	for _, item := range members {
		name := strings.TrimSpace(item.FirstNameTH + " " + item.LastNameTH)
		result = append(result, PersonalDataCandidate{"member", fmt.Sprint(item.ID), "member_code", name, ""})
		if item.UserID != nil {
			result = append(result, PersonalDataCandidate{"user", item.UserID.String(), "member", name, ""})
		}
	}
	var users []models.User
	if email != "" {
		if err := s.db.Where("LOWER(email) = ?", email).Find(&users).Error; err != nil {
			return nil, err
		}
		for _, item := range users {
			result = append(result, PersonalDataCandidate{"user", item.ID.String(), "email", item.Name, maskEmail(item.Email)})
		}
	}
	return result, nil
}

func maskEmail(value string) string {
	parts := strings.SplitN(value, "@", 2)
	if len(parts) != 2 || parts[0] == "" {
		return ""
	}
	local := parts[0]
	if len(local) > 1 {
		local = local[:1] + "***"
	} else {
		local = "***"
	}
	return local + "@" + parts[1]
}
