# Admin Panel Full API Connection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the remaining mock services in the Admin Frontend (`eventAdminService`, `websiteCmsAdminService`, `siteSettingsAdminService`) to the actual Backend APIs without affecting the Client-side pages.

**Architecture:** We will modify the Admin-specific services inside the Frontend repository to bypass the env-based mock check and strictly make network requests to the Go API server.

**Tech Stack:** Next.js, Axios, GORM API endpoints.

## Global Constraints
- Do not modify or delete files under `src/data/*.json` as they are still consumed by the public Client pages.
- Ensure type compliance: running `npx tsc --noEmit` must pass without errors.
- Ensure all admin services only contact real `/api/v1/admin/*` endpoints.

---

### Task 1: Connect Event Admin Service to API

**Files:**
- Modify: `frontend/src/services/adminService.ts`

**Interfaces:**
- Consumes: Gofiber Backend `/api/v1/admin/events` routes
- Produces: Fully integrated `eventAdminService` exported functions (`getAll`, `getById`, `create`, `update`, `delete`, `bulkDelete`)

- [ ] **Step 1: Modify `adminService.ts` to unmock events**
  
  Open `frontend/src/services/adminService.ts` and modify it. Remove the `mockEvents` constant array (lines 63-108) and the manual `eventAdminService` object implementation (lines 110-134). Replace it by instantiating `eventAdminService` using the generic `createAdminService` helper.

  Code changes:
  ```typescript
  // Delete mockEvents array and manual eventAdminService
  // Replace with:
  export const eventAdminService = createAdminService<Event>("events");
  ```

- [ ] **Step 2: Verify type compilation**

  Run: `npx tsc --noEmit` in `frontend` directory.
  Expected: Command succeeds with zero errors.

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/src/services/adminService.ts
  git commit -m "feat(admin): connect eventAdminService to Go backend API"
  ```

---

### Task 2: Connect Website CMS Admin Service to API

**Files:**
- Modify: `frontend/src/services/websiteCmsService.ts`

**Interfaces:**
- Consumes: Go Backend `/api/v1/admin/website/pages` and `/api/v1/admin/website/sections` routes
- Produces: Fully integrated `websiteCmsAdminService` methods directly querying backend without mock checks.

- [ ] **Step 1: Modify `websiteCmsService.ts` to remove mock checks in admin functions**

  Open `frontend/src/services/websiteCmsService.ts` and modify the methods of `websiteCmsAdminService` (`listPages`, `getPage`, `updatePageDraft`, `publishPage`, `reorderSections`, `updateSectionDraft`, etc.) to remove `if (useMockWebsiteCms)` branches. Keep `websiteCmsPublicService` untouched.

  Example modification for `listPages`:
  ```typescript
  // OLD:
  async listPages() {
    if (useMockWebsiteCms) {
      return pages.map((page) => normalizePage(clonePage(page)));
    }
    const res = await api.get<ApiResponse<ContentPage[]>>("/admin/website/pages");
    ...
  }

  // NEW:
  async listPages() {
    const res = await api.get<ApiResponse<ContentPage[]>>("/admin/website/pages");
    const payload = unwrapApiResponse(res.data, "Failed to fetch content pages");
    return payload.map(normalizePage);
  }
  ```
  Apply this change to all methods in `websiteCmsAdminService` that check `useMockWebsiteCms`.

- [ ] **Step 2: Verify type compilation**

  Run: `npx tsc --noEmit` in `frontend` directory.
  Expected: Command succeeds with zero errors.

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/src/services/websiteCmsService.ts
  git commit -m "feat(admin): force websiteCmsAdminService to query backend API directly"
  ```

---

### Task 3: Connect Site Settings Admin Service to API

**Files:**
- Modify: `frontend/src/services/siteSettingsService.ts`

**Interfaces:**
- Consumes: Go Backend `/api/v1/admin/website/settings/contact` routes
- Produces: Fully integrated `settingsAdminService` methods directly querying backend.

- [ ] **Step 1: Modify `siteSettingsService.ts` to remove mock checks in admin functions**

  Open `frontend/src/services/siteSettingsService.ts` and modify the methods of `siteSettingsAdminService` (`getContactSettings`, `updateContactSettings`) to remove `if (useMockSiteSettings)` branches. Keep `siteSettingsPublicService` untouched.

  Example modification for `getContactSettings`:
  ```typescript
  // OLD:
  async getContactSettings() {
    if (useMockSiteSettings) {
      return getDefaultContactSettings();
    }
    const res = await api.get<ApiResponse<GlobalContactSettings>>("/admin/website/settings/contact");
    ...
  }

  // NEW:
  async getContactSettings() {
    const res = await api.get<ApiResponse<GlobalContactSettings>>("/admin/website/settings/contact");
    return normalizeContactSettings(unwrapApiResponse(res.data, "Failed to fetch contact settings"));
  }
  ```
  Apply this change to all methods in `siteSettingsAdminService`.

- [ ] **Step 2: Verify type compilation**

  Run: `npx tsc --noEmit` in `frontend` directory.
  Expected: Command succeeds with zero errors.

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/src/services/siteSettingsService.ts
  git commit -m "feat(admin): force siteSettingsAdminService to query backend API directly"
  ```
