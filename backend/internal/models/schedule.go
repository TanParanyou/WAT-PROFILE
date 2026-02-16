package models

import "time"

// Schedule represents daily/weekly temple schedule
type Schedule struct {
	ID           int           `gorm:"primaryKey;autoIncrement" json:"id"`
	ScheduleType string        `gorm:"size:20;not null;index" json:"schedule_type"` // 'daily', 'weekly', 'online'
	DayOfWeek    *int          `json:"day_of_week"`                                  // 0=Sunday, 6=Saturday (for weekly)
	TimeStart    *time.Time    `gorm:"type:time" json:"time_start"`
	TimeEnd      *time.Time    `gorm:"type:time" json:"time_end"`
	Activity     MultiLangText `gorm:"type:jsonb;not null" json:"activity"`
	Location     MultiLangText `gorm:"type:jsonb" json:"location"`
	OnlineLink   string        `gorm:"type:text" json:"online_link"` // Facebook Live URL
	IsActive     bool          `gorm:"default:true;index" json:"is_active"`
	DisplayOrder int           `gorm:"default:0" json:"display_order"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}
