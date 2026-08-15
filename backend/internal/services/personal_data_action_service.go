package services

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type PersonalDataActionService struct {
	db  *gorm.DB
	now func() time.Time
}

func NewPersonalDataActionService(db *gorm.DB, clocks ...func() time.Time) *PersonalDataActionService {
	now := time.Now
	if len(clocks) > 0 && clocks[0] != nil {
		now = clocks[0]
	}
	return &PersonalDataActionService{db: db, now: now}
}

// AnonymiseSelected preserves donation accounting fields while removing direct
// identifiers from each selected domain record.
func (s *PersonalDataActionService) AnonymiseSelected(_ context.Context, requestID, actor uuid.UUID) (int, error) {
	var request models.PersonalDataRequest
	if err := s.db.Preload("Items").First(&request, "id = ?", requestID).Error; err != nil {
		return 0, err
	}
	if request.Status != "verified" && request.Status != "processing" {
		return 0, fmt.Errorf("request must be verified before erasure")
	}
	count := 0
	err := s.db.Transaction(func(tx *gorm.DB) error {
		for _, item := range request.Items {
			if item.SelectedAction != "anonymise" {
				continue
			}
			id := strings.TrimSpace(item.RecordID)
			switch item.Domain {
			case "donation":
				if err := tx.Model(&models.Donation{}).Where("id = ?", id).Updates(map[string]interface{}{"donor_name": "Redacted donor", "donor_email": "redacted@privacy.invalid", "donor_phone": "", "donor_address": "", "notes": ""}).Error; err != nil {
					return err
				}
			case "contact_inquiry":
				if err := tx.Model(&models.ContactInquiry{}).Where("id = ?", id).Updates(map[string]interface{}{"name": "Redacted", "email": "redacted@privacy.invalid", "phone": "", "message": "[redacted]", "reply_message": ""}).Error; err != nil {
					return err
				}
			case "event_registration":
				if err := tx.Model(&models.EventRegistration{}).Where("id = ?", id).Updates(map[string]interface{}{"first_name": "Redacted", "last_name": "", "email": "redacted@privacy.invalid", "phone": "", "dietary_restrictions": "", "special_needs": "", "additional_notes": "", "user_id": nil, "member_id": nil, "manage_token_hash": nil, "manage_token_expires_at": nil, "confirmation_code": "redacted-" + id}).Error; err != nil {
					return err
				}
			case "event_registration_participant":
				if err := tx.Model(&models.EventRegistrationParticipant{}).Where("id = ?", id).Updates(map[string]interface{}{"first_name": "Redacted", "last_name": "", "dietary_restrictions": "", "special_needs": "", "additional_notes": ""}).Error; err != nil {
					return err
				}
			case "member":
				if err := tx.Model(&models.Member{}).Where("id = ?", id).Updates(map[string]interface{}{"first_name_th": "ผู้ขอลบข้อมูล", "last_name_th": "", "first_name_en": "Redacted", "last_name_en": "", "address_th": "", "address_en": "", "phone": "", "line_id": "", "emergency_contact_name": "", "emergency_contact_phone": "", "profile_image_url": "", "notes": ""}).Error; err != nil {
					return err
				}
			case "user":
				uid, err := uuid.Parse(id)
				if err != nil {
					return err
				}
				if err := tx.Model(&models.User{}).Where("id = ?", uid).Updates(map[string]interface{}{"email": "redacted-" + uid.String() + "@privacy.invalid", "name": "Redacted user", "avatar_url": ""}).Error; err != nil {
					return err
				}
			default:
				return fmt.Errorf("unsupported privacy domain %q", item.Domain)
			}
			if err := tx.Model(&item).Updates(map[string]interface{}{"result": "completed"}).Error; err != nil {
				return err
			}
			count++
		}
		now := s.now()
		return tx.Model(&request).Updates(map[string]interface{}{"status": "completed", "completed_by_id": actor, "completed_at": now}).Error
	})
	return count, err
}
