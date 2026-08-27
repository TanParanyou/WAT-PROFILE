package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type BackupService struct {
	db *gorm.DB
}

func NewBackupService(db *gorm.DB) *BackupService {
	return &BackupService{db: db}
}

type BackupStatusResponse struct {
	LastAutomatedAt       *time.Time `json:"last_automated_at"`
	LastSnapshotAt        *time.Time `json:"last_snapshot_at"`
	AutomatedStatus       string     `json:"automated_status"`
	AutomatedRecordsCount int64      `json:"automated_records_count"`
	TotalTables           int        `json:"total_tables"`
}

type DatabaseSnapshot struct {
	Metadata struct {
		AppName      string           `json:"app_name"`
		ExportedAt   time.Time        `json:"exported_at"`
		Version      string           `json:"version"`
		RecordCounts map[string]int64 `json:"record_counts"`
	} `json:"metadata"`
	Data struct {
		Events                        []models.Event                        `json:"events"`
		EventCategories               []models.EventCategory               `json:"event_categories"`
		EventRegistrations            []models.EventRegistration            `json:"event_registrations"`
		EventRegistrationParticipants []models.EventRegistrationParticipant `json:"event_registration_participants"`
		CalendarResources             []models.CalendarResource             `json:"calendar_resources"`
		Monks                         []models.Monk                         `json:"monks"`
		Gallery                       []models.Gallery                      `json:"gallery"`
		GalleryCategories             []models.GalleryCategory             `json:"gallery_categories"`
		Schedules                     []models.Schedule                     `json:"schedules"`
		Donations                     []models.Donation                     `json:"donations"`
		DonationCategories            []models.DonationCategory            `json:"donation_categories"`
		Members                       []models.Member                       `json:"members"`
		ContactInquiries              []models.ContactInquiry              `json:"contact_inquiries"`
		Settings                      []models.Setting                      `json:"settings"`
		Roles                         []models.Role                         `json:"roles"`
		CommunityCategories           []models.CommunityCategory           `json:"community_categories"`
		CommunityQuestions            []models.CommunityQuestion            `json:"community_questions"`
		CommunityAnswers              []models.CommunityAnswer              `json:"community_answers"`
		CommunityComments             []models.CommunityComment             `json:"community_comments"`
		ContentPages                  []models.ContentPage                 `json:"content_pages"`
		ContentSections               []models.ContentSection              `json:"content_sections"`
		Media                         []models.Media                        `json:"media"`
		Chantings                     []models.Chanting                     `json:"chantings"`
		ChatbotKnowledgeBases         []models.ChatbotKnowledgeBase        `json:"chatbot_knowledge_bases"`
	} `json:"data"`
}

func isSensitiveSettingKey(key string) bool {
	lower := strings.ToLower(key)
	return strings.Contains(lower, "secret") ||
		strings.Contains(lower, "key") ||
		strings.Contains(lower, "token") ||
		strings.Contains(lower, "password") ||
		strings.Contains(lower, "credential") ||
		strings.Contains(lower, "private")
}

func (s *BackupService) setSettingValue(key string, value string) error {
	var setting models.Setting
	err := s.db.Where("key = ?", key).First(&setting).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			setting = models.Setting{
				Key:   key,
				Value: value,
			}
			return s.db.Create(&setting).Error
		}
		return err
	}
	setting.Value = value
	return s.db.Save(&setting).Error
}

func (s *BackupService) getSettingValue(key string) string {
	var setting models.Setting
	if err := s.db.Where("key = ?", key).First(&setting).Error; err != nil {
		return ""
	}
	return setting.Value
}

func (s *BackupService) GetBackupStatus() (*BackupStatusResponse, error) {
	status := &BackupStatusResponse{
		AutomatedStatus: "none",
		TotalTables:     24,
	}

	autoAtStr := s.getSettingValue("backup_last_automated_at")
	if autoAtStr != "" {
		if t, err := time.Parse(time.RFC3339, autoAtStr); err == nil {
			status.LastAutomatedAt = &t
		}
	}

	snapAtStr := s.getSettingValue("backup_last_snapshot_at")
	if snapAtStr != "" {
		if t, err := time.Parse(time.RFC3339, snapAtStr); err == nil {
			status.LastSnapshotAt = &t
		}
	}

	autoStatus := s.getSettingValue("backup_last_automated_status")
	if autoStatus != "" {
		status.AutomatedStatus = autoStatus
	}

	var recCount int64
	recStr := s.getSettingValue("backup_last_automated_records")
	if recStr != "" {
		_, _ = fmt.Sscanf(recStr, "%d", &recCount)
		status.AutomatedRecordsCount = recCount
	}

	return status, nil
}

func (s *BackupService) RecordAutomatedBackup(backupStatus string, recordCount int64, notes string) error {
	nowStr := time.Now().UTC().Format(time.RFC3339)
	if backupStatus == "" {
		backupStatus = "success"
	}

	if err := s.setSettingValue("backup_last_automated_at", nowStr); err != nil {
		return err
	}
	if err := s.setSettingValue("backup_last_automated_status", backupStatus); err != nil {
		return err
	}
	if recordCount > 0 {
		if err := s.setSettingValue("backup_last_automated_records", fmt.Sprintf("%d", recordCount)); err != nil {
			return err
		}
	}
	if notes != "" {
		if err := s.setSettingValue("backup_last_automated_notes", notes); err != nil {
			return err
		}
	}
	return nil
}

func (s *BackupService) RecordSnapshotDownload() error {
	nowStr := time.Now().UTC().Format(time.RFC3339)
	return s.setSettingValue("backup_last_snapshot_at", nowStr)
}

