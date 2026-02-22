package services

import (
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type ScheduleService struct {
	db *gorm.DB
}

func NewScheduleService(db *gorm.DB) *ScheduleService {
	return &ScheduleService{db: db}
}

// ListActive returns all active schedules, optionally filtered by type
func (s *ScheduleService) ListActive(scheduleType string) ([]models.Schedule, error) {
	var schedules []models.Schedule
	query := s.db.Where("is_active = ?", true).Order("display_order ASC")

	if scheduleType != "" {
		query = query.Where("schedule_type = ?", scheduleType)
	}

	err := query.Find(&schedules).Error
	return schedules, err
}

// Create creates a new schedule
func (s *ScheduleService) Create(schedule *models.Schedule) error {
	return s.db.Create(schedule).Error
}

// GetByID returns a schedule by ID
func (s *ScheduleService) GetByID(id int) (*models.Schedule, error) {
	var schedule models.Schedule
	err := s.db.First(&schedule, id).Error
	if err != nil {
		return nil, err
	}
	return &schedule, nil
}

// Update saves changes to a schedule
func (s *ScheduleService) Update(schedule *models.Schedule) error {
	return s.db.Save(schedule).Error
}

// Delete removes a schedule by ID
func (s *ScheduleService) Delete(id int) error {
	return s.db.Delete(&models.Schedule{}, id).Error
}

// BulkDelete removes multiple schedules by their IDs
func (s *ScheduleService) BulkDelete(ids []int) error {
	return s.db.Where("id IN ?", ids).Delete(&models.Schedule{}).Error
}
