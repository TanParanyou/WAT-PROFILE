# News & Important Announcements Feature Design

## Summary

Add a production-ready **News & Articles** (`NewsArticle`, `NewsCategory`) and **Site Alerts & Important Announcements** (`SiteAlert`) system to WAT-PROFILE. The feature provides temple staff with an intuitive Admin Panel to publish multi-language news articles and broadcast time-sensitive announcements, while giving public visitors clear access to temple stories and critical notifications in compliance with the "Apothecary Register" design system (`DESIGN.md`).

## Ubiquitous Language

- **News Article**: Long-form news or temple story supporting multi-language content (`th`, `en`, `de`), rich text body, cover image, and publishing lifecycle.
- **News Category**: Dynamic category taxonomy (`th`, `en`, `de`) used to group news and articles (e.g. Temple News, Dhamma Teachings, Event Reports).
- **Featured Article**: A highlighted news article pinned to the top of the news listing and/or featured on the homepage.
- **Draft / Scheduled / Published / Archived Article**: The publication lifecycle states of a news article.
- **Site Alert**: Urgent announcement or notification banner/modal displayed across the website.
- **Alert Banner**: A top-bar notification rendered above the public navigation.
- **Alert Popup**: A modal dialogue for critical/urgent alerts requiring immediate acknowledgement.
- **Dismissed Alert**: An alert closed by a visitor, stored locally in `localStorage` by Alert ID and timestamp to prevent repeat display.

---

## User Experience

### Public Visitor Experience

1. **Global Site Alert Banner & Modal (`SiteAlertBanner` / `SiteAlertModal`)**:
   - Integrated into root public client layout (`src/app/[locale]/(client)/layout.tsx`).
   - Fetches active alerts from `GET /api/v1/public/alerts`.
   - Checks client-side dismissal state via `useDismissibleAlert` (keyed by `${alert.id}_${alert.updated_at}`).
   - Renders top banner or modal popup styled strictly under `DESIGN.md`: 0px corner radius, hairline 1px borders, role-based Tailwind classes (`bg-site-surface`, `border-site-border`, `text-site-foreground`, `text-site-accent`), WCAG 2.2 AA compliant contrast and 44px touch targets.
   - Severity styling:
     - `info`: Deep Graphite / Register Ink hairline with quiet background.
     - `warning`: Restrained Terracotta Marker accent (`#945C26`).
     - `critical`: Distinct deep crimson notice with clear warning icon.
   - Action link navigation: Optional CTA button linking to internal article `/news/[slug]` or external destination.

2. **Public News Listing (`/[locale]/(client)/news/page.tsx`)**:
   - Layout styled as an "Apothecary Register": clean header, search input, and category filter tabs.
   - Featured Article hero section displaying the latest pinned/featured story.
   - Paginated list/grid of `ArticleRegisterRow` / `ArticleCard` items displaying: publication date (Berlin timezone), category badge, localized title, summary excerpt, and read time.
   - Fully accessible: keyboard navigable, screen-reader ready, responsive from mobile to desktop.

3. **Public News Detail (`/[locale]/(client)/news/[slug]/page.tsx`)**:
   - Clean reading typography: Noto Sans Thai / Inter body, Pridi serif heading moment, 65-75ch comfortable reading width.
   - Full cover image with 0px corner radius and taupe-surface photo credit/caption if available.
   - Safe HTML rich-text rendering (`RichTextRenderer`) supporting images, blockquotes, lists, and formatted text.
   - Photo gallery grid (if attached).
   - Global `ShareButtons` component (Web Share API + Facebook, LINE, X, WhatsApp, and Copy Link).
   - "Related Articles" section displaying up to 3 stories from the same category.

4. **Homepage Integration (`/[locale]/(client)/page.tsx`)**:
   - "Latest News & Stories" (ข่าวสารและเรื่องราวจากวัด) section displaying the 3 most recent published articles with clean hairline separators and a "View All News" button.

---

### Admin Operator Experience

1. **Permissions & Role Access (`backend/internal/models/role.go`)**:
   - New resources: `news` (read, create, update, delete) and `site_alerts` (read, create, update, delete).
   - `admin` and `editor` roles have full permissions to both resources.

2. **Admin Navigation & Sidebar (`src/components/admin/AdminSidebar.tsx`)**:
   - Sidebar item: **"ข่าวและประกาศ" (News & Announcements)** with route `/admin/news`.
   - Sub-navigation or tabs for `/admin/news` (Articles), `/admin/news/categories` (Categories), and `/admin/alerts` (Site Alerts).

