package services

import (
	"errors"
	"fmt"
	"sort"
	"strings"

	"github.com/watloungporsai/wat-profile-backend/internal/listquery"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

var (
	ErrInvalidResourceAssignments = errors.New("one or more calendar resources are invalid or inactive")
	ErrCalendarResourceAssigned   = errors.New("calendar resource is assigned to one or more events")
)

type CalendarResourceService struct {
	db *gorm.DB
}

type CalendarResourceListOptions struct {
	Common   listquery.Common
	Statuses []string
	Types    []string
}

type CalendarResourceListItem struct {
	models.CalendarResource
	AssignmentCount int64 `json:"assignment_count"`
}

var calendarResourceSortColumns = map[string]string{
	"id":            "calendar_resources.id",
	"slug":          "calendar_resources.slug",
	"resource_type": "calendar_resources.resource_type",
	"display_order": "calendar_resources.display_order",
	"created_at":    "calendar_resources.created_at",
}

func CalendarResourceSortConfig() map[string]string {
	config := make(map[string]string, len(calendarResourceSortColumns))
	for key, column := range calendarResourceSortColumns {
		config[key] = column
	}
	return config
}

func NewCalendarResourceService(db *gorm.DB) *CalendarResourceService {
	return &CalendarResourceService{db: db}
}

// NormalizeResourceIDs removes duplicate IDs and rejects IDs that cannot be
// used as foreign keys. The sorted result makes assignment writes stable.
func NormalizeResourceIDs(ids []int) ([]int, error) {
	seen := make(map[int]struct{}, len(ids))
	result := make([]int, 0, len(ids))
	for _, id := range ids {
		if id <= 0 {
			return nil, fmt.Errorf("resource IDs must be positive")
		}
		if _, exists := seen[id]; exists {
			continue
		}
		seen[id] = struct{}{}
		result = append(result, id)
	}
	sort.Ints(result)
	return result, nil
}

func (s *CalendarResourceService) ListAdmin(options CalendarResourceListOptions) ([]CalendarResourceListItem, int64, error) {
	var resources []models.CalendarResource
	var total int64
	query := s.db.Model(&models.CalendarResource{})

	if search := strings.TrimSpace(options.Common.Search); search != "" {
		term := "%" + search + "%"
		query = query.Where(
			"calendar_resources.slug ILIKE ? OR calendar_resources.resource_type ILIKE ? OR calendar_resources.title->>'th' ILIKE ? OR calendar_resources.title->>'en' ILIKE ? OR calendar_resources.title->>'de' ILIKE ?",
			term, term, term, term, term,
		)
	}
	if len(options.Statuses) > 0 {
		active := make([]bool, 0, len(options.Statuses))
		for _, status := range options.Statuses {
			switch status {
			case "active":
				active = append(active, true)
			case "inactive":
				active = append(active, false)
			}
		}
		if len(active) > 0 {
			query = query.Where("calendar_resources.is_active IN ?", active)
		}
	}
	if len(options.Types) > 0 {
		query = query.Where("calendar_resources.resource_type IN ?", options.Types)
	}
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortColumn := calendarResourceSortColumns[options.Common.Sort]
	if sortColumn == "" {
		sortColumn = calendarResourceSortColumns["display_order"]
	}
	order := "ASC"
	if options.Common.Order == "desc" {
		order = "DESC"
	}
	offset := (options.Common.Page - 1) * options.Common.Limit
	if err := query.Order(sortColumn + " " + order + ", calendar_resources.id " + order).
		Offset(offset).Limit(options.Common.Limit).Find(&resources).Error; err != nil {
		return nil, 0, err
	}

	items := make([]CalendarResourceListItem, len(resources))
	for index, resource := range resources {
		items[index].CalendarResource = resource
	}
	if len(resources) == 0 {
		return items, total, nil
	}

	type assignmentCount struct {
		ResourceID int
		Count      int64
	}
	counts := make([]assignmentCount, 0, len(resources))
	ids := make([]int, 0, len(resources))
	for _, resource := range resources {
		ids = append(ids, resource.ID)
	}
	if err := s.db.Model(&models.EventResourceAssignment{}).
		Select("resource_id, COUNT(*) AS count").
		Where("resource_id IN ?", ids).
		Group("resource_id").
		Scan(&counts).Error; err != nil {
		return nil, 0, err
	}
	for _, count := range counts {
		for index := range items {
			if items[index].ID == count.ResourceID {
				items[index].AssignmentCount = count.Count
				break
			}
		}
	}
	return items, total, nil
}

func (s *CalendarResourceService) GetByID(id int) (*models.CalendarResource, error) {
	var resource models.CalendarResource
	if err := s.db.First(&resource, id).Error; err != nil {
		return nil, err
	}
	return &resource, nil
}

func (s *CalendarResourceService) Create(resource *models.CalendarResource) error {
	return s.db.Create(resource).Error
}

func (s *CalendarResourceService) Update(resource *models.CalendarResource) error {
	return s.db.Save(resource).Error
}

func (s *CalendarResourceService) Delete(id int) error {
	var count int64
	if err := s.db.Model(&models.EventResourceAssignment{}).Where("resource_id = ?", id).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return ErrCalendarResourceAssigned
	}
	result := s.db.Delete(&models.CalendarResource{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// ValidateActiveIDs checks all requested IDs in one query so clients cannot
// attach missing or inactive resources through an event payload.
func (s *CalendarResourceService) ValidateActiveIDs(tx *gorm.DB, ids []int) error {
	normalized, err := NormalizeResourceIDs(ids)
	if err != nil {
		return err
	}
	if len(normalized) == 0 {
		return nil
	}
	var count int64
	if err := tx.Model(&models.CalendarResource{}).
		Where("id IN ? AND is_active = ?", normalized, true).
		Count(&count).Error; err != nil {
		return err
	}
	if count != int64(len(normalized)) {
		return ErrInvalidResourceAssignments
	}
	return nil
}
