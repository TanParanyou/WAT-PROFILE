# Calendar Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a self-built, mock-first global Calendar Platform with public `/calendar` and permission-aware `/admin/calendar`, five views, a small hook/component interface, and a server-shaped `CalendarEntry` contract.

**Architecture:** A shared `frontend/src/features/calendar` module owns navigation, URL/persistence state, range calculation, query state, layout models, and all five responsive views. A single public/admin calendar feed materializes Event records into source-neutral entries in Go; mock data implements the same typed response at the frontend data seam during development. Existing Events and Schedule list pages remain operational and do not use the new platform in this release.

**Tech Stack:** Next.js 16, React 19, TanStack Query, next-intl, date-fns/date-fns-tz, Tailwind 4, Go 1.25, Fiber v2, GORM, PostgreSQL.

## Global Constraints

- Do not add FullCalendar or any calendar dependency.
- Keep visitor-facing date semantics in `Europe/Berlin`; use date-only `YYYY-MM-DD` query bounds and ISO datetime entry boundaries.
- Preserve th/en/de localized data and add all public/admin message keys to the six relevant locale files.
- Do not use `any`, `as any`, or `@ts-ignore`; public data remains behind the feature API/query seam.
- `NEXT_PUBLIC_CALENDAR_SOURCE` accepts only `mock` or `api`; use mock only when `NODE_ENV=development`, and force API in production.
- Calendar v1 materializes `event` only. Do not interpret schedule recurrence or add a resource/place schema; return one `default` resource lane.
- Public calendar returns only active Events. Admin calendar requires `events:read`; each entry reports whether `events:update` is permitted.
- Retain existing Events/Schedules pages and existing `CalendarMonth` until the two new routes are verified; do not change lockout work already present in the tree.

---

### Task 1: Define the source-neutral Calendar contract and pure layout models

**Files:**
- Create: `frontend/src/features/calendar/types.ts`
- Create: `frontend/src/features/calendar/range.ts`
- Create: `frontend/src/features/calendar/layout.ts`
- Create: `frontend/src/features/calendar/range.test.ts`
- Create: `frontend/src/features/calendar/layout.test.ts`

**Interfaces:**
- Produces `CalendarView = "month" | "week" | "day" | "dayGrid" | "timeline"`, `CalendarScope = "public" | "admin"`, `CalendarEntry`, `CalendarResource`, `CalendarFeed`, and `CalendarRange`.
- Produces `getCalendarVisibleRange(date, view, weekStartsOn): CalendarRange`, `getCalendarStep(view): "month" | "week" | "day"`, `entriesForRange(entries, range)`, `buildTimedColumns(entries)`, `groupEntriesByResource(entries, resources)`, and `getCalendarOverflowCount(total, visibleLimit)`.
- `CalendarEntry.start`/`end` are ISO datetime strings; `allDay` entries use end-exclusive dates. `detail` has `{ href?: string; editorHref?: string; canEdit: boolean; description?: string; location?: string }`.

- [ ] **Step 1: Write failing range tests**

```ts
test("month range includes complete leading and trailing weeks", () => {
  assert.deepEqual(
    getCalendarVisibleRange(new Date(2026, 7, 12), "month", 1),
    { startDate: "2026-07-27", endDate: "2026-09-06" },
  );
});

test("week and day ranges use Berlin calendar-day boundaries", () => {
  assert.deepEqual(getCalendarVisibleRange(new Date(2026, 7, 12), "week", 1), {
    startDate: "2026-08-10", endDate: "2026-08-16",
  });
  assert.deepEqual(getCalendarVisibleRange(new Date(2026, 7, 12), "day", 1), {
    startDate: "2026-08-12", endDate: "2026-08-12",
  });
});
```

- [ ] **Step 2: Run range tests to verify they fail**

Run: `cd frontend && node --import tsx --test src/features/calendar/range.test.ts`

Expected: FAIL because `range.ts` and `getCalendarVisibleRange` do not exist.

- [ ] **Step 3: Write failing layout tests**

