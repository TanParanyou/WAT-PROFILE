# PAGE-CONTACT CMS Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first Website CMS vertical slice so `PAGE-CONTACT` can be edited in admin, previewed responsively, published, and rendered publicly from backend CMS data.

**Architecture:** Add focused `content_pages` and `content_sections` backend models with draft fields and published snapshot fields. Admin APIs mutate draft data; publish copies draft fields into published fields; public APIs read only published active content. Frontend adds Website > Pages admin surfaces and rewires the public Contact page to use the CMS payload with static JSON as a temporary fallback.

**Tech Stack:** Go Fiber, GORM, PostgreSQL JSONB, Next.js App Router, React 19, TypeScript, next-intl, axios, Tailwind CSS.

---

## Scope

This plan implements only the `PAGE-CONTACT` vertical slice from `docs/website-cms/website-cms-superpowers-prd.md`.

Included:

- `content_pages` and `content_sections` schema.
- SEO JSONB on content pages.
- Draft/published storage for pages and sections.
- Seed data for `PAGE-CONTACT`.
- Admin APIs and public API for CMS pages.
- Admin route `app/[locale]/admin/website/pages`.
- Admin route `app/[locale]/admin/website/pages/[id]`.
- Preview-first mono page editor based on `docs/website-cms/mockups/admin-contact-preview-first-mono.html`.
- Public Contact page rendered from CMS data.
- Locale fallback helper.
- Audit log calls for update and publish actions.

Excluded:

- Home/About/Privacy/Impressum migration.
- Event registration.
- Full media library UI.
- Revision rollback UI.
- SEO JSONB for events/monks/gallery.

## Draft/Published Decision

Use one database row per page/section with draft fields and published snapshot fields.

Draft fields:

- `title`
- `description`
- `seo`
- `body`
- `settings`

Published snapshot fields:

- `published_title`
- `published_description`
- `published_seo`
- `published_body`
- `published_settings`

Public endpoints read published fields only. Admin update endpoints write draft fields only. Publish endpoints copy draft fields to published fields and set `status = 'published'` and `published_at = NOW()`.

This keeps phase 1 simple while ensuring draft edits do not leak to the public website.

## File Structure

### Backend

- Create `backend/internal/models/json_map.go`  
  Shared JSONB scanner/valuer for arbitrary JSON objects.

- Create `backend/internal/models/content.go`  
  `ContentPage` and `ContentSection` models.

- Modify `backend/internal/config/config.go`  
  Add content models to `AutoMigrate`.

- Create `backend/migrations/000013_create_content_pages.up.sql`
- Create `backend/migrations/000013_create_content_pages.down.sql`
- Create `backend/migrations/000014_create_content_sections.up.sql`
- Create `backend/migrations/000014_create_content_sections.down.sql`  
  SQL migrations matching the GORM models.

- Create `backend/internal/services/content_service.go`  
  Page/section CRUD, publish, public fetch, and seed helpers.

- Create `backend/internal/handlers/content_handler.go`  
  Fiber handlers for admin/public CMS endpoints.

- Modify `backend/internal/routes/routes.go`  
  Register content handler and route permissions.

- Modify `backend/cmd/seed/main.go`  
  Seed `PAGE-CONTACT`, contact sections, and `website` permission.

- Reuse `backend/internal/services/audit_service.go` through existing `LogAction`; do not change audit behavior in this vertical slice.

### Frontend Shared

- Create `frontend/src/types/website-cms.ts`  
  CMS page/section/SEO types.

- Create `frontend/src/utils/localizedText.ts`  
  Locale fallback helpers with requested locale -> English -> Thai.

- Create `frontend/src/services/websiteCmsService.ts`  
  Admin and public CMS API calls.

### Frontend Admin

- Modify `frontend/src/types/auth.ts`  
  Add `website` permission resource.

- Modify `frontend/src/components/admin/AdminSidebar.tsx`  
  Add Website > Pages menu entry.

- Modify `frontend/src/messages/admin/th.json`
- Modify `frontend/src/messages/admin/en.json`
- Modify `frontend/src/messages/admin/de.json`  
  Add labels for Website CMS admin surfaces.

- Create `frontend/src/app/[locale]/admin/website/pages/page.tsx`  
  Website pages list.

- Create `frontend/src/app/[locale]/admin/website/pages/[id]/page.tsx`  
  Preview-first page editor.

- Create `frontend/src/components/admin/website/PageStatusPill.tsx`
- Create `frontend/src/components/admin/website/LanguageCompleteness.tsx`
- Create `frontend/src/components/admin/website/DevicePreviewFrame.tsx`
- Create `frontend/src/components/admin/website/ContactPagePreview.tsx`
- Create `frontend/src/components/admin/website/SeoPreviewPanel.tsx`
- Create `frontend/src/components/admin/website/ContactSectionEditor.tsx`  
  Focused admin UI units.

### Frontend Public

- Modify `frontend/src/services/publicService.ts`  
  Add public CMS page fetch.

- Modify `frontend/src/app/[locale]/(client)/contact/page.tsx`  
  Generate metadata from CMS payload with fallback.

- Modify `frontend/src/app/[locale]/(client)/contact/ContactContent.tsx`  
  Render contact page from CMS sections; keep temporary static JSON fallback.

## Task 1: Backend JSONB Helpers And Content Models

**Files:**
- Create: `backend/internal/models/json_map.go`
- Create: `backend/internal/models/content.go`
- Modify: `backend/internal/config/config.go`
- Test: `backend/internal/models/json_map_test.go`

- [ ] **Step 1: Write JSONMap tests**

Create `backend/internal/models/json_map_test.go`:

```go
package models

import (
	"testing"
)

func TestJSONMapValueAndScanRoundTrip(t *testing.T) {
	source := JSONMap{
		"canonical_url": "/th/contact",
		"noindex":       false,
		"meta_title": map[string]interface{}{
			"th": "ติดต่อวัดหลวงพ่อใส",
			"en": "Contact Wat Loung Por Sai",
			"de": "",
		},
	}

	value, err := source.Value()
	if err != nil {
		t.Fatalf("Value returned error: %v", err)
	}

	var scanned JSONMap
	if err := scanned.Scan(value); err != nil {
		t.Fatalf("Scan returned error: %v", err)
	}

	if scanned["canonical_url"] != "/th/contact" {
		t.Fatalf("expected canonical_url to round trip, got %#v", scanned["canonical_url"])
	}
	if scanned["noindex"] != false {
		t.Fatalf("expected noindex false, got %#v", scanned["noindex"])
	}
}

func TestJSONMapScanNil(t *testing.T) {
	var scanned JSONMap
	if err := scanned.Scan(nil); err != nil {
		t.Fatalf("Scan nil returned error: %v", err)
	}
	if scanned != nil {
		t.Fatalf("expected nil map, got %#v", scanned)
	}
}
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
cd backend
go test ./internal/models -run 'TestJSONMap' -v
```

Expected: FAIL because `JSONMap` is not defined.

- [ ] **Step 3: Create JSONMap helper**

Create `backend/internal/models/json_map.go`:

```go
package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

// JSONMap stores arbitrary structured JSONB data.
type JSONMap map[string]interface{}

func (m JSONMap) Value() (driver.Value, error) {
	if m == nil {
		return nil, nil
	}
	bytes, err := json.Marshal(m)
	if err != nil {
		return nil, err
	}
	return string(bytes), nil
}

func (m *JSONMap) Scan(value interface{}) error {
	if value == nil {
		*m = nil
		return nil
	}

	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("unsupported type for JSONMap")
	}

	result := make(JSONMap)
	if err := json.Unmarshal(bytes, &result); err != nil {
		return err
	}
	*m = result
	return nil
}
```

- [ ] **Step 4: Create content models**

Create `backend/internal/models/content.go`:

```go
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ContentStatus string

const (
	ContentStatusDraft     ContentStatus = "draft"
	ContentStatusPublished ContentStatus = "published"
)

type ContentPage struct {
	ID                   uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	PageKey              string         `gorm:"size:100;uniqueIndex;not null" json:"page_key"`
	Slug                 string         `gorm:"size:150;uniqueIndex;not null" json:"slug"`
	Title                MultiLangText  `gorm:"type:jsonb;not null" json:"title"`
	Description          MultiLangText  `gorm:"type:jsonb" json:"description"`
	SEO                  JSONMap        `gorm:"type:jsonb" json:"seo"`
	PublishedTitle       MultiLangText  `gorm:"type:jsonb" json:"published_title"`
	PublishedDescription MultiLangText  `gorm:"type:jsonb" json:"published_description"`
	PublishedSEO         JSONMap        `gorm:"type:jsonb" json:"published_seo"`
	Status               ContentStatus  `gorm:"size:20;default:draft;index" json:"status"`
	IsActive             bool           `gorm:"default:true;index" json:"is_active"`
	PublishedAt          *time.Time     `json:"published_at"`
	CreatedAt            time.Time      `json:"created_at"`
	UpdatedAt            time.Time      `json:"updated_at"`
	Sections             []ContentSection `gorm:"foreignKey:PageID;constraint:OnDelete:CASCADE" json:"sections,omitempty"`
}

func (p *ContentPage) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

type ContentSection struct {
	ID                uuid.UUID     `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	PageID            uuid.UUID     `gorm:"type:uuid;not null;index" json:"page_id"`
	Page              *ContentPage  `gorm:"foreignKey:PageID;constraint:OnDelete:CASCADE" json:"page,omitempty"`
	SectionKey        string        `gorm:"size:100;not null;index" json:"section_key"`
	SectionType       string        `gorm:"size:50;not null;index" json:"section_type"`
	Title             MultiLangText `gorm:"type:jsonb" json:"title"`
	Subtitle          MultiLangText `gorm:"type:jsonb" json:"subtitle"`
	Body              MultiLangText `gorm:"type:jsonb" json:"body"`
	Settings          JSONMap       `gorm:"type:jsonb" json:"settings"`
	PublishedTitle    MultiLangText `gorm:"type:jsonb" json:"published_title"`
	PublishedSubtitle MultiLangText `gorm:"type:jsonb" json:"published_subtitle"`
	PublishedBody     MultiLangText `gorm:"type:jsonb" json:"published_body"`
	PublishedSettings JSONMap       `gorm:"type:jsonb" json:"published_settings"`
	MediaID           *uuid.UUID    `gorm:"type:uuid;index" json:"media_id"`
	Media             *Media        `gorm:"foreignKey:MediaID;constraint:OnDelete:SET NULL" json:"media,omitempty"`
	DisplayOrder      int           `gorm:"default:0;index" json:"display_order"`
	Status            ContentStatus `gorm:"size:20;default:draft;index" json:"status"`
	IsActive          bool          `gorm:"default:true;index" json:"is_active"`
	PublishedAt       *time.Time    `json:"published_at"`
	CreatedAt         time.Time     `json:"created_at"`
	UpdatedAt         time.Time     `json:"updated_at"`
}

func (s *ContentSection) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
```

- [ ] **Step 5: Add models to AutoMigrate**

Modify `backend/internal/config/config.go` in `MigrateModels()` so `ContentPage` and `ContentSection` are migrated after `Media` and before temple-specific models:

```go
		&models.Setting{},
		&models.Media{},
		&models.AuditLog{},
		&models.ContentPage{},
		&models.ContentSection{},
```

- [ ] **Step 6: Run tests and build**

Run:

```bash
cd backend
go test ./internal/models -run 'TestJSONMap' -v
go build ./...
```

Expected: tests PASS and build succeeds.

- [ ] **Step 7: Commit**

```bash
git add backend/internal/models/json_map.go backend/internal/models/json_map_test.go backend/internal/models/content.go backend/internal/config/config.go
git commit -m "feat: add content CMS models"
```

## Task 2: Backend SQL Migrations

**Files:**
- Create: `backend/migrations/000013_create_content_pages.up.sql`
- Create: `backend/migrations/000013_create_content_pages.down.sql`
- Create: `backend/migrations/000014_create_content_sections.up.sql`
- Create: `backend/migrations/000014_create_content_sections.down.sql`

- [ ] **Step 1: Create content pages migration**

Create `backend/migrations/000013_create_content_pages.up.sql`:

```sql
CREATE TABLE IF NOT EXISTS content_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_key VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(150) NOT NULL UNIQUE,
    title JSONB NOT NULL DEFAULT '{}'::jsonb,
    description JSONB DEFAULT '{}'::jsonb,
    seo JSONB DEFAULT '{}'::jsonb,
    published_title JSONB DEFAULT '{}'::jsonb,
    published_description JSONB DEFAULT '{}'::jsonb,
    published_seo JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'draft',
    is_active BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_pages_status ON content_pages(status);
CREATE INDEX IF NOT EXISTS idx_content_pages_is_active ON content_pages(is_active);
CREATE INDEX IF NOT EXISTS idx_content_pages_slug ON content_pages(slug);
```

- [ ] **Step 2: Create content pages down migration**

Create `backend/migrations/000013_create_content_pages.down.sql`:

```sql
DROP TABLE IF EXISTS content_pages;
```

- [ ] **Step 3: Create content sections migration**

Create `backend/migrations/000014_create_content_sections.up.sql`:

```sql
CREATE TABLE IF NOT EXISTS content_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES content_pages(id) ON DELETE CASCADE,
    section_key VARCHAR(100) NOT NULL,
    section_type VARCHAR(50) NOT NULL,
    title JSONB DEFAULT '{}'::jsonb,
    subtitle JSONB DEFAULT '{}'::jsonb,
    body JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    published_title JSONB DEFAULT '{}'::jsonb,
    published_subtitle JSONB DEFAULT '{}'::jsonb,
    published_body JSONB DEFAULT '{}'::jsonb,
    published_settings JSONB DEFAULT '{}'::jsonb,
    media_id UUID REFERENCES media(id) ON DELETE SET NULL,
    display_order INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    is_active BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_sections_page_key ON content_sections(page_id, section_key);
CREATE INDEX IF NOT EXISTS idx_content_sections_page_order ON content_sections(page_id, display_order);
CREATE INDEX IF NOT EXISTS idx_content_sections_status ON content_sections(status);
CREATE INDEX IF NOT EXISTS idx_content_sections_is_active ON content_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_content_sections_type ON content_sections(section_type);
```

- [ ] **Step 4: Create content sections down migration**

Create `backend/migrations/000014_create_content_sections.down.sql`:

```sql
DROP TABLE IF EXISTS content_sections;
```

- [ ] **Step 5: Verify migration filenames sort after existing migrations**

Run:

```bash
find backend/migrations -maxdepth 1 -type f | sort
```

Expected: `000013_create_content_pages.*.sql` and `000014_create_content_sections.*.sql` appear after `000012_create_audit_logs.*.sql`.

- [ ] **Step 6: Commit**

```bash
git add backend/migrations/000013_create_content_pages.up.sql backend/migrations/000013_create_content_pages.down.sql backend/migrations/000014_create_content_sections.up.sql backend/migrations/000014_create_content_sections.down.sql
git commit -m "feat: add content CMS migrations"
```

## Task 3: Content Service

**Files:**
- Create: `backend/internal/services/content_service.go`
- Test: `backend/internal/services/content_service_test.go`

- [ ] **Step 1: Write tests for publish snapshot behavior**

Create `backend/internal/services/content_service_test.go`:

```go
package services

import (
	"testing"

	"github.com/watloungporsai/wat-profile-backend/internal/models"
)

func TestPublishedPagePayloadUsesPublishedFields(t *testing.T) {
	page := models.ContentPage{
		PageKey: "PAGE-CONTACT",
		Slug:    "contact",
		Title: models.MultiLangText{
			"th": "Draft TH",
			"en": "Draft EN",
			"de": "",
		},
		PublishedTitle: models.MultiLangText{
			"th": "Published TH",
			"en": "Published EN",
			"de": "",
		},
		SEO: models.JSONMap{
			"meta_title": map[string]interface{}{"en": "Draft SEO"},
		},
		PublishedSEO: models.JSONMap{
			"meta_title": map[string]interface{}{"en": "Published SEO"},
		},
	}

	payload := BuildPublishedPagePayload(page, nil)

	if payload.Title["en"] != "Published EN" {
		t.Fatalf("expected published title, got %#v", payload.Title)
	}
	metaTitle := payload.SEO["meta_title"].(map[string]interface{})
	if metaTitle["en"] != "Published SEO" {
		t.Fatalf("expected published SEO, got %#v", payload.SEO)
	}
}

func TestLocaleFallback(t *testing.T) {
	text := models.MultiLangText{"th": "ไทย", "en": "English", "de": ""}
	if got := LocalizedWithFallback(text, "de"); got != "English" {
		t.Fatalf("expected English fallback, got %q", got)
	}
	if got := LocalizedWithFallback(text, "fr"); got != "English" {
		t.Fatalf("expected English fallback for unknown locale, got %q", got)
	}
}
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
cd backend
go test ./internal/services -run 'TestPublishedPagePayload|TestLocaleFallback' -v
```

Expected: FAIL because `BuildPublishedPagePayload` and `LocalizedWithFallback` are not defined.

- [ ] **Step 3: Create content service**

Create `backend/internal/services/content_service.go`:

```go
package services

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"gorm.io/gorm"
)

