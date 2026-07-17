# Admin Data Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the remaining mock-only admin data paths and make the Website CMS editor's supported actions match the backend API.

**Architecture:** Keep `ContentPage` and `ContentSection` as the sole Website CMS contract. The generic editor at `/admin/website/pages/[id]` becomes the only editable route for all CMS pages; legacy Home and Contact editors no longer own separate LocalStorage data. The backend exposes every mutation already offered by the generic frontend and returns the updated page after a reorder so React Query can replace its cache correctly.

**Tech Stack:** Next.js/React, TanStack Query, TypeScript, Go/Fiber, GORM, PostgreSQL.

## Global Constraints

- Do not add or run automated tests for this work, per request.
- Preserve all current user worktree changes; this plan touches none of the currently modified admin-list files.
- Admin authentication must be opt-in for bypass only: production/default behavior requires a valid API session.
- Do not retain LocalStorage or JSON mock data as a fallback for editable admin CMS content.
- Keep endpoint response envelopes compatible with `ApiResponse<T>`.

---

## Files and responsibilities

- `frontend/src/context/AuthContext.tsx` — resolves the current user only through `authService` unless an explicitly enabled development bypass is present.
- `frontend/.env.example` — documents the required production-safe values.
- `frontend/src/components/admin/website/WebsitePagesList.tsx` — links every CMS list item to the generic page editor by `page_key`.
- `frontend/src/app/[locale]/admin/website/home/page.tsx` and `contact/page.tsx` — redirect legacy entry points to `/admin/website/pages/PAGE-HOME` and `/admin/website/pages/PAGE-CONTACT`.
- `frontend/src/hooks/website-page-master.ts` — removes Home/Contact LocalStorage hooks once no route imports them; retains API-backed About, Privacy, and Impressum hooks.
- `frontend/src/components/admin/website/home/` and `frontend/src/components/admin/website/contact/` — remove now-unreachable legacy form editors after imports are gone.
- `frontend/src/services/websiteCmsService.ts` — remains the client contract for section create/reorder/archive/restore/duplicate and must receive payloads matching the backend.
- `backend/internal/handlers/content_handler.go` — parses the section mutation requests, returns consistent validation errors, and creates audit records.
- `backend/internal/services/content_service.go` — creates, archives/restores, duplicates, and reorders sections transactionally; seeds `PAGE-HOME`.
- `backend/internal/routes/routes.go` — registers all CMS mutation endpoints used by the frontend.

## Task 1: Make authentication production-safe by default

