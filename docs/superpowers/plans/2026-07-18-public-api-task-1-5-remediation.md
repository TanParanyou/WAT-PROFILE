# Public API Tasks 1–5 Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the remaining public Events, Schedules, and Monks migration work so public API failures, routes, query state, and types match Tasks 1–5.

**Architecture:** The Go backend owns public response semantics, ordering, and optional list limiting. The shared frontend Axios instance remains a host, while domain features own typed endpoints and TanStack Query. Monk detail follows the Event detail split: the server shell handles metadata and confirmed 404s; the client component owns query state and presentation.

**Tech Stack:** Go, Fiber, GORM, Next.js App Router, React 19, TypeScript strict mode, TanStack Query, Axios, next-intl.

## Global Constraints

- Do not use `any`, `unknown as T`, or assertions that conceal an API contract mismatch.
- Do not add automated tests; use the focused lint, source audits, and manual API/browser checks specified below.
- Keep Tasks 6–8 (public content and Home migration) out of scope.
- Do not remove the two Home adapters from `publicService.ts`; Task 7 owns their removal.
- All Events and Monks browser reads use TanStack Query with `shouldRetryPublicQuery` and `staleTime: 60_000`.
- Preserve the existing public image fallback component and date/time formatters.

---

## File Structure

```text
backend/internal/
  handlers/event_handler.go                # validate limit; map not-found vs server failures
  services/event_service.go                # apply deterministic event/schedule ordering and limit
frontend/src/
  services/publicService.ts                 # typed temporary Home adapters plus Axios host
  features/public/events/
    queries.ts                              # explicit 60-second cache policy
    components/EventDetailContent.tsx       # omit absent JSON-LD image field
  features/public/monks/
    mappers.ts                              # safe LocalizedTextDto helper
    queries.ts                              # explicit cache policy and hydration input
    components/MonkDetailContent.tsx        # detail query state boundary
    components/MonkDetailSkeleton.tsx       # detail-shaped loading UI
  app/[locale]/(client)/monks/[slug]/page.tsx # server metadata/404 shell
  messages/{th,en,de}.json                 # monk detail labels
```

### Task 1: Correct the public Events backend contract

**Files:**
- Modify: `backend/internal/handlers/event_handler.go`
- Modify: `backend/internal/services/event_service.go`

**Consumes:** `models.Event`, `models.EventSchedule`, `utils.SuccessResponse`, `utils.ErrorResponse`, and GORM errors.

**Produces:** A public event list that applies a positive `limit`, ordered event schedules, and an event detail endpoint that returns 404 only for missing records.

- [ ] **Step 1: Parse and validate the optional public list limit in the handler**

Add `strconv` to the imports, parse `c.Query("limit")`, and reject non-integer or non-positive values before calling the service:

```go
limit := 0
if rawLimit := c.Query("limit"); rawLimit != "" {
    parsedLimit, err := strconv.Atoi(rawLimit)
    if err != nil || parsedLimit <= 0 {
        return utils.ErrorResponse(c, fiber.StatusBadRequest, "limit must be a positive integer")
    }
    limit = parsedLimit
}

events, err := h.eventService.ListActive(limit)
```

- [ ] **Step 2: Preserve 404 only for a missing Event detail record**

Add `errors` and change `GetEvent` to distinguish `gorm.ErrRecordNotFound` from infrastructure failures:

```go
event, err := h.eventService.GetBySlug(c.Params("slug"))
if err != nil {
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return utils.ErrorResponse(c, fiber.StatusNotFound, "Event not found")
    }
    return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch event")
}
return utils.SuccessResponse(c, event)
```

- [ ] **Step 3: Apply limit and schedule ordering in `EventService`**

Change the list signature to `ListActive(limit int)`. Use one reusable preload closure in both methods so schedules always use `display_order ASC`, and apply `Limit` only when the caller supplied a positive value:

```go
preloadSchedules := func(db *gorm.DB) *gorm.DB {
    return db.Order("display_order ASC")
}

query := s.db.Where("is_active = ?", true).
    Order("start_date DESC").
    Preload("Schedules", preloadSchedules)
if limit > 0 {
    query = query.Limit(limit)
}
err := query.Find(&events).Error
```

Use `Preload("Schedules", preloadSchedules)` in `GetBySlug` too.

- [ ] **Step 4: Manually verify the contract**

Run the backend and inspect these cases:

```bash
curl -i 'http://localhost:8080/api/v1/public/events?limit=1'
curl -i 'http://localhost:8080/api/v1/public/events?limit=invalid'
curl -i 'http://localhost:8080/api/v1/public/events/a-known-slug'
curl -i 'http://localhost:8080/api/v1/public/events/missing-slug'
```

Expected: first response has at most one active item; second is 400; known detail is 200 with schedules ordered by `display_order`; missing detail is 404. Temporarily stopping the database must produce 500, not 404.

