# Public Content Admin FE/BE Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship four direct admin pages that edit the exact public About, Contact, Privacy, and Impressum data through dedicated backend APIs, without Website CMS controls or duplicate Settings data.

**Architecture:** Reuse the existing `content_pages` rows as storage, but place a dedicated service/handler contract over the four fixed page keys. A save publishes immediately in the same transaction, so the public and admin clients use one persisted source of truth. The frontend owns form state with React Hook Form; TanStack Query owns API data; no CMS records enter Zustand.

**Tech Stack:** Next.js/React, TypeScript, React Hook Form, Zod, TanStack Query, Go/Fiber, GORM, PostgreSQL.

## Global Constraints

- Do not create or run automated tests, per request.
- Do not add a page builder, page creation, generic section controls, draft/publish UI, raw JSON editing, or editable route identifiers.
- Thai is required for visitor-visible text; English and German are optional and visibly marked incomplete when empty.
- Saving any of the four forms makes the change public immediately.
- Preserve unrelated worktree changes; do not alter the current admin list-page edits.

---

## Task 1: Define the fixed public-content contract and migration mapping

**Files:**
- Create: `backend/internal/publiccontent/contracts.go`
- Create: `backend/internal/publiccontent/mapper.go`
- Modify: `backend/internal/models/content.go`
- Modify: `backend/internal/richtext/validation.go:159-196`

**Interfaces:**
- Produces four request/response DTOs: `AboutContent`, `ContactContent`, `PrivacyContent`, and `ImpressumContent`.
- Consumes fixed content-page keys and maps them to/from `models.ContentPage` without exposing `PageKey`, `Slug`, `Status`, `Sections`, or published-field internals.

- [ ] **Step 1: Define localized reusable DTOs**

  In `contracts.go`, define localized text and localized rich-text fields plus the nested form shapes below. Give every `body` field an explicit JSON name so API and frontend agree on one payload.

  ```go
  type PrivacyContent struct {
      Title models.MultiLangText `json:"title"`
      SEO models.JSONMap `json:"seo"`
      Body struct {
          Content models.LocalizedRichText `json:"content"`
          LastUpdated time.Time `json:"last_updated"`
      } `json:"body"`
  }
  ```

  Define About fields for `intro`, `objective`, `administration`, `history`, `buildings`, and `sangha`; Contact fields for visitor-visible contact details, opening hours, transport, map, social, bank, form visibility, success copy, and privacy link; and Impressum fields specified in the design document. Do not add a delivery-recipient field to any DTO: the email recipient remains the server-only `CONTACT_EMAIL` configuration.

- [ ] **Step 2: Implement mapping and validation boundaries**

  In `mapper.go`, implement `AboutFromPage`, `ApplyAbout`, `ContactFromPage`, `ApplyContact`, `PrivacyFromPage`, `ApplyPrivacy`, `ImpressumFromPage`, and `ApplyImpressum`. Mappers must normalize missing optional locale values to empty strings/empty rich-text documents, preserve unknown legacy data until migration completes, and never return database-only columns to handlers.

- [ ] **Step 3: Accept the simplified Privacy rich-text shape**

  Extend `ValidateContentPageBody` so `PAGE-PRIVACY` validates `body.content` as localized Tiptap JSON. Continue accepting legacy `body.sections[*].content` only for reads/migrations; new writes use `body.content` exclusively.

- [ ] **Step 4: Commit the contract boundary**

  ```bash
  git add backend/internal/publiccontent backend/internal/models/content.go backend/internal/richtext/validation.go
  git commit -m "feat: define public content contracts"
  ```

## Task 2: Build a backend service that saves fixed pages as immediately published content

**Files:**
- Create: `backend/internal/services/public_content_service.go`
- Modify: `backend/internal/services/content_service.go`
- Modify: `backend/cmd/seed/main.go:239-251`
- Create: `backend/migrations/<next>_migrate_public_content.up.sql`
- Create: `backend/migrations/<next>_migrate_public_content.down.sql`

**Interfaces:**
- Consumes: `publiccontent` DTOs and `ContentPage` records identified only by `PAGE-ABOUT`, `PAGE-CONTACT`, `PAGE-PRIVACY`, `PAGE-IMPRESSUM`.
- Produces: `GetAbout/GetContact/GetPrivacy/GetImpressum` plus matching `Save…` service methods.

