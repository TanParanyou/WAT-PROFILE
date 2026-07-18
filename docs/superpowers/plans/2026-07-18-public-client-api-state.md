# Public Client API and State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every public visitor page consume typed APIs through TanStack Query and render reliable localized loading, error, and empty states.

**Architecture:** Keep API DTOs, DTO-to-view-model mappers, query hooks, and page-specific presentation components together under `frontend/src/features/public/<domain>`. Server routes retain metadata and `notFound()` decisions; client containers own TanStack Query state. Reuse only small semantic state components and keep independent data sections independent.

**Tech Stack:** Next.js App Router, React 19, TypeScript strict mode, TanStack Query, Axios, next-intl, Go/Fiber public API.

## Global Constraints

- Do not use `any`, `unknown as T`, or assertions that hide an API contract mismatch.
- All browser-side API reads use TanStack Query; no `useEffect` + local state fetches and no direct service calls from components.
- Keep `loading`, `error`, and `empty` boundaries local to the section that owns the request.
- Keep server metadata/JSON-LD/not-found concerns separate from client query state.
- Do not modify Admin navigation or legacy Website CMS behavior.
- Do not add automated tests under the current owner direction; run focused type/lint checks and manually exercise success, loading, error/retry, and empty paths.
- Do not migrate Home until Events, Monks, and public content are complete.

---

## Target File Structure

```text
frontend/src/
  features/public/
    shared/
      api-types.ts
      query-error.ts
    events/
      types.ts
      api.ts
      mappers.ts
      queries.ts
      components/{EventsList,EventsListSkeleton,SchedulesSection,EventDetailContent}.tsx
    monks/
      types.ts
      api.ts
      mappers.ts
      queries.ts
      components/{MonksGrid,MonksGridSkeleton,MonkDetailContent}.tsx
    content/
      types.ts
      queries.ts
      components/PublicContentStateBoundary.tsx
  components/public/states/
    QueryErrorState.tsx
    EmptyState.tsx
```

Existing route components under `frontend/src/app/[locale]/(client)/` become thin server shells or client containers. Existing public API routes are `/api/v1/public/events`, `/events/:slug`, `/schedules`, `/monks`, `/monks/:slug`, and `/about|contact|privacy|impressum`.

### Task 1: Establish typed public API and reusable state primitives

**Files:**
- Create: `frontend/src/features/public/shared/api-types.ts`
- Create: `frontend/src/features/public/shared/query-error.ts`
- Create: `frontend/src/components/public/states/QueryErrorState.tsx`
- Create: `frontend/src/components/public/states/EmptyState.tsx`
- Modify: `frontend/src/services/publicService.ts`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Consumes:** `publicApi` from `frontend/src/services/publicService.ts`; current `QueryProvider` defaults from `frontend/src/components/providers/QueryProvider.tsx`.

**Produces:** Typed response extraction and error classification used by every feature; accessible, localized retry and empty UI.

- [ ] **Step 1: Define the public response envelope and API error classifier**

```ts
// features/public/shared/api-types.ts
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  message?: string;
}

export function unwrapApiData<T>(payload: ApiSuccess<T>): T {
  return payload.data;
}
```

```ts
// features/public/shared/query-error.ts
import axios from "axios";

export type PublicQueryError =
  | { kind: "not-found"; status: 404 }
  | { kind: "transient"; status?: number }
  | { kind: "unexpected"; status?: number };

export function toPublicQueryError(error: unknown): PublicQueryError {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  if (status === 404) return { kind: "not-found", status };
  if (status === undefined || status === 408 || status === 429 || status >= 500) {
    return { kind: "transient", status };
  }
  return { kind: "unexpected", status };
}

export function shouldRetryPublicQuery(failureCount: number, error: unknown): boolean {
  return failureCount < 1 && toPublicQueryError(error).kind === "transient";
}
```