- [ ] **Step 5: Commit the backend contract correction**

```bash
git add backend/internal/handlers/event_handler.go backend/internal/services/event_service.go
git commit -m "fix: align public event response semantics"
```

### Task 2: Complete typed public query policy without migrating Home

**Files:**
- Modify: `frontend/src/services/publicService.ts`
- Modify: `frontend/src/features/public/events/queries.ts`
- Modify: `frontend/src/features/public/monks/queries.ts`

**Consumes:** `ApiSuccess`, `PublicEventDto`, `PublicMonkDto`, and `shouldRetryPublicQuery`.

**Produces:** Explicitly typed temporary Home adapters and consistent 60-second cache settings for every Events/Monks query.

- [ ] **Step 1: Keep only the typed temporary Home adapters in `publicService.ts`**

Delete unused endpoint convenience methods (`getEventBySlug`, `getSchedules`, and `getPublicPage`). Type the two remaining Home adapters using the API envelope and owning DTOs:

```ts
import type { ApiSuccess } from "@/features/public/shared/api-types";
import type { PublicEventDto } from "@/features/public/events/types";
import type { PublicMonkDto } from "@/features/public/monks/types";

export const publicService = {
  async getLatestEvents(limit = 3): Promise<ApiSuccess<PublicEventDto[]>> {
    const response = await publicApi.get<ApiSuccess<PublicEventDto[]>>("/events", { params: { limit } });
    return response.data;
  },
  async getMonks(): Promise<ApiSuccess<PublicMonkDto[]>> {
    const response = await publicApi.get<ApiSuccess<PublicMonkDto[]>>("/monks");
    return response.data;
  },
};
```

Do not alter the Home page in this task; Task 7 deletes these transitional adapters.

- [ ] **Step 2: Set the feature-level cache policy explicitly**

Add `staleTime: 60_000` to list and schedules queries, and make Monk queries support the same safe detail hydration contract as Events:

```ts
export function usePublicMonkQuery(slug: string, initialData?: PublicMonkDto) {
  return useQuery({
    queryKey: publicMonksKeys.detail(slug),
    queryFn: () => fetchPublicMonkBySlug(slug),
    enabled: Boolean(slug),
    initialData,
    staleTime: 60_000,
    retry: shouldRetryPublicQuery,
  });
}
```

Apply `staleTime: 60_000` to `usePublicEventsQuery`, `usePublicSchedulesQuery`, and `usePublicMonksQuery`. Add `enabled: Boolean(slug)` to `usePublicEventQuery` for the same invariant.

- [ ] **Step 3: Run focused static checks**

```bash
cd frontend && npm run lint -- src/services/publicService.ts src/features/public/events/queries.ts src/features/public/monks/queries.ts
```

Expected: no ESLint errors and no implicit or explicit unsafe types.

- [ ] **Step 4: Commit the query policy correction**

```bash
git add frontend/src/services/publicService.ts frontend/src/features/public/events/queries.ts frontend/src/features/public/monks/queries.ts
git commit -m "fix: align public query cache policy"
```

### Task 3: Move Monk detail onto the public query state boundary

**Files:**
- Create: `frontend/src/features/public/monks/components/MonkDetailSkeleton.tsx`
- Modify: `frontend/src/features/public/monks/mappers.ts`
- Modify: `frontend/src/features/public/monks/components/MonkDetailContent.tsx`
- Rename: `frontend/src/app/[locale]/(client)/monks/[id]/page.tsx` to `frontend/src/app/[locale]/(client)/monks/[slug]/page.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Consumes:** `usePublicMonkQuery`, `QueryErrorState`, `EmptyState`, `PublicMonkDto`, and the public retry classifier.

**Produces:** Runtime slug detail routing with localized client-side loading, error/retry, empty, and success states.

- [ ] **Step 1: Replace the unsafe monk localization helper with the DTO contract**

Use the shared DTO type and explicit locale selection rather than `unknown` or `Record` assertions:

```ts
import type { LocalizedTextDto } from "../shared/api-types";

