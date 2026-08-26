package services

import (
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

type DatabaseSnapshot struct {
	Metadata struct {
		AppName      string           `json:"app_name"`
		ExportedAt   time.Time        `json:"exported_at"`
		Version      string           `json:"version"`
		RecordCounts map[string]int64 `json:"record_counts"`
	} `json:"metadata"`
	Data struct {
		Events             []models.Event            `json:"events"`
		EventCategories    []models.EventCategory    `json:"event_categories"`
		CalendarResources  []models.CalendarResource `json:"calendar_resources"`
		Monks              []models.Monk             `json:"monks"`
		Gallery            []models.Gallery          `json:"gallery"`
		GalleryCategories  []models.GalleryCategory  `json:"gallery_categories"`
		Schedules          []models.Schedule         `json:"schedules"`
		Donations          []models.Donation         `json:"donations"`
		DonationCategories []models.DonationCategory `json:"donation_categories"`
		Members            []models.Member           `json:"members"`
		ContactInquiries   []models.ContactInquiry   `json:"contact_inquiries"`
		Settings           []models.Setting          `json:"settings"`
		Roles              []models.Role             `json:"roles"`
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

	return snapshot, nil
}
