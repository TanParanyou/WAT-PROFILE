# Event List and Detail Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make public Events, schedules, and event detail render the API contract safely with localized data and resilient TanStack Query states.

**Architecture:** Keep the public event DTO honest about Tiptap rich-text values, and use one plain-text extractor only where text is required (print/metadata/JSON-LD). The detail route remains responsible for SEO and confirmed server-side 404 decisions; the client detail component owns the TanStack Query boundary, including loading and retry. The route passes server-fetched data as query initial data so a normal direct visit does not immediately issue a duplicate browser request.

**Tech Stack:** Next.js App Router, React 19, TypeScript strict mode, TanStack Query, Axios, next-intl, Tiptap JSONContent.

## Global Constraints

- Do not use `any`, `unknown as T`, or assertions that hide an API-contract mismatch.
- All browser-side reads must use TanStack Query; no component fetches via `useEffect`.
- Keep loading, error, and empty states inside the data section they belong to.
- Do not use `generateStaticParams` for runtime public API records.
- Preserve event-detail capabilities already supported by the public DTO: rich text, schedules, map link, share, print, and calendar link. Related events remain out of scope until the API has an explicit related-events rule.
- Do not change Admin/CMS behavior, Monks, Home, or backend contracts in this corrective plan.
- Per owner direction, do not add automated tests. Run focused lint, type checking, `git diff --check`, and manual browser checks instead.

---

## Target File Structure

```text
frontend/src/
  features/public/
    shared/
      api-types.ts                 # truthful localized rich-text contract
      rich-text.ts                 # safe plain-text extraction for non-rich UI
    events/
      api.ts                       # existing browser/server-safe axios request functions
      queries.ts                   # detail query accepts optional initial data
      components/
        EventDetailContent.tsx     # client query boundary and detail UI
        EventDetailSkeleton.tsx    # detail loading UI
        SchedulesSection.tsx       # localized day/time/online-link display
  app/[locale]/(client)/events/[slug]/
    page.tsx                       # metadata + confirmed 404 + initial query data
  components/events/EventPrinter.tsx
```

### Task 1: Correct the localized rich-text contract and plain-text projection

**Files:**
- Modify: `frontend/src/features/public/shared/api-types.ts`
- Create: `frontend/src/features/public/shared/rich-text.ts`
- Modify: `frontend/src/features/public/events/components/EventsList.tsx`
- Modify: `frontend/src/components/events/EventPrinter.tsx`

**Consumes:** `RichTextDocument` and `LocalizedRichText` from `frontend/src/lib/rich-text/document.ts`.

**Produces:** A DTO that accurately represents API rich text and `getLocalizedPlainText`, which is only used in contexts that require a string.

- [ ] **Step 1: Replace the false string contract with the existing rich-text contract**

  In `api-types.ts`, replace the current `LocalizedRichTextDto` interface with the existing document type alias. Do not duplicate Tiptap's document shape.

  ```ts
  import type { LocalizedRichText } from "@/lib/rich-text/document";

  export type LocalizedRichTextDto = LocalizedRichText;
  ```

  Retain `LocalizedTextDto` for fields such as `title`, `location`, and schedule `activity`; those API values are strings.

- [ ] **Step 2: Add a safe document-to-plain-text projection**

  Create `features/public/shared/rich-text.ts`. It must select `locale`, then `th`, then the first available document, and recursively collect only Tiptap `text` nodes.

  ```ts
  import type { JSONContent } from "@tiptap/core";
  import type { LocalizedRichTextDto } from "./api-types";

  function toPlainText(node: JSONContent | null | undefined): string {
    if (!node) return "";
    const ownText = typeof node.text === "string" ? node.text : "";
    const children = node.content?.map(toPlainText).filter(Boolean).join(" ") ?? "";
    return [ownText, children].filter(Boolean).join(" ").trim();
  }

  export function getLocalizedPlainText(value: LocalizedRichTextDto, locale: string): string {
    const document = value[locale] ?? value.th ?? Object.values(value).find(Boolean);
    return toPlainText(document);
  }
  ```

  Do not change `RichTextContent`; it remains the renderer for the full document.

- [ ] **Step 3: Use the projection only in text-only surfaces**

  In `EventsList.tsx`, delete the local `extractPlainText` and `getRichTextSnippet` functions and derive the summary with:

  ```ts
  const description = event.description
    ? getLocalizedPlainText(event.description, locale).slice(0, 180)
    : "";
  ```

  In `EventPrinter.tsx`, replace the direct `getLocalizedText(event.description, locale)` child with `getLocalizedPlainText(event.description, locale) || "-"`. This prevents React from receiving a `{ type, content }` object even though the print subtree is visually hidden.