export function getLocalizedText(value: LocalizedTextDto | null | undefined, locale: string): string {
  if (!value) return "";
  const requested = locale === "en" ? value.en : locale === "de" ? value.de : value.th;
  return requested || value.th || value.en || value.de;
}
```

- [ ] **Step 2: Add a detail-shaped skeleton**

Create `MonkDetailSkeleton.tsx` with the same `lg:grid-cols-12` layout as the success component: a 3:4 image placeholder, role placeholder, biography heading placeholder, divider, and text rows. It must not use `any` or network state.

- [ ] **Step 3: Make `MonkDetailContent` own query state**

Replace its `monk` prop with `{ slug: string; initialMonk?: PublicMonkDto }`. Call `usePublicMonkQuery(slug, initialMonk)` and return boundaries in this order:

```tsx
if (monkQuery.isLoading) return <MonkDetailSkeleton />;
if (monkQuery.isError) {
  return <QueryErrorState title={tState("errorTitle")} description={tState("errorDescription")} retryLabel={tState("retry")} onRetry={() => monkQuery.refetch()} isRetrying={monkQuery.isFetching} />;
}
if (!monkQuery.data) return <EmptyState title={tState("emptyMonks")} description={tState("emptyContent")} />;
```

Render the existing success layout below this boundary using `const monk = monkQuery.data`. Replace hard-coded `Role`, `Biography`, and empty biography `"-"` with `MonksPage.role`, `MonksPage.biography`, and `PublicState.emptyContent` respectively.

- [ ] **Step 4: Rename the route and reduce it to server concerns**

Move `[id]` to `[slug]`, update params to `Promise<{ slug: string; locale: string }>`, and delete `generateStaticParams`. The server page fetches once to seed `initialMonk`; calls `notFound()` only when `toPublicQueryError(error).kind === "not-found"`; for any other failure it leaves `initialMonk` undefined and renders `<MonkDetailContent slug={slug} initialMonk={initialMonk} />` so the client retry UI owns the failure.

`generateMetadata` keeps its safe fallback metadata. Replace all `id` references in metadata, breadcrumbs, canonical URLs, and route params with `slug`.

- [ ] **Step 5: Add the three localized monk-detail labels**

Add these exact keys under `MonksPage` in TH, EN, and DE:

```json
{
  "role": "Role",
  "biography": "Biography"
}
```

Translate the two values for Thai and German; do not put visitor copy inside the component.

- [ ] **Step 6: Verify Monk detail states manually and with lint**

```bash
cd frontend && npm run lint -- src/features/public/monks 'src/app/[locale]/(client)/monks/[slug]/page.tsx' src/messages/th.json src/messages/en.json src/messages/de.json
```

Verify a valid slug, unknown slug (404), API failure with Retry, absent bio, absent image, and TH/EN/DE routes. Confirm `rg 'generateStaticParams|\[id\]' 'frontend/src/app/[locale]/(client)/monks'` returns no matches.

- [ ] **Step 7: Commit the Monk detail migration**

```bash
git add frontend/src/features/public/monks 'frontend/src/app/[locale]/(client)/monks' frontend/src/messages/{th,en,de}.json
git commit -m "fix: complete public monk detail query state"
```

### Task 4: Harden Event detail structured data and complete the Task 1–5 audit

**Files:**
- Modify: `frontend/src/features/public/events/components/EventDetailContent.tsx`
- Modify only if audit finds a violation: files listed in Tasks 1–3

**Consumes:** `PublicEventDto`, `PublicImage`, typed event queries, and the Task 1–5 constraints.

**Produces:** Valid event JSON-LD without null images and a verified Task 1–5 boundary.

- [ ] **Step 1: Omit absent event images from JSON-LD**

Build the structured-data object with a conditional spread instead of `image: [image]`:

```ts
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: getLocalizedText(event.title, locale),
  startDate: event.start_date,
  endDate: event.end_date,
  location: { "@type": "Place", name: getLocalizedText(event.location, locale) },
  description,
  ...(image ? { image: [image] } : {}),
};
```

- [ ] **Step 2: Run the Task 1–5 source audits**

```bash
rg -n '\bas any\b|unknown as|as Record' frontend/src/features/public frontend/src/services/publicService.ts 'frontend/src/app/[locale]/(client)/events' 'frontend/src/app/[locale]/(client)/monks'
rg -n 'publicService\.(getEventBySlug|getSchedules|getPublicPage)' frontend/src
rg -n 'generateStaticParams|\[id\]' 'frontend/src/app/[locale]/(client)/monks'
```

Expected: all commands return no matches. `publicService.getLatestEvents` and `publicService.getMonks` remain permitted only in the Home route until Task 7.

- [ ] **Step 3: Run final focused lint and whitespace validation**

```bash
cd frontend && npm run lint -- src/features/public src/components/public/states src/services/publicService.ts 'src/app/[locale]/(client)/events' 'src/app/[locale]/(client)/monks'
cd .. && git diff --check
```

Expected: both commands exit successfully.

- [ ] **Step 4: Commit audit corrections**

```bash
git add backend/internal frontend/src/features/public frontend/src/services/publicService.ts 'frontend/src/app/[locale]/(client)/events' 'frontend/src/app/[locale]/(client)/monks' frontend/src/messages/{th,en,de}.json
git commit -m "chore: complete public API tasks one through five"
```

## Plan Self-Review

- Backend API semantics, list limit, and schedule ordering are covered in Task 1.
- Typed temporary Home compatibility and all Events/Monks cache policies are covered in Task 2.
- Monk route, types, state boundaries, and locale copy are covered in Task 3.
- Event JSON-LD and the required audits are covered in Task 4.
- The plan contains no implementation placeholders and intentionally excludes automated tests, Home migration, and public-content migration.
