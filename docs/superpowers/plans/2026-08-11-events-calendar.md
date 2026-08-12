# Events Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a production-ready, localized monthly calendar to public and admin events, with a site-controlled public default and a visitor override.

**Architecture:** A pure, reusable calendar-domain module maps date-only event ranges into visible month-grid occurrences. Public and admin route wrappers fetch their own event data and provide click behavior, state treatment, and theme variants. The existing settings endpoint publishes the global default; local storage overrides it only for an individual public visitor.

**Tech Stack:** Next.js 16, React 19, TypeScript, TanStack Query, date-fns/date-fns-tz, next-intl, Tailwind CSS 4, Go 1.24, Fiber, GORM, PostgreSQL.

## Global Constraints

- Do not add a calendar dependency; use the installed `date-fns` and project UI primitives.
- Preserve `th`, `en`, and `de` copy, and use `Europe/Berlin` semantics for visitor dates.
- No TypeScript `any`, `as any`, or `@ts-ignore`; unwrap typed API envelopes at the service boundary.
- Reuse the existing public/admin settings endpoints and retain their permission model; update OpenAPI for public event-query changes.
- Add only new reversible migrations; do not edit existing numbered migrations.
- Preserve public loading/error/empty states, admin permissions, and the existing list workflow.

---

## File structure

| Path | Responsibility |
| --- | --- |
| `frontend/src/features/calendar/calendar-domain.ts` | Date-only parsing, Berlin-safe month-grid bounds, inclusive range placement, and overflow-safe day grouping. |
| `frontend/src/features/calendar/CalendarMonth.tsx` | Accessible generic month UI; receives calendar occurrences and click renderers, owns no HTTP calls. |
| `frontend/src/features/public/events/*` | Public range-query contract, localized adapter, stored view preference, and event page composition. |
| `frontend/src/app/[locale]/admin/events/*` | Calendar/List switcher plus permission-aware admin adapter and range query. |
| `backend/internal/services/event_service.go` | Shared overlapping-range predicates for public/admin event reads. |
| `backend/migrations/000039_seed_events_calendar_default.*.sql` | Public setting seed and reversible removal. |

### Task 1: Build and test the reusable calendar domain

**Files:**
- Create: `frontend/src/features/calendar/calendar-domain.ts`
- Create: `frontend/src/features/calendar/calendar-domain.test.ts`

**Interfaces:**
- Produces `CalendarEvent`, `CalendarDay`, `getMonthGridRange(month: Date, weekStartsOn: 0 | 1)`, and `buildCalendarDays(events, range)`.
- `CalendarEvent` is `{ id: string; startDate: string; endDate: string; title: string; href?: string; status?: "active" | "inactive"; type?: string }`.
- Date strings are strictly `yyyy-MM-dd`; malformed values are excluded rather than converted through `new Date(string)`.

- [ ] **Step 1: Write the failing date-domain tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { buildCalendarDays, getMonthGridRange } from "./calendar-domain";

test("month grid contains leading and trailing display days", () => {
  const range = getMonthGridRange(new Date(2026, 7, 1), 1);
  assert.equal(range.startDate, "2026-07-27");
  assert.equal(range.endDate, "2026-09-06");
});

test("a multi-day event appears on every inclusive day", () => {
  const days = buildCalendarDays([{ id: "retreat", title: "Retreat", startDate: "2026-08-10", endDate: "2026-08-12" }], { startDate: "2026-08-09", endDate: "2026-08-15" });
  assert.deepEqual(days.filter((day) => day.events.length).map((day) => day.date), ["2026-08-10", "2026-08-11", "2026-08-12"]);
});