```ts
test("overlapping timed entries receive separate columns", () => {
  const layout = buildTimedColumns([
    entry({ id: "a", start: "2026-08-12T09:00:00+02:00", end: "2026-08-12T10:00:00+02:00" }),
    entry({ id: "b", start: "2026-08-12T09:30:00+02:00", end: "2026-08-12T11:00:00+02:00" }),
  ]);
  assert.equal(layout.get("a")?.columnCount, 2);
  assert.equal(layout.get("b")?.columnCount, 2);
});

test("entries without a resource use the default lane", () => {
  assert.equal(groupEntriesByResource([entry({ resourceId: undefined })], []).get("default")?.length, 1);
});
```

- [ ] **Step 4: Run layout tests to verify they fail**

Run: `cd frontend && node --import tsx --test src/features/calendar/layout.test.ts`

Expected: FAIL because the layout exports do not exist.

- [ ] **Step 5: Implement the types, inclusive range helpers, and layout algorithms**

```ts
export interface CalendarEntry {
  id: string;
  source: "event" | string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  resourceId?: string;
  status: "active" | "inactive";
  display: { tone: "default" | "muted" | "warning" };
  detail: { href?: string; editorHref?: string; canEdit: boolean; description?: string; location?: string };
}

export function getCalendarVisibleRange(date: Date, view: CalendarView, weekStartsOn: 0 | 1): CalendarRange {
  const day = startOfDay(date);
  if (view === "month") {
    return toRange(startOfWeek(startOfMonth(day), { weekStartsOn }), endOfWeek(endOfMonth(day), { weekStartsOn }));
  }
  if (view === "week") return toRange(startOfWeek(day, { weekStartsOn }), endOfWeek(day, { weekStartsOn }));
  return toRange(day, day);
}
```

Use strict parsing for date-only values, sort entries by start/end/title/id, treat `end` as exclusive for all-day entries, and ensure timed overlap columns are deterministic.

- [ ] **Step 6: Run pure-module tests**

Run: `cd frontend && node --import tsx --test src/features/calendar/range.test.ts src/features/calendar/layout.test.ts src/features/calendar/calendar-domain.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/calendar/types.ts frontend/src/features/calendar/range.ts frontend/src/features/calendar/layout.ts frontend/src/features/calendar/range.test.ts frontend/src/features/calendar/layout.test.ts
git commit -m "feat: add calendar platform domain"
```

### Task 2: Build mock-first calendar data seam and entry query hook

**Files:**
- Create: `frontend/src/features/calendar/api.ts`
- Create: `frontend/src/features/calendar/queries.ts`
- Create: `frontend/src/features/calendar/mock-data.ts`
- Create: `frontend/src/features/calendar/mock-data.test.ts`
- Create: `frontend/src/features/calendar/queries.test.ts`

**Interfaces:**
- Consumes `CalendarFeed`, `CalendarRange`, and `CalendarScope` from Task 1.
- Produces `fetchCalendarFeed({ scope, range, locale }): Promise<CalendarFeed>` and `useCalendarEntries({ scope, range, locale })`.
- Query key format is `['calendar', scope, locale, range.startDate, range.endDate]`; it uses `keepPreviousData`.

- [ ] **Step 1: Write failing mock-source tests**

```ts
test("development mock feed covers every calendar presentation case", async () => {
  const feed = await fetchCalendarFeed({
    scope: "admin", locale: "th", range: { startDate: "2026-08-01", endDate: "2026-08-31" },
  });
  assert.ok(feed.entries.some((entry) => entry.allDay));
  assert.ok(feed.entries.some((entry) => !entry.allDay));
  assert.ok(feed.entries.some((entry) => entry.status === "inactive"));
  assert.ok(feed.entries.some((entry) => entry.detail.canEdit));
});
```

- [ ] **Step 2: Run mock-source tests to verify they fail**

Run: `cd frontend && NODE_ENV=development NEXT_PUBLIC_CALENDAR_SOURCE=mock node --import tsx --test src/features/calendar/mock-data.test.ts`

Expected: FAIL because fetch and mock source do not exist.

- [ ] **Step 3: Implement the mock feed and source selection**

