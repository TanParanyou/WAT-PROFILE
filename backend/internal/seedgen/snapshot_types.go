package seedgen

import "encoding/json"

type RichTextNode struct {
	Type    string         `json:"type"`
	Content []RichTextNode `json:"content,omitempty"`
	Text    string         `json:"text,omitempty"`
}

type LocalizedRichText struct {
	TH RichTextNode `json:"th"`
	EN RichTextNode `json:"en"`
	DE RichTextNode `json:"de"`
}

type SeedSnapshot struct {
	Events          []SeedEvent          `json:"events"`
	Monks           []SeedMonk           `json:"monks"`
	Categories      []SeedCategory       `json:"categories"`
	Galleries       []SeedGallery        `json:"galleries"`
	Schedules       []SeedSchedule       `json:"schedules"`
	ContentPages    []SeedContentPage    `json:"content_pages"`
	ContentSections []SeedContentSection `json:"content_sections"`
	Settings        []SeedSetting        `json:"settings"`
}

type SeedEvent struct {
	Slug         string              `json:"slug"`
	StartDate    string              `json:"start_date"`
	EndDate      string              `json:"end_date"`
	ImageURL     string              `json:"image_url"`
	MapURL       string              `json:"map_url"`
	EventType    string              `json:"event_type"`
	Title        LocalizedText       `json:"title"`
	Location     LocalizedText       `json:"location"`
	Description  LocalizedRichText   `json:"description"`
	StartTime    *string             `json:"start_time"`
	EndTime      *string             `json:"end_time"`
	IsActive     bool                `json:"is_active"`
	DisplayOrder int                 `json:"display_order"`
	Schedules    []SeedEventSchedule `json:"schedules"`
}

type SeedEventSchedule struct {
	StartTime    string        `json:"start_time"`
	EndTime      string        `json:"end_time"`
	Activity     LocalizedText `json:"activity"`
	DisplayOrder int           `json:"display_order"`
}

type SeedMonk struct {
	Slug         string            `json:"slug"`
	ImageURL     string            `json:"image_url"`
	Position     string            `json:"position"`
	Name         LocalizedText     `json:"name"`
	Title        LocalizedText     `json:"title"`
	Bio          LocalizedRichText `json:"bio"`
	DisplayOrder int               `json:"display_order"`
	IsActive     bool              `json:"is_active"`
}

type SeedCategory struct {
	Slug         string        `json:"slug"`
	Name         LocalizedText `json:"name"`
	DisplayOrder int           `json:"display_order"`
	IsActive     bool          `json:"is_active"`
}

type SeedGallery struct {
	ImageURL     string        `json:"image_url"`
	ThumbnailURL string        `json:"thumbnail_url"`
	CategorySlug string        `json:"category_slug"`
	Caption      LocalizedText `json:"caption"`
	DisplayOrder int           `json:"display_order"`
	IsActive     bool          `json:"is_active"`
}

type SeedSchedule struct {
	ScheduleType string        `json:"schedule_type"`
	DayOfWeek    *int          `json:"day_of_week"`
	TimeStart    *string       `json:"time_start"`
	TimeEnd      *string       `json:"time_end"`
	Activity     LocalizedText `json:"activity"`
	Location     LocalizedText `json:"location"`
	OnlineLink   string        `json:"online_link"`
	DisplayOrder int           `json:"display_order"`
	IsActive     bool          `json:"is_active"`
}

type SeedContentPage struct {
	ID          string          `json:"id"`
	PageKey     string          `json:"page_key"`
	Slug        string          `json:"slug"`
	Title       LocalizedText   `json:"title"`
	Description LocalizedText   `json:"description"`
	SEO         json.RawMessage `json:"seo"`
	Body        json.RawMessage `json:"body"`
	Settings    json.RawMessage `json:"settings"`
}

type SeedContentSection struct {
	ID          string          `json:"id"`
	PageID      string          `json:"page_id"`
	SectionKey  string          `json:"section_key"`
	SectionType string          `json:"section_type"`
	Title       LocalizedText   `json:"title"`
	Description LocalizedText   `json:"description"`
	Body        json.RawMessage `json:"body"`
	Settings    json.RawMessage `json:"settings"`
	SortOrder   int             `json:"sort_order"`
}

type SeedSetting struct {
	Key      string `json:"key"`
	Value    string `json:"value"`
	Type     string `json:"type"`
	Category string `json:"category"`
	IsPublic bool   `json:"is_public"`
}