test("invalid and out-of-range events do not populate a day", () => {
  const days = buildCalendarDays([{ id: "bad", title: "Bad", startDate: "not-a-date", endDate: "2026-08-11" }], { startDate: "2026-08-01", endDate: "2026-08-31" });
  assert.equal(days.flatMap((day) => day.events).length, 0);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx tsx --test src/features/calendar/calendar-domain.test.ts`

Expected: FAIL because `calendar-domain.ts` does not exist.

- [ ] **Step 3: Implement date-only calendar primitives**

```ts
export interface CalendarRange { startDate: string; endDate: string }
export interface CalendarEvent { id: string; title: string; startDate: string; endDate: string; href?: string; status?: "active" | "inactive"; type?: string }
export interface CalendarDay { date: string; events: CalendarEvent[] }

const dateFormat = "yyyy-MM-dd";
const parseDateOnly = (value: string) => {
  const date = parse(value, dateFormat, new Date(0));
  return isValid(date) && format(date, dateFormat) === value ? date : null;
};

export function getMonthGridRange(month: Date, weekStartsOn: 0 | 1): CalendarRange {
  return {
    startDate: format(startOfWeek(startOfMonth(month), { weekStartsOn }), dateFormat),
    endDate: format(endOfWeek(endOfMonth(month), { weekStartsOn }), dateFormat),
  };
}

export function buildCalendarDays(events: readonly CalendarEvent[], range: CalendarRange): CalendarDay[] {
  const start = parseDateOnly(range.startDate);
  const end = parseDateOnly(range.endDate);
  if (!start || !end || isAfter(start, end)) return [];
  const byDate = new Map(eachDayOfInterval({ start, end }).map((date) => [format(date, dateFormat), [] as CalendarEvent[]]));
  for (const event of events) {
    const eventStart = parseDateOnly(event.startDate);
    const eventEnd = parseDateOnly(event.endDate);
    if (!eventStart || !eventEnd || isAfter(eventStart, eventEnd)) continue;
    const visibleStart = isBefore(eventStart, start) ? start : eventStart;
    const visibleEnd = isAfter(eventEnd, end) ? end : eventEnd;
    for (const date of eachDayOfInterval({ start: visibleStart, end: visibleEnd })) byDate.get(format(date, dateFormat))?.push(event);
  }
  return [...byDate].map(([date, dayEvents]) => ({ date, events: dayEvents.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id)) }));
}
```

Use `parse`/`format` and integer date increments, not `new Date("yyyy-mm-dd")`. Sort each day by start date, then title, then id for deterministic chips.

- [ ] **Step 4: Run focused tests and static checking**

Run: `cd frontend && npx tsx --test src/features/calendar/calendar-domain.test.ts && ./node_modules/.bin/tsc --noEmit`

Expected: all three tests pass and TypeScript exits 0.

- [ ] **Step 5: Commit the domain unit**

```bash
git add frontend/src/features/calendar/calendar-domain.ts frontend/src/features/calendar/calendar-domain.test.ts
git commit -m "feat: add calendar date domain"
```

### Task 2: Add date-range contracts, overlap queries, and the global default setting

**Files:**
- Create: `backend/migrations/000039_seed_events_calendar_default.up.sql`
- Create: `backend/migrations/000039_seed_events_calendar_default.down.sql`
- Modify: `backend/internal/handlers/event_handler.go`
- Modify: `backend/internal/services/event_service.go`
- Modify: `backend/docs/openapi.yaml`
- Modify: `frontend/src/features/public/events/api.ts`
- Modify: `frontend/src/features/public/events/queries.ts`
- Modify: `frontend/src/features/public/settings/types.ts`
- Modify: `frontend/src/features/public/settings/mapper.ts`

**Interfaces:**
- Public endpoint becomes `GET /public/events?from=yyyy-mm-dd&to=yyyy-mm-dd&limit=n`; both dates are optional but must be supplied together when filtering.
- Both public and admin date filtering use `end_date >= from AND start_date <= to`.
- Public settings exposes `defaultEventsView: "calendar" | "list"`; invalid/missing input resolves to `"calendar"`.

- [ ] **Step 1: Write failing backend tests for overlap policy**

Create `backend/internal/services/event_range_test.go` that tests a pure helper used by query construction:

```go
func TestEventDateRangeOverlaps(t *testing.T) {
  start := time.Date(2026, 8, 10, 0, 0, 0, 0, time.UTC)
  end := time.Date(2026, 8, 12, 0, 0, 0, 0, time.UTC)
  cases := []struct { from, to time.Time; want bool }{
    {date("2026-08-01"), date("2026-08-10"), true},
    {date("2026-08-12"), date("2026-08-31"), true},
    {date("2026-08-13"), date("2026-08-31"), false},
  }
  for _, tc := range cases {
    if got := EventDateRangeOverlaps(start, end, tc.from, tc.to); got != tc.want { t.Fatalf("overlap(%s, %s) = %t, want %t", tc.from, tc.to, got, tc.want) }
  }
}

