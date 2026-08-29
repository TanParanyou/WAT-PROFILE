# News & Important Announcements Implementation Plan

> **Goal:** Implement the complete News & Articles (`NewsArticle`, `NewsCategory`) and Site Alerts (`SiteAlert`) feature across Backend, Admin Panel, and Public Frontend according to `DESIGN.md` ("Apothecary Register") and `AGENTS.md` rules.

---

## Phase 1: Database & Backend Architecture (Go Fiber + GORM)

### 1.1 Database Migration
- [ ] Create `backend/migrations/000058_create_news_and_site_alerts.up.sql`
  - Tables: `news_categories`, `news_articles`, `site_alerts`
  - Constraints: foreign keys, unique slugs, default statuses, check constraints for severity/publish_status
  - Indexes: slugs, status, publish dates, display orders, category_id
- [ ] Create `backend/migrations/000058_create_news_and_site_alerts.down.sql`
- [ ] Update seed script (`backend/cmd/seed/main.go`) with initial news categories (e.g., General News, Dhamma Teachings, Temple Activities) and role permissions for `news` and `site_alerts`.

### 1.2 Go Domain Models
- [ ] Create `backend/internal/models/news_category.go`
- [ ] Create `backend/internal/models/news_article.go`
- [ ] Create `backend/internal/models/site_alert.go`
- [ ] Update `backend/internal/config/config.go` (`MigrateModels` auto-migrate list)

### 1.3 Handlers, Services & Routes
- [ ] Create `backend/internal/handlers/news_category_handler.go`
- [ ] Create `backend/internal/handlers/news_article_handler.go`
- [ ] Create `backend/internal/handlers/site_alert_handler.go`
- [ ] Register Admin & Public routes in `backend/internal/routes/routes.go`:
  - Public:
    - `GET /api/v1/public/news`
    - `GET /api/v1/public/news/:slug`
    - `GET /api/v1/public/news/categories`
    - `GET /api/v1/public/alerts`
  - Admin:
    - `GET /api/v1/admin/news`, `POST /api/v1/admin/news`, `GET/PUT/DELETE /api/v1/admin/news/:id`
    - `GET /api/v1/admin/news-categories`, `POST /api/v1/admin/news-categories`, `PUT/DELETE /api/v1/admin/news-categories/:id`
    - `GET /api/v1/admin/site-alerts`, `POST /api/v1/admin/site-alerts`, `GET/PUT/DELETE /api/v1/admin/site-alerts/:id`
- [ ] Update `backend/docs/openapi.yaml` with all new endpoints, request bodies, and response schemas.

---

## Phase 2: Frontend Types, Services & Global Reusable Primitives

### 2.1 TypeScript Definitions & API Services
- [ ] Create `frontend/src/types/news.ts` (`NewsArticle`, `NewsCategory`, DTOs, query filters)
- [ ] Create `frontend/src/types/alert.ts` (`SiteAlert`, severity types, DTOs)
- [ ] Create `frontend/src/services/newsService.ts` (`createAdminService<NewsArticle>('/news')`, category service, public news fetchers)
- [ ] Create `frontend/src/services/alertService.ts` (`createAdminService<SiteAlert>('/site-alerts')`, public alerts fetcher)

### 2.2 Global Reusable Components & Hooks
- [ ] Create `frontend/src/hooks/useDismissibleAlert.ts` (LocalStorage-backed dismissal tracking with version/timestamp safety)
- [ ] Create `frontend/src/components/public/SiteAlertBanner.tsx` & `SiteAlertModal.tsx` (Apothecary register style, 0px radius, hairline borders, accessibility)
- [ ] Create `frontend/src/components/public/ShareButtons.tsx` (Web Share API + Facebook, LINE, X, WhatsApp, Copy to Clipboard)
- [ ] Create `frontend/src/components/public/ArticleCard.tsx` (Structured apothecary register row/card)

### 2.3 Localization Files (Zero Hardcoding)
- [ ] Update `src/messages/th.json`, `src/messages/en.json`, `src/messages/de.json` with keys for `news`, `alerts`, `share`, `common`
- [ ] Update `src/messages/admin/th.json`, `src/messages/admin/en.json`, `src/messages/admin/de.json` with keys for news management, categories, alerts, form validation

---

## Phase 3: Public Website Implementation

### 3.1 Layout & Global Banners
- [ ] Integrate `SiteAlertBanner` into `src/app/[locale]/(client)/layout.tsx`
- [ ] Connect TanStack Query to fetch active alerts with automatic polling/revalidation

### 3.2 Public News Pages
- [ ] Create `src/app/[locale]/(client)/news/page.tsx`:
  - Hero featured article
  - Category filter tabs
  - Search bar
  - Paginated list of `ArticleCard` items
- [ ] Create `src/app/[locale]/(client)/news/[slug]/page.tsx`:
  - Breadcrumbs & metadata (Berlin timezone date, category, reading time)
  - Cover photo with taupe caption
  - RichText content rendering
  - Gallery grid
  - `ShareButtons`
  - Related articles section
- [ ] Update `src/app/[locale]/(client)/page.tsx` (Homepage):
  - Add "Latest News & Stories" section (3 latest published articles)

---

## Phase 4: Admin Panel Implementation

### 4.1 Admin Navigation & Permissions
- [ ] Update `src/components/admin/AdminSidebar.tsx` to include "ข่าวและประกาศ" (News & Announcements)
- [ ] Ensure `PermissionGuard` and `usePermission` guard routes and actions with `news` and `site_alerts`

### 4.2 News Management Pages
- [ ] Create `src/app/[locale]/admin/news/page.tsx` (DataTable with search, category/status filters, quick feature toggle, pagination)
- [ ] Create `src/app/[locale]/admin/news/[id]/page.tsx` (Single dynamic route for Create/Edit, React Hook Form, `MultiLangInput`, `RichTextEditor`, `ImageUpload` deferred upload)
- [ ] Create `src/app/[locale]/admin/news/categories/page.tsx` (or drawer modal for category CRUD)

### 4.3 Site Alerts Management Pages
- [ ] Create `src/app/[locale]/admin/alerts/page.tsx` (DataTable for alerts, severity badges, active toggle)
- [ ] Create `src/app/[locale]/admin/alerts/[id]/page.tsx` (Single dynamic route for Create/Edit alerts with date-time ranges and link pickers)

---

## Phase 5: Verification & Testing

- [ ] Run backend tests and vet: `cd backend && go vet ./... && go test ./...`
- [ ] Run frontend lint & typecheck: `npm run lint && ./node_modules/.bin/tsc --noEmit`
- [ ] Run frontend build: `npm run build`
- [ ] Verify multi-language integrity across TH, EN, DE in public and admin views.
- [ ] Verify zero `any` usage in new TypeScript files.