- [ ] **Step 1: Implement fixed-key read methods**

  Add a `PublicContentService` that loads one `ContentPage` by its fixed key and calls the appropriate `…FromPage` mapper. Return a typed not-found error when a seeded record is absent; do not fall back to mock JSON.

- [ ] **Step 2: Implement atomic immediate-save methods**

  Each `Save…` method must run in a GORM transaction: load by fixed key, apply the validated DTO to `Title`, `Description`, `SEO`, and `Body`, copy the same values into `PublishedTitle`, `PublishedDescription`, `PublishedSEO`, and `PublishedBody`, set `Status` to `published`, and set `PublishedAt` to `time.Now()`.

  For Privacy, override `body.last_updated` with the server time/date; never accept a user-provided value. For Contact, store all visitor-visible contact data in the `PAGE-CONTACT` body and stop reading it from separate Settings keys. The contact form delivery handler continues to resolve its recipient only from server configuration and must not receive a recipient value from this service or its public response.

- [ ] **Step 3: Make seed/migration idempotent**

  Create a versioned, idempotent migration under `backend/migrations/` and wire it into the project’s deployment migration process; do not rely on `backend/cmd/seed/main.go` because existing production databases may never run the seed command. The migration must:

  - transforms the Privacy `sections` array into one localized rich-text document when `body.content` is missing;
  - maps legacy About body fields into the dedicated nested body;
  - copies current contact/global-site-settings values into `PAGE-CONTACT.body` only when the destination fields are empty;
  - maps existing Impressum values and fills missing legal fields with empty values, never fabricated legal facts.

  Keep the existing seed methods only for fresh local databases. Existing edited production values always win over defaults. Retain the old settings rows and legacy privacy shape for one release as rollback inputs; do not delete data in this migration.

- [ ] **Step 4: Commit backend persistence work**

  ```bash
  git add backend/internal/services/public_content_service.go backend/internal/services/content_service.go backend/cmd/seed/main.go backend/migrations
  git commit -m "feat: persist public content as live pages"
  ```

## Task 3: Expose dedicated admin/public API endpoints and audit saves

**Files:**
- Create: `backend/internal/handlers/public_content_handler.go`
- Modify: `backend/internal/routes/routes.go:61,174-179`
- Modify: `backend/internal/services/audit_service.go`

**Interfaces:**
- Admin: `GET|PUT /api/v1/admin/{about,contact,privacy,impressum}` guarded by `website:read` / `website:update`.
- Public: `GET /api/v1/public/{about,contact,privacy,impressum}` returns only the live DTO.

- [ ] **Step 1: Create typed handlers**

  Add one handler pair per resource. `GET` calls the typed service method and returns `utils.SuccessResponse`. `PUT` parses only the matching DTO, rejects malformed payloads with `400`, maps service not-found to `404`, maps rich-text/URL validation errors to `400`, and returns the saved DTO.

- [ ] **Step 2: Audit each write**

  After a successful save, call the existing audit service with action `update`, resource `public_content`, the fixed page key, and metadata containing the resource name. Do not log form body content or contact/bank values.

- [ ] **Step 3: Register routes**

  Register the eight routes before the generic `:pageKey` CMS route so fixed route names cannot be interpreted as page keys. Retain generic public `/pages/:slug` only for compatibility until the client cutover is complete; do not add new frontend callers to it.

- [ ] **Step 4: Commit the HTTP contract**

  ```bash
  git add backend/internal/handlers/public_content_handler.go backend/internal/routes/routes.go backend/internal/services/audit_service.go
  git commit -m "feat: add public content api"
  ```

## Task 4: Create typed frontend data contracts and service hooks

**Files:**
- Create: `frontend/src/types/public-content.ts`
- Create: `frontend/src/schemas/public-content.schema.ts`
- Create: `frontend/src/services/publicContentService.ts`
- Create: `frontend/src/hooks/public-content.ts`
- Modify: `frontend/src/services/siteSettingsService.ts`
- Modify: `frontend/src/types/site-settings.ts`

**Interfaces:**
- `publicContentAdminService.getAbout/updateAbout`, `getContact/updateContact`, `getPrivacy/updatePrivacy`, `getImpressum/updateImpressum`.
- Equivalent read-only public service methods use `/public/{resource}`.