Use `axios.isAxiosError(error)` and inspect `error.response?.status`; never cast `error` to `AxiosError`.

- [ ] **Step 2: Implement shared state components with constrained props**

```ts
export interface QueryErrorStateProps {
  title: string;
  description: string;
  retryLabel: string;
  onRetry: () => void;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}
```

Render `role="alert"` on the error component and disable the retry button while its caller reports fetching. Do not build a generic resource renderer.

- [ ] **Step 3: Add public-state translation copy**

Add `PublicState.loading`, `PublicState.refreshing`, `PublicState.errorTitle`, `PublicState.errorDescription`, `PublicState.retry`, `PublicState.emptyEvents`, `PublicState.emptySchedules`, `PublicState.emptyMonks`, and `PublicState.emptyContent` in TH/EN/DE with equivalent meanings.

- [ ] **Step 4: Make `publicService` typed while retaining it only as the Axios host**

```ts
export const publicApi = axios.create({
  baseURL: `${API_BASE}/api/v1/public`,
  headers: { "Content-Type": "application/json" },
});
```

Remove untyped convenience methods only after their domain replacements are wired. Keep no endpoint-specific types in this shared service.

- [ ] **Step 5: Verify foundations**

Run: `cd frontend && npm run lint -- src/features/public/shared src/components/public/states src/services/publicService.ts`

Expected: no lint errors and no new explicit-`any` diagnostics.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/public/shared frontend/src/components/public/states frontend/src/services/publicService.ts frontend/src/messages/{th,en,de}.json
git commit -m "feat: add typed public query state primitives"
```

### Task 2: Audit and complete public Events/Schedules API contracts

**Files:**
- Modify if fields are missing: `backend/internal/handlers/event_handler.go`
- Modify if fields are missing: `backend/internal/handlers/schedule_handler.go`
- Modify if fields are missing: `backend/internal/services/event_service.go`
- Modify if fields are missing: `backend/internal/services/schedule_service.go`
- Create: `frontend/src/features/public/events/types.ts`

**Consumes:** Models in `backend/internal/models/event.go` and `backend/internal/models/schedule.go`; existing public routes in `backend/internal/routes/routes.go`.

**Produces:** Stable public DTOs that can render the current Events list, event detail, and daily/weekly/online schedule UI without JSON fallback.

- [ ] **Step 1: Compare current JSON fields to public API payloads**

Required event fields are `slug`, localized `title`, localized rich-text `description`, `start_date`, `end_date`, nullable time fields, localized `location`, `image_url`, `map_url`, and ordered event schedules. Required schedule fields are `schedule_type`, `day_of_week`, time range, localized `activity`, localized `location`, `online_link`, and `display_order`.

- [ ] **Step 2: Add an explicit frontend DTO contract**

```ts
export interface PublicEventScheduleDto {
  id: number;
  start_time: string;
  end_time: string;
  activity: LocalizedTextDto;
  display_order: number;
}

export interface PublicEventDto {
  slug: string;
  title: LocalizedTextDto;
  description: LocalizedRichText | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  location: LocalizedTextDto;
  image_url: string | null;
  map_url: string | null;
  schedules: readonly PublicEventScheduleDto[];
}

export interface PublicScheduleDto {
  id: number;
  schedule_type: "daily" | "weekly" | "online";
  day_of_week: number | null;
  time_start: string | null;
  time_end: string | null;
  activity: LocalizedTextDto;
  location: LocalizedTextDto;
  online_link: string | null;
  display_order: number;
}
export interface LocalizedTextDto { th: string; en: string; de: string; }
```

Do not reuse the legacy `Event` interface in `frontend/src/types/common.ts`; it describes the old JSON fixture shape (`date`, `image`, `id`) rather than the API.

- [ ] **Step 3: Make only necessary backend changes**

If `ListActive` omits relations/order or a public-safe field required above, select/preload/order it in the service and return it through the existing `utils.SuccessResponse`. Do not expose admin-only fields such as registration internals unless the existing public UI requires them.

- [ ] **Step 4: Verify contract manually**

Run the backend locally and inspect `GET /api/v1/public/events`, `GET /api/v1/public/events/<known-slug>`, and `GET /api/v1/public/schedules`.

Expected: all required fields are present, active records only are returned, schedule items are display ordered, and a missing slug returns 404.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/handlers backend/internal/services frontend/src/features/public/events/types.ts
git commit -m "feat: align public events API contract"
```