func (s *BackupService) ExportSnapshot() (*DatabaseSnapshot, error) {
	snapshot := &DatabaseSnapshot{}
	snapshot.Metadata.AppName = "WAT-PROFILE"
	snapshot.Metadata.ExportedAt = time.Now().UTC()
	snapshot.Metadata.Version = "1.0.0"
	snapshot.Metadata.RecordCounts = make(map[string]int64)

	// Events
	s.db.Preload("Category").Preload("Schedules").Find(&snapshot.Data.Events)
	snapshot.Metadata.RecordCounts["events"] = int64(len(snapshot.Data.Events))

	// Event Categories
	s.db.Find(&snapshot.Data.EventCategories)
	snapshot.Metadata.RecordCounts["event_categories"] = int64(len(snapshot.Data.EventCategories))

	// Event Registrations
	s.db.Find(&snapshot.Data.EventRegistrations)
	snapshot.Metadata.RecordCounts["event_registrations"] = int64(len(snapshot.Data.EventRegistrations))

	// Event Registration Participants
	s.db.Find(&snapshot.Data.EventRegistrationParticipants)
	snapshot.Metadata.RecordCounts["event_registration_participants"] = int64(len(snapshot.Data.EventRegistrationParticipants))

	// Calendar Resources
	s.db.Find(&snapshot.Data.CalendarResources)
	snapshot.Metadata.RecordCounts["calendar_resources"] = int64(len(snapshot.Data.CalendarResources))

	// Monks
	s.db.Find(&snapshot.Data.Monks)
	snapshot.Metadata.RecordCounts["monks"] = int64(len(snapshot.Data.Monks))

	// Gallery
	s.db.Preload("Category").Find(&snapshot.Data.Gallery)
	snapshot.Metadata.RecordCounts["gallery"] = int64(len(snapshot.Data.Gallery))

	// Gallery Categories
	s.db.Find(&snapshot.Data.GalleryCategories)
	snapshot.Metadata.RecordCounts["gallery_categories"] = int64(len(snapshot.Data.GalleryCategories))

	// Schedules
	s.db.Find(&snapshot.Data.Schedules)
	snapshot.Metadata.RecordCounts["schedules"] = int64(len(snapshot.Data.Schedules))

	// Donations
	s.db.Preload("Category").Find(&snapshot.Data.Donations)
	snapshot.Metadata.RecordCounts["donations"] = int64(len(snapshot.Data.Donations))

	// Donation Categories
	s.db.Find(&snapshot.Data.DonationCategories)
	snapshot.Metadata.RecordCounts["donation_categories"] = int64(len(snapshot.Data.DonationCategories))

	// Members
	s.db.Find(&snapshot.Data.Members)
	snapshot.Metadata.RecordCounts["members"] = int64(len(snapshot.Data.Members))

	// Contact Inquiries
	s.db.Find(&snapshot.Data.ContactInquiries)
	snapshot.Metadata.RecordCounts["contact_inquiries"] = int64(len(snapshot.Data.ContactInquiries))

	// Settings (Redact sensitive values like secrets, API keys, passwords)
	s.db.Find(&snapshot.Data.Settings)
	for i := range snapshot.Data.Settings {
		if isSensitiveSettingKey(snapshot.Data.Settings[i].Key) {
			snapshot.Data.Settings[i].Value = "[REDACTED]"
		}
	}
	snapshot.Metadata.RecordCounts["settings"] = int64(len(snapshot.Data.Settings))

	// Roles
	s.db.Find(&snapshot.Data.Roles)
	snapshot.Metadata.RecordCounts["roles"] = int64(len(snapshot.Data.Roles))

	// Community Categories
	s.db.Find(&snapshot.Data.CommunityCategories)
	snapshot.Metadata.RecordCounts["community_categories"] = int64(len(snapshot.Data.CommunityCategories))

	// Community Questions
	s.db.Find(&snapshot.Data.CommunityQuestions)
	snapshot.Metadata.RecordCounts["community_questions"] = int64(len(snapshot.Data.CommunityQuestions))

	// Community Answers
	s.db.Find(&snapshot.Data.CommunityAnswers)
	snapshot.Metadata.RecordCounts["community_answers"] = int64(len(snapshot.Data.CommunityAnswers))

	// Community Comments
	s.db.Find(&snapshot.Data.CommunityComments)
	snapshot.Metadata.RecordCounts["community_comments"] = int64(len(snapshot.Data.CommunityComments))

	// Content Pages
	s.db.Find(&snapshot.Data.ContentPages)
	snapshot.Metadata.RecordCounts["content_pages"] = int64(len(snapshot.Data.ContentPages))

	// Content Sections
	s.db.Find(&snapshot.Data.ContentSections)
	snapshot.Metadata.RecordCounts["content_sections"] = int64(len(snapshot.Data.ContentSections))

	// Media Metadata
	s.db.Find(&snapshot.Data.Media)
	snapshot.Metadata.RecordCounts["media"] = int64(len(snapshot.Data.Media))

	// Chantings
	s.db.Find(&snapshot.Data.Chantings)
	snapshot.Metadata.RecordCounts["chantings"] = int64(len(snapshot.Data.Chantings))

	// Chatbot Knowledge Bases
	s.db.Find(&snapshot.Data.ChatbotKnowledgeBases)
	snapshot.Metadata.RecordCounts["chatbot_knowledge_bases"] = int64(len(snapshot.Data.ChatbotKnowledgeBases))

	// Record snapshot time
	_ = s.RecordSnapshotDownload()

	return snapshot, nil
}
