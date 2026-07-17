package services

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/richtext"
	"gorm.io/gorm"
)

type ContentService struct {
	db *gorm.DB
}

var ErrInvalidContentBody = errors.New("invalid content body")

type PublishedSectionPayload struct {
	ID          string               `json:"id"`
	SectionKey  string               `json:"section_key"`
	SectionType string               `json:"section_type"`
	Title       models.MultiLangText `json:"title"`
	Description models.MultiLangText `json:"description"`
	Body        models.JSONMap       `json:"body"`
	Settings    models.JSONMap       `json:"settings"`
	SortOrder   int                  `json:"sort_order"`
}

type PublishedPagePayload struct {
	ID          string                    `json:"id"`
	PageKey     string                    `json:"page_key"`
	Slug        string                    `json:"slug"`
	Title       models.MultiLangText      `json:"title"`
	Description models.MultiLangText      `json:"description"`
	Seo         models.JSONMap            `json:"seo"`
	Body        models.JSONMap            `json:"body"`
	Settings    models.JSONMap            `json:"settings"`
	Status      models.ContentStatus      `json:"status"`
	Sections    []PublishedSectionPayload `json:"sections"`
	PublishedAt *time.Time                `json:"published_at,omitempty"`
}

func NewContentService(db *gorm.DB) *ContentService { return &ContentService{db: db} }

func (s *ContentService) ListPages() ([]models.ContentPage, error) {
	var pages []models.ContentPage
	if err := s.db.Preload("Sections", func(tx *gorm.DB) *gorm.DB {
		return tx.Order("sort_order ASC")
	}).Order("page_key ASC").Find(&pages).Error; err != nil {
		return nil, err
	}
	return pages, nil
}

func (s *ContentService) GetPageByKey(pageKey string) (*models.ContentPage, error) {
	var page models.ContentPage
	if err := s.db.Preload("Sections", func(tx *gorm.DB) *gorm.DB {
		return tx.Order("sort_order ASC")
	}).Where("page_key = ?", pageKey).First(&page).Error; err != nil {
		return nil, err
	}
	return &page, nil
}

func (s *ContentService) UpdatePageDraft(id uuid.UUID, input models.ContentPage) (*models.ContentPage, error) {
	var page models.ContentPage
	if err := s.db.First(&page, "id = ?", id.String()).Error; err != nil {
		return nil, err
	}
	pageKey := input.PageKey
	if pageKey == "" {
		pageKey = page.PageKey
	}
	if err := richtext.ValidateContentPageBody(pageKey, input.Body); err != nil {
		return nil, errors.Join(ErrInvalidContentBody, err)
	}
	page.PageKey = input.PageKey
	page.Slug = input.Slug
	page.Title = input.Title
	page.Description = input.Description
	page.Seo = input.Seo
	page.Body = input.Body
	page.Settings = input.Settings
	if input.Status != "" {
		page.Status = input.Status
	}
	if err := s.db.Save(&page).Error; err != nil {
		return nil, err
	}
	return &page, nil
}

func (s *ContentService) UpdateSectionDraft(id uuid.UUID, input models.ContentSection) (*models.ContentSection, error) {
	var section models.ContentSection
	if err := s.db.First(&section, "id = ?", id.String()).Error; err != nil {
		return nil, err
	}
	sectionType := input.SectionType
	if sectionType == "" {
		sectionType = section.SectionType
	}
	if err := richtext.ValidateContentSectionBody(sectionType, input.Body); err != nil {
		return nil, errors.Join(ErrInvalidContentBody, err)
	}
	section.SectionKey = input.SectionKey
	section.SectionType = input.SectionType
	section.Title = input.Title
	section.Description = input.Description
	section.Body = input.Body
	section.Settings = input.Settings
	section.SortOrder = input.SortOrder
	if input.Status != "" {
		section.Status = input.Status
	}
	if err := s.db.Save(&section).Error; err != nil {
		return nil, err
	}
	return &section, nil
}