### Task 3: Implement the Events feature data layer and list states

**Files:**
- Create: `frontend/src/features/public/events/api.ts`
- Create: `frontend/src/features/public/events/mappers.ts`
- Create: `frontend/src/features/public/events/queries.ts`
- Create: `frontend/src/features/public/events/components/EventsList.tsx`
- Create: `frontend/src/features/public/events/components/EventsListSkeleton.tsx`
- Create: `frontend/src/features/public/events/components/SchedulesSection.tsx`
- Modify: `frontend/src/app/[locale]/(client)/events/EventsContent.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Consumes:** `ApiSuccess<T>`, `toPublicQueryError`, shared state components, and `PublicEventDto`/`PublicScheduleDto`.

**Produces:** `useEventsQuery()` and `useSchedulesQuery()`; an Events page that no longer imports `src/data/events.json` or `src/data/schedule.json`.

- [ ] **Step 1: Map DTOs to view models**

```ts
export interface EventListItem {
  slug: string;
  title: LocalizedTextDto;
  summary: LocalizedRichText | null;
  startDate: string;
  startTime: string | null;
  location: LocalizedTextDto;
  imageUrl: string | null;
}

export function toEventListItem(dto: PublicEventDto): EventListItem {
  return {
    slug: dto.slug,
    title: dto.title,
    summary: dto.description,
    startDate: dto.start_date,
    startTime: dto.start_time,
    location: dto.location,
    imageUrl: dto.image_url,
  };
}

export interface ScheduleGroups {
  daily: readonly PublicScheduleDto[];
  weekly: readonly PublicScheduleDto[];
  online: readonly PublicScheduleDto[];
}

export function groupSchedules(items: readonly PublicScheduleDto[]): ScheduleGroups {
  return {
    daily: items.filter((item) => item.schedule_type === "daily"),
    weekly: items.filter((item) => item.schedule_type === "weekly"),
    online: items.filter((item) => item.schedule_type === "online"),
  };
}
```

Handle null images/times in the mapper or presentational component with a deliberate placeholder, never `as string`.

- [ ] **Step 2: Add typed endpoint functions and query keys**

```ts
export const publicEventKeys = {
  all: ["public", "events"] as const,
  list: () => [...publicEventKeys.all, "list"] as const,
  detail: (slug: string) => [...publicEventKeys.all, "detail", slug] as const,
  schedules: () => ["public", "schedules"] as const,
};

export function useEventsQuery() {
  return useQuery({
    queryKey: publicEventKeys.list(),
    queryFn: () => getPublicEvents().then((items) => items.map(toEventListItem)),
    staleTime: 60_000,
    retry: shouldRetryPublicQuery,
  });
}

export function useSchedulesQuery() {
  return useQuery({
    queryKey: publicEventKeys.schedules(),
    queryFn: () => getPublicSchedules().then(groupSchedules),
    staleTime: 60_000,
    retry: shouldRetryPublicQuery,
  });
}
```

Use `placeholderData: keepPreviousData` only when a query later gains filters; do not add fake pagination now.

- [ ] **Step 3: Split rendering by independently fetched section**

`EventsContent` calls both hooks but renders two boundaries:

```tsx
<SchedulesSection query={schedulesQuery} />
<EventsList query={eventsQuery} />
```

Each boundary renders its own domain skeleton, `QueryErrorState` with `query.refetch`, `EmptyState`, or success UI. Preserve current visual card/table layout and next-intl date formatting. Use `/events/${event.slug}` for detail links.

- [ ] **Step 4: Remove fixture dependencies and add page copy**

Delete only the imports from `EventsContent`; do not delete JSON files because Home and detail pages still consume them until their migration tasks complete. Add Events-specific loading, empty, and error descriptions for all three locales.

- [ ] **Step 5: Verify Events list states**

Run: `cd frontend && npm run lint -- src/features/public/events 'src/app/[locale]/(client)/events/EventsContent.tsx`