```ts
const canUseMockCalendar =
  process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_CALENDAR_SOURCE !== "api";

export async function fetchCalendarFeed(input: CalendarFeedRequest): Promise<CalendarFeed> {
  if (canUseMockCalendar) return getMockCalendarFeed(input);
  return fetchCalendarFeedFromApi(input);
}
```

Use fixed Berlin-dated fixtures around the requested visible range. Include cross-month multi-day, 3+ same-day overflow, two timed overlaps, one all-day entry, one inactive entry visible only in admin, and a `default` resource. Filter mock entries by inclusive range and by public/admin visibility.

- [ ] **Step 4: Implement API feed validation and the TanStack Query hook**

`api.ts` must call `/calendar` through `publicApi` for public scope and `/admin/calendar` through the authenticated admin service for admin scope. Validate the success envelope and narrow every unknown field before returning `CalendarFeed`; reject malformed entries instead of casting.

- [ ] **Step 5: Write and run query-key tests**

```ts
test("calendar query keys change with scope, locale, and visible range", () => {
  assert.notDeepEqual(calendarKeys.feed("public", "th", august), calendarKeys.feed("admin", "th", august));
  assert.notDeepEqual(calendarKeys.feed("public", "th", august), calendarKeys.feed("public", "de", august));
});
```

Run: `cd frontend && NODE_ENV=development NEXT_PUBLIC_CALENDAR_SOURCE=mock node --import tsx --test src/features/calendar/mock-data.test.ts src/features/calendar/queries.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/calendar/api.ts frontend/src/features/calendar/queries.ts frontend/src/features/calendar/mock-data.ts frontend/src/features/calendar/mock-data.test.ts frontend/src/features/calendar/queries.test.ts
git commit -m "feat: add mock-first calendar feed"
```

### Task 3: Implement the controller hook and accessible Calendar shell

**Files:**
- Create: `frontend/src/features/calendar/useCalendar.ts`
- Create: `frontend/src/features/calendar/useCalendar.test.ts`
- Create: `frontend/src/features/calendar/Calendar.tsx`
- Create: `frontend/src/features/calendar/CalendarToolbar.tsx`
- Create: `frontend/src/features/calendar/CalendarViewTabs.tsx`
- Create: `frontend/src/features/calendar/calendar-copy.ts`

**Interfaces:**
- Consumes Task 1 range/types and Task 2 query return type.
- Produces `useCalendar(options): CalendarController` where the controller has `{ view, date, selectedDate, visibleRange, previous(), next(), today(), setView(view), setDate(date), selectDate(date) }`.
- `Calendar` accepts `{ controller: CalendarController; query: UseQueryResult<CalendarFeed>; variant: 'public' | 'admin'; labels: CalendarLabels; onEntryActivate(entry): void }`.

- [ ] **Step 1: Write failing controller tests**

```ts
test("URL parameters override saved preference and navigation updates the visible range", () => {
  const controller = createCalendarState({
    initialView: "month", savedView: "week", url: "?view=day&date=2026-08-12", weekStartsOn: 1,
  });
  assert.equal(controller.view, "day");
  assert.equal(controller.visibleRange.startDate, "2026-08-12");
});

test("public and admin view preferences use different storage keys", () => {
  assert.notEqual(calendarPreferenceKey("public"), calendarPreferenceKey("admin"));
});
```

- [ ] **Step 2: Run controller tests to verify they fail**

Run: `cd frontend && node --import tsx --test src/features/calendar/useCalendar.test.ts`

Expected: FAIL because the controller helpers do not exist.

- [ ] **Step 3: Implement state precedence and browser synchronization**

Use `next/navigation` search params and router replacement only from the client hook. Validate `view` and strict `YYYY-MM-DD` values; URL overrides persisted storage, persisted storage overrides `initialView`, and invalid values resolve to `month`. Store public and admin preferences under distinct `wat-calendar-view:<scope>` keys.

- [ ] **Step 4: Implement toolbar and view tabs**

Use semantic `role="tablist"` buttons with roving focus and Arrow/Home/End behavior. The toolbar provides previous, today, and next controls. Every interactive control has a 44px minimum target and public/admin role-token classes.

- [ ] **Step 5: Implement Calendar loading/error/empty shell**