func (s *ContentService) ReorderSections(pageID uuid.UUID, sectionIDs []uuid.UUID) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		for idx, id := range sectionIDs {
			if err := tx.Model(&models.ContentSection{}).
				Where("id = ? AND page_id = ?", id.String(), pageID.String()).
				Update("sort_order", idx).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *ContentService) PublishPage(id uuid.UUID) (*models.ContentPage, error) {
	var page models.ContentPage
	if err := s.db.Preload("Sections").First(&page, "id = ?", id.String()).Error; err != nil {
		return nil, err
	}

	now := time.Now()
	page.PublishedTitle = page.Title
	page.PublishedDescription = page.Description
	page.PublishedSeo = page.Seo.Clone()
	page.PublishedBody = page.Body.Clone()
	page.PublishedSettings = page.Settings.Clone()
	page.Status = models.ContentStatusPublished
	page.PublishedAt = &now

	if err := s.db.Save(&page).Error; err != nil {
		return nil, err
	}

	for _, section := range page.Sections {
		section.PublishedTitle = section.Title
		section.PublishedDescription = section.Description
		section.PublishedBody = section.Body.Clone()
		section.PublishedSettings = section.Settings.Clone()
		section.Status = models.ContentStatusPublished
		section.PublishedAt = &now
		if err := s.db.Save(&section).Error; err != nil {
			return nil, err
		}
	}

	return s.GetPageByID(page.ID)
}

func (s *ContentService) GetPageByID(id string) (*models.ContentPage, error) {
	var page models.ContentPage
	if err := s.db.Preload("Sections", func(tx *gorm.DB) *gorm.DB {
		return tx.Order("sort_order ASC")
	}).First(&page, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &page, nil
}

func (s *ContentService) GetPublishedPage(slug string) (*PublishedPagePayload, error) {
	var page models.ContentPage
	if err := s.db.Preload("Sections", func(tx *gorm.DB) *gorm.DB {
		return tx.Where("status = ?", models.ContentStatusPublished).Order("sort_order ASC")
	}).Where("slug = ? AND status = ?", slug, models.ContentStatusPublished).First(&page).Error; err != nil {
		return nil, err
	}

	return buildPublishedPagePayload(&page), nil
}

func buildPublishedPagePayload(page *models.ContentPage) *PublishedPagePayload {
	payload := &PublishedPagePayload{
		ID:          page.ID,
		PageKey:     page.PageKey,
		Slug:        page.Slug,
		Title:       page.PublishedTitle,
		Description: page.PublishedDescription,
		Seo:         page.PublishedSeo,
		Body:        page.PublishedBody,
		Settings:    page.PublishedSettings,
		Status:      page.Status,
		PublishedAt: page.PublishedAt,
	}
	for _, section := range page.Sections {
		payload.Sections = append(payload.Sections, PublishedSectionPayload{
			ID:          section.ID,
			SectionKey:  section.SectionKey,
			SectionType: section.SectionType,
			Title:       section.PublishedTitle,
			Description: section.PublishedDescription,
			Body:        section.PublishedBody,
			Settings:    section.PublishedSettings,
			SortOrder:   section.SortOrder,
		})
	}
	return payload
}

func (s *ContentService) EnsureContactPageSeed() error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var page models.ContentPage
		err := tx.Where("page_key = ?", "PAGE-CONTACT").First(&page).Error
		if err == nil {
			return nil
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		page = models.ContentPage{
			PageKey: "PAGE-CONTACT",
			Slug:    "contact",
			Title: models.MultiLangText{
				"th": "ติดต่อวัดหลวงพ่อใส",
				"en": "Contact Wat Loung Por Sai",
				"de": "Kontakt Wat Loung Por Sai",
			},
			Description: models.MultiLangText{
				"th": "ข้อมูลติดต่อและแบบฟอร์มส่งข้อความ",
				"en": "Contact details and message form",
				"de": "Kontaktdaten und Nachrichtenformular",
			},
			Status: models.ContentStatusDraft,
			Seo: models.JSONMap{
				"canonical_url": "/th/contact",
				"noindex":       false,
			},
			Body: models.JSONMap{
				"intro": "contact",
			},
			Settings: models.JSONMap{
				"layout": "contact",
			},
		}
		if err := tx.Create(&page).Error; err != nil {
			return err
		}

		sections := []models.ContentSection{
			{
				PageID:      page.ID,
				SectionKey:  "hero",
				SectionType: "hero",
				Title: models.MultiLangText{
					"th": "ติดต่อเรา",
					"en": "Contact Us",
					"de": "Kontakt",
				},
				Description: models.MultiLangText{
					"th": "สอบถามเส้นทาง เวลาทำการ และข้อมูลติดต่อ",
					"en": "Ask about directions, opening hours, and contact details",
					"de": "Fragen zu Anfahrt, Öffnungszeiten und Kontaktdaten",
				},
				SortOrder: 0,
			},
			{
				PageID:      page.ID,
				SectionKey:  "contact-info",
				SectionType: "contact_info",
				Title:       models.MultiLangText{"th": "ข้อมูลติดต่อ", "en": "Contact Details", "de": "Kontaktdaten"},
				SortOrder:   1,
			},
			{
				PageID:      page.ID,
				SectionKey:  "contact-form",
				SectionType: "contact_form",
				Title:       models.MultiLangText{"th": "ส่งข้อความถึงเรา", "en": "Send us a message", "de": "Senden Sie uns eine Nachricht"},
				SortOrder:   2,
			},
		}
		return tx.Create(&sections).Error
	})
}

