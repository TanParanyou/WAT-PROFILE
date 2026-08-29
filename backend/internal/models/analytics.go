package models

import (
	"time"
)

// AnalyticsPageView represents a logged pageview/visitor event
type AnalyticsPageView struct {
	ID           uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Path         string    `gorm:"size:255;not null;index" json:"path"`
	Locale       string    `gorm:"size:10;not null;default:'th';index" json:"locale"`
	ResourceType string    `gorm:"size:50;not null;default:'page';index" json:"resource_type"`
	ResourceID   string    `gorm:"size:100;index" json:"resource_id"`
	IPHash       string    `gorm:"size:64;index" json:"-"`
	DeviceType   string    `gorm:"size:20;default:'desktop'" json:"device_type"`
	Browser      string    `gorm:"size:50" json:"browser"`
	OS           string    `gorm:"size:50" json:"os"`
	Referrer     string    `gorm:"type:text" json:"referrer"`
	CreatedAt    time.Time `gorm:"index" json:"created_at"`
}

// TrackPageViewRequest represents the client payload when tracking a view
type TrackPageViewRequest struct {
	Path         string `json:"path"`
	Locale       string `json:"locale"`
	ResourceType string `json:"resource_type"`
	ResourceID   string `json:"resource_id"`
	Referrer     string `json:"referrer"`
}

// TrendDataPoint represents a single point in a time-series trend
type TrendDataPoint struct {
	Date           string `json:"date"`
	Views          int64  `json:"views"`
	UniqueVisitors int64  `json:"unique_visitors"`
}

// AnalyticsOverviewResponse represents summarized analytics metrics
type AnalyticsOverviewResponse struct {
	TotalViews             int64            `json:"total_views"`
	UniqueVisitors         int64            `json:"unique_visitors"`
	TodayViews             int64            `json:"today_views"`
	TodayUniqueVisitors    int64            `json:"today_unique_visitors"`
	PeriodViews            int64            `json:"period_views"`
	PeriodUniqueVisitors   int64            `json:"period_unique_visitors"`
	DeviceBreakdown        map[string]int64 `json:"device_breakdown"`
	LocaleBreakdown        map[string]int64 `json:"locale_breakdown"`
	ResourceTypeBreakdown  map[string]int64 `json:"resource_type_breakdown"`
	Trends                 []TrendDataPoint `json:"trends"`
}

// TopResourceItem represents a top performing page/resource
type TopResourceItem struct {
	ResourceType   string `json:"resource_type"`
	ResourceID     string `json:"resource_id"`
	Path           string `json:"path"`
	Views          int64  `json:"views"`
	UniqueVisitors int64  `json:"unique_visitors"`
	Title          string `json:"title,omitempty"`
}

// ResourceStatsResponse represents detailed stats for a specific entity
type ResourceStatsResponse struct {
	ResourceType   string           `json:"resource_type"`
	ResourceID     string           `json:"resource_id"`
	TotalViews     int64            `json:"total_views"`
	UniqueVisitors int64            `json:"unique_visitors"`
	LocaleBreakdown map[string]int64 `json:"locale_breakdown"`
	DeviceBreakdown map[string]int64 `json:"device_breakdown"`
	DailyTrends    []TrendDataPoint `json:"daily_trends"`
}
