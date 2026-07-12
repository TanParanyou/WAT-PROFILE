# Admin Panel Full API Connection Design

## 1. Context & Goal
The Admin Panel currently has most endpoints connected to the real Supabase database. However, a few services still rely on mock data:
- `eventAdminService`
- `websiteCmsAdminService`
- `settingsAdminService`

The goal is to connect these specific admin services to the real backend APIs, **without** affecting the public Client-side pages which still rely on the local `src/data/*.json` mock files.

## 2. Architecture & Approach
We will decouple the Admin services from the Mock logic by forcibly routing their requests to the `api` instance, while leaving the Public (Client) services untouched.

### 2.1 Event Admin Service
- **File:** `frontend/src/services/adminService.ts`
- **Changes:**
  - Delete `mockEvents` constant array.
  - Delete the hardcoded `eventAdminService` implementation (which uses `setTimeout` and `mockEvents`).
  - Replace with: `export const eventAdminService = createAdminService<Event>("events");`

### 2.2 Website CMS Admin Service
- **File:** `frontend/src/services/websiteCmsService.ts`
- **Changes:**
  - Locate `websiteCmsAdminService`.
  - Remove the `if (useMockWebsiteCms) { ... }` blocks from all methods in `websiteCmsAdminService` (`listPages`, `getPage`, `updatePageDraft`, `publishPage`, `updateSectionDraft`, etc.).
  - Ensure all these methods strictly await `api.get`, `api.post`, `api.put`, etc.
  - Leave `websiteCmsPublicService` completely untouched so it continues to respect `useMockWebsiteCms`.

### 2.3 Site Settings Admin Service
- **File:** `frontend/src/services/siteSettingsService.ts`
- **Changes:**
  - Locate `settingsAdminService`.
  - Remove the `if (useMockSiteSettings) { ... }` blocks from its methods (`getAll`, `update`, `upsert`).
  - Leave `siteSettingsPublicService` untouched.

## 3. Data Integrity & Impact
- **Client Side:** No impact. `useMockWebsiteCms` and `useMockSiteSettings` will still govern the public services.
- **Admin Side:** Admin will now read and write directly to Supabase. This guarantees that edits made in the CMS or Settings panel are persisted securely and are ready for the Client side to switch over in the future.

## 4. Testing Plan
- Type Check: Run `npx tsc --noEmit` to ensure type compatibility.
- Manual verification: Log into Admin, create/edit an Event, update Site Settings, and edit a Website CMS page. Verify data persists on page reload.
