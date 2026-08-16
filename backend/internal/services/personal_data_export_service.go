package services

import (
	"encoding/json"
	"fmt"
	"strings"

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
	var communityUserID uuid.UUID
	communitySubjectLoaded := false
	var err error
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
			if err := s.db.Preload("Participants").First(&row, item.RecordID).Error; err != nil {
				return nil, err
			}
			value = row
		case "event_registration_participant":
			var row models.EventRegistrationParticipant
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
		case "community_question":
			if !communitySubjectLoaded {
				communityUserID, err = s.subjectUserID(request)
				if err != nil {
					return nil, err
				}
				communitySubjectLoaded = true
			}
			var row models.CommunityQuestion
			if communityUserID == uuid.Nil || s.db.Where("id = ? AND author_user_id = ?", item.RecordID, communityUserID).First(&row).Error != nil {
				return nil, fmt.Errorf("community record is not owned by request subject")
			}
			value = map[string]interface{}{"id": row.ID, "category_id": row.CategoryID, "locale": row.Locale, "title": row.Title, "body": row.Body, "publication_status": row.PublicationStatus, "created_at": row.CreatedAt, "updated_at": row.UpdatedAt}
		case "community_answer":
			if !communitySubjectLoaded {
				communityUserID, err = s.subjectUserID(request)
				if err != nil {
					return nil, err
				}
				communitySubjectLoaded = true
			}
			var row models.CommunityAnswer
			if communityUserID == uuid.Nil || s.db.Where("id = ? AND author_user_id = ?", item.RecordID, communityUserID).First(&row).Error != nil {
				return nil, fmt.Errorf("community record is not owned by request subject")
			}
			value = map[string]interface{}{"id": row.ID, "question_id": row.QuestionID, "body": row.Body, "publication_status": row.PublicationStatus, "created_at": row.CreatedAt, "updated_at": row.UpdatedAt}
		case "community_comment":
			if !communitySubjectLoaded {
				communityUserID, err = s.subjectUserID(request)
				if err != nil {
					return nil, err
				}
				communitySubjectLoaded = true
			}
			var row models.CommunityComment
			if communityUserID == uuid.Nil || s.db.Where("id = ? AND author_user_id = ?", item.RecordID, communityUserID).First(&row).Error != nil {
				return nil, fmt.Errorf("community record is not owned by request subject")
			}
			value = map[string]interface{}{"id": row.ID, "question_id": row.QuestionID, "answer_id": row.AnswerID, "body": row.Body, "publication_status": row.PublicationStatus, "created_at": row.CreatedAt, "updated_at": row.UpdatedAt}
		case "community_vote":
			if !communitySubjectLoaded {
				communityUserID, err = s.subjectUserID(request)
				if err != nil {
					return nil, err
				}
				communitySubjectLoaded = true
			}
			var row models.CommunityAnswerVote
			if communityUserID == uuid.Nil || s.db.Where("answer_id = ? AND user_id = ?", item.RecordID, communityUserID).First(&row).Error != nil {
				return nil, fmt.Errorf("community record is not owned by request subject")
			}
			value = map[string]interface{}{"answer_id": row.AnswerID, "created_at": row.CreatedAt}
		case "community_notification":
			if !communitySubjectLoaded {
				communityUserID, err = s.subjectUserID(request)
				if err != nil {
					return nil, err
				}
				communitySubjectLoaded = true
			}
			var row models.CommunityNotification
			if communityUserID == uuid.Nil || s.db.Where("id = ? AND recipient_user_id = ?", item.RecordID, communityUserID).First(&row).Error != nil {
				return nil, fmt.Errorf("community record is not owned by request subject")
			}
			value = map[string]interface{}{"id": row.ID, "event_type": row.EventType, "target_type": row.TargetType, "target_id": row.TargetID, "read_at": row.ReadAt, "created_at": row.CreatedAt}
		default:
			return nil, fmt.Errorf("unsupported privacy domain %q", item.Domain)
		}
		records = append(records, map[string]interface{}{"domain": item.Domain, "record_id": item.RecordID, "data": value})
	}
	result := map[string]interface{}{"request_id": request.ID, "request_type": request.RequestType, "records": records, "record_count": len(records)}
	return json.Marshal(result)
}

func (s *PersonalDataExportService) subjectUserID(request models.PersonalDataRequest) (uuid.UUID, error) {
	if strings.TrimSpace(request.SubjectEmail) != "" {
		var user models.User
		if err := s.db.Where("LOWER(email) = ?", strings.ToLower(strings.TrimSpace(request.SubjectEmail))).First(&user).Error; err != nil {
			return uuid.Nil, err
		}
		return user.ID, nil
	}
	if strings.TrimSpace(request.SubjectMemberCode) != "" {
		var member models.Member
		if err := s.db.Where("member_code = ?", strings.TrimSpace(request.SubjectMemberCode)).First(&member).Error; err != nil {
			return uuid.Nil, err
		}
		if member.UserID == nil {
			return uuid.Nil, nil
		}
		return *member.UserID, nil
	}
	return uuid.Nil, nil
}