Manually verify a normal response, an empty event list, a schedule request failure with a usable event list, and an event request failure with usable schedules.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/public/events 'frontend/src/app/[locale]/(client)/events/EventsContent.tsx' frontend/src/messages/{th,en,de}.json
git commit -m "feat: load public events and schedules with queries"
```

### Task 4: Migrate Event detail to slug, typed content, and detail state

**Files:**
- Create: `frontend/src/features/public/events/components/EventDetailContent.tsx`
- Modify: `frontend/src/features/public/events/queries.ts`
- Modify: `frontend/src/features/public/events/mappers.ts`
- Modify: `frontend/src/app/[locale]/(client)/events/[id]/page.tsx`
- Rename: `frontend/src/app/[locale]/(client)/events/[id]` to `frontend/src/app/[locale]/(client)/events/[slug]`

**Consumes:** `useEventQuery(slug)`, `useEventsQuery()`, `RichTextContent` with its real localized rich-text type, and the page state components.

**Produces:** A slug route with no JSON lookup or `as any` rich-text conversion.

- [ ] **Step 1: Define the detail view model and query**

```ts
export interface EventDetail extends EventListItem {
  description: LocalizedRichText;
  endDate: string;
  endTime: string | null;
  mapUrl: string | null;
  schedule: readonly EventScheduleItem[];
}

export function useEventQuery(slug: string) {
  return useQuery({
    queryKey: publicEventKeys.detail(slug),
    queryFn: () => getPublicEvent(slug).then(toEventDetail),
    enabled: Boolean(slug),
    staleTime: 60_000,
    retry: shouldRetryPublicQuery,
  });
}
```

- [ ] **Step 2: Move interactive/detail rendering into the client component**

`EventDetailContent` owns the query boundary, retry state, related-event query, rich-text rendering, print/share controls, calendar URL construction, and detail skeleton. Use an explicit `LocalizedRichText` value passed to `RichTextContent`; remove the current `event.description as any`.

- [ ] **Step 3: Keep the server route responsible only for server concerns**

Change params to `{ slug, locale }`. Generate metadata from a typed server-safe request helper or a safe generic title fallback; do not read the fixture. For a confirmed missing detail resource, call `notFound()`. Do not use `generateStaticParams` because public records are runtime API data.

- [ ] **Step 4: Verify detail behavior**

Run: `cd frontend && npm run lint -- src/features/public/events 'src/app/[locale]/(client)/events/[slug]/page.tsx`

