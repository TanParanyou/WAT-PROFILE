# Events Page Calendar Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the full reusable public Calendar on the Events page before schedules and upcoming event rows, with identical behavior to the dedicated Calendar route.

**Architecture:** Extract the public Calendar composition and public-feed integration from `CalendarPageContent` into `PublicCalendarSection`. The dedicated Calendar page keeps its own page shell and composes that section. `EventsContent` composes the same section immediately after its header, then retains its independently queried schedules and event list. URL state stays route-local through `useRoutedCalendar`, so each route reads its own `view` and `date` query parameters.

**Tech Stack:** Next.js 16 App Router, React 19, next-intl, TanStack Query 5, TypeScript, Tailwind CSS 4, node:test.

## Global Constraints

- Reuse the existing custom `Calendar`; do not add FullCalendar or another dependency.
- The embedded Calendar must provide Month, Week, and Day with the same public feed and `Europe/Berlin` semantics as `/calendar`.
- Keep Calendar rendering generic: fetching, locale labels, and WAT adapters stay in `integrations/wat`.
- Preserve Thai, English, and German text.
- Keep the Events order: header → Calendar → regular schedules → upcoming event list.
- Preserve existing event-list/schedule loading, error, and empty states.
- Do not change backend APIs, Admin Calendar, database schema, or OpenAPI.
- Do not use TypeScript `any`, `as any`, or `@ts-ignore`.

---

### Task 1: Extract the public Calendar route composition into a reusable integration section

**Files:**
- Create: `frontend/src/features/calendar/integrations/wat/PublicCalendarSection.tsx`
- Modify: `frontend/src/app/[locale]/(client)/calendar/CalendarPageContent.tsx`
- Modify: `frontend/src/features/calendar/presets/presets.test.ts`

**Interfaces:**
- Produces: `PublicCalendarSection`, a client component with no props that owns public route state, `useCalendarEntries({ scope: "public" })`, labels, public presentation adapters, and event-detail navigation.
- Consumes: `useRoutedCalendar`, `useClientCalendarLabels`, `CalendarQueryBoundary`, `Calendar`, `discoveryPreset`, and existing WAT adapter functions.
- Guarantees: Both public routes render the same Calendar facade and no page component imports Calendar views directly.

- [x] **Step 1: Extend the source-boundary test with the Events page contract.**

In `presets.test.ts`, add an `eventsPagePath` using this exact relative URL:

```ts
const eventsPagePath = fileURLToPath(
  new URL("../../../app/[locale]/(client)/events/EventsContent.tsx", import.meta.url),
);
```

Add this failing test:

```ts
test("Events page composes the shared public calendar section before schedules", () => {
  const source = readFileSync(eventsPagePath, "utf8");
  const calendarIndex = source.indexOf("<PublicCalendarSection");
  const scheduleIndex = source.indexOf('aria-labelledby="schedule-heading"');

  assert.ok(calendarIndex >= 0);
  assert.ok(scheduleIndex > calendarIndex);
  assert.doesNotMatch(source, /href="\/calendar"/);
});
```

- [x] **Step 2: Run the test to verify it fails.**

Run:

```bash
cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/presets/presets.test.ts
```

Expected: FAIL because `EventsContent` currently has no `PublicCalendarSection` and still links to `/calendar`.

- [x] **Step 3: Create `PublicCalendarSection`.**

Move these concerns from `CalendarPageContent` into the new component without changing their behavior:

```tsx
const localeValue = useLocale();
const locale: CalendarLocale = localeValue === "de" || localeValue === "en" ? localeValue : "th";
const router = useRouter();
const controller = useRoutedCalendar({
  scope: "public",
  weekStartsOn: locale === "th" ? 0 : 1,
  initialView: "month",
});
const query = useCalendarEntries({ scope: "public", locale, range: controller.visibleRange });
const labels = useClientCalendarLabels(locale);
```

Render `CalendarQueryBoundary` and the existing `<Calendar>` props exactly as the dedicated page does today. Keep `onEventActivate` navigating through `event.detail.href`; preserve the public theme, feed, presentation adapters, tooltip defaults, and `discoveryPreset`.

- [x] **Step 4: Reduce `CalendarPageContent` to page shell plus section.**

Keep only locale-independent page text and page layout in `CalendarPageContent`:

```tsx
<div className="min-h-screen bg-site-canvas">
  <PageHeader variant="color" density="compact" align="left" title={t("title")} subtitle={t("subtitle")} />
  <PageContainer width="wide">
    <PublicCalendarSection />
  </PageContainer>
</div>
```

