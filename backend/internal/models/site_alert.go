package models

import (
	"time"
)

// SiteAlert represents an urgent announcement or alert notification
type SiteAlert struct {
	ID            uint          `gorm:"primaryKey;autoIncrement" json:"id"`
	Title         MultiLangText `gorm:"type:jsonb;not null" json:"title"`
	Message       MultiLangText `gorm:"type:jsonb;not null" json:"message"`
	Severity      string        `gorm:"size:20;default:'info';index" json:"severity"`       // 'info', 'warning', 'critical'
	DisplayType   string        `gorm:"size:20;default:'top_banner';index" json:"display_type"` // 'top_banner', 'modal_popup'
	Scope         string        `gorm:"size:20;default:'all_pages';index" json:"scope"`        // 'all_pages', 'home_only'
	ActionText    MultiLangText `gorm:"type:jsonb" json:"action_text"`
	ActionURL     string        `gorm:"size:255" json:"action_url"`
	StartsAt      *time.Time    `gorm:"index" json:"starts_at"`
	EndsAt        *time.Time    `gorm:"index" json:"ends_at"`
	IsActive      bool          `gorm:"default:true;index" json:"is_active"`
	DisplayOrder  int           `gorm:"default:0" json:"display_order"`
	IsDismissible bool          `gorm:"default:true" json:"is_dismissible"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
}

// TableName specifies the table name for SiteAlert
func (SiteAlert) TableName() string {
	return "site_alerts"
}