Keep the last successful entries rendered while fetching a new range. Render the toolbar and selected view even when the feed is empty. Use an inline refreshing status, a retry button for no-data errors, and a contextual empty message inside the active view.

- [ ] **Step 6: Run controller and targeted accessibility tests**

Run: `cd frontend && node --import tsx --test src/features/calendar/useCalendar.test.ts && ./node_modules/.bin/eslint src/features/calendar/useCalendar.ts src/features/calendar/Calendar.tsx src/features/calendar/CalendarToolbar.tsx src/features/calendar/CalendarViewTabs.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/calendar/useCalendar.ts frontend/src/features/calendar/useCalendar.test.ts frontend/src/features/calendar/Calendar.tsx frontend/src/features/calendar/CalendarToolbar.tsx frontend/src/features/calendar/CalendarViewTabs.tsx frontend/src/features/calendar/calendar-copy.ts
git commit -m "feat: add calendar controller and shell"
```

### Task 4: Implement the five internal calendar views

**Files:**
- Create: `frontend/src/features/calendar/views/MonthView.tsx`
- Create: `frontend/src/features/calendar/views/WeekView.tsx`
- Create: `frontend/src/features/calendar/views/DayView.tsx`
- Create: `frontend/src/features/calendar/views/DayGridView.tsx`
- Create: `frontend/src/features/calendar/views/TimelineView.tsx`
- Create: `frontend/src/features/calendar/views/CalendarEntryButton.tsx`
- Create: `frontend/src/features/calendar/views/calendar-views.test.ts`
- Modify: `frontend/src/features/calendar/Calendar.tsx`

**Interfaces:**
- Consumes `CalendarEntry`, `CalendarResource`, layout helpers, `CalendarController`, and `onEntryActivate` from Tasks 1–3.
- Produces five presentation-only views; views never call HTTP, localStorage, router APIs, or consume raw Event DTOs.

- [ ] **Step 1: Write failing view-model/component tests**

```ts
test("month view exposes overflow count and activates the selected date", () => {
  assert.equal(getCalendarOverflowCount(4, 2), 2);
});

test("week and day views render overlapping timed entries in separate columns", () => {
  const columns = buildTimedColumns(overlappingEntries);
  assert.notEqual(columns.get("first")?.column, columns.get("second")?.column);
});

test("dayGrid and timeline render the default resource lane", () => {
  assert.equal(groupEntriesByResource(entries, []).has("default"), true);
});
```

- [ ] **Step 2: Run view tests to verify they fail**

Run: `cd frontend && node --import tsx --test src/features/calendar/views/calendar-views.test.ts`

Expected: FAIL because view components do not exist.

- [ ] **Step 3: Implement MonthView and all-day DayGridView**

MonthView renders the complete visible month grid, inclusive multi-day chips, `+ n more`, and a selected-day agenda on narrow screens. DayGridView renders one selected day with a resource-lane header and the all-day entries for each lane; v1 always receives the `default` lane.

- [ ] **Step 4: Implement WeekView and DayView time grids**

Render 00:00–24:00 slots in 30-minute intervals. Position timed entries using minute offsets and Task 1 overlap columns. Render all-day entries in a dedicated row before time slots. On small screens, WeekView presents a horizontal day strip and the selected day’s DayView rather than compressing seven time columns.

- [ ] **Step 5: Implement TimelineView and shared entry activation**

TimelineView renders a 24-hour horizontal scale with resource lanes as rows and uses the same offset/width calculation as time grids. `CalendarEntryButton` announces title, date/time, source, and status; it calls `onEntryActivate(entry)` without knowing public/admin navigation behavior.

- [ ] **Step 6: Wire all views into the Calendar shell and run tests**

