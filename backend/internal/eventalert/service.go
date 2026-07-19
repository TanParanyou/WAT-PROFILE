package eventalert

import (
	"encoding/json"
	"errors"
	"strconv"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

const key = "event_alert_settings"

type Service struct { db *gorm.DB }
func NewService(db *gorm.DB) *Service { return &Service{db: db} }

func (s *Service) Get() (Settings, error) {
	var row models.Setting
	if err := s.db.Where("key = ?", key).First(&row).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) { return Settings{DelaySeconds: 2, DismissHours: 24}, nil }
		return Settings{}, err
	}
	var result Settings
	if err := json.Unmarshal([]byte(row.Value), &result); err != nil { return Settings{}, err }
	return result, result.Validate()
}

func (s *Service) Save(value Settings) error {
	if err := value.Validate(); err != nil { return err }
	raw, err := json.Marshal(value); if err != nil { return err }
	row := models.Setting{Key:key, Value:string(raw), Type:"json", Category:"event", IsPublic:true}
	var existing models.Setting
	if err = s.db.Where("key = ?", key).First(&existing).Error; err == nil { existing.Value=row.Value; existing.Type=row.Type; existing.Category=row.Category; existing.IsPublic=true; return s.db.Save(&existing).Error }
	if !errors.Is(err, gorm.ErrRecordNotFound) { return err }
	return s.db.Create(&row).Error
}

func ParseEventID(raw string) (int, error) { if raw == "" { return 0,nil }; return strconv.Atoi(raw) }
