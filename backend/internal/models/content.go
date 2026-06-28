package models

import "time"

type ContentStatus string

const (
	ContentStatusDraft     ContentStatus = "draft"
	ContentStatusPublished ContentStatus = "published"
	ContentStatusArchived  ContentStatus = "archived"
)

type ContentPage struct {
	ID                   string           `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	PageKey              string           `gorm:"size:120;uniqueIndex;not null" json:"page_key"`
	Slug                 string           `gorm:"size:160;uniqueIndex;not null" json:"slug"`
	Title                MultiLangText    `gorm:"type:jsonb;not null" json:"title"`
	Description          MultiLangText    `gorm:"type:jsonb" json:"description"`
	Seo                  JSONMap          `gorm:"type:jsonb" json:"seo"`
	Body                 JSONMap          `gorm:"type:jsonb" json:"body"`
	Settings             JSONMap          `gorm:"type:jsonb" json:"settings"`
	Status               ContentStatus    `gorm:"size:20;default:draft;index" json:"status"`
	PublishedTitle       MultiLangText    `gorm:"type:jsonb" json:"published_title"`
	PublishedDescription MultiLangText    `gorm:"type:jsonb" json:"published_description"`
	PublishedSeo         JSONMap          `gorm:"type:jsonb" json:"published_seo"`
	PublishedBody        JSONMap          `gorm:"type:jsonb" json:"published_body"`
	PublishedSettings    JSONMap          `gorm:"type:jsonb" json:"published_settings"`
	PublishedAt          *time.Time       `json:"published_at"`
	CreatedAt            time.Time        `json:"created_at"`
	UpdatedAt            time.Time        `json:"updated_at"`
	Sections             []ContentSection `gorm:"foreignKey:PageID;constraint:OnDelete:CASCADE" json:"sections,omitempty"`
}

type ContentSection struct {
	ID                   string        `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	PageID               string        `gorm:"type:uuid;not null;index" json:"page_id"`
	Page                 *ContentPage  `gorm:"foreignKey:PageID;constraint:OnDelete:CASCADE" json:"-"`
	SectionKey           string        `gorm:"size:120;not null;index" json:"section_key"`
	SectionType          string        `gorm:"size:80;not null" json:"section_type"`
	Title                MultiLangText `gorm:"type:jsonb" json:"title"`
	Description          MultiLangText `gorm:"type:jsonb" json:"description"`
	Body                 JSONMap       `gorm:"type:jsonb" json:"body"`
	Settings             JSONMap       `gorm:"type:jsonb" json:"settings"`
	SortOrder            int           `gorm:"default:0;index" json:"sort_order"`
	Status               ContentStatus `gorm:"size:20;default:draft;index" json:"status"`
	PublishedTitle       MultiLangText `gorm:"type:jsonb" json:"published_title"`
	PublishedDescription MultiLangText `gorm:"type:jsonb" json:"published_description"`
	PublishedBody        JSONMap       `gorm:"type:jsonb" json:"published_body"`
	PublishedSettings    JSONMap       `gorm:"type:jsonb" json:"published_settings"`
	PublishedAt          *time.Time    `json:"published_at"`
	CreatedAt            time.Time     `json:"created_at"`
	UpdatedAt            time.Time     `json:"updated_at"`
}