func date(value string) time.Time { parsed, err := time.Parse("2006-01-02", value); if err != nil { panic(err) }; return parsed }
```

Use the repository's assertion style (`if !condition { t.Fatal(...) }`) rather than introducing a Go assertion library.

- [ ] **Step 2: Run the focused backend test to verify failure**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run TestEventDateRangeOverlaps -count=1`

Expected: FAIL because `EventDateRangeOverlaps` is undefined.

- [ ] **Step 3: Implement range handling and migration**

```sql
-- 000039_seed_events_calendar_default.up.sql
INSERT INTO settings (id, key, value, type, category, is_public)
VALUES (gen_random_uuid(), 'events_default_view', 'calendar', 'string', 'event', TRUE)
ON CONFLICT (key) DO NOTHING;
```

```sql
-- 000039_seed_events_calendar_default.down.sql
DELETE FROM settings WHERE key = 'events_default_view';
```

In Go, validate that `from` and `to` are both valid ISO dates or both absent, map invalid pairs to the established 400 error envelope, and build the GORM predicate exactly as:

```go
query = query.Where("events.end_date >= ? AND events.start_date <= ?", *from, *to)
```

Use this predicate in `ListAdmin` and in the public active-event list, retaining active visibility, limit behavior, ordering, pagination, and schedule preloading. Add `from`/`to` parameters to the public OpenAPI route and update frontend `PublicEventsListOptions`, query keys, and API parameter serialization so cached month ranges cannot collide.

Extend `PublicSiteSettings` and `mapPublicSiteSettings` with:

```ts
export type EventsView = "calendar" | "list";
defaultEventsView: raw.events_default_view === "list" ? "list" : "calendar";
```

- [ ] **Step 4: Run backend and frontend contract checks**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run TestEventDateRangeOverlaps -count=1 && gofmt -w internal/handlers/event_handler.go internal/services/event_service.go && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./internal/services ./internal/handlers`

Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`

Expected: focused overlap tests, vet, and type-check pass; `git diff --check` is clean.

- [ ] **Step 5: Commit the API/settings contract**

```bash
git add backend/migrations/000039_seed_events_calendar_default.up.sql backend/migrations/000039_seed_events_calendar_default.down.sql backend/internal/handlers/event_handler.go backend/internal/services/event_service.go backend/internal/services/event_range_test.go backend/docs/openapi.yaml frontend/src/features/public/events/api.ts frontend/src/features/public/events/queries.ts frontend/src/features/public/settings/types.ts frontend/src/features/public/settings/mapper.ts
git commit -m "feat: add calendar event range queries"
```

### Task 3: Implement the accessible generic calendar presentation

**Files:**
- Create: `frontend/src/features/calendar/CalendarMonth.tsx`
- Create: `frontend/src/features/calendar/CalendarViewToggle.tsx`
- Create: `frontend/src/features/calendar/calendar-copy.ts`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:**
- `CalendarMonthProps` accepts `month`, `onMonthChange`, `days`, `selectedDate`, `onSelectedDateChange`, `renderEvent(event, date)`, `variant: "public" | "admin"`, and localized control labels.
- `CalendarViewToggleProps` accepts `value: EventsView`, `onChange(view: EventsView)`, and labels; it uses `role="tablist"` with linked tab/panel ids.
- Calendar renderers create the actual `<Link>` or permitted admin button, so the generic module never imports routing/auth code.

- [ ] **Step 1: Write component-behavior tests for the testable seams**

Extend `calendar-domain.test.ts` with overflow and selection data assertions:

```ts
test("day event ordering is stable and exposes remainder count", () => {
  const event = (id: string, title: string) => ({ id, title, startDate: "2026-08-10", endDate: "2026-08-10" });
  const oneDayRange = (date: string) => ({ startDate: date, endDate: date });
  const days = buildCalendarDays([event("b", "Beta"), event("a", "Alpha"), event("c", "Gamma")], oneDayRange("2026-08-10"));
  assert.deepEqual(days[0].events.map(({ id }) => id), ["a", "b", "c"]);
  assert.equal(Math.max(days[0].events.length - 2, 0), 1);
});
```

- [ ] **Step 2: Run the test to verify the new assertion fails**

Run: `cd frontend && npx tsx --test src/features/calendar/calendar-domain.test.ts`

Expected: FAIL until deterministic sorting is present.

- [ ] **Step 3: Implement desktop/mobile and accessibility behavior**

