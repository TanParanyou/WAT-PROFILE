package services

import (
	"crypto/sha256"
	"encoding/hex"
	"strconv"
	"strings"
	"time"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type AnalyticsService struct {
	db *gorm.DB
}

func NewAnalyticsService(db *gorm.DB) *AnalyticsService {
	return &AnalyticsService{db: db}
}

// AnonymizeIP creates a daily-salted SHA-256 hash of an IP address for GDPR compliance
func AnonymizeIP(ip string, t time.Time) string {
	if strings.TrimSpace(ip) == "" {
		return ""
	}
	salt := t.Format("2006-01-02")
	hash := sha256.Sum256([]byte(ip + ":" + salt))
	return hex.EncodeToString(hash[:])
}

// ParseUserAgent extracts device type, browser family, and OS from User-Agent string
func ParseUserAgent(ua string) (deviceType, browser, os string) {
	uaLower := strings.ToLower(ua)

	// Bot detection
	if strings.Contains(uaLower, "bot") || strings.Contains(uaLower, "crawler") ||
		strings.Contains(uaLower, "spider") || strings.Contains(uaLower, "googlebot") ||
		strings.Contains(uaLower, "bingbot") {
		return "bot", "bot", "other"
	}

	// Device Type
	if strings.Contains(uaLower, "ipad") || strings.Contains(uaLower, "tablet") ||
		strings.Contains(uaLower, "playbook") || strings.Contains(uaLower, "silk") {
		deviceType = "tablet"
	} else if strings.Contains(uaLower, "mobile") || strings.Contains(uaLower, "iphone") ||
		strings.Contains(uaLower, "android") {
		deviceType = "mobile"
	} else {
		deviceType = "desktop"
	}

	// Browser
	if strings.Contains(uaLower, "edg/") || strings.Contains(uaLower, "edge/") {
		browser = "Edge"
	} else if strings.Contains(uaLower, "chrome") || strings.Contains(uaLower, "crios") {
		browser = "Chrome"
	} else if strings.Contains(uaLower, "safari") && !strings.Contains(uaLower, "chrome") {
		browser = "Safari"
	} else if strings.Contains(uaLower, "firefox") || strings.Contains(uaLower, "fxios") {
		browser = "Firefox"
	} else if strings.Contains(uaLower, "opera") || strings.Contains(uaLower, "opr/") {
		browser = "Opera"
	} else {
		browser = "Other"
	}

	// OS
	if strings.Contains(uaLower, "iphone") || strings.Contains(uaLower, "ipad") || strings.Contains(uaLower, "ios") {
		os = "iOS"
	} else if strings.Contains(uaLower, "android") {
		os = "Android"
	} else if strings.Contains(uaLower, "macintosh") || strings.Contains(uaLower, "mac os x") {
		os = "macOS"
	} else if strings.Contains(uaLower, "windows") {
		os = "Windows"
	} else if strings.Contains(uaLower, "linux") {
		os = "Linux"
	} else {
		os = "Other"
	}

	return deviceType, browser, os
}

// TrackView logs a pageview record asynchronously or synchronously
func (s *AnalyticsService) TrackView(req models.TrackPageViewRequest, clientIP, userAgent string) error {
	path := strings.TrimSpace(req.Path)
	if path == "" {
		path = "/"
	}

	locale := strings.ToLower(strings.TrimSpace(req.Locale))
	if locale == "" {
		locale = "th"
	}

	resourceType := strings.ToLower(strings.TrimSpace(req.ResourceType))
	if resourceType == "" {
		resourceType = "page"
	}

	now := time.Now().UTC()
	ipHash := AnonymizeIP(clientIP, now)
	deviceType, browser, os := ParseUserAgent(userAgent)

	// Don't count bot spam into normal stats if detected as bot
	if deviceType == "bot" {
		return nil
	}

	record := models.AnalyticsPageView{
		Path:         path,
		Locale:       locale,
		ResourceType: resourceType,
		ResourceID:   strings.TrimSpace(req.ResourceID),
		IPHash:       ipHash,
		DeviceType:   deviceType,
		Browser:      browser,
		OS:           os,
		Referrer:     strings.TrimSpace(req.Referrer),
		CreatedAt:    now,
	}

	return s.db.Create(&record).Error
}

// GetOverview returns summary analytics
func (s *AnalyticsService) GetOverview(startDate, endDate time.Time) (*models.AnalyticsOverviewResponse, error) {
	resp := &models.AnalyticsOverviewResponse{
		DeviceBreakdown:       make(map[string]int64),
		LocaleBreakdown:       make(map[string]int64),
		ResourceTypeBreakdown: make(map[string]int64),
		Trends:                make([]models.TrendDataPoint, 0),
	}

	// 1. All-time stats
	s.db.Model(&models.AnalyticsPageView{}).Count(&resp.TotalViews)
	s.db.Model(&models.AnalyticsPageView{}).Select("COUNT(DISTINCT ip_hash)").Scan(&resp.UniqueVisitors)

	// 2. Today stats
	todayStart := time.Now().UTC().Truncate(24 * time.Hour)
	s.db.Model(&models.AnalyticsPageView{}).Where("created_at >= ?", todayStart).Count(&resp.TodayViews)
	s.db.Model(&models.AnalyticsPageView{}).Where("created_at >= ?", todayStart).Select("COUNT(DISTINCT ip_hash)").Scan(&resp.TodayUniqueVisitors)

	// 3. Period stats
	periodQuery := s.db.Model(&models.AnalyticsPageView{}).Where("created_at >= ? AND created_at <= ?", startDate, endDate)
	periodQuery.Count(&resp.PeriodViews)
	periodQuery.Select("COUNT(DISTINCT ip_hash)").Scan(&resp.PeriodUniqueVisitors)

	// 4. Device breakdown in period
	type KeyCount struct {
		Key   string `gorm:"column:key"`
		Count int64  `gorm:"column:count"`
	}
	var deviceCounts []KeyCount
	s.db.Model(&models.AnalyticsPageView{}).
		Select("device_type AS key, COUNT(*) AS count").
		Where("created_at >= ? AND created_at <= ?", startDate, endDate).
		Group("device_type").
		Scan(&deviceCounts)
	for _, dc := range deviceCounts {
		if dc.Key != "" {
			resp.DeviceBreakdown[dc.Key] = dc.Count
		}
	}

	// 5. Locale breakdown in period
	var localeCounts []KeyCount
	s.db.Model(&models.AnalyticsPageView{}).
		Select("locale AS key, COUNT(*) AS count").
		Where("created_at >= ? AND created_at <= ?", startDate, endDate).
		Group("locale").
		Scan(&localeCounts)
	for _, lc := range localeCounts {
		if lc.Key != "" {
			resp.LocaleBreakdown[lc.Key] = lc.Count
		}
	}

	// 6. Resource type breakdown in period
	var resourceCounts []KeyCount
	s.db.Model(&models.AnalyticsPageView{}).
		Select("resource_type AS key, COUNT(*) AS count").
		Where("created_at >= ? AND created_at <= ?", startDate, endDate).
		Group("resource_type").
		Scan(&resourceCounts)
	for _, rc := range resourceCounts {
		if rc.Key != "" {
			resp.ResourceTypeBreakdown[rc.Key] = rc.Count
		}
	}

	// 7. Trends in period
	trends, err := s.GetTrends("", startDate, endDate)
	if err == nil {
		resp.Trends = trends
	}

	return resp, nil
}

// GetTrends returns daily pageviews and unique visitors over time
func (s *AnalyticsService) GetTrends(resourceType string, startDate, endDate time.Time) ([]models.TrendDataPoint, error) {
	type DailyStat struct {
		Date           string `gorm:"column:date"`
		Views          int64  `gorm:"column:views"`
		UniqueVisitors int64  `gorm:"column:unique_visitors"`
	}

	query := s.db.Model(&models.AnalyticsPageView{}).
		Select("TO_CHAR(created_at, 'YYYY-MM-DD') AS date, COUNT(*) AS views, COUNT(DISTINCT ip_hash) AS unique_visitors").
		Where("created_at >= ? AND created_at <= ?", startDate, endDate)

	if resourceType != "" {
		query = query.Where("resource_type = ?", resourceType)
	}

	var stats []DailyStat
	err := query.Group("TO_CHAR(created_at, 'YYYY-MM-DD')").Order("date ASC").Scan(&stats).Error
	if err != nil {
		return nil, err
	}

	// Build map of existing stats
	statMap := make(map[string]DailyStat)
	for _, st := range stats {
		statMap[st.Date] = st
	}

	// Fill every day in date range so continuous charts don't have gaps
	result := make([]models.TrendDataPoint, 0)
	curr := startDate.UTC().Truncate(24 * time.Hour)
	end := endDate.UTC().Truncate(24 * time.Hour)

	for !curr.After(end) {
		dateStr := curr.Format("2006-01-02")
		if st, ok := statMap[dateStr]; ok {
			result = append(result, models.TrendDataPoint{
				Date:           dateStr,
				Views:          st.Views,
				UniqueVisitors: st.UniqueVisitors,
			})
		} else {
			result = append(result, models.TrendDataPoint{
				Date:           dateStr,
				Views:          0,
				UniqueVisitors: 0,
			})
		}
		curr = curr.Add(24 * time.Hour)
	}

	return result, nil
}

// GetTopResources returns top viewed items
func (s *AnalyticsService) GetTopResources(resourceType string, limit int, startDate, endDate time.Time) ([]models.TopResourceItem, error) {
	if limit <= 0 {
		limit = 10
	}

	type TopRow struct {
		ResourceType   string `gorm:"column:resource_type"`
		ResourceID     string `gorm:"column:resource_id"`
		Path           string `gorm:"column:path"`
		Views          int64  `gorm:"column:views"`
		UniqueVisitors int64  `gorm:"column:unique_visitors"`
	}

	query := s.db.Model(&models.AnalyticsPageView{}).
		Select("resource_type, resource_id, path, COUNT(*) AS views, COUNT(DISTINCT ip_hash) AS unique_visitors").
		Where("created_at >= ? AND created_at <= ?", startDate, endDate)

	if resourceType != "" {
		query = query.Where("resource_type = ?", resourceType)
	}

	var rows []TopRow
	err := query.
		Group("resource_type, resource_id, path").
		Order("views DESC").
		Limit(limit).
		Scan(&rows).Error

	if err != nil {
		return nil, err
	}

	items := make([]models.TopResourceItem, len(rows))
	for i, r := range rows {
		item := models.TopResourceItem{
			ResourceType:   r.ResourceType,
			ResourceID:     r.ResourceID,
			Path:           r.Path,
			Views:          r.Views,
			UniqueVisitors: r.UniqueVisitors,
		}

		// Enrich titles if possible
		if r.ResourceType == "event" && r.ResourceID != "" {
			if eventID, err := strconv.Atoi(r.ResourceID); err == nil {
				var ev models.Event
				if err := s.db.Select("id, title").First(&ev, eventID).Error; err == nil {
					item.Title = ev.Title.Get("th")
					if item.Title == "" {
						item.Title = ev.Title.Get("en")
					}
				}
			}
		}

		items[i] = item
	}

	return items, nil
}

// GetResourceStats returns metrics for a single specific resource
func (s *AnalyticsService) GetResourceStats(resourceType, resourceID string, startDate, endDate time.Time) (*models.ResourceStatsResponse, error) {
	resp := &models.ResourceStatsResponse{
		ResourceType:    resourceType,
		ResourceID:      resourceID,
		LocaleBreakdown: make(map[string]int64),
		DeviceBreakdown: make(map[string]int64),
		DailyTrends:     make([]models.TrendDataPoint, 0),
	}

	baseQuery := s.db.Model(&models.AnalyticsPageView{}).
		Where("resource_type = ? AND resource_id = ?", resourceType, resourceID)

	baseQuery.Count(&resp.TotalViews)
	baseQuery.Select("COUNT(DISTINCT ip_hash)").Scan(&resp.UniqueVisitors)

	// Locale breakdown
	type KeyCount struct {
		Key   string `gorm:"column:key"`
		Count int64  `gorm:"column:count"`
	}
	var localeCounts []KeyCount
	s.db.Model(&models.AnalyticsPageView{}).
		Select("locale AS key, COUNT(*) AS count").
		Where("resource_type = ? AND resource_id = ?", resourceType, resourceID).
		Group("locale").
		Scan(&localeCounts)
	for _, lc := range localeCounts {
		if lc.Key != "" {
			resp.LocaleBreakdown[lc.Key] = lc.Count
		}
	}

	// Device breakdown
	var deviceCounts []KeyCount
	s.db.Model(&models.AnalyticsPageView{}).
		Select("device_type AS key, COUNT(*) AS count").
		Where("resource_type = ? AND resource_id = ?", resourceType, resourceID).
		Group("device_type").
		Scan(&deviceCounts)
	for _, dc := range deviceCounts {
		if dc.Key != "" {
			resp.DeviceBreakdown[dc.Key] = dc.Count
		}
	}

	// Trends in period
	type DailyStat struct {
		Date           string `gorm:"column:date"`
		Views          int64  `gorm:"column:views"`
		UniqueVisitors int64  `gorm:"column:unique_visitors"`
	}

	var stats []DailyStat
	s.db.Model(&models.AnalyticsPageView{}).
		Select("TO_CHAR(created_at, 'YYYY-MM-DD') AS date, COUNT(*) AS views, COUNT(DISTINCT ip_hash) AS unique_visitors").
		Where("resource_type = ? AND resource_id = ? AND created_at >= ? AND created_at <= ?", resourceType, resourceID, startDate, endDate).
		Group("TO_CHAR(created_at, 'YYYY-MM-DD')").
		Order("date ASC").
		Scan(&stats)

	statMap := make(map[string]DailyStat)
	for _, st := range stats {
		statMap[st.Date] = st
	}

	curr := startDate.UTC().Truncate(24 * time.Hour)
	end := endDate.UTC().Truncate(24 * time.Hour)
	for !curr.After(end) {
		dateStr := curr.Format("2006-01-02")
		if st, ok := statMap[dateStr]; ok {
			resp.DailyTrends = append(resp.DailyTrends, models.TrendDataPoint{
				Date:           dateStr,
				Views:          st.Views,
				UniqueVisitors: st.UniqueVisitors,
			})
		} else {
			resp.DailyTrends = append(resp.DailyTrends, models.TrendDataPoint{
				Date:           dateStr,
				Views:          0,
				UniqueVisitors: 0,
			})
		}
		curr = curr.Add(24 * time.Hour)
	}

	return resp, nil
}