type ContentService struct {
	db *gorm.DB
}

func NewContentService(db *gorm.DB) *ContentService {
	return &ContentService{db: db}
}

type PublishedSectionPayload struct {
	ID           uuid.UUID            `json:"id"`
	SectionKey   string               `json:"section_key"`
	SectionType  string               `json:"section_type"`
	Title        models.MultiLangText `json:"title"`
	Subtitle     models.MultiLangText `json:"subtitle"`
	Body         models.MultiLangText `json:"body"`
	Settings     models.JSONMap       `json:"settings"`
	DisplayOrder int                  `json:"display_order"`
}

type PublishedPagePayload struct {
	ID          uuid.UUID                 `json:"id"`
	PageKey     string                    `json:"page_key"`
	Slug        string                    `json:"slug"`
	Title       models.MultiLangText      `json:"title"`
	Description models.MultiLangText      `json:"description"`
	SEO         models.JSONMap            `json:"seo"`
	Sections    []PublishedSectionPayload `json:"sections"`
}

func LocalizedWithFallback(text models.MultiLangText, locale string) string {
	if text == nil {
		return ""
	}
	if value := text[locale]; value != "" {
		return value
	}
	if value := text["en"]; value != "" {
		return value
	}
	if value := text["th"]; value != "" {
		return value
	}
	return ""
}

func BuildPublishedPagePayload(page models.ContentPage, sections []models.ContentSection) PublishedPagePayload {
	payload := PublishedPagePayload{
		ID:          page.ID,
		PageKey:     page.PageKey,
		Slug:        page.Slug,
		Title:       page.PublishedTitle,
		Description: page.PublishedDescription,
		SEO:         page.PublishedSEO,
		Sections:    []PublishedSectionPayload{},
	}

	for _, section := range sections {
		payload.Sections = append(payload.Sections, PublishedSectionPayload{
			ID:           section.ID,
			SectionKey:   section.SectionKey,
			SectionType:  section.SectionType,
			Title:        section.PublishedTitle,
			Subtitle:     section.PublishedSubtitle,
			Body:         section.PublishedBody,
			Settings:     section.PublishedSettings,
			DisplayOrder: section.DisplayOrder,
		})
	}

	return payload
}

func (s *ContentService) ListPages() ([]models.ContentPage, error) {
	var pages []models.ContentPage
	err := s.db.Preload("Sections", func(db *gorm.DB) *gorm.DB {
		return db.Order("display_order ASC")
	}).Order("created_at DESC").Find(&pages).Error
	return pages, err
}

func (s *ContentService) GetPageByKey(pageKey string) (*models.ContentPage, error) {
	var page models.ContentPage
	err := s.db.Preload("Sections", func(db *gorm.DB) *gorm.DB {
		return db.Order("display_order ASC")
	}).Where("page_key = ?", pageKey).First(&page).Error
	if err != nil {
		return nil, err
	}
	return &page, nil
}