- [ ] **Step 1: Mirror the backend DTOs in TypeScript and Zod**

  Define explicit `AboutContentFormData`, `ContactContentFormData`, `PrivacyContentFormData`, and `ImpressumContentFormData`. Use localized text/rich-text schemas and URL/email validation; model Contact's public-transport and building lists as typed repeatable arrays. Do not model arbitrary sections, page keys, slugs, statuses, or JSON maps.

- [ ] **Step 2: Implement one source-switched service boundary**

  Make `publicContentService.ts` the only place that reads admin/public endpoints. During migration, it may normalize legacy mock data to the new DTO shape, but components must see the same DTO regardless of source. Remove contact data reads/writes from `siteSettingsService` after the public Contact service is adopted.

- [ ] **Step 3: Add focused TanStack Query hooks**

  Add `useAboutContentQuery`, `useUpdateAboutContentMutation`, and matching pairs for Contact, Privacy, and Impressum. On a successful save, replace that query’s cached DTO with the response; no Zustand server state and no generic CMS cache invalidation.

- [ ] **Step 4: Commit the frontend contract**

  ```bash
  git add frontend/src/types/public-content.ts frontend/src/schemas/public-content.schema.ts frontend/src/services/publicContentService.ts frontend/src/hooks/public-content.ts frontend/src/services/siteSettingsService.ts frontend/src/types/site-settings.ts
  git commit -m "feat: add public content client contract"
  ```

## Task 5: Build the four direct admin forms and direct navigation

**Files:**
- Create: `frontend/src/app/[locale]/admin/about/page.tsx`
- Create: `frontend/src/app/[locale]/admin/contact/page.tsx`
- Create: `frontend/src/app/[locale]/admin/privacy/page.tsx`
- Create: `frontend/src/app/[locale]/admin/impressum/page.tsx`
- Create: `frontend/src/components/admin/public-content/` with `AboutContentForm.tsx`, `ContactContentForm.tsx`, `PrivacyContentForm.tsx`, `ImpressumContentForm.tsx`, `LocalizedFieldGroup.tsx`, and `PublicContentSaveBar.tsx`
- Modify: `frontend/src/components/admin/AdminSidebar.tsx:27-97`
- Modify: `frontend/src/app/[locale]/admin/website/layout.tsx`

**Interfaces:**
- Each route fetches one typed DTO, initializes a React Hook Form with its Zod resolver, and saves through its matching mutation.
- `PublicContentSaveBar` consumes `isDirty`, mutation state, `updatedAt`, and public URL; it does not know page-specific field names.

- [ ] **Step 1: Add a grouped sidebar surface**

  Replace the Website CMS sidebar entry with a **ข้อมูลเว็บไซต์** group containing About, Contact, Privacy, and Impressum. Retain permission filtering with the existing `website` resource. Remove the standalone `/admin/website` navigation entry; retain the route temporarily only for redirects during rollout.

- [ ] **Step 2: Build common form behavior**

  `LocalizedFieldGroup` renders TH/EN/DE tabs, requires Thai where the schema requires it, and displays translation completeness without blocking optional locales. `PublicContentSaveBar` displays unsaved changes, saves the whole document once, shows mutation error/success feedback, displays server `updated_at`, and links to the matching public route.

- [ ] **Step 3: Build About and Contact forms**

  Build About as six named panels matching the DTO; use repeatable field arrays only for buildings. Build Contact as Contact details, Opening & location, Travel, Social, Donation, and Contact form panels; use a field array only for public transport. The Contact form panel exposes only public behavior/copy and never an email recipient. Use Media Library selection for image/OG-image fields rather than free-form asset URLs where the current media picker supports it.

- [ ] **Step 4: Build Privacy and Impressum forms**

  Privacy has one localized rich-text editor and a read-only last-updated label—no item array, visibility toggles, or ordering UI. Impressum has Organization, Contact, Registry & tax, and Responsible content panels. Legal IDs are optional; their labels explain that the operator must supply legally correct information.

- [ ] **Step 5: Retire Website CMS entry points from active navigation**

  Convert `/admin/website`, `/admin/website/about`, `/admin/website/contact`, `/admin/website/privacy`, and `/admin/website/impressum` into redirects to their new direct routes. Do not delete the generic CMS implementation in this task; keep it unreachable until the public cutover is complete.