- [ ] **Step 4: Verify the contract correction**

  Run:

  ```bash
  cd frontend && npx eslint src/features/public/shared/rich-text.ts src/features/public/events/components/EventsList.tsx src/components/events/EventPrinter.tsx
  ```

  Expected: exit code `0`; no explicit `any` or TypeScript/ESLint diagnostics.

- [ ] **Step 5: Commit the isolated contract fix**

  ```bash
  git add frontend/src/features/public/shared frontend/src/features/public/events/components/EventsList.tsx frontend/src/components/events/EventPrinter.tsx
  git commit -m "fix: render public event rich text safely"
  ```

### Task 2: Make event detail a runtime slug route with a client query boundary

**Files:**
- Modify: `frontend/src/features/public/events/queries.ts`
- Create: `frontend/src/features/public/events/components/EventDetailSkeleton.tsx`
- Modify: `frontend/src/features/public/events/components/EventDetailContent.tsx`
- Rename: `frontend/src/app/[locale]/(client)/events/[id]/page.tsx` to `frontend/src/app/[locale]/(client)/events/[slug]/page.tsx`

**Consumes:** `fetchPublicEventBySlug`, `toPublicQueryError`, `QueryErrorState`, `PublicEventDto`, and Task 1's `getLocalizedPlainText`.

**Produces:** An SSR-friendly detail shell with actual 404s and a client-owned success/loading/error/retry state.

- [ ] **Step 1: Allow detail query hydration without changing its key**

  Change `usePublicEventQuery` so route data can seed the query without hiding an API failure:

  ```ts
  export function usePublicEventQuery(slug: string, initialData?: PublicEventDto) {
    return useQuery({
      queryKey: publicEventsKeys.detail(slug),
      queryFn: () => fetchPublicEventBySlug(slug),
      enabled: Boolean(slug),
      initialData,
      staleTime: 60_000,
      retry: shouldRetryPublicQuery,
    });
  }
  ```

  Do not map a rejected server request into `initialData`; leaving it undefined lets the client show its own retry boundary.

- [ ] **Step 2: Add a detail-shaped initial loading component**

  Create `EventDetailSkeleton.tsx` with a visual image block, metadata lines, title lines, body lines, and schedule rows. It must be presentational only and have no data calls.

  ```tsx
  export function EventDetailSkeleton() {
    return (
      <div className="animate-pulse space-y-8" aria-label="Loading event">
        <div className="aspect-video rounded-3xl bg-gray-200" />
        <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-8">
          <div className="h-4 w-2/5 rounded bg-gray-200" />
          <div className="h-9 w-3/4 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-100" />
          <div className="h-4 w-5/6 rounded bg-gray-100" />
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 3: Refactor `EventDetailContent` into the client state boundary**

  Change props to `{ slug: string; initialEvent?: PublicEventDto }`, call `usePublicEventQuery(slug, initialEvent)`, and branch in this order:

  ```tsx
  if (eventQuery.isLoading) return <EventDetailSkeleton />;

  if (eventQuery.isError) {
    return (
      <QueryErrorState
        title={tState("errorTitle")}
        description={tState("errorDescription")}
        retryLabel={tState("retry")}
        onRetry={() => eventQuery.refetch()}
        isRetrying={eventQuery.isFetching}
      />
    );
  }

  if (!eventQuery.data) {
    return <EmptyState title={tState("emptyEvents")} description={tState("emptyContent")} />;
  }
  ```

  Render the existing event body only after assigning `const event = eventQuery.data`. Use `RichTextContent` for the visible description and `getLocalizedPlainText` for JSON-LD only. Keep image, date/time, location, print, and share controls inside the success branch.

- [ ] **Step 4: Replace static generation with a minimal server shell**

  Rename the route directory to `[slug]`; update `params` to `Promise<{ slug: string; locale: string }>` and remove `generateStaticParams` completely. The route performs one server request only to seed valid data or confirm a 404:

  ```ts
  let initialEvent: PublicEventDto | undefined;
  try {
    initialEvent = await fetchPublicEventBySlug(slug);
  } catch (error) {
    if (toPublicQueryError(error).kind === "not-found") notFound();
  }
  ```

  On non-404 failure, do not throw; render `<EventDetailContent slug={slug} initialEvent={initialEvent} />` so the client query supplies loading/error/retry. `generateMetadata` may keep its safe fallback behavior, but must use `getLocalizedPlainText` for `description` and Open Graph description.

- [ ] **Step 5: Verify direct-detail behavior**

  Run:

  ```bash
  cd frontend && npx eslint src/features/public/events 'src/app/[locale]/(client)/events/[slug]/page.tsx'
  git diff --check
  ```

  Expected: both commands exit `0`. Manually visit a valid slug, a missing slug, and a valid slug while the API is temporarily unreachable; confirm content, Next 404, and retry UI respectively.

- [ ] **Step 6: Commit the detail-query migration**

  ```bash
  git add frontend/src/features/public/events 'frontend/src/app/[locale]/(client)/events/[slug]'
  git commit -m "fix: query public event detail by runtime slug"
  ```

### Task 3: Restore schedule information and localize all event strings

**Files:**
- Modify: `frontend/src/features/public/events/components/SchedulesSection.tsx`
- Modify: `frontend/src/features/public/events/components/EventDetailContent.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Consumes:** `PublicScheduleDto`, `getLocalizedText`, and the three locale catalogs.