3. **Admin News Management (`src/app/[locale]/admin/news/`)**:
   - `page.tsx`: DataTable with search, category filter, publish status filter, sortable columns, quick feature/pin toggle, and pagination.
   - `[id]/page.tsx`: Single dynamic route form (`id="new"` for create, UUID/numeric ID for edit):
     - Multi-language fields via `MultiLangInput` (Title, Excerpt).
     - Full article body via `RichTextEditor` (TH, EN, DE tabs).
     - Cover image upload via `ImageUpload` (deferred upload to Cloudflare R2 on save).
     - Gallery image selector.
     - Category select dropdown with quick "Add Category" modal.
     - Publishing status controls (`draft`, `scheduled`, `published`, `archived`) with date-time picker.
     - Flags: `is_featured`, `is_pinned`.

4. **Admin Site Alerts Management (`src/app/[locale]/admin/alerts/`)**:
   - `page.tsx`: DataTable listing active/inactive alerts with severity badges, active period dates, view counts, and quick active toggle.
   - `[id]/page.tsx`: Single dynamic route form for Site Alerts:
     - Multi-language Title & Message (`MultiLangInput`).
     - Severity selection (`info`, `warning`, `critical`).
     - Display type selection (`top_banner`, `modal_popup`).
     - Display scope (`all_pages`, `home_only`).
     - Start and End display date-time.
     - Action button text (`MultiLangInput`) and destination URL selector (can pick existing News Article, Event, or custom URL).
     - Dismissible toggle (`is_dismissible`).

---

## Technical Design

### Data Models & PostgreSQL Migrations (Backend - Go Fiber + GORM)

#### 1. `NewsCategory` (`backend/internal/models/news_category.go`)
```go
type NewsCategory struct {
    ID           uint          `gorm:"primaryKey;autoIncrement" json:"id"`
    Slug         string        `gorm:"size:100;uniqueIndex;not null" json:"slug"`
    Name         MultiLangText `gorm:"type:jsonb;not null" json:"name"`
    Description  MultiLangText `gorm:"type:jsonb" json:"description"`
    IsActive     bool          `gorm:"default:true;index" json:"is_active"`
    DisplayOrder int           `gorm:"default:0;index" json:"display_order"`
    CreatedAt    time.Time     `json:"created_at"`
    UpdatedAt    time.Time     `json:"updated_at"`
}
```

#### 2. `NewsArticle` (`backend/internal/models/news_article.go`)
```go
type NewsArticle struct {
    ID             uint              `gorm:"primaryKey;autoIncrement" json:"id"`
    Slug           string            `gorm:"size:150;uniqueIndex;not null" json:"slug"`
    Title          MultiLangText     `gorm:"type:jsonb;not null" json:"title"`
    Excerpt        MultiLangText     `gorm:"type:jsonb" json:"excerpt"`
    Content        LocalizedRichText `gorm:"type:jsonb" json:"content"`
    CoverImageURL  string            `gorm:"size:255" json:"cover_image_url"`
    GalleryURLs    StringSlice       `gorm:"type:jsonb;default:'[]'" json:"gallery_urls"`
    CategoryID     *uint             `gorm:"index" json:"category_id"`
    Category       *NewsCategory     `gorm:"foreignKey:CategoryID;constraint:OnDelete:SET NULL" json:"category,omitempty"`
    AuthorName     string            `gorm:"size:100" json:"author_name"`
    PublishStatus  string            `gorm:"size:20;default:'published';index" json:"publish_status"` // 'draft', 'scheduled', 'published', 'archived'
    PublishedAt    *time.Time        `gorm:"index" json:"published_at"`
    ScheduledAt    *time.Time        `gorm:"index" json:"scheduled_at"`
    IsFeatured     bool              `gorm:"default:false;index" json:"is_featured"`
    IsPinned       bool              `gorm:"default:false;index" json:"is_pinned"`
    ViewCount      int               `gorm:"default:0" json:"view_count"`
    CreatedAt      time.Time         `json:"created_at"`
    UpdatedAt      time.Time         `json:"updated_at"`
    DeletedAt      gorm.DeletedAt    `gorm:"index" json:"-"`
}
```