func (s *ContentService) GetPageByID(id uuid.UUID) (*models.ContentPage, error) {
	var page models.ContentPage
	err := s.db.Preload("Sections", func(db *gorm.DB) *gorm.DB {
		return db.Order("display_order ASC")
	}).First(&page, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &page, nil
}

func (s *ContentService) UpdatePageDraft(id uuid.UUID, input models.ContentPage) (*models.ContentPage, error) {
	page, err := s.GetPageByID(id)
	if err != nil {
		return nil, err
	}
	page.Title = input.Title
	page.Description = input.Description
	page.SEO = input.SEO
	page.IsActive = input.IsActive
	if page.Status == models.ContentStatusPublished {
		page.Status = models.ContentStatusDraft
	}
	if err := s.db.Save(page).Error; err != nil {
		return nil, err
	}
	return s.GetPageByID(id)
}

func (s *ContentService) UpdateSectionDraft(id uuid.UUID, input models.ContentSection) (*models.ContentSection, error) {
	var section models.ContentSection
	if err := s.db.First(&section, "id = ?", id).Error; err != nil {
		return nil, err
	}
	section.Title = input.Title
	section.Subtitle = input.Subtitle
	section.Body = input.Body
	section.Settings = input.Settings
	section.MediaID = input.MediaID
	section.DisplayOrder = input.DisplayOrder
	section.IsActive = input.IsActive
	if section.Status == models.ContentStatusPublished {
		section.Status = models.ContentStatusDraft
	}
	if err := s.db.Save(&section).Error; err != nil {
		return nil, err
	}
	return &section, nil
}

func (s *ContentService) ReorderSections(pageID uuid.UUID, orderedIDs []uuid.UUID) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		for index, id := range orderedIDs {
			if err := tx.Model(&models.ContentSection{}).
				Where("id = ? AND page_id = ?", id, pageID).
				Update("display_order", index+1).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *ContentService) PublishPage(pageID uuid.UUID) (*models.ContentPage, error) {
	now := time.Now()
	err := s.db.Transaction(func(tx *gorm.DB) error {
		var page models.ContentPage
		if err := tx.First(&page, "id = ?", pageID).Error; err != nil {
			return err
		}
		page.PublishedTitle = page.Title
		page.PublishedDescription = page.Description
		page.PublishedSEO = page.SEO
		page.Status = models.ContentStatusPublished
		page.PublishedAt = &now
		if err := tx.Save(&page).Error; err != nil {
			return err
		}

		var sections []models.ContentSection
		if err := tx.Where("page_id = ?", pageID).Find(&sections).Error; err != nil {
			return err
		}
		for i := range sections {
			sections[i].PublishedTitle = sections[i].Title
			sections[i].PublishedSubtitle = sections[i].Subtitle
			sections[i].PublishedBody = sections[i].Body
			sections[i].PublishedSettings = sections[i].Settings
			sections[i].Status = models.ContentStatusPublished
			sections[i].PublishedAt = &now
			if err := tx.Save(&sections[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.GetPageByID(pageID)
}

func (s *ContentService) GetPublishedPage(slug string) (*PublishedPagePayload, error) {
	var page models.ContentPage
	if err := s.db.Where("slug = ? AND status = ? AND is_active = ?", slug, models.ContentStatusPublished, true).First(&page).Error; err != nil {
		return nil, err
	}
	var sections []models.ContentSection
	if err := s.db.Where("page_id = ? AND status = ? AND is_active = ?", page.ID, models.ContentStatusPublished, true).
		Order("display_order ASC").
		Find(&sections).Error; err != nil {
		return nil, err
	}
	payload := BuildPublishedPagePayload(page, sections)
	return &payload, nil
}

func (s *ContentService) EnsureContactPageSeed() error {
	var existing models.ContentPage
	if err := s.db.Where("page_key = ?", "PAGE-CONTACT").First(&existing).Error; err == nil {
		return nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	now := time.Now()
	page := models.ContentPage{
		PageKey: "PAGE-CONTACT",
		Slug:    "contact",
		Title: models.MultiLangText{
			"th": "ติดต่อวัดหลวงพ่อใส",
			"en": "Contact Wat Loung Por Sai",
			"de": "Kontakt Wat Loung Por Sai",
		},
		Description: models.MultiLangText{
			"th": "สอบถามข้อมูลกิจกรรม การเดินทาง และการร่วมทำบุญ",
			"en": "Contact the temple for events, visiting information, and donations.",
			"de": "Kontaktieren Sie den Tempel für Veranstaltungen, Besuchsinformationen und Spenden.",
		},
		SEO: models.JSONMap{
			"meta_title": map[string]interface{}{
				"th": "ติดต่อวัดหลวงพ่อใส",
				"en": "Contact Wat Loung Por Sai",
				"de": "Kontakt Wat Loung Por Sai",
			},
			"meta_description": map[string]interface{}{
				"th": "สอบถามข้อมูลกิจกรรม การเดินทาง และการร่วมทำบุญกับวัดหลวงพ่อใส",
				"en": "Contact Wat Loung Por Sai for temple events, visiting information, and donations.",
				"de": "Kontaktieren Sie Wat Loung Por Sai für Veranstaltungen, Besuchsinformationen und Spenden.",
			},
			"noindex": false,
		},
		Status:      models.ContentStatusPublished,
		IsActive:    true,
		PublishedAt: &now,
	}
	page.PublishedTitle = page.Title
	page.PublishedDescription = page.Description
	page.PublishedSEO = page.SEO

	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&page).Error; err != nil {
			return err
		}
		sections := []models.ContentSection{
			contactSection(page.ID, "contact-hero", "hero", 1, "ติดต่อวัด", "Contact", "Kontakt"),
			contactSection(page.ID, "contact-info", "contact_info", 2, "ข้อมูลติดต่อ", "Contact information", "Kontaktinformationen"),
			contactSection(page.ID, "contact-form-copy", "contact_form_copy", 3, "ส่งข้อความถึงวัด", "Send a message", "Nachricht senden"),
			contactSection(page.ID, "visit-cards", "visit_cards", 4, "ข้อมูลสำหรับผู้มาเยือน", "Visitor information", "Besucherinformationen"),
			contactSection(page.ID, "map-block", "map", 5, "แผนที่", "Map", "Karte"),
		}
		for i := range sections {
			if err := tx.Create(&sections[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func contactSection(pageID uuid.UUID, key, sectionType string, order int, th, en, de string) models.ContentSection {
	now := time.Now()
	section := models.ContentSection{
		PageID:       pageID,
		SectionKey:   key,
		SectionType:  sectionType,
		Title:        models.MultiLangText{"th": th, "en": en, "de": de},
		Subtitle:     models.MultiLangText{"th": "", "en": "", "de": ""},
		Body:         models.MultiLangText{"th": "", "en": "", "de": ""},
		Settings:     models.JSONMap{},
		DisplayOrder: order,
		Status:       models.ContentStatusPublished,
		IsActive:     true,
		PublishedAt:  &now,
	}
	section.PublishedTitle = section.Title
	section.PublishedSubtitle = section.Subtitle
	section.PublishedBody = section.Body
	section.PublishedSettings = section.Settings
	return section
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
cd backend
go test ./internal/services -run 'TestPublishedPagePayload|TestLocaleFallback' -v
```

Expected: PASS.

- [ ] **Step 5: Run backend build**

Run:

```bash
cd backend
go build ./...
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add backend/internal/services/content_service.go backend/internal/services/content_service_test.go
git commit -m "feat: add content CMS service"
```

## Task 4: Content Handlers And Routes

**Files:**
- Create: `backend/internal/handlers/content_handler.go`
- Modify: `backend/internal/routes/routes.go`

- [ ] **Step 1: Create content handler**

Create `backend/internal/handlers/content_handler.go`:

```go
package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/watloungporsai/wat-profile-backend/internal/models"
	"github.com/watloungporsai/wat-profile-backend/internal/services"
	"github.com/watloungporsai/wat-profile-backend/pkg/utils"
	"gorm.io/gorm"
)

type ContentHandler struct {
	contentService *services.ContentService
	auditService   *services.AuditService
}

func NewContentHandler(db *gorm.DB) *ContentHandler {
	return &ContentHandler{
		contentService: services.NewContentService(db),
		auditService:   services.NewAuditService(db),
	}
}

func (h *ContentHandler) ListPages(c *fiber.Ctx) error {
	pages, err := h.contentService.ListPages()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch content pages")
	}
	return utils.SuccessResponse(c, pages)
}

func (h *ContentHandler) GetPage(c *fiber.Ctx) error {
	pageKey := c.Params("pageKey")
	page, err := h.contentService.GetPageByKey(pageKey)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Content page not found")
	}
	return utils.SuccessResponse(c, page)
}

func (h *ContentHandler) UpdatePageDraft(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid page id")
	}

	var input models.ContentPage
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	page, err := h.contentService.UpdatePageDraft(id, input)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update content page")
	}

	go h.auditService.LogAction(c, "update", "content_pages", id.String(), map[string]interface{}{"page_key": page.PageKey})
	return utils.SuccessResponse(c, page)
}

func (h *ContentHandler) UpdateSectionDraft(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid section id")
	}

	var input models.ContentSection
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	section, err := h.contentService.UpdateSectionDraft(id, input)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update content section")
	}

	go h.auditService.LogAction(c, "update", "content_sections", id.String(), map[string]interface{}{"section_key": section.SectionKey})
	return utils.SuccessResponse(c, section)
}

func (h *ContentHandler) ReorderSections(c *fiber.Ctx) error {
	pageID, err := uuid.Parse(c.Params("pageId"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid page id")
	}

	var body struct {
		SectionIDs []uuid.UUID `json:"section_ids"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if len(body.SectionIDs) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "section_ids is required")
	}

	if err := h.contentService.ReorderSections(pageID, body.SectionIDs); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to reorder sections")
	}

	go h.auditService.LogAction(c, "reorder", "content_sections", pageID.String(), map[string]interface{}{"count": len(body.SectionIDs)})
	return utils.MessageResponse(c, "Sections reordered successfully")
}

func (h *ContentHandler) PublishPage(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid page id")
	}

	page, err := h.contentService.PublishPage(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to publish content page")
	}

	go h.auditService.LogAction(c, "publish", "content_pages", id.String(), map[string]interface{}{"page_key": page.PageKey})
	return utils.SuccessResponse(c, page)
}

func (h *ContentHandler) GetPublicPage(c *fiber.Ctx) error {
	slug := c.Params("slug")
	page, err := h.contentService.GetPublishedPage(slug)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Content page not found")
	}
	return utils.SuccessResponse(c, page)
}
```

- [ ] **Step 2: Register content routes**

Modify `backend/internal/routes/routes.go`:

1. Add handler initialization near other handlers:

```go
	contentHandler := handlers.NewContentHandler(db)
```

2. Add public route after public settings:

```go
	// Website CMS pages
	public.Get("/pages/:slug", contentHandler.GetPublicPage)
```

3. Add admin routes after Settings Management:

```go
	// Website CMS Management
	admin.Get("/website/pages", middleware.PermissionRequired("website", "read"), contentHandler.ListPages)
	admin.Get("/website/pages/:pageKey", middleware.PermissionRequired("website", "read"), contentHandler.GetPage)
	admin.Put("/website/pages/:id", middleware.PermissionRequired("website", "update"), contentHandler.UpdatePageDraft)
	admin.Post("/website/pages/:id/publish", middleware.PermissionRequired("website", "update"), contentHandler.PublishPage)
	admin.Put("/website/pages/:pageId/sections/reorder", middleware.PermissionRequired("website", "update"), contentHandler.ReorderSections)
	admin.Put("/website/sections/:id", middleware.PermissionRequired("website", "update"), contentHandler.UpdateSectionDraft)
```

- [ ] **Step 3: Run backend build**

Run:

```bash
cd backend
go build ./...
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add backend/internal/handlers/content_handler.go backend/internal/routes/routes.go
git commit -m "feat: add content CMS API routes"
```

## Task 5: Seed PAGE-CONTACT And Permissions

**Files:**
- Modify: `backend/cmd/seed/main.go`
- Modify: `frontend/src/types/auth.ts`
- Modify: `frontend/src/components/admin/PermissionEditor.tsx`

- [ ] **Step 1: Add website permissions to seed roles**

Modify `backend/cmd/seed/main.go` inside `seedRoles()`:

For admin permissions, add:

```go
				"website":   "all",
				"audit_logs": "all",
```

For editor permissions, add:

```go
				"website":   "all",
```

The admin permission block should include both `website` and `audit_logs` because the admin sidebar already has Audit Logs guarded by `audit_logs`.

- [ ] **Step 2: Seed PAGE-CONTACT**

Modify `backend/cmd/seed/main.go`:

1. Add import if not present:

```go
	"github.com/watloungporsai/wat-profile-backend/internal/services"
```

2. Call the new seed function after `seedSettings()`:

```go
	// Seed website CMS contact page
	seedWebsiteContent()
```

3. Add function near other seed functions:

```go
func seedWebsiteContent() {
	log.Println("Seeding website CMS content...")
	contentService := services.NewContentService(config.DB)
	if err := contentService.EnsureContactPageSeed(); err != nil {
		log.Fatalf("  Failed to seed PAGE-CONTACT: %v", err)
	}
	log.Println("  PAGE-CONTACT ready")
}
```

- [ ] **Step 3: Add frontend permission resource**

Modify `frontend/src/types/auth.ts` and add `"website"` to `PermissionResource`:

```ts
export type PermissionResource =
  | "events"
  | "monks"
  | "gallery"
  | "schedules"
  | "donations"
  | "members"
  | "contacts"
  | "settings"
  | "users"
  | "registrations"
  | "audit_logs"
  | "website";
```

- [ ] **Step 4: Add Website to PermissionEditor**

Modify `frontend/src/components/admin/PermissionEditor.tsx` and add this resource to `RESOURCES`:

```ts
  { key: "website", label: "เว็บไซต์และเนื้อหา (Website CMS)" },
  { key: "audit_logs", label: "บันทึกการใช้งาน (Audit Logs)" },
```

Place it after `settings` and before `users`.

- [ ] **Step 5: Run builds**

Run:

```bash
cd backend
go build ./...
cd ../frontend
npm run build
```

Expected: backend build succeeds. Frontend build succeeds if dependencies are installed. If frontend fails with `eslint: command not found` or missing `node_modules`, run `npm install` only after user approval because it uses network.

- [ ] **Step 6: Commit**

```bash
git add backend/cmd/seed/main.go frontend/src/types/auth.ts frontend/src/components/admin/PermissionEditor.tsx
git commit -m "feat: seed contact CMS permissions"
```

## Task 6: Frontend CMS Types, Services, And Locale Helpers

**Files:**
- Create: `frontend/src/types/website-cms.ts`
- Create: `frontend/src/utils/localizedText.ts`
- Create: `frontend/src/services/websiteCmsService.ts`
- Modify: `frontend/src/services/publicService.ts`

- [ ] **Step 1: Create CMS types**

Create `frontend/src/types/website-cms.ts`:

```ts
import type { MultiLangText } from "./api";

export type ContentStatus = "draft" | "published";

export interface SeoMetadata {
  meta_title?: MultiLangText;
  meta_description?: MultiLangText;
  og_title?: MultiLangText;
  og_description?: MultiLangText;
  og_image_url?: string;
  canonical_url?: string;
  noindex?: boolean;
}

export interface ContentSection {
  id: string;
  page_id: string;
  section_key: string;
  section_type: string;
  title: MultiLangText;
  subtitle: MultiLangText;
  body: MultiLangText;
  settings: Record<string, unknown>;
  published_title?: MultiLangText;
  published_subtitle?: MultiLangText;
  published_body?: MultiLangText;
  published_settings?: Record<string, unknown>;
  media_id: string | null;
  display_order: number;
  status: ContentStatus;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentPage {
  id: string;
  page_key: string;
  slug: string;
  title: MultiLangText;
  description: MultiLangText;
  seo: SeoMetadata;
  published_title?: MultiLangText;
  published_description?: MultiLangText;
  published_seo?: SeoMetadata;
  status: ContentStatus;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  sections?: ContentSection[];
}

export interface PublicContentSection {
  id: string;
  section_key: string;
  section_type: string;
  title: MultiLangText;
  subtitle: MultiLangText;
  body: MultiLangText;
  settings: Record<string, unknown>;
  display_order: number;
}

export interface PublicContentPage {
  id: string;
  page_key: string;
  slug: string;
  title: MultiLangText;
  description: MultiLangText;
  seo: SeoMetadata;
  sections: PublicContentSection[];
}
```

- [ ] **Step 2: Create locale fallback helper**

Create `frontend/src/utils/localizedText.ts`:

```ts
import type { MultiLangText } from "@/types/api";

export function getCmsText(
  value: MultiLangText | null | undefined,
  locale: string,
  fallback = "",
): string {
  if (!value) return fallback;
  return value[locale] || value.en || value.th || fallback;
}

export function hasLocaleValue(
  value: MultiLangText | null | undefined,
  locale: "th" | "en" | "de",
): boolean {
  return Boolean(value?.[locale]?.trim());
}
```

- [ ] **Step 3: Create CMS service**

Create `frontend/src/services/websiteCmsService.ts`:

```ts
import api from "./api";
import { publicApi } from "./publicService";
import type { ApiResponse } from "@/types/api";
import type { ContentPage, ContentSection, PublicContentPage } from "@/types/website-cms";

export const websiteCmsAdminService = {
  async getPages(): Promise<ContentPage[]> {
    const res = await api.get<ApiResponse<ContentPage[]>>("/admin/website/pages");
    return res.data.data || [];
  },

  async getPage(pageKey: string): Promise<ContentPage> {
    const res = await api.get<ApiResponse<ContentPage>>(`/admin/website/pages/${pageKey}`);
    return res.data.data!;
  },

  async updatePage(id: string, page: Partial<ContentPage>): Promise<ContentPage> {
    const res = await api.put<ApiResponse<ContentPage>>(`/admin/website/pages/${id}`, page);
    return res.data.data!;
  },

  async updateSection(id: string, section: Partial<ContentSection>): Promise<ContentSection> {
    const res = await api.put<ApiResponse<ContentSection>>(`/admin/website/sections/${id}`, section);
    return res.data.data!;
  },

  async reorderSections(pageId: string, sectionIds: string[]): Promise<void> {
    await api.put(`/admin/website/pages/${pageId}/sections/reorder`, { section_ids: sectionIds });
  },

  async publishPage(id: string): Promise<ContentPage> {
    const res = await api.post<ApiResponse<ContentPage>>(`/admin/website/pages/${id}/publish`);
    return res.data.data!;
  },
};

export const websiteCmsPublicService = {
  async getPage(slug: string): Promise<PublicContentPage | null> {
    try {
      const res = await publicApi.get<ApiResponse<PublicContentPage>>(`/pages/${slug}`);
      return res.data.data || null;
    } catch {
      return null;
    }
  },
};
```

- [ ] **Step 4: Export public CMS fetch from publicService**

Modify `frontend/src/services/publicService.ts` by adding:

```ts
  getPageBySlug: async (slug: string) => {
    const res = await publicApi.get(`/pages/${slug}`);
    return res.data;
  },
```

Place it inside `publicService`.

- [ ] **Step 5: Run frontend build**

Run:

```bash
cd frontend
npm run build
```

Expected: build succeeds if dependencies are installed.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/website-cms.ts frontend/src/utils/localizedText.ts frontend/src/services/websiteCmsService.ts frontend/src/services/publicService.ts
git commit -m "feat: add website CMS frontend services"
```

## Task 7: Admin Sidebar And Messages

**Files:**
- Modify: `frontend/src/components/admin/AdminSidebar.tsx`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

- [ ] **Step 1: Add icon import**

Modify `frontend/src/components/admin/AdminSidebar.tsx` and add `MonitorCog` to lucide imports:

```ts
  MonitorCog,
```

- [ ] **Step 2: Add Website menu item**

Add this item after Dashboard:

```ts
  {
    labelKey: "website",
    href: "/admin/website/pages",
    icon: MonitorCog,
    resource: "website",
  },
```

- [ ] **Step 3: Add sidebar labels**

In `frontend/src/messages/admin/th.json`, add under `sidebar`:

```json
"website": "เว็บไซต์"
```

In `frontend/src/messages/admin/en.json`, add under `sidebar`:

```json
"website": "Website"
```

In `frontend/src/messages/admin/de.json`, add under `sidebar`:

```json
"website": "Webseite"
```

- [ ] **Step 4: Add website CMS labels**

In each admin message file, add a top-level `website` object inside the `Admin` namespace. Use these Thai labels in `th.json`:

```json
"website": {
  "pagesTitle": "จัดการหน้าเว็บไซต์",
  "contactPage": "PAGE-CONTACT",
  "open": "เปิด",
  "saveDraft": "บันทึกฉบับร่าง",
  "publish": "เผยแพร่",
  "preview": "พรีวิว",
  "sections": "ส่วนของหน้า",
  "seo": "SEO",
  "desktop": "เดสก์ท็อป",
  "tablet": "แท็บเล็ต",
  "mobile": "มือถือ"
}
```

Use equivalent English and German labels:

```json
"website": {
  "pagesTitle": "Website Pages",
  "contactPage": "PAGE-CONTACT",
  "open": "Open",
  "saveDraft": "Save draft",
  "publish": "Publish",
  "preview": "Preview",
  "sections": "Sections",
  "seo": "SEO",
  "desktop": "Desktop",
  "tablet": "Tablet",
  "mobile": "Mobile"
}
```

```json
"website": {
  "pagesTitle": "Webseiten",
  "contactPage": "PAGE-CONTACT",
  "open": "Öffnen",
  "saveDraft": "Entwurf speichern",
  "publish": "Veröffentlichen",
  "preview": "Vorschau",
  "sections": "Abschnitte",
  "seo": "SEO",
  "desktop": "Desktop",
  "tablet": "Tablet",
  "mobile": "Mobil"
}
```

- [ ] **Step 5: Run frontend build**

Run:

```bash
cd frontend
npm run build
```

Expected: build succeeds if dependencies are installed.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/admin/AdminSidebar.tsx frontend/src/messages/admin/th.json frontend/src/messages/admin/en.json frontend/src/messages/admin/de.json
git commit -m "feat: add website CMS navigation"
```

## Task 8: Admin Website Pages List

**Files:**
- Create: `frontend/src/components/admin/website/PageStatusPill.tsx`
- Create: `frontend/src/components/admin/website/LanguageCompleteness.tsx`
- Create: `frontend/src/app/[locale]/admin/website/pages/page.tsx`

- [ ] **Step 1: Create PageStatusPill**

Create `frontend/src/components/admin/website/PageStatusPill.tsx`:

```tsx
"use client";

import { cn } from "@/utils/cn";
import type { ContentStatus } from "@/types/website-cms";

interface PageStatusPillProps {
  status: ContentStatus;
}

export function PageStatusPill({ status }: PageStatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2 text-xs font-semibold",
        status === "published"
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-gray-200 bg-gray-50 text-gray-600",
      )}
    >
      {status}
    </span>
  );
}
```

- [ ] **Step 2: Create LanguageCompleteness**

Create `frontend/src/components/admin/website/LanguageCompleteness.tsx`:

```tsx
"use client";

import type { MultiLangText } from "@/types/api";
import { hasLocaleValue } from "@/utils/localizedText";
import { cn } from "@/utils/cn";

interface LanguageCompletenessProps {
  value: MultiLangText;
}

const LOCALES = ["th", "en", "de"] as const;

export function LanguageCompleteness({ value }: LanguageCompletenessProps) {
  return (
    <div className="flex gap-1">
      {LOCALES.map((locale) => {
        const complete = hasLocaleValue(value, locale);
        return (
          <span
            key={locale}
            className={cn(
              "rounded border px-1.5 py-0.5 text-[11px] font-semibold uppercase",
              complete
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-600",
            )}
          >
            {locale}
          </span>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create pages list route**

Create `frontend/src/app/[locale]/admin/website/pages/page.tsx`:

```tsx
"use client";

import React, { useEffect, useState } from "react";
import { MonitorCog } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageLoading } from "@/components/ui/Loading";
import { PageStatusPill } from "@/components/admin/website/PageStatusPill";
import { LanguageCompleteness } from "@/components/admin/website/LanguageCompleteness";
import { websiteCmsAdminService } from "@/services/websiteCmsService";
import type { ContentPage } from "@/types/website-cms";

export default function WebsitePagesPage() {
  const t = useTranslations("Admin");
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    websiteCmsAdminService
      .getPages()
      .then((data) => {
        if (mounted) setPages(data);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const columns: Column<ContentPage>[] = [
    {
      header: "Page",
      accessorKey: "page_key",
      cell: (_, row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.page_key}</div>
          <div className="text-xs text-gray-500">/{row.slug}</div>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (value) => <PageStatusPill status={value as ContentPage["status"]} />,
    },
    {
      header: "Languages",
      accessorKey: "title",
      cell: (value) => <LanguageCompleteness value={value as ContentPage["title"]} />,
    },
    {
      header: "Sections",
      accessorKey: "sections",
      cell: (_, row) => `${row.sections?.length || 0} sections`,
    },
    {
      header: "Updated",
      accessorKey: "updated_at",
      cell: (value) => new Date(value as string).toLocaleString("th-TH"),
    },
    {
      header: "Actions",
      cell: (_, row) => (
        <Link
          href={`/admin/website/pages/${row.page_key}`}
          className="inline-flex h-8 items-center rounded border border-gray-300 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          {t("website.open")}
        </Link>
      ),
    },
  ];

  if (isLoading) return <PageLoading />;

  return (
    <div>
      <AdminPageHeader
        title={t("website.pagesTitle")}
        breadcrumbs={[{ label: t("website.pagesTitle") }]}
        actions={
          <div className="inline-flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
            <MonitorCog size={16} />
            Structured CMS
          </div>
        }
      />
      <div className="mt-4">
        <DataTable columns={columns} data={pages} hidePagination />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run frontend build**

Run:

```bash
cd frontend
npm run build
```

Expected: build succeeds if dependencies are installed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/admin/website/PageStatusPill.tsx frontend/src/components/admin/website/LanguageCompleteness.tsx frontend/src/app/[locale]/admin/website/pages/page.tsx
git commit -m "feat: add website pages admin list"
```

## Task 9: Admin PAGE-CONTACT Editor And Preview

**Files:**
- Create: `frontend/src/components/admin/website/DevicePreviewFrame.tsx`
- Create: `frontend/src/components/admin/website/ContactPagePreview.tsx`
- Create: `frontend/src/components/admin/website/SeoPreviewPanel.tsx`
- Create: `frontend/src/components/admin/website/ContactSectionEditor.tsx`
- Create: `frontend/src/app/[locale]/admin/website/pages/[id]/page.tsx`

- [ ] **Step 1: Create DevicePreviewFrame**

Create `frontend/src/components/admin/website/DevicePreviewFrame.tsx`:

```tsx
"use client";

import React, { useState } from "react";
import { cn } from "@/utils/cn";

type Device = "desktop" | "tablet" | "mobile";

interface DevicePreviewFrameProps {
  children: React.ReactNode;
}

const widths: Record<Device, string> = {
  desktop: "max-w-[960px]",
  tablet: "max-w-[720px]",
  mobile: "max-w-[375px]",
};

export function DevicePreviewFrame({ children }: DevicePreviewFrameProps) {
  const [device, setDevice] = useState<Device>("desktop");

  return (
    <div className="rounded-md border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
        <div className="font-mono text-xs font-semibold uppercase tracking-wide text-neutral-700">
          Live public preview
        </div>
        <div className="flex gap-1">
          {(["desktop", "tablet", "mobile"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setDevice(item)}
              className={cn(
                "h-8 rounded border px-2 font-mono text-xs font-semibold",
                device === item
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-neutral-100 text-neutral-600",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="flex min-h-[560px] justify-center overflow-auto bg-neutral-200 p-4">
        <div className={cn("w-full border border-neutral-300 bg-white shadow-xl", widths[device])}>
          {children}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ContactPagePreview**

Create `frontend/src/components/admin/website/ContactPagePreview.tsx`:

```tsx
"use client";

import type { ContentPage } from "@/types/website-cms";
import { getCmsText } from "@/utils/localizedText";

interface ContactPagePreviewProps {
  page: ContentPage;
  locale: string;
}

export function ContactPagePreview({ page, locale }: ContactPagePreviewProps) {
  const sections = page.sections || [];
  const hero = sections.find((section) => section.section_type === "hero");
  const info = sections.find((section) => section.section_type === "contact_info");
  const formCopy = sections.find((section) => section.section_type === "contact_form_copy");
  const visit = sections.find((section) => section.section_type === "visit_cards");

  return (
    <article className="font-mono text-neutral-900">
      <nav className="flex h-14 items-center justify-between border-b border-neutral-200 px-6 text-xs">
        <strong>Wat Loung Por Sai</strong>
        <div className="hidden gap-4 text-neutral-500 md:flex">
          <span>Home</span>
          <span>Events</span>
          <span>Monks</span>
          <span>Gallery</span>
          <span>Contact</span>
        </div>
      </nav>
      <section className="border-b border-neutral-200 bg-neutral-50 px-6 py-10">
        <div className="mb-2 text-xs uppercase tracking-[0.2em] text-neutral-500">Contact</div>
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight">
          {getCmsText(hero?.title || page.title, locale, "Contact")}
        </h1>
        <p className="mt-3 max-w-2xl text-neutral-600">
          {getCmsText(hero?.subtitle || page.description, locale, "")}
        </p>
      </section>
      <section className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border-b border-neutral-200 p-6 lg:border-b-0 lg:border-r">
          <PreviewInfo label="Address" value={String(info?.settings?.address || "Wat Loung Por Sai, Germany")} />
          <PreviewInfo label="Phone" value={String(info?.settings?.phone || "+49 000 000000")} />
          <PreviewInfo label="Email" value={String(info?.settings?.email || "info@watloungporsai.de")} />
          <PreviewInfo label="Bank donation" value={String(info?.settings?.bank || "Sparkasse · IBAN DE00 0000 0000")} />
        </div>
        <div className="bg-neutral-50 p-6">
          <h2 className="mb-4 text-xl font-bold">{getCmsText(formCopy?.title, locale, "Send a message")}</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="h-11 border border-neutral-300 bg-white px-3 py-3 text-neutral-500">Name</div>
            <div className="h-11 border border-neutral-300 bg-white px-3 py-3 text-neutral-500">Email</div>
          </div>
          <div className="mt-3 h-11 border border-neutral-300 bg-white px-3 py-3 text-neutral-500">Subject</div>
          <div className="mt-3 h-28 border border-neutral-300 bg-white px-3 py-3 text-neutral-500">Message</div>
          <div className="mt-3 grid h-11 place-items-center bg-neutral-900 font-bold text-white">Send</div>
        </div>
      </section>
      <section className="border-t border-neutral-200 p-6">
        <h2 className="mb-4 text-xl font-bold">{getCmsText(visit?.title, locale, "Visitor information")}</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <VisitCard title="Opening hours" text="Daily practice and ceremonies by schedule." />
          <VisitCard title="Parking" text="Use the entrance beside the main hall." />
          <VisitCard title="Etiquette" text="Dress modestly and keep phones silent." />
        </div>
      </section>
    </article>
  );
}

function PreviewInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-neutral-200 py-4 last:border-b-0">
      <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="text-neutral-700">{value}</div>
    </div>
  );
}

function VisitCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="border border-neutral-200 p-4">
      <strong className="block">{title}</strong>
      <span className="mt-2 block text-xs text-neutral-500">{text}</span>
    </div>
  );
}
```

- [ ] **Step 3: Create SeoPreviewPanel**

Create `frontend/src/components/admin/website/SeoPreviewPanel.tsx`:

```tsx
"use client";

import type { ContentPage } from "@/types/website-cms";
import { getCmsText } from "@/utils/localizedText";

interface SeoPreviewPanelProps {
  page: ContentPage;
  locale: string;
}

export function SeoPreviewPanel({ page, locale }: SeoPreviewPanelProps) {
  const metaTitle = getCmsText(page.seo?.meta_title, locale, getCmsText(page.title, locale, "Contact"));
  const metaDescription = getCmsText(
    page.seo?.meta_description,
    locale,
    getCmsText(page.description, locale, ""),
  );

  return (
    <div className="rounded-md border border-neutral-200 bg-white p-4">
      <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-neutral-700">
        Search result preview
      </div>
      <div className="text-base text-blue-800">{metaTitle}</div>
      <div className="text-xs text-green-700">https://watloungporsai.de/{locale}/contact</div>
      <div className="mt-1 text-sm text-neutral-600">{metaDescription}</div>
    </div>
  );
}
```

- [ ] **Step 4: Create ContactSectionEditor**

Create `frontend/src/components/admin/website/ContactSectionEditor.tsx`:

```tsx
"use client";

import type { ContentSection } from "@/types/website-cms";
import type { MultiLangText } from "@/types/api";

interface ContactSectionEditorProps {
  section: ContentSection;
  locale: "th" | "en" | "de";
  onChange: (section: ContentSection) => void;
}

export function ContactSectionEditor({ section, locale, onChange }: ContactSectionEditorProps) {
  const updateText = (field: "title" | "subtitle" | "body", value: string) => {
    onChange({
      ...section,
      [field]: {
        ...(section[field] as MultiLangText),
        [locale]: value,
      },
    });
  };

  return (
    <div className="space-y-3">
      <TextField label="Section title" value={section.title?.[locale] || ""} onChange={(value) => updateText("title", value)} />
      <TextField label="Subtitle" value={section.subtitle?.[locale] || ""} onChange={(value) => updateText("subtitle", value)} />
      <TextArea label="Body" value={section.body?.[locale] || ""} onChange={(value) => updateText("body", value)} />
      <div className="rounded border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-500">
        Section type: <strong>{section.section_type}</strong>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-xs font-bold uppercase tracking-wide text-neutral-600">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded border border-neutral-300 px-3 text-sm text-neutral-900"
      />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-xs font-bold uppercase tracking-wide text-neutral-600">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
      />
    </label>
  );
}
```

- [ ] **Step 5: Create page detail editor**

Create `frontend/src/app/[locale]/admin/website/pages/[id]/page.tsx`:

```tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { DevicePreviewFrame } from "@/components/admin/website/DevicePreviewFrame";
import { ContactPagePreview } from "@/components/admin/website/ContactPagePreview";
import { SeoPreviewPanel } from "@/components/admin/website/SeoPreviewPanel";
import { ContactSectionEditor } from "@/components/admin/website/ContactSectionEditor";
import { websiteCmsAdminService } from "@/services/websiteCmsService";
import type { ContentPage, ContentSection } from "@/types/website-cms";
import { cn } from "@/utils/cn";

const LOCALES = ["th", "en", "de"] as const;

export default function WebsitePageEditor() {
  const t = useTranslations("Admin");
  const routeParams = useParams<{ id: string }>();
  const currentLocale = useLocale() as "th" | "en" | "de";
  const pageKey = routeParams.id || "PAGE-CONTACT";
  const [page, setPage] = useState<ContentPage | null>(null);
  const [activeLocale, setActiveLocale] = useState<"th" | "en" | "de">(currentLocale);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    let mounted = true;
    websiteCmsAdminService.getPage(pageKey).then((data) => {
      if (!mounted) return;
      setPage(data);
      setActiveSectionId(data.sections?.[0]?.id || null);
    }).finally(() => {
      if (mounted) setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [pageKey]);

  const activeSection = useMemo(() => {
    return page?.sections?.find((section) => section.id === activeSectionId) || null;
  }, [page, activeSectionId]);

  const updateSection = (nextSection: ContentSection) => {
    if (!page) return;
    setPage({
      ...page,
      sections: (page.sections || []).map((section) =>
        section.id === nextSection.id ? nextSection : section,
      ),
    });
  };

  const saveDraft = async () => {
    if (!page || !activeSection) return;
    setIsSaving(true);
    try {
      const saved = await websiteCmsAdminService.updateSection(activeSection.id, activeSection);
      updateSection(saved);
    } finally {
      setIsSaving(false);
    }
  };

  const publish = async () => {
    if (!page) return;
    setIsPublishing(true);
    try {
      const saved = await websiteCmsAdminService.publishPage(page.id);
      setPage(saved);
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) return <PageLoading />;
  if (!page) return <div className="text-sm text-red-600">Page not found: {pageKey}</div>;

  return (
    <div>
      <AdminPageHeader
        title={page.page_key}
        breadcrumbs={[
          { label: t("website.pagesTitle"), href: "/admin/website/pages" },
          { label: page.page_key },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveDraft} isLoading={isSaving}>
              {t("website.saveDraft")}
            </Button>
            <Button onClick={publish} isLoading={isPublishing}>
              {t("website.publish")}
            </Button>
          </div>
        }
      />

      <div className="mt-4 grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded-md border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 p-3">
            <div className="mb-3 flex gap-1">
              {LOCALES.map((locale) => (
                <button
                  key={locale}
                  type="button"
                  onClick={() => setActiveLocale(locale)}
                  className={cn(
                    "rounded border px-3 py-1.5 font-mono text-xs font-semibold uppercase",
                    activeLocale === locale
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-neutral-100 text-neutral-600",
                  )}
                >
                  {locale}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {(page.sections || []).map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSectionId(section.id)}
                  className={cn(
                    "grid w-full grid-cols-[1fr_auto] rounded border p-3 text-left",
                    activeSectionId === section.id
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 bg-white",
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold text-neutral-900">{section.section_key}</span>
                    <span className="block text-xs text-neutral-500">{section.section_type}</span>
                  </span>
                  <span className="text-xs text-neutral-500">{section.status}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="p-3">
            {activeSection && (
              <ContactSectionEditor
                section={activeSection}
                locale={activeLocale}
                onChange={updateSection}
              />
            )}
          </div>
        </section>

        <section className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <DevicePreviewFrame>
            <ContactPagePreview page={page} locale={activeLocale} />
          </DevicePreviewFrame>
          <SeoPreviewPanel page={page} locale={activeLocale} />
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run frontend build**

Run:

```bash
cd frontend
npm run build
```

Expected: build succeeds if dependencies are installed.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/admin/website/DevicePreviewFrame.tsx frontend/src/components/admin/website/ContactPagePreview.tsx frontend/src/components/admin/website/SeoPreviewPanel.tsx frontend/src/components/admin/website/ContactSectionEditor.tsx frontend/src/app/[locale]/admin/website/pages/[id]/page.tsx
git commit -m "feat: add contact page CMS editor"
```

## Task 10: Public Contact Page CMS Rendering

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/contact/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/contact/ContactContent.tsx`

- [ ] **Step 1: Update metadata to use CMS payload**

Modify `frontend/src/app/[locale]/(client)/contact/page.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import ContactContent from "./ContactContent";
import { websiteCmsPublicService } from "@/services/websiteCmsService";
import { getCmsText } from "@/utils/localizedText";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ContactPage" });
  const cmsPage = await websiteCmsPublicService.getPage("contact");

  const fallbackTitle = t("title");
  const fallbackDescription = t("subtitle");
  const title = getCmsText(cmsPage?.seo?.meta_title, locale, getCmsText(cmsPage?.title, locale, fallbackTitle));
  const description = getCmsText(
    cmsPage?.seo?.meta_description,
    locale,
    getCmsText(cmsPage?.description, locale, fallbackDescription),
  );
  const ogTitle = getCmsText(cmsPage?.seo?.og_title, locale, title);
  const ogDescription = getCmsText(cmsPage?.seo?.og_description, locale, description);
  const ogImage = cmsPage?.seo?.og_image_url || siteConfig.seo.defaultOgImage;

  return {
    title,
    description,
    robots: cmsPage?.seo?.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: `${ogTitle} | ${siteConfig.siteName.th}`,
      description: ogDescription,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    alternates: {
      canonical: cmsPage?.seo?.canonical_url || `/${locale}/contact`,
      languages: {
        th: "/th/contact",
        en: "/en/contact",
        de: "/de/contact",
      },
    },
  };
}

export default async function ContactPage() {
  const cmsPage = await websiteCmsPublicService.getPage("contact");
  return <ContactContent cmsPage={cmsPage} />;
}
```

- [ ] **Step 2: Update ContactContent props and render CMS hero**

Modify the top of `frontend/src/app/[locale]/(client)/contact/ContactContent.tsx`:

```tsx
"use client";

import type { PublicContentPage } from "@/types/website-cms";
```

Change the component signature:

```tsx
export default function ContactContent({
  cmsPage,
}: {
  cmsPage: PublicContentPage | null;
}) {
```

Add section helpers after locale:

```tsx
  const heroSection = cmsPage?.sections.find((section) => section.section_type === "hero");
  const infoSection = cmsPage?.sections.find((section) => section.section_type === "contact_info");
  const formCopySection = cmsPage?.sections.find((section) => section.section_type === "contact_form_copy");
  const visitSection = cmsPage?.sections.find((section) => section.section_type === "visit_cards");
  const pageTitle = getCmsText(heroSection?.title || cmsPage?.title, locale, t("title"));
  const pageSubtitle = getCmsText(heroSection?.subtitle || cmsPage?.description, locale, t("subtitle"));
```

Change `PageHeader`:

```tsx
      <PageHeader title={pageTitle} subtitle={pageSubtitle} />
```

Change contact info values to prefer section settings:

```tsx
  const contactSettings = infoSection?.settings || {};
  const addressText = String(contactSettings.address || getLocalizedText(contactData.address, locale));
  const phoneText = String(contactSettings.phone || contactData.phone);
  const emailText = String(contactSettings.email || contactData.email);
```

Replace uses of `getLocalizedText(contactData.address, locale)`, `contactData.phone`, and `contactData.email` with `addressText`, `phoneText`, and `emailText`.

Replace form title:

```tsx
              {getCmsText(formCopySection?.title, locale, t("formTitle"))}
```

Replace visit title:

```tsx
              {getCmsText(visitSection?.title, locale, tVisit("subtitle"))}
```

- [ ] **Step 3: Run frontend build**

Run:

```bash
cd frontend
npm run build
```

Expected: build succeeds if dependencies are installed.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/[locale]/\(client\)/contact/page.tsx frontend/src/app/[locale]/\(client\)/contact/ContactContent.tsx
git commit -m "feat: render contact page from CMS"
```

## Task 11: Verification Script And Manual QA

**Files:**
- Create: `docs/website-cms/page-contact-verification.md`

- [ ] **Step 1: Create verification guide**

Create `docs/website-cms/page-contact-verification.md`:

```markdown
# PAGE-CONTACT CMS Verification

## Backend

Run:

```bash
cd backend
go test ./...
go build ./...
```

Expected:

- Tests pass.
- Build succeeds.

## Frontend

Run:

```bash
cd frontend
npm run build
```

Expected:

- Build succeeds.

If `node_modules` is missing, run `npm install` after user approval, then rerun the build.

## Seed

Run:

```bash
cd backend
go run cmd/seed/main.go
```

Expected:

- Seed prints `PAGE-CONTACT ready`.
- `content_pages` has one row with `page_key = PAGE-CONTACT`.
- `content_sections` has five rows for the contact page.

## Admin Browser Checks

1. Start backend API.
2. Start frontend.
3. Login as admin.
4. Open `/th/admin/website/pages`.
5. Verify `PAGE-CONTACT` appears.
6. Open `/th/admin/website/pages/PAGE-CONTACT`.
7. Switch preview modes: desktop, tablet, mobile.
8. Edit the hero title in Thai.
9. Save draft.
10. Verify public `/th/contact` still shows the old published title.
11. Publish changes.
12. Verify public `/th/contact` shows the new title.

## Public Checks

1. Open `/th/contact`.
2. Open `/en/contact`.
3. Open `/de/contact`.
4. Clear a German value in admin and verify German falls back to English.
5. Verify page metadata uses CMS SEO title and description.

## Audit Checks

1. Open `/th/admin/audit-logs`.
2. Verify update and publish actions exist for `content_pages` or `content_sections`.
```

- [ ] **Step 2: Run backend tests**

Run:

```bash
cd backend
go test ./...
go build ./...
```

Expected: tests and build pass.

- [ ] **Step 3: Run frontend build**

Run:

```bash
cd frontend
npm run build
```

Expected: build succeeds if dependencies are installed.

- [ ] **Step 4: Commit**

```bash
git add docs/website-cms/page-contact-verification.md
git commit -m "docs: add contact CMS verification guide"
```

## Task 12: Final Integration Review

**Files:**
- Review all changed files.

- [ ] **Step 1: Inspect git status**

Run:

```bash
git status --short
```

Expected: only intentional files are modified or untracked.

- [ ] **Step 2: Inspect route references**

Run:

```bash
rg "website/pages|PAGE-CONTACT|/pages/contact|content_pages|content_sections" -n backend frontend docs
```

Expected: route and model names are consistent.

- [ ] **Step 3: Confirm no static Contact dependency remains for CMS-covered fields**

Run:

```bash
rg "contactData\\.(address|phone|email)" -n frontend/src/app/'[locale]'/'(client)'/contact
```

Expected: no matches for address, phone, or email in CMS-covered rendering paths. Static `contactData` may still be used for temporary fallback fields such as social or bank until those settings are migrated.

- [ ] **Step 4: Confirm PRD acceptance coverage**

Open `docs/website-cms/website-cms-superpowers-prd.md` and verify each `Phase 1 Acceptance Criteria` item maps to implemented behavior:

```text
Admin opens PAGE-CONTACT: Task 8 and Task 9
Edit sections: Task 9
Save draft: Task 9 and Task 4
Publish: Task 9 and Task 4
Responsive preview: Task 9
Public contact from CMS: Task 10
No static JSON for covered content: Task 10
Locale fallback: Task 6 and Task 10
SEO metadata: Task 10
Audit log: Task 4
```

- [ ] **Step 5: Final commit if verification changed files**

If verification edits any docs or code, run:

```bash
git add docs backend frontend
git commit -m "chore: finalize contact CMS vertical slice"
```

Expected: commit succeeds or no changes remain to commit.

## Self-Review

Spec coverage:

- `PAGE-CONTACT` vertical slice is covered by Tasks 1-12.
- Backend schema, model, service, handler, routes, seed, and permission work are covered by Tasks 1-5.
- Frontend admin list/editor/preview work is covered by Tasks 6-9.
- Public Contact rendering and SEO are covered by Task 10.
- Verification and audit checks are covered by Tasks 11-12.

Placeholder scan:

- This plan intentionally contains no `TBD`, `TODO`, or open-ended implementation placeholders.
- Deferred work is explicitly listed as out of scope or phase 2+.

Type consistency:

- Backend uses `ContentPage`, `ContentSection`, `JSONMap`, `ContentStatus`, and `PublishedPagePayload`.
- Frontend uses `ContentPage`, `ContentSection`, `PublicContentPage`, and `SeoMetadata`.
- Route names use `/admin/website/pages`, `/admin/website/sections`, and `/public/pages/:slug`.