Manually verify a valid slug, an unknown slug (not-found), a transient API failure with retry, rich-text description, related links, and event schedule rendering.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/public/events 'frontend/src/app/[locale]/(client)/events/[slug]'
git commit -m "feat: migrate public event detail to typed query"
```

### Task 5: Migrate Monks list and detail through the same bounded pattern

**Files:**
- Create: `frontend/src/features/public/monks/{types,api,mappers,queries}.ts`
- Create: `frontend/src/features/public/monks/components/{MonksGrid,MonksGridSkeleton,MonkDetailContent}.tsx`
- Modify: `frontend/src/app/[locale]/(client)/monks/MonksContent.tsx`
- Rename: `frontend/src/app/[locale]/(client)/monks/[id]` to `frontend/src/app/[locale]/(client)/monks/[slug]`
- Modify: `frontend/src/app/[locale]/(client)/monks/[slug]/page.tsx`
- Modify: `frontend/src/messages/{th,en,de}.json`

**Consumes:** Shared API/error/state primitives and existing `/public/monks`, `/public/monks/:slug` routes.

**Produces:** `useMonksQuery` and `useMonkQuery`; no `monks.json` or `as any` in public Monk pages.

- [ ] **Step 1: Define Monk DTO and view model without legacy fixture types**

```ts
export interface PublicMonkDto {
  slug: string;
  image_url: string | null;
  name: LocalizedTextDto;
  title: LocalizedTextDto;
  bio: LocalizedRichText | null;
  ordination_date: string | null;
  position: string;
}
export interface MonkCardModel { slug: string; imageUrl: string | null; name: LocalizedTextDto; title: LocalizedTextDto; }
```

- [ ] **Step 2: Implement typed API, mapper, and queries**

Use keys `["public", "monks", "list"]` and `["public", "monks", "detail", slug]`; use the shared retry classifier and domain-appropriate stale time.

- [ ] **Step 3: Replace list and detail fixtures with state boundaries**

Keep `cmsPage` heading metadata behavior in `MonksContent`, but put only the monk grid behind its query state. Render `EmptyState` for an empty list, not a blank grid. The detail client component must pass `bio` as a typed rich-text value or render a localized empty biography state; remove both current `(monk as any)` expressions.

- [ ] **Step 4: Verify and commit**

Run: `cd frontend && npm run lint -- src/features/public/monks 'src/app/[locale]/(client)/monks'`

Manually verify list success/empty/error/retry, detail success/404/error/retry, and all locale links using slugs.

```bash
git add frontend/src/features/public/monks 'frontend/src/app/[locale]/(client)/monks' frontend/src/messages/{th,en,de}.json
git commit -m "feat: load public monks with typed queries"
```

### Task 6: Migrate public-content pages and remove their remaining JSON dependencies

**Files:**
- Create: `frontend/src/features/public/content/types.ts`
- Create: `frontend/src/features/public/content/queries.ts`
- Create: `frontend/src/features/public/content/components/PublicContentStateBoundary.tsx`
- Modify: `frontend/src/hooks/public-content.ts`
- Modify: `frontend/src/app/[locale]/(client)/about/AboutContent.tsx`
- Modify: `frontend/src/app/[locale]/(client)/contact/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/contact/ContactContent.tsx`
- Modify: `frontend/src/app/[locale]/(client)/privacy/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/impressum/page.tsx`
- Modify: `frontend/src/messages/{th,en,de}.json`

**Consumes:** Existing public content API and types in `frontend/src/types/public-content.ts` and `frontend/src/services/publicContentService.ts`.

**Produces:** Client-facing public-content query keys separate from admin edit query keys, with published-data state behavior.

- [x] **Step 1: Audit the published-content contract before wiring UI state**

For `/about`, `/contact`, `/privacy`, and `/impressum`, record the exact success envelope, nullable body fields, and missing-publication response. A missing or unpublished page must be an HTTP 404; database and serialization failures must remain 5xx so `toPublicQueryError` can expose Retry. Do not turn every service error into 404.

Define the DTOs in `features/public/content/types.ts` from the actual payload. Keep nullable fields nullable in the DTO; do not use `as`, `as Record`, or default objects that hide an API mismatch. Verify each endpoint with a published page, no published page, and a forced server failure before building components.

- [x] **Step 2: Separate visitor query keys from Admin edit keys**

```ts
export const publicContentKeys = {
  about: () => ["public", "content", "about"] as const,
  contact: () => ["public", "content", "contact"] as const,
  privacy: () => ["public", "content", "privacy"] as const,
  impressum: () => ["public", "content", "impressum"] as const,
};
```

Do not reuse admin form mutation hooks for visitor reads. Visitor query functions call the published public endpoints only, use `shouldRetryPublicQuery`, and set `staleTime: 60_000`. Keep `publicContentService` only as a temporary typed adapter for non-migrated server consumers; remove an adapter only after `rg` confirms it has no consumers.

- [x] **Step 3: Reconcile About layout with the new admin body contract**

Map the published About API body to the layout sections already represented by `PublicAboutPageLayout`. Replace `aboutData` and the local monk fixture in `AboutContent` with the published content query and `usePublicMonksQuery` only if the Sangha grid remains part of the intended page. Keep failures isolated: About body failure does not hide a separately fetched monk grid.

The server route may fetch only for metadata and confirmed `notFound()`. `AboutContent` owns the body query's skeleton, retryable error, empty state, and success layout; the monk grid owns its own equivalent boundary. Seed client queries with `initialData` only when the server fetch succeeded. For a transient server failure, render the shell with no initial data and let the client retry.

- [x] **Step 4: Apply one state boundary pattern to Contact, Privacy, and Impressum**

Contact retains a usable contact-form state even when optional CMS body fields are absent. Privacy and Impressum render a localized empty-public-content state when no published document exists; they never show hard-coded legal copy. All failures show retry UI and preserve the page shell.

Each route becomes a thin server shell for metadata and confirmed 404 decisions. Its client content component owns `usePublicContentQuery`, loading skeleton, `QueryErrorState`, `EmptyState`, and the published-content renderer. Never catch an API error and silently substitute legal copy; use a locale key for intentional empty state instead. If content has an optional image, use `PublicImage` and omit any absent image field from structured data.

- [x] **Step 5: Verify and commit**

Run: `cd frontend && npm run lint -- src/features/public/content 'src/app/[locale]/(client)/about' 'src/app/[locale]/(client)/contact' 'src/app/[locale]/(client)/privacy' 'src/app/[locale]/(client)/impressum'`

Manually verify each page with published content, absent published content (404 or empty response as defined by the endpoint), and a simulated 5xx public API failure in TH/EN/DE. Verify that a contact-form interaction remains usable while optional CMS content is loading or failed.

```bash
git add frontend/src/features/public/content frontend/src/hooks/public-content.ts 'frontend/src/app/[locale]/(client)/about' 'frontend/src/app/[locale]/(client)/contact' 'frontend/src/app/[locale]/(client)/privacy' 'frontend/src/app/[locale]/(client)/impressum' frontend/src/messages/{th,en,de}.json
git commit -m "feat: query published public content pages"
```

### Task 7: Migrate Home last and remove obsolete public fixture reads

**Files:**
- Modify: `frontend/src/components/home/EventsSection.tsx`
- Modify: `frontend/src/components/home/EventAlertModal.tsx`
- Modify: `frontend/src/components/home/WelcomeSection.tsx`
- Modify: `frontend/src/components/home/DonationSection.tsx`
- Modify: `frontend/src/app/[locale]/(client)/page.tsx`
- Modify: `frontend/src/messages/{th,en,de}.json`
- Delete only after no imports remain: `frontend/src/data/events.json`, `frontend/src/data/schedule.json`, `frontend/src/data/monks.json`, `frontend/src/data/about.json`

**Consumes:** Events, Monks, and Content query hooks produced by Tasks 3–6.

**Produces:** Home as a composition layer with isolated sections and no duplicate public API wrappers.

- [x] **Step 1: Remove Home's server-side data orchestration before replacing fixture consumers**

Move runtime visitor data ownership out of `app/[locale]/(client)/page.tsx`. The server route retains only metadata and static shell concerns; it must not call `publicService`, fetch Events/Monks, or use `Promise.all` for independent visitor data.

Create a client composition boundary for Home if the existing `PublicHomePageLayout` cannot host query hooks. Pass only static labels, locale-independent page configuration, and successfully fetched metadata-derived initial data into it. On a transient server metadata failure, render the client boundary without initial data so its own query state can retry.

- [x] **Step 2: Replace each fixture consumer with its owning domain query**

`EventsSection` uses `usePublicEventsQuery` and slices mapped list data; `EventAlertModal` derives its next event from the same event query model; welcome/donation sections use the published content query that owns their data. Do not introduce a Home-specific endpoint for data already returned by a domain endpoint.

Every query uses the existing domain key, retry classifier, and 60-second stale time. Event and monk cards use `PublicImage`; absence or failure of both source and fallback must render the visual placeholder rather than a blank frame. JSON-LD/metadata must conditionally include optional images rather than emitting `null` values.

- [x] **Step 3: Preserve independent Home boundaries**

Each Home section renders its own skeleton, error/retry state, empty state, or content. A failed events request must not remove hero/welcome/donation content. Do not share a page-level loading or error branch across independently requested sections.

- [x] **Step 4: Remove only unused fixtures, temporary adapters, and legacy common types**

Use `rg "@/data/(events|schedule|monks|about)" frontend/src` before deleting each JSON file. Then run `rg "publicService\." frontend/src` before deleting the temporary Home adapters in `publicService.ts`. If an obsolete `frontend/src/types/common.ts` type is no longer imported, delete or narrow it in the same commit; do not leave a second event model in the codebase.

- [x] **Step 5: Verify and commit**

Run: `cd frontend && npm run lint -- src/components/home 'src/app/[locale]/(client)/page.tsx && rg "@/data/(events|schedule|monks|about)" frontend/src`