Render seven named day columns on desktop. Each event item is visibly clipped after two entries and the overflow control updates `selectedDate` to that day. On small screens, retain one selectable button per date and render all selected-day events in an agenda below the grid. Month navigation must update `month` without changing the selected date unless it falls outside the next month, in which case select the first day of that month.

Use actual buttons for month, today, day, and overflow controls; include `aria-label` values such as `"10 August 2026, 2 events"`. Use locale-specific date-fns locales (`th`, `enUS`, `de`) and theme tokens only. Add all new keys under `EventsPage` in all three locale files: `previousMonth`, `nextMonth`, `today`, `moreEvents`, `noEventsOnDate`, `calendarInstructions`, and `viewLabel`.

- [ ] **Step 4: Verify behavior, a11y primitives, and build**

Run: `cd frontend && npx tsx --test src/features/calendar/calendar-domain.test.ts && npm run lint && ./node_modules/.bin/tsc --noEmit && npm run build`

Manual: at 375px and 1440px in each locale, tab through controls, activate a day and an overflow button, and confirm reduced-motion settings do not require animation.

- [ ] **Step 5: Commit the shared UI**

```bash
git add frontend/src/features/calendar frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json
git commit -m "feat: add accessible month calendar"
```

### Task 4: Integrate the public Events page and persisted visitor view

**Files:**
- Create: `frontend/src/features/public/events/calendar.ts`
- Create: `frontend/src/features/public/events/view-preference.ts`
- Create: `frontend/src/features/public/events/view-preference.test.ts`
- Modify: `frontend/src/app/[locale]/(client)/events/EventsContent.tsx`
- Modify: `frontend/src/app/[locale]/(client)/events/page.tsx`
- Modify: `frontend/src/features/public/events/mappers.ts`

**Interfaces:**
- `resolveEventsView(saved: unknown, defaultView: unknown): EventsView` returns a valid saved value first, then the valid global default, then `calendar`.
- `toPublicCalendarEvent(event, locale): CalendarEvent` returns an `href` of `/events/${slug}` and contains no admin-only status.
- `EVENTS_VIEW_STORAGE_KEY` is a named exported constant used only client-side.

- [ ] **Step 1: Write failing preference tests**

```ts
test("saved list view overrides the site calendar default", () => {
  assert.equal(resolveEventsView("list", "calendar"), "list");
});

test("unknown persisted values fall back to calendar", () => {
  assert.equal(resolveEventsView("week", "list"), "list");
  assert.equal(resolveEventsView(null, "invalid"), "calendar");
});
```

Implement the resolver with `value === "calendar" || value === "list"` guards; do not use a type assertion for persisted data.

- [ ] **Step 2: Run the preference tests to verify failure**

Run: `cd frontend && npx tsx --test src/features/public/events/view-preference.test.ts`

Expected: FAIL because the resolver does not exist.

- [ ] **Step 3: Wire public data, settings, and UI**

Keep a full upcoming-events query for the existing List panel and a separate visible-grid range query for Calendar. Prefetch the current visible grid range in the server page and hydrate it under the same query key. Render list/calendar panels without dropping the active panel's previous data while the next month fetches.

On first client render, resolve the view from the setting supplied by `usePublicSiteSettings`; read and write local storage inside effects/click handlers only to avoid hydration mismatch. Show the existing `EventsList`, `EventsListSkeleton`, `EmptyState`, and `QueryErrorState` for List; use parallel calendar-specific state messages for Calendar. The public calendar event renderer must use locale-aware `Link` and route to the existing detail page.

- [ ] **Step 4: Run focused tests and public verification**

Run: `cd frontend && npx tsx --test src/features/public/events/view-preference.test.ts src/features/calendar/calendar-domain.test.ts && npm run lint && ./node_modules/.bin/tsc --noEmit && npm run build`

Manual: clear local storage, verify the admin-selected default; choose the other view, reload, and verify precedence. Navigate across a month boundary with a multi-day event and verify every displayed day links to the same detail page.

- [ ] **Step 5: Commit public calendar integration**

```bash
git add frontend/src/features/public/events frontend/src/app/'[locale]'/'(client)'/events
git commit -m "feat: add public events calendar"
```

### Task 5: Integrate admin Calendar/List management and finish verification

**Files:**
- Create: `frontend/src/app/[locale]/admin/events/_components/AdminEventsCalendar.tsx`
- Modify: `frontend/src/app/[locale]/admin/events/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/settings/page.tsx`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