#### 3. `SiteAlert` (`backend/internal/models/site_alert.go`)
```go
type SiteAlert struct {
    ID            uint          `gorm:"primaryKey;autoIncrement" json:"id"`
    Title         MultiLangText `gorm:"type:jsonb;not null" json:"title"`
    Message       MultiLangText `gorm:"type:jsonb;not null" json:"message"`
    Severity      string        `gorm:"size:20;default:'info';index" json:"severity"` // 'info', 'warning', 'critical'
    DisplayType   string        `gorm:"size:20;default:'top_banner';index" json:"display_type"` // 'top_banner', 'modal_popup'
    Scope         string        `gorm:"size:20;default:'all_pages';index" json:"scope"` // 'all_pages', 'home_only'
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
```

---

### API Endpoints & Contracts

#### Public Routes:
- `GET /api/v1/public/news`: List published news articles (supports `page`, `limit`, `category_id`, `search`, `featured`).
- `GET /api/v1/public/news/:slug`: Get single published news article by slug.
- `GET /api/v1/public/news/categories`: List active news categories.
- `GET /api/v1/public/alerts`: List currently active site alerts (where `is_active = true` AND `starts_at <= NOW()` AND (`ends_at IS NULL` OR `ends_at >= NOW()`)).

#### Admin Routes:
- `GET /api/v1/admin/news`: Paginated list of all news articles (all statuses).
- `POST /api/v1/admin/news`: Create news article (`PermissionRequired("news", "create")`).
- `GET /api/v1/admin/news/:id`: Get single news article by ID (`PermissionRequired("news", "read")`).
- `PUT /api/v1/admin/news/:id`: Update news article (`PermissionRequired("news", "update")`).
- `DELETE /api/v1/admin/news/:id`: Delete news article (`PermissionRequired("news", "delete")`).
- `GET /api/v1/admin/news-categories`: List news categories.
- `POST /api/v1/admin/news-categories`: Create category (`PermissionRequired("news", "create")`).
- `PUT /api/v1/admin/news-categories/:id`: Update category (`PermissionRequired("news", "update")`).
- `DELETE /api/v1/admin/news-categories/:id`: Delete category (`PermissionRequired("news", "delete")`).
- `GET /api/v1/admin/site-alerts`: List all site alerts.
- `POST /api/v1/admin/site-alerts`: Create site alert (`PermissionRequired("site_alerts", "create")`).
- `GET /api/v1/admin/site-alerts/:id`: Get site alert by ID (`PermissionRequired("site_alerts", "read")`).
- `PUT /api/v1/admin/site-alerts/:id`: Update site alert (`PermissionRequired("site_alerts", "update")`).
- `DELETE /api/v1/admin/site-alerts/:id`: Delete site alert (`PermissionRequired("site_alerts", "delete")`).

---

## Global Reusable Components & Hooks

1. **`SiteAlertBanner` & `SiteAlertModal` (`src/components/public/SiteAlertBanner.tsx`)**:
   - Reusable notification components with WCAG 2.2 AA compliance, 0px radius, hairline borders, responsive layout.
2. **`useDismissibleAlert` (`src/hooks/useDismissibleAlert.ts`)**:
   - LocalStorage tracking for dismissed banners/popups with versioning.
3. **`ShareButtons` (`src/components/public/ShareButtons.tsx`)**:
   - Universal social & clipboard sharing component for News, Events, Teachings, and Gallery.
4. **`ArticleRegisterRow` / `ArticleCard` (`src/components/public/ArticleCard.tsx`)**:
   - "The Apothecary Register" style article summary row/card.
5. **`date-utils.ts` / Timezone utilities**:
   - Europe/Berlin date formatting across TH, EN, DE.

---

## Localization & Zero Hardcoding Guarantee

All strings are placed in:
- `src/messages/th.json`, `src/messages/en.json`, `src/messages/de.json`
- `src/messages/admin/th.json`, `src/messages/admin/en.json`, `src/messages/admin/de.json`

Strict TypeScript typing ensures **zero `any`** throughout the codebase.

---

## Decisions

1. **Separation of Concerns**: Kept `NewsArticle` (rich editorial content) and `SiteAlert` (transient urgent notification) as distinct entities that can optionally link to each other.
2. **Deferred Image Uploads**: Form saves upload files to Cloudflare R2 upon submit, preventing orphaned storage assets.
3. **"Apothecary Register" Visuals**: Strictly zero border-radius, flat surfaces with 1px hairlines, and restrained Terracotta accents.