Run: `cd frontend && node --import tsx --test src/features/calendar/views/calendar-views.test.ts src/features/calendar/range.test.ts src/features/calendar/layout.test.ts && ./node_modules/.bin/tsc --noEmit`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/calendar/views frontend/src/features/calendar/Calendar.tsx
git commit -m "feat: add calendar platform views"
```

### Task 5: Add server-owned Calendar feed contracts and Event materializer

**Files:**
- Create: `backend/internal/calendar/types.go`
- Create: `backend/internal/calendar/event_source.go`
- Create: `backend/internal/calendar/event_source_test.go`
- Create: `backend/internal/handlers/calendar_handler.go`
- Create: `backend/internal/handlers/calendar_handler_test.go`
- Modify: `backend/internal/routes/routes.go`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**
- Produces `calendar.Feed`, `calendar.Entry`, `calendar.Resource`, `calendar.Request`, and `calendar.Source`.
- Produces `CalendarHandler.GetPublic` and `CalendarHandler.GetAdmin`.
- Public contract: `GET /api/v1/public/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD&locale=th|en|de`.
- Admin contract: `GET /api/v1/admin/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD&locale=th|en|de`, registered with `Resource: "events", Action: "read"`.

- [ ] **Step 1: Write failing Event materializer tests**

```go
func TestEventSourceMaterializesLocalizedCalendarEntry(t *testing.T) {
  entry := source.Entry(models.Event{
    ID: 42, Title: models.MultiLangText{"th": "งานบุญ", "en": "Merit", "de": "Verdienst"},
    StartDate: mustDate("2026-08-10"), EndDate: mustDate("2026-08-12"), IsActive: true,
  }, "de", true)
  if entry.Title != "Verdienst" || entry.Source != "event" || !entry.AllDay || !entry.Detail.CanEdit {
    t.Fatalf("unexpected entry: %#v", entry)
  }
}

func TestEventSourceUsesExclusiveEndForAllDayEntries(t *testing.T) {
  entry := source.Entry(eventFrom("2026-08-10", "2026-08-12"), "th", false)
  if entry.End != "2026-08-13" { t.Fatalf("end = %s", entry.End) }
}
```

- [ ] **Step 2: Run materializer tests to verify they fail**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/calendar -run EventSource -v`

Expected: FAIL because the calendar package does not exist.

- [ ] **Step 3: Implement source-neutral server contracts and Event source**

`calendar.Source` exposes `Name() string` and `List(ctx context.Context, request Request, canEdit bool) ([]Entry, error)`. `EventSource` queries active Events for public requests and all overlapping Events for admin requests, resolves the requested locale with Thai fallback, converts all-day inclusive Event end dates to exclusive feed ends, returns `default` resource, and builds `/events/:slug`/`/admin/events/:id` targets. Do not return model descriptions as rich HTML; expose the safe localized text summary only.

- [ ] **Step 4: Write failing handler tests**

```go
func TestPublicCalendarRejectsMissingRangeAndUnsupportedLocale(t *testing.T) {
	app := newCalendarHTTPTestApp(t)
	for _, path := range []string{
		"/api/v1/public/calendar?to=2026-08-31&locale=th",
		"/api/v1/public/calendar?from=2026-08-01&to=2026-08-31&locale=fr",
	} {
		response, err := app.Test(httptest.NewRequest(http.MethodGet, path, nil))
		if err != nil { t.Fatal(err) }
		if response.StatusCode != fiber.StatusBadRequest { t.Fatalf("%s: got %d", path, response.StatusCode) }
	}
}

func TestAdminCalendarRouteRequiresEventsReadPermission(t *testing.T) {
	app := newCalendarHTTPTestApp(t)
	request := httptest.NewRequest(http.MethodGet, "/api/v1/admin/calendar?from=2026-08-01&to=2026-08-31&locale=th", nil)
	response, err := app.Test(request)
	if err != nil { t.Fatal(err) }
	if response.StatusCode != fiber.StatusUnauthorized && response.StatusCode != fiber.StatusForbidden {
		t.Fatalf("got %d, want authentication or permission denial", response.StatusCode)
	}
}
```

- [ ] **Step 5: Implement handlers, route registration, and OpenAPI**

Parse both range values as required strict dates, reject `from > to`, accept only `th`, `en`, and `de`, and set `Europe/Berlin` in response metadata. Register public handler under the existing public group and admin handler in `adminRouteDefinitions`; add both handler-map entries. Document query parameters, 200 feed schema, and 400/401/403 responses in OpenAPI.