- [ ] **Step 6: Commit admin UX**

  ```bash
  git add frontend/src/app/'[locale]'/admin frontend/src/components/admin/AdminSidebar.tsx frontend/src/components/admin/public-content
  git commit -m "feat: add direct public content admin pages"
  ```

## Task 6: Cut public client pages over to the dedicated live content API

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/about/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/about/AboutContent.tsx`
- Modify: `frontend/src/app/[locale]/(client)/contact/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/contact/ContactContent.tsx`
- Modify: `frontend/src/app/[locale]/(client)/privacy/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/impressum/page.tsx`
- Modify: `frontend/src/components/public/website/PublicAboutPageLayout.tsx`
- Modify: `frontend/src/components/public/website/PublicContactPageLayout.tsx`

**Interfaces:**
- Consumes the read-only DTOs from `publicContentPublicService`; components receive typed page-specific content rather than `ContentPage`, generic sections, or `GlobalContactSettings`.

- [ ] **Step 1: Replace generic page/settings fetches**

  Update each client route to request its dedicated public endpoint and pass the typed response to its page component. Remove `siteSettingsPublicService.getContactSettings`, generic `websiteCmsPublicService.getPage`, and mock fallback imports from these four routes. The contact email submission request remains unchanged and its backend delivery handler reads `CONTACT_EMAIL` from server configuration.

- [ ] **Step 2: Render the direct data shapes**

  Update About and Contact layouts to consume their named fields directly. Keep monks supplied by the existing Monk data flow. Render Privacy from the single localized rich-text document; read legacy `sections` only as a one-release fallback. Render Impressum legal fields only when populated.

- [ ] **Step 3: Remove duplicated contact sources**

  Once Contact is served by its dedicated DTO, remove public-client reads of `GlobalContactSettings` for contact-page values and any generic Settings UI fields that edit contact/social/donation data. Keep unrelated system settings untouched.

- [ ] **Step 4: Commit public cutover**

  ```bash
  git add frontend/src/app/'[locale]'/'(client)' frontend/src/components/public/website frontend/src/services/siteSettingsService.ts
  git commit -m "refactor: render public pages from dedicated content api"
  ```

## Task 7: Remove inactive CMS-only UI and constrain Settings

**Files:**
- Modify: `frontend/src/app/[locale]/admin/settings/page.tsx`
- Modify: `backend/cmd/seed/main.go:171-191`
- Modify: `backend/internal/handlers/settings_handler.go`
- Modify: `backend/internal/services/settings_service.go`
- Delete after cutover: legacy imports/components under `frontend/src/app/[locale]/admin/website/` and `frontend/src/components/admin/website/` used solely by the retired generic CMS

**Interfaces:**
- Generic Settings exposes only explicitly supported system configuration categories.
- Public content APIs are the sole owner of public About/Contact/Privacy/Impressum data.

- [ ] **Step 1: Whitelist true system settings**

  Hide the Settings sidebar item and redirect `/admin/settings` to `/admin` in this release. Do not expose the generic editable key-value list. Retain the backend Settings endpoints and database rows for rollback; a future system-settings screen requires a separate approved specification with explicit fields.

- [ ] **Step 2: Retire public-content setting keys safely**

  Stop seeding new `contact`, `social`, and `donation` keys. Retain existing database rows for rollback, but exclude them from Settings responses and writes once the migration marker confirms `PAGE-CONTACT.body` is populated.

- [ ] **Step 3: Delete only unreachable generic CMS code**

  Use repository references to identify components and services used exclusively by the retired `/admin/website` surface. Delete them only after direct admin and public routes no longer import them. Preserve shared rich-text, media, localization, and permission components.

- [ ] **Step 4: Commit retirement work**

  ```bash
  git add frontend/src/app/'[locale]'/admin/settings/page.tsx frontend/src/app/'[locale]'/admin/website backend/cmd/seed/main.go backend/internal/handlers/settings_handler.go backend/internal/services/settings_service.go frontend/src/components/admin/website
  git commit -m "refactor: retire website cms settings paths"
  ```

## Plan review

- Covers backend storage, mappings, validation, migration, dedicated API, audit logs, frontend DTOs/services/hooks, direct admin pages/navigation, public rendering, and retirement of duplicate Settings/CMS paths.
- Uses `content_pages` rather than adding a second public-content database table; this preserves existing records and lowers migration risk.
- Excludes all automated test creation and test commands as requested.
