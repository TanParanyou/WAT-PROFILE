# Admin Token Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh an expired Admin access token after a protected API request returns 401 and expose donation filter-options failures in the Admin UI.

**Architecture:** `adminApi` will accept a forced-refresh path used only after a protected request has already returned 401. It will keep the existing shared refresh promise, so simultaneous expired requests perform one cookie-based refresh and replay with the new token. The Donations page will retain its query data boundary but render a visible message when its filter-options query fails.

**Tech Stack:** Next.js 16, React 19, TypeScript, Axios, TanStack Query, node:test.

## Global Constraints

- Keep Admin access tokens in memory only and refresh credentials in the existing HttpOnly cookie flow.
- Do not use TypeScript `any`, `as any`, or `@ts-ignore`.
- Preserve existing 403 and refresh-failure behavior.
- Do not modify public or member authentication clients.
- Keep the UI functional when filter metadata is unavailable.

---

### Task 1: Force refresh after protected Admin 401 responses

**Files:**
- Modify: `frontend/src/services/adminApi.ts:45-84`
- Test: `frontend/src/services/adminApi.test.ts:65-103`

**Interfaces:**
- Consumes: `getAdminAccessToken(): string | null`, `setAdminAccessToken(token: string | null): void`, and `POST /auth/admin/refresh`.
- Produces: `ensureAdminAccessToken(forceRefresh?: boolean): Promise<string>`; `forceRefresh=true` always obtains a new token through the Admin refresh endpoint.

- [x] **Step 1: Write the failing regression test**

Add a test that starts with `setAdminAccessToken("expired-token")`, returns 401 on the first `GET /admin/events`, returns `{ access_token: "refreshed-token" }` from `POST /auth/admin/refresh`, and returns 200 for the replayed request. Assert one refresh, two protected requests, and `getAdminAccessToken() === "refreshed-token"`.

- [x] **Step 2: Run the regression test to verify it fails**

Run: `cd frontend && npx tsx --test src/services/adminApi.test.ts`

Expected: the stale-token case fails because the interceptor retries using `expired-token` instead of requesting a refresh.

- [x] **Step 3: Implement forced refresh**

Update `ensureAdminAccessToken`:

```ts
function ensureAdminAccessToken(forceRefresh = false): Promise<string> {
  const current = getAdminAccessToken();
  if (!forceRefresh && current) return Promise.resolve(current);
  // retain the existing refreshPromise creation and cleanup
}
```

In the 401 response interceptor, call `ensureAdminAccessToken(true)` before replaying the original request.

- [x] **Step 4: Run the service test to verify it passes**

Run: `cd frontend && npx tsx --test src/services/adminApi.test.ts`

Expected: all Admin API authentication tests pass, including the new stale-token case.

- [x] **Step 5: Commit**

```bash
git add frontend/src/services/adminApi.ts frontend/src/services/adminApi.test.ts
git commit -m "fix: refresh expired admin access tokens"
```

### Task 2: Show donation filter-options query failures

**Files:**
- Modify: `frontend/src/app/[locale]/admin/donations/page.tsx:79-82,320-360`

**Interfaces:**
- Consumes: `useQuery` result fields `isError` and `error` for query key `["admin", "donations", "filter-options"]`.
- Produces: a visible inline error state near donation filters without changing list data or form state.

- [x] **Step 1: Add the error-state rendering and translations**

Destructure `isError` from the existing filter-options `useQuery` call. Add `donations.filterOptionsError` to the Admin message files with these values:

```json
// th: "ไม่สามารถโหลดตัวเลือกตัวกรองได้ กรุณาลองใหม่อีกครั้ง"
// en: "Filter options could not be loaded. Please try again."
// de: "Filteroptionen konnten nicht geladen werden. Bitte versuchen Sie es erneut."
```

Above `AdminListToolbar`, render a compact `role="alert"` message when `isError` is true using `t("donations.filterOptionsError")`.

- [x] **Step 2: Keep the fallback values safe**

Leave `filterOptions?.categories || []` and `filterOptions?.payment_methods || []` in place so the page remains operable, while the alert explains that metadata could not load.

- [x] **Step 3: Run static checks**

Run: `cd frontend && npx eslint src/services/adminApi.ts src/services/adminApi.test.ts 'src/app/[locale]/admin/donations/page.tsx' && ./node_modules/.bin/tsc --noEmit`

Expected: targeted lint and strict TypeScript checks exit with code 0. The repository-wide lint command remains blocked by pre-existing errors in unrelated files.

- [x] **Step 4: Commit**

```bash
git add frontend/src/app/[locale]/admin/donations/page.tsx frontend/src/messages/admin/th.json frontend/src/messages/admin/en.json frontend/src/messages/admin/de.json
git commit -m "fix: expose donation filter metadata failures"
```

### Task 3: Verify the original failure path

**Files:**
- Verify only: `frontend/src/services/adminApi.ts`, `frontend/src/services/adminApi.test.ts`, `frontend/src/app/[locale]/admin/donations/page.tsx`

**Interfaces:**
- Consumes: the completed forced-refresh implementation and donation page error state.
- Produces: fresh evidence that the stale-token flow and frontend static checks pass.

- [x] **Step 1: Run focused authentication tests**

Run: `cd frontend && npx tsx --test src/services/adminApi.test.ts`

Expected: the test command exits 0 and reports the stale-token regression as passing.

- [x] **Step 2: Run frontend verification**

Run: `cd frontend && npx eslint src/services/adminApi.ts src/services/adminApi.test.ts 'src/app/[locale]/admin/donations/page.tsx' && ./node_modules/.bin/tsc --noEmit`

Expected: both targeted checks exit 0. The repository-wide lint command remains blocked by pre-existing errors in unrelated files.

- [x] **Step 3: Review final diff**

Run: `git -c core.fsmonitor=false diff --check HEAD~2..HEAD` and inspect changed files to confirm only the planned authentication, test, and donation error-state changes are included.