Expected: lint passes and both fixture and `publicService.` audits return no matches before deleting their implementations.

Manually verify that each Home section continues to work independently when another source is loading, empty, or failed.

```bash
git add frontend/src/components/home 'frontend/src/app/[locale]/(client)/page.tsx' frontend/src/messages/{th,en,de}.json frontend/src/types/common.ts frontend/src/data
git commit -m "feat: compose home from public query domains"
```

### Task 8: Final migration audit and owner handoff

**Files:**
- Modify only if audit finds a remaining violation: affected public route, feature, translation, or type file
- Modify: `docs/superpowers/specs/2026-07-18-public-client-api-state-design.md` only if implementation reveals a required contract decision not captured in the spec

**Consumes:** All completed domain migrations.

**Produces:** A public frontend with one data source per domain and no banned type escapes.

- [x] **Step 1: Run source audits**

```bash
rg -n "@/data/(events|schedule|monks|about)|\bas any\b|unknown as" frontend/src/app/'[locale]'/'(client)' frontend/src/components/home frontend/src/features/public
rg -n "\bas Record<|useEffect\(|publicService\." frontend/src/app/'[locale]'/'(client)' frontend/src/components/home frontend/src/features/public
rg -n "generateStaticParams|Promise\.all" frontend/src/app/'[locale]'/'(client)' frontend/src/components/home
```

Expected: no fixture imports, no banned type escapes, no direct component fetches, no remaining temporary `publicService` consumers, no runtime static generation, and no Home-level aggregation of independent requests. Review any legitimate `useEffect` unrelated to fetching rather than removing it blindly.

- [x] **Step 2: Run focused static verification**

Run: `cd frontend && npm run lint -- src/features/public src/components/public/states src/components/home 'src/app/[locale]/(client)'`

Expected: no errors. Resolve any errors without adding `any` or unsafe assertions.

- [ ] **Step 3: Perform manual visitor state review**

For Events, Monks, About, Contact, Privacy, Impressum, and Home, confirm normal content, initial skeleton, empty response, retryable 5xx failure, confirmed 404 detail, absent image fallback, and three locale copies. Confirm a failure in a page subsection does not erase unrelated loaded content. For every server shell, confirm a transient server fetch still leaves a client retry boundary rather than a blank page or a false 404.

- [x] **Step 4: Commit any audit corrections**

```bash
git add frontend backend docs/superpowers/specs/2026-07-18-public-client-api-state-design.md
git commit -m "chore: complete public client API migration"
```