func (s *ContentService) EnsurePrivacyPageSeed() error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var page models.ContentPage
		err := tx.Where("page_key = ?", "PAGE-PRIVACY").First(&page).Error
		if err == nil {
			return nil
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		page = models.ContentPage{
			PageKey: "PAGE-PRIVACY",
			Slug:    "privacy",
			Title: models.MultiLangText{
				"th": "นโยบายความเป็นส่วนตัว",
				"en": "Privacy Policy",
				"de": "Datenschutzerklärung",
			},
			Description: models.MultiLangText{
				"th": "นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลของวัดหลวงพ่อใส",
				"en": "Privacy Policy and Data Protection of Wat Loung Por Sai",
				"de": "Datenschutzerklärung und Datenschutz von Wat Loung Por Sai",
			},
			Status: models.ContentStatusPublished,
			Seo: models.JSONMap{
				"canonical_url": "/th/privacy",
				"noindex":       false,
			},
			Body: models.JSONMap{
				"last_updated": "2026-07-16",
				"sections": []interface{}{
					map[string]interface{}{
						"title": map[string]interface{}{
							"th": "การเก็บรวบรวมข้อมูลและการใช้งาน",
							"en": "Information Collection and Use",
							"de": "Datenerfassung und -verwendung",
						},
						"content": map[string]interface{}{
							"th": "เราเก็บรวบรวมข้อมูลประเภทต่างๆ เพื่อวัตถุประสงค์ในการให้บริการและปรับปรุงหน้าเว็บไซต์ให้กับท่าน",
							"en": "We collect several different types of information for various purposes to provide and improve our Service to you.",
							"de": "Wir erfassen verschiedene Arten von Informationen für verschiedene Zwecke, um unseren Dienst für Sie bereitzustellen und zu verbessern.",
						},
					},
				},
			},
			Settings: models.JSONMap{
				"layout": "default",
			},
		}

		// Also set published fields directly
		now := time.Now()
		page.PublishedTitle = page.Title
		page.PublishedDescription = page.Description
		page.PublishedSeo = page.Seo.Clone()
		page.PublishedBody = page.Body.Clone()
		page.PublishedSettings = page.Settings.Clone()
		page.PublishedAt = &now

		return tx.Create(&page).Error
	})
}

func (s *ContentService) EnsureImpressumPageSeed() error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var page models.ContentPage
		err := tx.Where("page_key = ?", "PAGE-IMPRESSUM").First(&page).Error
		if err == nil {
			return nil
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		page = models.ContentPage{
			PageKey: "PAGE-IMPRESSUM",
			Slug:    "impressum",
			Title: models.MultiLangText{
				"th": "ข้อมูลทางกฎหมาย",
				"en": "Impressum",
				"de": "Impressum",
			},
			Description: models.MultiLangText{
				"th": "ข้อมูลทางกฎหมายและผู้รับผิดชอบเว็บไซต์",
				"en": "Legal disclosure and website responsibility",
				"de": "Impressum und rechtliche Hinweise",
			},
			Status: models.ContentStatusPublished,
			Seo: models.JSONMap{
				"canonical_url": "/th/impressum",
				"noindex":       false,
			},
			Body: models.JSONMap{
				"organization_name": map[string]interface{}{
					"th": "สมาคมศูนย์สมาธิพระพุทธศาสนา",
					"en": "Buddhistisches Meditationszentrum e.V.",
					"de": "Buddhistisches Meditationszentrum e.V.",
				},
				"address": map[string]interface{}{
					"th": "Am Pflaster 11, 63599 Biebergemünd",
					"en": "Am Pflaster 11, 63599 Biebergemünd",
					"de": "Am Pflaster 11, 63599 Biebergemünd",
				},
				"phone": "+49 160-1604486",
				"email": "Watloungporsai@gmail.com",
			},
			Settings: models.JSONMap{
				"layout": "default",
			},
		}

		// Also set published fields directly
		now := time.Now()
		page.PublishedTitle = page.Title
		page.PublishedDescription = page.Description
		page.PublishedSeo = page.Seo.Clone()
		page.PublishedBody = page.Body.Clone()
		page.PublishedSettings = page.Settings.Clone()
		page.PublishedAt = &now

		return tx.Create(&page).Error
	})
}