**Produces:** Schedules that display readable weekdays, time ranges, and usable online links in every supported locale.

- [ ] **Step 1: Add only the required translation keys**

  Add these keys under `EventsPage` in all three locale files: `dailySchedule`, `weeklySchedule`, `onlineSchedule`, `schedule`, `dayNames` (`sunday` through `saturday`), and `joinOnline`. Add `EventDetailPage.schedule`, `EventDetailPage.openMap`, and `EventDetailPage.addToCalendar`.

  Do not reuse `calendarView` as the weekly schedule heading; it describes a UI mode, not a recurring schedule.

- [ ] **Step 2: Convert `day_of_week` to localized labels and retain schedule time**

  Add a private helper in `SchedulesSection.tsx`:

  ```ts
  const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

  function getDayLabel(dayOfWeek: number | null, translate: (key: string) => string): string {
    return dayOfWeek === null || !Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6
      ? "-"
      : translate(`dayNames.${dayKeys[dayOfWeek]}`);
  }
  ```

  Weekly rows must show the translated day, `time_start`–`time_end` when present, and localized activity. Daily rows must show the same complete time range. Preserve server order; do not add a frontend sort that can contradict `display_order`.

- [ ] **Step 3: Restore the online action and avoid empty subsection shells**

  Render an online item as a semantic external anchor only when `online_link` is non-null:

  ```tsx
  {item.online_link ? (
    <a href={item.online_link} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">
      {t("joinOnline")}
    </a>
  ) : null}
  ```

  Do not render a blank weekly or online card if that group has no items. The outer Events page continues to own the overall empty schedule state.

- [ ] **Step 4: Restore supported detail actions without inventing APIs**

  In the success branch of `EventDetailContent`, display an `openMap` anchor only when `event.map_url` is present. Construct the Google Calendar URL locally from `title`, plain-text description, localized location, `start_date`, `end_date`, `start_time`, and `end_time`; preserve a valid all-day fallback when no times exist. Do not add related events because no related-events API contract is present.

- [ ] **Step 5: Verify all locales and schedule variants**

  Run:

  ```bash
  cd frontend && npx eslint src/features/public/events/components/SchedulesSection.tsx src/features/public/events/components/EventDetailContent.tsx
  git diff --check
  ```

  Expected: exit code `0`. Manually verify TH/EN/DE with daily-only, weekly-only, online-with-link, and a detail record with map/calendar data.

- [ ] **Step 6: Commit restored event presentation behavior**

  ```bash
  git add frontend/src/features/public/events frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json
  git commit -m "fix: restore localized public event details"
  ```

### Task 4: Final corrective audit

**Files:**
- Modify only if this audit identifies a violation in the Event feature files above.

**Consumes:** Tasks 1–3.

**Produces:** A verified Events/detail correction with no remaining fixture route or unsafe rich-text render.

- [ ] **Step 1: Run targeted source audits**

  ```bash
  rg -n "generateStaticParams|\[id\]|\bas any\b|unknown as|description.*getLocalizedText" frontend/src/features/public/events frontend/src/components/events 'frontend/src/app/[locale]/(client)/events'
  ```

  Expected: no `generateStaticParams`, no event `[id]` route, no banned type escapes, and no rich-text description passed through `getLocalizedText`.

- [ ] **Step 2: Run final static verification**

  ```bash
  cd frontend && npx eslint src/features/public/shared src/features/public/events src/components/events 'src/app/[locale]/(client)/events'
  git diff --check
  ```

  Expected: both commands exit `0`.

- [ ] **Step 3: Commit only audit corrections, if any**

  ```bash
  git add frontend/src/features/public frontend/src/components/events 'frontend/src/app/[locale]/(client)/events' frontend/src/messages
  git commit -m "chore: audit public event query states"
  ```

## Self-Review

- Rich-text object rendering is addressed before any event detail render in Task 1.
- The detail route becomes `[slug]`, removes `generateStaticParams`, preserves 404, and delegates transient failures to a retryable TanStack Query state in Task 2.
- Daily/weekly/online information, map, calendar, and all localized labels are restored in Task 3; related events are explicitly excluded because the current API has no relationship contract.
- Automated tests are intentionally omitted per owner direction; each task instead includes the exact lint/static/manual verification required.