- [ ] **Step 6: Run backend calendar tests**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/calendar ./internal/handlers ./internal/routes -run 'Calendar|EventSource' -v`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/internal/calendar backend/internal/handlers/calendar_handler.go backend/internal/handlers/calendar_handler_test.go backend/internal/routes/routes.go backend/docs/openapi.yaml
git commit -m "feat: add calendar feed endpoints"
```

### Task 6: Connect API mode, add public calendar route, and migrate entry-point navigation

**Files:**
- Create: `frontend/src/app/[locale]/(client)/calendar/page.tsx`
- Create: `frontend/src/app/[locale]/(client)/calendar/CalendarPageContent.tsx`
- Modify: `frontend/src/features/calendar/api.ts`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`
- Modify: `frontend/src/components/layout/Footer.tsx`

**Interfaces:**
- Consumes `useCalendar`, `useCalendarEntries`, and `Calendar` from Tasks 2–4.
- Uses the Task 5 public feed when `NEXT_PUBLIC_CALENDAR_SOURCE=api` or in production.

- [ ] **Step 1: Write failing public page data tests**

```ts
test("API feed client requests a locale and inclusive visible range", async () => {
  await fetchCalendarFeedFromApi({ scope: "public", locale: "de", range: august });
  assert.deepEqual(mockedRequest.params, { from: august.startDate, to: august.endDate, locale: "de" });
});
```

- [ ] **Step 2: Run public data tests to verify they fail**

Run: `cd frontend && node --import tsx --test src/features/calendar/queries.test.ts`

Expected: FAIL until the API-mode request is implemented against `/calendar`.

- [ ] **Step 3: Implement public route and user-facing activation**

`CalendarPageContent` sets `scope: "public"`, derives `weekStartsOn` from next-intl locale, calls both hooks, and supplies `onEntryActivate` that uses locale-aware `Link` navigation to `entry.detail.href`. The page sets Calendar metadata and prefetches only when API mode is active. Add `CalendarPage` messages for title, view labels, previous/next/today, loading, retry, empty, source, status, and accessible descriptions in th/en/de.

- [ ] **Step 4: Add a public Calendar link without replacing Events**

Add one locale-aware calendar link in the public Footer/navigation area that points to `/calendar`. Do not alter the Events list/schedules page or its existing view toggle in this task.

- [ ] **Step 5: Run public route checks**

Run: `cd frontend && NODE_ENV=development NEXT_PUBLIC_CALENDAR_SOURCE=mock node --import tsx --test src/features/calendar/mock-data.test.ts src/features/calendar/queries.test.ts && ./node_modules/.bin/tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/'[locale]'/'(client)'/calendar frontend/src/features/calendar/api.ts frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json frontend/src/components/layout/Footer.tsx
git commit -m "feat: add public calendar platform page"
```

### Task 7: Add Admin Calendar route, permission-aware drawer, and navigation

**Files:**
- Create: `frontend/src/app/[locale]/admin/calendar/page.tsx`
- Create: `frontend/src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx`
- Create: `frontend/src/app/[locale]/admin/calendar/_components/CalendarEntryDrawer.tsx`
- Create: `frontend/src/app/[locale]/admin/calendar/_components/CalendarEntryDrawer.test.ts`
- Modify: `frontend/src/components/admin/AdminSidebar.tsx`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

**Interfaces:**
- Consumes the shared Calendar module; admin route never maps Event DTOs or evaluates update permission itself.
- `CalendarEntryDrawer` accepts `{ entry: CalendarEntry | null; open: boolean; onClose(): void }` and uses only `entry.detail.canEdit` to show the editor link.

- [ ] **Step 1: Write failing drawer permission tests**

```ts
test("drawer renders entry details but hides editor action when canEdit is false", () => {
  const view = renderDrawer(entry({ detail: { canEdit: false, editorHref: "/admin/events/42" } }));
  assert.equal(view.getByText("Merit gathering").isConnected, true);
  assert.equal(view.queryByRole("link", { name: /edit/i }), null);
});
```

- [ ] **Step 2: Run drawer tests to verify they fail**

Run: `cd frontend && node --import tsx --test src/app/'[locale]'/admin/calendar/_components/CalendarEntryDrawer.test.ts`

Expected: FAIL because the drawer component does not exist.

- [ ] **Step 3: Implement Admin Calendar content and drawer**

`AdminCalendarContent` uses `scope: "admin"`, passes the server feed to `Calendar`, and sets the selected entry into the existing shared `Drawer`. The drawer shows source, status, date/time, location, summary, and a localized editor link only when `canEdit` is true. It does not provide create, drag/drop, or mutation actions.

- [ ] **Step 4: Add sidebar entry and complete locale copy**

Add `/admin/calendar` under the Events/Schedules admin navigation with the Calendar icon and `events` read resource guard. Add all drawer, source, status, and view labels to admin th/en/de messages.

- [ ] **Step 5: Run Admin route checks**

Run: `cd frontend && NODE_ENV=development NEXT_PUBLIC_CALENDAR_SOURCE=mock node --import tsx --test src/app/'[locale]'/admin/calendar/_components/CalendarEntryDrawer.test.ts && ./node_modules/.bin/tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/'[locale]'/admin/calendar frontend/src/components/admin/AdminSidebar.tsx frontend/src/messages/admin/th.json frontend/src/messages/admin/en.json frontend/src/messages/admin/de.json
git commit -m "feat: add admin calendar platform page"
```

### Task 8: Retire the duplicated calendar wiring and verify the complete slice

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/events/EventsContent.tsx`
- Modify: `frontend/src/app/[locale]/admin/events/page.tsx`
- Modify: `frontend/src/features/calendar/CalendarMonth.tsx`
- Modify: `frontend/src/features/calendar/CalendarViewToggle.tsx`
- Modify: `frontend/src/features/calendar/calendar-domain.ts`
- Modify: `frontend/src/features/calendar/calendar-domain.test.ts`