Remove its direct imports of Calendar state, query, label, adapter, and navigation dependencies. Do not move `PageHeader` or `PageContainer` into the reusable section.

- [x] **Step 5: Run the focused source test and verify it passes.**

Run:

```bash
cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/presets/presets.test.ts
```

Expected: all existing Calendar facade tests pass and the new source test confirms the Events consumer is ready for composition.

- [x] **Step 6: Commit the extraction.**

```bash
git add frontend/src/features/calendar/integrations/wat/PublicCalendarSection.tsx frontend/src/app/[locale]/(client)/calendar/CalendarPageContent.tsx frontend/src/features/calendar/presets/presets.test.ts
git commit -m "refactor(calendar): extract public calendar section"
```

### Task 2: Compose the shared Calendar in Events with localized section copy

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/events/EventsContent.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`
- Modify: `frontend/src/features/calendar/presets/presets.test.ts`

**Interfaces:**
- Consumes: `PublicCalendarSection` from Task 1 and `EventsPage.calendarTitle` / `EventsPage.calendarDescription` message keys.
- Produces: the Events route with the full Calendar between header and schedules, while schedules and event list remain independent sections.

- [x] **Step 1: Add complete localized section copy.**

Add two keys to each `EventsPage` locale object:

```json
// th
"calendarTitle": "ปฏิทินกิจกรรม",
"calendarDescription": "เลือกดูวัน เวลา และรายละเอียดกิจกรรมของวัด"

// en
"calendarTitle": "Activity calendar",
"calendarDescription": "Browse temple activities by date, time, and detail."

// de
"calendarTitle": "Aktivitätskalender",
"calendarDescription": "Entdecken Sie Tempelaktivitäten nach Datum, Uhrzeit und Details."
```

- [x] **Step 2: Compose the Calendar section before schedules.**

Replace the current direct `/calendar` action link with this section immediately inside `PageContainer`, before the existing schedule section:

```tsx
<section className="border-t border-site-border pt-12 sm:pt-16" aria-labelledby="calendar-heading">
  <PublicSectionHeading
    id="calendar-heading"
    title={tPage("calendarTitle")}
    description={tPage("calendarDescription")}
  />
  <div className="mt-8">
    <PublicCalendarSection />
  </div>
</section>
```

Change the former schedule section to `className="mt-20 border-t border-site-border pt-16"`. Keep its `aria-labelledby="schedule-heading"`, queries, and state branches unchanged. Remove the now-unused `Link` import and the upcoming-events heading `action` prop.

- [x] **Step 3: Tighten the source test.**

Update the Task 1 test to also assert:

```ts
assert.match(source, /title=\{tPage\("calendarTitle"\)\}/);
assert.match(source, /description=\{tPage\("calendarDescription"\)\}/);
```

This proves the embedded Calendar has a localized section heading rather than silently inheriting the route title.

- [x] **Step 4: Run focused tests and Calendar gate.**

Run:

```bash
cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/presets/presets.test.ts
cd frontend && npm run test:calendar
```

Expected: the section-order/localization assertion passes and all Calendar behavior remains green.

- [x] **Step 5: Run TypeScript, focused ESLint, build, and browser QA.**

Run:

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && ./node_modules/.bin/eslint src/app/[locale]/(client)/events/EventsContent.tsx src/app/[locale]/(client)/calendar/CalendarPageContent.tsx src/features/calendar/integrations/wat/PublicCalendarSection.tsx
cd frontend && NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED=false npm run build
```

Browser-check `/th/events?view=month&date=2026-08-12` at `390px` and `1280px`, then switch to Week and Day. Confirm the URL updates on `/events`, the Calendar appears before schedules, event activation opens the existing detail route, no page-width overflow appears, and localized `/en/events` and `/de/events` headings render.

- [x] **Step 6: Commit Events composition.**

```bash
git add frontend/src/app/[locale]/(client)/events/EventsContent.tsx frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json frontend/src/features/calendar/presets/presets.test.ts
git commit -m "feat(events): embed public calendar"
```

## Self-review

- Spec coverage: Task 1 creates a single public Calendar consumer; Task 2 places it before schedules with localized copy and removes the redundant action link.
- Placeholder scan: every code, test, command, and commit step is explicit.
- Type consistency: `PublicCalendarSection` is prop-free because route-local URL state comes from the page pathname, while both consumers provide their own page layout and heading context.
