package services

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/accountauth"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type PersonalDataRequestService struct {
	db  *gorm.DB
	now func() time.Time
}

func NewPersonalDataRequestService(db *gorm.DB, clocks ...func() time.Time) *PersonalDataRequestService {
	now := time.Now
	if len(clocks) > 0 && clocks[0] != nil {
		now = clocks[0]
	}
	return &PersonalDataRequestService{db: db, now: now}
}

type PersonalDataRequestInput struct {
	SubjectEmail      string `json:"subject_email"`
	SubjectMemberCode string `json:"subject_member_code"`
	RequestType       string `json:"request_type"`
	Notes             string `json:"notes"`
}

func (s *PersonalDataRequestService) Create(_ context.Context, input PersonalDataRequestInput, actor uuid.UUID) (*models.PersonalDataRequest, error) {
	input.RequestType = strings.ToLower(strings.TrimSpace(input.RequestType))
	if input.RequestType != "access" && input.RequestType != "erasure" {
		return nil, fmt.Errorf("request type must be access or erasure")
	}
	request := &models.PersonalDataRequest{SubjectEmail: strings.ToLower(strings.TrimSpace(input.SubjectEmail)), SubjectMemberCode: strings.TrimSpace(input.SubjectMemberCode), RequestType: input.RequestType, Notes: input.Notes, CreatedByID: &actor}
	if request.SubjectEmail == "" && request.SubjectMemberCode == "" {
		return nil, fmt.Errorf("subject email or member code is required")
	}
	if err := s.db.Create(request).Error; err != nil {
		return nil, err
	}
	return request, nil
}

func (s *PersonalDataRequestService) CreatePublic(_ context.Context, input PersonalDataRequestInput) (*models.PersonalDataRequest, error) {
	input.RequestType = strings.ToLower(strings.TrimSpace(input.RequestType))
	if input.RequestType != "access" && input.RequestType != "erasure" {
		return nil, fmt.Errorf("request type must be access or erasure")
	}
	email := strings.ToLower(strings.TrimSpace(input.SubjectEmail))
	memberCode := strings.TrimSpace(input.SubjectMemberCode)
	if email == "" && memberCode == "" {
		return nil, fmt.Errorf("subject email or member code is required")
	}
	request := &models.PersonalDataRequest{
		SubjectEmail:       email,
		SubjectMemberCode:  memberCode,
		RequestType:        input.RequestType,
		Notes:              strings.TrimSpace(input.Notes),
		Status:             "open",
		VerificationStatus: "unverified",
		CreatedByID:        nil,
	}
	if err := s.db.Create(request).Error; err != nil {
		return nil, err
	}
	return request, nil
}

func (s *PersonalDataRequestService) List() ([]models.PersonalDataRequest, error) {
	var rows []models.PersonalDataRequest
	err := s.db.Preload("Items").Order("created_at DESC").Find(&rows).Error
	return rows, err
}
func (s *PersonalDataRequestService) Get(id uuid.UUID) (*models.PersonalDataRequest, error) {
	var row models.PersonalDataRequest
	err := s.db.Preload("Items").First(&row, "id = ?", id).Error
	return &row, err
}

func (s *PersonalDataRequestService) Verify(id, actor uuid.UUID, method, evidence string) (*models.PersonalDataRequest, error) {
	method = strings.ToLower(strings.TrimSpace(method))
	evidence = strings.TrimSpace(evidence)
	if method != "email" && method != "in_person" {
		return nil, fmt.Errorf("unsupported verification method")
	}
	if evidence == "" {
		return nil, fmt.Errorf("verification evidence is required")
	}
	var row models.PersonalDataRequest
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&row, "id = ?", id).Error; err != nil {
			return err
		}
		if row.Status != "open" && row.Status != "verified" {
			return fmt.Errorf("request cannot be verified")
		}
		if method == "email" && (row.VerificationTokenHash == "" || row.VerificationExpiresAt == nil || s.now().After(*row.VerificationExpiresAt) || accountauth.HashOpaqueToken(evidence) != row.VerificationTokenHash) {
			return fmt.Errorf("email verification token is invalid or expired")
		}
		now := s.now()
		return tx.Model(&row).Updates(map[string]interface{}{"verification_method": method, "verification_status": "verified", "evidence_reference": evidence, "status": "verified", "verified_by_id": actor, "verified_at": now}).Error
	})
	if err != nil {
		return nil, err
	}
	return s.Get(id)
}

func (s *PersonalDataRequestService) IssueEmailVerification(id uuid.UUID) (string, *models.PersonalDataRequest, error) {
	var row models.PersonalDataRequest
	if err := s.db.First(&row, "id = ?", id).Error; err != nil {
		return "", nil, err
	}
	if row.SubjectEmail == "" {
		return "", nil, fmt.Errorf("request has no subject email")
	}
	plain, hash, err := accountauth.NewOpaqueToken()
	if err != nil {
		return "", nil, err
	}
	expires := s.now().Add(30 * time.Minute)
	if err := s.db.Model(&row).Updates(map[string]interface{}{"verification_token_hash": hash, "verification_expires_at": expires, "verification_method": "email"}).Error; err != nil {
		return "", nil, err
	}
	row.VerificationExpiresAt = &expires
	return plain, &row, nil
}

func (s *PersonalDataRequestService) SelectItems(id uuid.UUID, items []models.PersonalDataRequestItem) error {
	request, err := s.Get(id)
	if err != nil {
		return err
	}
	if request.Status != "verified" {
		return fmt.Errorf("request must be verified before selecting records")
	}
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("request_id = ?", id).Delete(&models.PersonalDataRequestItem{}).Error; err != nil {
			return err
		}
		for i := range items {
			items[i].ID = uuid.Nil
			items[i].RequestID = id
			if items[i].SelectedAction != "export" && items[i].SelectedAction != "anonymise" {
				return fmt.Errorf("invalid selected action")
			}
			if err := tx.Create(&items[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *PersonalDataRequestService) Reject(id uuid.UUID) error {
	return s.db.Model(&models.PersonalDataRequest{}).Where("id = ? AND status IN ?", id, []string{"open", "verified"}).Update("status", "rejected").Error
}