**Files:**
- Modify: `frontend/src/context/AuthContext.tsx:24-111`
- Modify: `frontend/.env.example:1-8`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SKIP_ADMIN_AUTH`.
- Produces: `skipAdminAuth === true` only when the variable is exactly `"true"`; absent/invalid values use `/auth/me` and the admin guard.

- [ ] **Step 1: Change bypass parsing to explicit opt-in**

  Replace `process.env.NEXT_PUBLIC_SKIP_ADMIN_AUTH !== "false"` with `process.env.NEXT_PUBLIC_SKIP_ADMIN_AUTH === "true"`. Keep the existing mock user only within the explicit bypass branches so it cannot authenticate a default deployment.

- [ ] **Step 2: Document the deployment values**

  Keep `NEXT_PUBLIC_SKIP_ADMIN_AUTH="false"` in `frontend/.env.example`; add `NEXT_PUBLIC_WEBSITE_CMS_SOURCE="api"` with a comment that both values are required for real admin data. Do not copy secrets into this file.

- [ ] **Step 3: Commit the isolated auth change**

  ```bash
  git add frontend/src/context/AuthContext.tsx frontend/.env.example
  git commit -m "fix: require explicit admin auth bypass"
  ```

## Task 2: Route Website CMS editing through the API-backed generic editor

**Files:**
- Modify: `frontend/src/components/admin/website/WebsitePagesList.tsx:43-67`
- Modify: `frontend/src/app/[locale]/admin/website/home/page.tsx:1-5`
- Modify: `frontend/src/app/[locale]/admin/website/contact/page.tsx:1-5`
- Delete: `frontend/src/hooks/website-page-master.ts:1-317` only after extracting/re-homing any About, Privacy, and Impressum hooks still used by active pages
- Delete: `frontend/src/components/admin/website/home/`
- Delete: `frontend/src/components/admin/website/contact/`

**Interfaces:**
- Consumes: `ContentPage.page_key`, `useWebsitePageQuery(pageKey)`, and `/admin/website/pages/:pageKey`.
- Produces: all CMS edits use `WebsitePageEditorShell`, `websiteCmsAdminService`, and server-backed `ContentPage` / `ContentSection` data.

- [ ] **Step 1: Correct the page-list destination**

  In `WebsitePagesList`, replace the slug route with:

  ```tsx
  href={`/admin/website/pages/${page.page_key}`}
  ```

  This preserves a stable server lookup key and avoids sending `PAGE-HOME` and `PAGE-CONTACT` into their legacy mock editors.

- [ ] **Step 2: Preserve old bookmarks with redirects**

  Convert `home/page.tsx` and `contact/page.tsx` into small server route components using `redirect` from `next/navigation`:

  ```tsx
  redirect("/admin/website/pages/PAGE-HOME");
  ```

  and

  ```tsx
  redirect("/admin/website/pages/PAGE-CONTACT");
  ```

  Keep locale handling consistent with the existing locale route structure; use the active route params if `redirect` requires the locale prefix in this project.

- [ ] **Step 3: Remove the LocalStorage implementation only after active consumers are moved**

  Move API-backed hooks for About, Privacy, and Impressum from `website-page-master.ts` into `frontend/src/hooks/website-cms.ts` (or a focused `website-page-special-pages.ts`) using `useWebsitePageQuery("PAGE-…")` and `useUpdateWebsitePageMutation("PAGE-…")`. Update their imports. Then delete `defaultMockData`, `defaultContactMockData`, all `load*/save*MockData` functions, and the Home/Contact mutation hooks.

- [ ] **Step 4: Delete unreachable legacy component trees**

  After `rg "HomePageEditor|ContactPageEditor|useHomePage|useContactPage" frontend/src` returns no application imports, delete the legacy Home/Contact editor folders and their obsolete form-only schema exports. Do not delete the generic `WebsiteContentTab` section editors.

- [ ] **Step 5: Commit the CMS routing/migration change**

  ```bash
  git add frontend/src/components/admin/website/WebsitePagesList.tsx frontend/src/app/[locale]/admin/website frontend/src/hooks frontend/src/components/admin/website frontend/src/schemas/website-page.schema.ts
  git commit -m "refactor: route website admin edits through cms api"
  ```

## Task 3: Complete the Website CMS section mutation API

**Files:**
- Modify: `backend/internal/routes/routes.go:174-179`
- Modify: `backend/internal/handlers/content_handler.go:77-130`
- Modify: `backend/internal/services/content_service.go`

**Interfaces:**
- Consumes the already-shipped frontend calls:

  ```text
  POST /admin/website/pages/:pageId/sections             { section_type }
  PUT  /admin/website/pages/:pageId/sections/reorder     { section_ids: string[] }
  POST /admin/website/sections/:id/archive               { archived: true }
  POST /admin/website/sections/:id/restore               { archived: false }
  POST /admin/website/sections/:id/duplicate             { section_key?: string }
  ```

- Produces: `ApiResponse<ContentSection>` for section create/archive/restore/duplicate and `ApiResponse<ContentPage>` for reorder.

- [ ] **Step 1: Add service methods with page ownership and transactional updates**

  Add `CreateSection(pageID uuid.UUID, sectionType, sectionKey string) (*models.ContentSection, error)`, `SetSectionArchived(id uuid.UUID, archived bool) (*models.ContentSection, error)`, `DuplicateSection(id uuid.UUID, requestedKey string) (*models.ContentSection, error)`, and change `ReorderSections` to return `(*models.ContentPage, error)`.

  `CreateSection` must calculate `sort_order` as the next slot on its page, choose a unique `section_key` when one was not supplied, and initialize title/description/body/settings from the same allowed section template rules the frontend exposes. `DuplicateSection` must create a new UUID, a unique key, draft status, no published fields, and the next sort order. Archive/restore must only change the target section status and return the updated record. Reorder must validate that every submitted section belongs to the requested page, assign consecutive positions in one transaction, preload `Sections`, and return the refreshed page.

- [ ] **Step 2: Add request DTOs and handler methods**

  Define small request structs in `content_handler.go` for `section_type`, optional `section_key`, and `archived`. Reject blank section types, invalid UUIDs, duplicate section IDs, and section IDs belonging to another page with `400`; return `404` when the page or section does not exist. Each successful mutation must call `auditService.LogAction` with `create`, `reorder`, `archive`, `restore`, or `duplicate` and the affected page/section identifiers.

- [ ] **Step 3: Register endpoints and make reorder response compatible**

  Add the five missing route registrations under Website CMS with `website:update` permission. Change `ReorderSections` handler from `MessageResponse` to `SuccessResponse(c, page)` so it matches `websiteCmsAdminService.reorderSections()`'s `ApiResponse<ContentPage>` expectation.

- [ ] **Step 4: Commit the API completion change**

  ```bash
  git add backend/internal/routes/routes.go backend/internal/handlers/content_handler.go backend/internal/services/content_service.go
  git commit -m "feat: complete website cms section mutations"
  ```

## Task 4: Seed and expose `PAGE-HOME` through the shared CMS contract

**Files:**
- Modify: `backend/internal/services/content_service.go:200-460`
- Modify: backend startup call site that invokes `EnsureContactPageSeed`, `EnsureAboutPageSeed`, `EnsurePrivacyPageSeed`, and `EnsureImpressumPageSeed`

**Interfaces:**
- Consumes: `ContentPage` / `ContentSection`, `PAGE-HOME`, and the generic editor template set returned by `getAvailableSectionTemplates("PAGE-HOME")`.
- Produces: an idempotent `EnsureHomePageSeed() error`, which creates a published initial home page and sections when no row exists.

- [ ] **Step 1: Add an idempotent Home seed**

  Implement `EnsureHomePageSeed()` with the same transaction/not-found pattern as the existing page seed methods. Seed `page_key: "PAGE-HOME"`, `slug: "home"`, localized title/description, SEO, initial `hero`, `event_teaser`, and `monk_teaser` sections, then populate the page's published fields and `PublishedAt` together with its published status.

- [ ] **Step 2: Wire it into startup**

  Locate the existing seed invocation sequence and call `EnsureHomePageSeed()` beside the other CMS page seeds. The method must do nothing when a real home row already exists, preserving edited production data.

- [ ] **Step 3: Commit the home data foundation**

  ```bash
  git add backend/internal/services/content_service.go backend/cmd backend/internal
  git commit -m "feat: seed home page for website cms"
  ```

## Plan review

- Coverage: removes the default mock authentication path, removes the editable Home/Contact LocalStorage data path, completes five frontend-declared CMS API mutations, fixes the reorder response mismatch, and guarantees an API-backed Home record exists.
- Deliberately excluded: automated tests and test commands, as requested. Existing unrelated modifications under admin list pages and CMS components are not included.
- Backend contract note: the currently registered backend routes omit section create/archive/restore/duplicate even though `websiteCmsAdminService` calls them; Task 3 closes that concrete disconnect.