**Interfaces:**
- Consumes the new public `/calendar` and admin `/admin/calendar` routes from Tasks 6–7.
- Produces Events list pages that no longer duplicate calendar range/mapping/query logic.

- [ ] **Step 1: Write regression checks for legacy-page behavior**

```ts
test("legacy Events route keeps schedule and list sections without importing calendar layout helpers", async () => {
  const source = await readFile("src/app/[locale]/(client)/events/EventsContent.tsx", "utf8");
  assert.equal(source.includes("buildCalendarDays"), false);
  assert.equal(source.includes("SchedulesSection"), true);
});
```

- [ ] **Step 2: Run regression check to verify it fails**

Run: `cd frontend && node --import tsx --test src/features/calendar/calendar-domain.test.ts`

Expected: FAIL until legacy pages stop importing old calendar code.

- [ ] **Step 3: Remove old embedded Calendar/List calendar rendering**

Keep existing Event list/table, filters, Schedule section, event alert use, and event-detail routes. Replace embedded calendar controls with a localized link to the new global calendar route. Delete `CalendarMonth`, `CalendarViewToggle`, old `calendar-domain` code, and their tests only after no import remains.

- [ ] **Step 4: Run repository-wide calendar import check**

Run: `rg "CalendarMonth|CalendarViewToggle|buildCalendarDays|getMonthGridRange|toPublicCalendarEvent|toAdminCalendarEvent" frontend/src`

Expected: no result except explicit migration comments, which should be removed before commit.

- [ ] **Step 5: Run complete verification**

Run:

```bash
cd frontend && node --import tsx --test src/features/calendar/**/*.test.ts && ./node_modules/.bin/tsc --noEmit && npm run lint && NEXT_PUBLIC_API_URL=https://api.example.invalid NEXT_PUBLIC_CALENDAR_SOURCE=api npm run build -- --webpack
cd ../backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./... && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./... && GOCACHE=/private/tmp/wat-profile-go-cache go build -o bin/server ./cmd/app
```

Expected: all Calendar tests/type checks/backend checks/build pass. If full frontend lint reports pre-existing errors outside changed files, run and report targeted lint for each calendar file and list the unrelated failures separately.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/'[locale]'/'(client)'/events/EventsContent.tsx frontend/src/app/'[locale]'/admin/events/page.tsx frontend/src/features/calendar
git commit -m "refactor: retire embedded events calendars"
```