**Interfaces:**
- `AdminEventsCalendar` receives `events: readonly AdminCalendarSourceEvent[]`, `month`, `onMonthChange`, `canUpdate`, `locale`, and existing active filters, where `AdminCalendarSourceEvent = Pick<Event, "id" | "title" | "start_date" | "end_date" | "is_active">`.
- Its adapter sets `status: event.is_active ? "active" : "inactive"` and only assigns `href: /admin/events/${id}` when `canUpdate` is true.
- Admin calendar queries request `from`/`to` for the visible grid and preserve search/status/type filters; the table retains its existing `useAdminListState` list query.

- [ ] **Step 1: Add failing adapter tests**

Create `frontend/src/app/[locale]/admin/events/_components/AdminEventsCalendar.test.ts`:

```ts
test("inactive event is labeled but not hidden", () => {
  const inactiveEvent: AdminCalendarSourceEvent = { id: 42, title: { th: "งานบุญ", en: "Merit", de: "Verdienst" }, start_date: "2026-08-10", end_date: "2026-08-10", is_active: false };
  const calendarEvent = toAdminCalendarEvent(inactiveEvent, true);
  assert.equal(calendarEvent.status, "inactive");
  assert.equal(calendarEvent.href, "/admin/events/42");
});

test("read-only staff cannot navigate from calendar chip to edit", () => {
  const activeEvent: AdminCalendarSourceEvent = { id: 43, title: { th: "ปฏิบัติ", en: "Practice", de: "Praxis" }, start_date: "2026-08-11", end_date: "2026-08-11", is_active: true };
  assert.equal(toAdminCalendarEvent(activeEvent, false).href, undefined);
});
```

- [ ] **Step 2: Run the adapter tests to verify failure**

Run: `cd frontend && npx tsx --test src/app/'[locale]'/admin/events/_components/AdminEventsCalendar.test.ts`

Expected: FAIL because the adapter has not been implemented.

- [ ] **Step 3: Build admin integration and setting control**

Use the existing permission hook/guard pattern to derive `canUpdate`; keep the table's create, filters, selection, export, preview, deletion, pagination, and confirmation dialog mounted only in List view. Calendar view keeps relevant search/status/type controls and replaces table pagination with a visible-month range query; it preserves filter values when changing months.

Add a labelled select in the existing Public Website settings card for `events_default_view`, store the loaded value in local state, include it in `hasChanges` and `settingsAdminService.update`, and exclude the key from the generic setting list to prevent duplicate controls. Add Thai, English, and German admin message keys for the label and its two options.

- [ ] **Step 4: Run complete verification**

Run: `cd frontend && npx tsx --test src/features/calendar/calendar-domain.test.ts src/features/public/events/view-preference.test.ts src/app/'[locale]'/admin/events/_components/AdminEventsCalendar.test.ts && npm run lint && ./node_modules/.bin/tsc --noEmit && npm run build`

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./... && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./... && go build -o bin/server ./cmd/app`

Manual: verify admin Calendar/List switching, filters across a month change, inactive styling, create/edit/delete permissions, all three locales, 375px/1440px, and public keyboard navigation. Apply migration to an isolated database, inspect `events_default_view`, run the migration down there, and confirm only that setting is removed.

- [ ] **Step 5: Commit and inspect final diff**

```bash
git add frontend/src/app/'[locale]'/admin/events frontend/src/app/'[locale]'/admin/settings/page.tsx frontend/src/messages/admin
git commit -m "feat: add admin events calendar"
git diff --check HEAD~1..HEAD
git status --short
```

Expected: calendar changes are committed, whitespace check is clean, and unrelated pre-existing working-tree edits remain unstaged.

## Self-review

- Spec coverage: Tasks 1 and 3 deliver the reusable desktop/mobile/accessibility foundation; Task 2 delivers date overlap, settings, migration, OpenAPI, and contracts; Task 4 delivers public preference and detail navigation; Task 5 delivers admin navigation, status, filtering, and end-to-end verification.
- Explicitly deferred scope remains deferred: recurrence expansion, week/agenda views beyond mobile selected-day agenda, drag/drop, iCal feed, analytics, and empty-day creation.
- The only potentially unsafe test type assertion described in an early draft is explicitly disallowed; production and test helpers must accept and narrow `unknown` instead.
