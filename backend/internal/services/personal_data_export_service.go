package services

import (
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type PersonalDataExportService struct{ db *gorm.DB }

func NewPersonalDataExportService(db *gorm.DB) *PersonalDataExportService {
	return &PersonalDataExportService{db: db}
}

func (s *PersonalDataExportService) Export(id uuid.UUID) ([]byte, error) {
	var request models.PersonalDataRequest
	if err := s.db.Preload("Items").First(&request, "id = ?", id).Error; err != nil {
		return nil, err
	}
	if request.Status != "verified" && request.Status != "completed" {
		return nil, fmt.Errorf("request must be verified before export")
	}
	records := make([]map[string]interface{}, 0)
	for _, item := range request.Items {
		if item.SelectedAction != "export" {
			continue
		}
		var value interface{}
		switch item.Domain {
		case "donation":
			var row models.Donation
			if err := s.db.First(&row, item.RecordID).Error; err != nil {
				return nil, err
			}
			value = row
		case "contact_inquiry":
			var row models.ContactInquiry
			if err := s.db.First(&row, item.RecordID).Error; err != nil {
				return nil, err
			}
			value = row
		case "event_registration":
			var row models.EventRegistration
			if err := s.db.First(&row, item.RecordID).Error; err != nil {
				return nil, err
			}
			value = row
		case "member":
			var row models.Member
			if err := s.db.First(&row, item.RecordID).Error; err != nil {
				return nil, err
			}
			value = row
		case "user":
			var row models.User
			if err := s.db.First(&row, item.RecordID).Error; err != nil {
				return nil, err
			}
			value = row
		default:
			return nil, fmt.Errorf("unsupported privacy domain %q", item.Domain)
		}
		records = append(records, map[string]interface{}{"domain": item.Domain, "record_id": item.RecordID, "data": value})
	}
	result := map[string]interface{}{"request_id": request.ID, "request_type": request.RequestType, "records": records, "record_count": len(records)}
	return json.Marshal(result)
}
