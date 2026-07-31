package services

import (
	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type ScheduleService struct {
	db *gorm.DB
}

func NewScheduleService(db *gorm.DB) *ScheduleService {
	return &ScheduleService{db: db}
}

type ScheduleListOptions struct {
	Common        listquery.Common
	Statuses      []string
	ScheduleTypes []string
	Weekdays      []int
}

var scheduleSortColumns = map[string]string{
	"display_order": "schedules.display_order",
	"activity":      "schedules.title->>'th'",
	"day_of_week":   "schedules.day_of_week",
	"schedule_type": "schedules.schedule_type",
}

// ListAdmin returns a paginated list of schedules for admin management
func (s *ScheduleService) ListAdmin(options ScheduleListOptions) ([]models.Schedule, int64, error) {
	var schedules []models.Schedule
	var total int64

	query := s.db.Model(&models.Schedule{})

	if options.Common.Search != "" {
		searchTerm := "%" + options.Common.Search + "%"
		query = query.Where(
			"schedules.title->>'th' ILIKE ? OR schedules.title->>'en' ILIKE ? OR schedules.title->>'de' ILIKE ? OR schedules.description->>'th' ILIKE ? OR schedules.description->>'en' ILIKE ? OR schedules.description->>'de' ILIKE ? OR schedules.location->>'th' ILIKE ? OR schedules.location->>'en' ILIKE ? OR schedules.location->>'de' ILIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	if len(options.Statuses) > 0 {
		var activeFilter []bool
		for _, st := range options.Statuses {
			if st == "active" {
				activeFilter = append(activeFilter, true)
			} else if st == "inactive" {
				activeFilter = append(activeFilter, false)
			}
		}
		if len(activeFilter) > 0 {
			query = query.Where("schedules.is_active IN ?", activeFilter)
		}
	}

	if len(options.ScheduleTypes) > 0 {
		query = query.Where("schedules.schedule_type IN ?", options.ScheduleTypes)
	}

	if len(options.Weekdays) > 0 {
		query = query.Where("schedules.day_of_week IN ?", options.Weekdays)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortCol, ok := scheduleSortColumns[options.Common.Sort]
	if !ok {
		sortCol = "schedules.display_order"
	}
	orderDir := "ASC"
	if options.Common.Order == "desc" {
		orderDir = "DESC"
	}

	offset := (options.Common.Page - 1) * options.Common.Limit
	err := query.Order(sortCol + " " + orderDir + ", schedules.id " + orderDir).
		Offset(offset).
		Limit(options.Common.Limit).
		Find(&schedules).Error

	return schedules, total, err
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
