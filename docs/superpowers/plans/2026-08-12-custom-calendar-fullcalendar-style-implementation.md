# Custom Calendar FullCalendar-style Presentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Admin Custom Calendar’s Month, Week, and Day views visually and behaviorally familiar to FullCalendar while retaining the local generic Calendar library and existing drawer.

**Architecture:** Keep the generic calendar core and Planning preset unchanged. Add pure ordering/summary seams to Month grid data, then inject presentation classes through generic callbacks into MonthView and TimeGrid. The Admin WAT adapter remains the only place that chooses status/tone classes and opens the drawer.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, date-fns, next-intl, Node test runner through `tsx --test`.

## Global Constraints

- Do not add FullCalendar or any new dependency.
- Do not add drag/drop, resize, recurrence, resource lanes/filtering, Timeline, Grid Day, event editing, or an API change.
- Keep `CalendarEvent<TMeta>` generic; generic views must not import WAT API types, Next.js router, TanStack Query, or locale services.
- Keep the public Discovery preset as Month + readable Week/Day agenda; it must not render TimeGrid.
- Preserve the Admin TimeGrid’s 08:00–20:00 window, 30-minute slots, all-day row, clipping, and overlap columns.
- Retain `th`, `en`, and `de` copy; no new messages are required because all displayed strings use the existing label contract.
- Maintain visible keyboard focus, 44px targets, and no page-level horizontal overflow.
- Do not modify user-owned `frontend/src/components/ui/DataTable.tsx` or `frontend/src/services/api.ts`.

---

## File map

| File | Responsibility |
| --- | --- |
| `frontend/src/features/calendar/core/agenda.ts` | Export one deterministic generic event comparator used by agenda and Month grid. |
| `frontend/src/features/calendar/core/agenda.test.ts` | Verify the comparator preserves all-day-first and deterministic timed ordering. |
| `frontend/src/features/calendar/views/month-grid.ts` | Sort a date cell’s events before limiting its visible bars. |
| `frontend/src/features/calendar/views/month-grid.test.ts` | Verify Month cells show all-day bars first and retain an accurate overflow count. |
| `frontend/src/features/calendar/views/MonthView.tsx` | Render FullCalendar-style Month bars with time/title and a complete selected-date panel. |
| `frontend/src/features/calendar/views/TimeGrid.tsx` | Accept generic event-class callbacks and render Planning event blocks with adapter-supplied tone. |
| `frontend/src/features/calendar/adapters/wat-calendar.ts` | Supply WAT-specific public/admin event bar class callbacks. |
| `frontend/src/features/calendar/adapters/wat-calendar.test.ts` | Verify tone selection stays at the adapter boundary. |
| `frontend/src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx` | Compose Month/Week/Day with Planning-specific renderer and class callbacks; preserve the drawer. |
| `frontend/src/features/calendar/views/calendar-views.test.ts` | Keep regression coverage proving Planning uses TimeGrid and Discovery does not. |

## Task 1: Establish deterministic Month event order in generic data

**Files:**
- Modify: `frontend/src/features/calendar/core/agenda.ts`
- Modify: `frontend/src/features/calendar/core/agenda.test.ts`
- Modify: `frontend/src/features/calendar/views/month-grid.ts`
- Modify: `frontend/src/features/calendar/views/month-grid.test.ts`

**Interfaces:**
- Produces `compareCalendarEvents<TMeta>(a: CalendarEvent<TMeta>, b: CalendarEvent<TMeta>): number`.
- `buildAgendaDays` and `buildMonthGrid` use the same all-day-first deterministic order.

- [ ] **Step 1: Write the failing Month ordering test**

  In `month-grid.test.ts`, import `CalendarEvent` from `../core/types`, add a generic fixture with `meta: {}`, and append:

  ```ts
  test("orders Month bars as all-day then timed by start while retaining overflow", () => {
    const entries = [
      event({ id: "late", start: "2026-08-12T10:00:00+02:00", end: "2026-08-12T11:00:00+02:00" }),
      event({ id: "all-day", allDay: true, start: "2026-08-12", end: "2026-08-13" }),
      event({ id: "early", start: "2026-08-12T09:00:00+02:00", end: "2026-08-12T09:30:00+02:00" }),
    ];
    const cell = buildMonthGrid({
      days: augustGridDays(), entries, monthDate: new Date(2026, 7, 12),
      selectedDate: new Date(2026, 7, 12), today: new Date(2026, 7, 12), maxVisibleEntries: 2,
    }).rows.flat().find((item) => item.key === "2026-08-12");

    assert.deepEqual(cell?.entries.map((item) => item.id), ["all-day", "early"]);
    assert.equal(cell?.overflowCount, 1);
  });
  ```

- [ ] **Step 2: Run the focused test and confirm it fails**

  Run: `cd frontend && npx tsx --test src/features/calendar/views/month-grid.test.ts`

  Expected: FAIL because `buildMonthGrid` keeps incoming order rather than the required presentation order.

- [ ] **Step 3: Export and reuse a generic comparator**

  In `core/agenda.ts`, export a comparator with this exact behavior:

  ```ts
  export function compareCalendarEvents<TMeta>(
    a: CalendarEvent<TMeta>,
    b: CalendarEvent<TMeta>,
  ): number {
    return (
      Number(b.allDay) - Number(a.allDay) ||
      a.start.localeCompare(b.start) ||
      a.end.localeCompare(b.end) ||
      a.title.localeCompare(b.title) ||
      a.id.localeCompare(b.id)
    );
  }
  ```

  This puts all-day events before timed events. Replace the private agenda comparator with this exported function. In `month-grid.ts`, import it and change `dayEntries` to:

  ```ts
  const dayEntries = entriesOnDay(entries, key).sort(compareCalendarEvents);
  ```

- [ ] **Step 4: Add direct comparator coverage**

  In `agenda.test.ts`, import `compareCalendarEvents` and add:

  ```ts
  test("compares all-day events before timed events", () => {
    const ordered = [
      event({ id: "timed", start: "2026-08-12T09:00:00+02:00", end: "2026-08-12T10:00:00+02:00" }),
      event({ id: "all-day", allDay: true, start: "2026-08-12", end: "2026-08-13" }),
    ].sort(compareCalendarEvents);

    assert.deepEqual(ordered.map((item) => item.id), ["all-day", "timed"]);
  });
  ```

- [ ] **Step 5: Run focused and aggregate tests**

  Run:

  ```bash
  cd frontend && npx tsx --test src/features/calendar/core/agenda.test.ts src/features/calendar/views/month-grid.test.ts
  cd frontend && npm run test:calendar
  ```

  Expected: all tests pass.

- [ ] **Step 6: Commit generic Month ordering**

  ```bash
  git add frontend/src/features/calendar/core/agenda.ts \
    frontend/src/features/calendar/core/agenda.test.ts \
    frontend/src/features/calendar/views/month-grid.ts \
    frontend/src/features/calendar/views/month-grid.test.ts
  git commit -m "feat: order calendar month events consistently"
  ```

## Task 2: Render FullCalendar-style generic Month event bars

**Files:**
- Modify: `frontend/src/features/calendar/views/MonthView.tsx`
- Modify: `frontend/src/features/calendar/views/month-grid.test.ts`

**Interfaces:**
- Extends `MonthViewProps<TMeta>` with:

  ```ts
  getEventClassName?: (
    event: CalendarEvent<TMeta>,
    density: "summary" | "row",
  ) => string;
  ```

- `formatTime(event, day)` supplies all-day/timed labels. `renderEvent` supplies domain-specific content only.

- [ ] **Step 1: Add a focused assertion for visible Month limits**

  In `month-grid.test.ts`, amend the existing overflow test to use `maxVisibleEntries: 2` and assert:

  ```ts
  assert.equal(cell?.entries.length, 2);
  assert.equal(cell?.overflowCount, 4);
  ```

  This is the presentation contract: two visible bars and a separate `+N more` action.

- [ ] **Step 2: Run the focused test**

  Run: `cd frontend && npx tsx --test src/features/calendar/views/month-grid.test.ts`

  Expected: PASS after Task 1; it protects the exact visible-bar contract before changing JSX.

- [ ] **Step 3: Add adapter-supplied bar classes and time labels**

  In `MonthView.tsx`:

  1. Add `getEventClassName` to `MonthViewProps<TMeta>` with the interface above.
  2. Define the default:

     ```ts
     const getEventClass = getEventClassName ?? (() => eventClassName);
     ```

  3. In desktop Month bars, render the returned `formatTime(event, cell.key)` before the title only when the event is not all-day and the formatter returns a value:

     ```tsx
     const time = formatTime(event, cell.key);
     <button className={`... ${getEventClass(event, "summary")}`}>
       {time && !event.allDay ? <span className="mr-1 font-medium">{time.slice(0, 5)}</span> : null}
       {renderSummary(event)}
     </button>
     ```

  4. Keep event bars one line, 32px minimum height, overflow-hidden, and square corners. The day cell remains `min-h-28`; do not add shadows or rounded cards.
  5. Replace the selected panel `CalendarEventRow` class with `getEventClass(event, "row")`; this preserves WAT tone in both summary and full detail contexts.
  6. Keep `+N more` as a 44px minimum button that calls `controller.selectDate(cell.date)`. The always-visible selected-date section provides the complete day detail list.

- [ ] **Step 4: Verify generic compilation and tests**

  Run:

  ```bash
  cd frontend && npm run test:calendar
  cd frontend && ./node_modules/.bin/tsc --noEmit
  cd frontend && npx eslint src/features/calendar/views/MonthView.tsx src/features/calendar/views/month-grid.ts
  ```

  Expected: all commands exit 0.

- [ ] **Step 5: Commit Month presentation**

  ```bash
  git add frontend/src/features/calendar/views/MonthView.tsx \
    frontend/src/features/calendar/views/month-grid.test.ts
  git commit -m "feat: present calendar month events as schedule bars"
  ```

## Task 3: Make Planning TimeGrid tone-aware without coupling it to WAT

**Files:**
- Modify: `frontend/src/features/calendar/views/TimeGrid.tsx`
- Modify: `frontend/src/features/calendar/views/time-grid.test.ts`

**Interfaces:**
- Extends `TimeGridProps<TEvent>` with:

  ```ts
  getEventClassName?: (
    event: TEvent,
    density: "timeGrid",
  ) => string;
  ```

- The generic component applies this class to both all-day and timed event blocks, and does not import WAT types.

- [ ] **Step 1: Add a generic TimeGrid fixture to the model test**

  In `time-grid.test.ts`, add this type-only fixture and assertion:

  ```ts
  import type { CalendarEvent } from "../core/types";

  const genericEvent: CalendarEvent<{ tone: "default" }> = {
    id: "generic", title: "Generic", start: "2026-08-12T09:00:00+02:00",
    end: "2026-08-12T10:00:00+02:00", allDay: false, meta: { tone: "default" },
  };

  test("accepts generic CalendarEvent metadata in the TimeGrid model", () => {
    const model = buildTimeGridModel({
      days: ["2026-08-12"], entries: [genericEvent],
      slotMinMinutes: 480, slotMaxMinutes: 1200, slotDurationMinutes: 30,
    });
    assert.equal(model.days[0]?.timedEntries[0]?.entry.meta.tone, "default");
  });
  ```

- [ ] **Step 2: Run the focused test**

  Run: `cd frontend && npx tsx --test src/features/calendar/views/time-grid.test.ts`

  Expected: PASS; this confirms the model boundary remains generic before adding presentation callbacks.

- [ ] **Step 3: Add class callback to TimeGrid JSX**

  In `TimeGrid.tsx`:

  1. Add `getEventClassName` to `TimeGridProps<TEvent>` and pass it from `TimeGrid` to `EventButton`.
  2. Add it to `EventButton` props with the same generic type.
  3. Apply `getEventClassName?.(event, "timeGrid") ?? "bg-current/5"` to the event button class in place of the fixed `bg-current/5`.
  4. Do not change `buildTimeGridModel`, its slot constants, calculated geometry, all-day row, or overlap logic.

- [ ] **Step 4: Run planning regression checks**

  Run:

  ```bash
  cd frontend && npx tsx --test src/features/calendar/views/time-grid.test.ts
  cd frontend && npm run test:calendar
  cd frontend && ./node_modules/.bin/tsc --noEmit
  cd frontend && npx eslint src/features/calendar/views/TimeGrid.tsx
  ```

  Expected: all commands exit 0.

- [ ] **Step 5: Commit generic TimeGrid presentation seam**

  ```bash
  git add frontend/src/features/calendar/views/TimeGrid.tsx \
    frontend/src/features/calendar/views/time-grid.test.ts
  git commit -m "feat: support calendar time grid event tones"
  ```

## Task 4: Compose the FullCalendar-style Planning presentation in Admin

**Files:**
- Modify: `frontend/src/features/calendar/adapters/wat-calendar.ts`
- Modify: `frontend/src/features/calendar/adapters/wat-calendar.test.ts`
- Modify: `frontend/src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx`
- Modify: `frontend/src/features/calendar/views/calendar-views.test.ts`

**Interfaces:**
- Produces:

  ```ts
  export function getWatEventBarClass(
    event: WatCalendarEvent,
    scope: CalendarScope,
    density: "summary" | "row" | "timeGrid",
  ): string;
  ```

- Admin passes `(event, density) => getWatEventBarClass(event, "admin", density)` to MonthView and TimeGrid.

- [ ] **Step 1: Write the failing adapter test**

  In `wat-calendar.test.ts`, import `getWatEventBarClass` and add:

  ```ts
  test("keeps Admin event bar tones in the WAT adapter", () => {
    const warning = toCalendarEvent(entry({ display: { tone: "warning" } }));
    const className = getWatEventBarClass(warning, "admin", "timeGrid");

    assert.match(className, /admin-warning/);
    assert.match(className, /border-l-2/);
  });
  ```

- [ ] **Step 2: Run the adapter test and confirm it fails**

  Run: `cd frontend && npx tsx --test src/features/calendar/adapters/wat-calendar.test.ts`

  Expected: FAIL because `getWatEventBarClass` does not exist.

- [ ] **Step 3: Implement the adapter-owned bar class**

  In `wat-calendar.ts`, implement:

  ```ts
  export function getWatEventBarClass(
    event: WatCalendarEvent,
    scope: CalendarScope,
    density: "summary" | "row" | "timeGrid",
  ): string {
    const toneClass = getWatEventToneClass(event, scope);
    return density === "summary"
      ? `${toneClass} border border-current/15`
      : `${toneClass} border border-current/15`;
  }
  ```

  Keep this intentionally simple: the density argument is part of the stable extension seam, while the current visual treatment is the same across densities. Do not export raw WAT fields into generic views.

- [ ] **Step 4: Update Admin composition**

  In `AdminCalendarContent.tsx`:

  1. Remove the unused `AgendaView` import and replace `renderAgenda` with `() => null`; Planning never selects agenda mode.
  2. Import `getWatEventBarClass`.
  3. Define one callback:

     ```ts
     const getEventBarClass = (
       event: WatCalendarEvent,
       density: "summary" | "row" | "timeGrid",
     ) => getWatEventBarClass(event, "admin", density);
     ```

  4. Pass `getEventClassName={getEventBarClass}` to `MonthView`.
  5. Pass `getEventClassName={(event) => getEventBarClass(event, "timeGrid")}` to `TimeGrid`.
  6. Keep `activateEvent` exactly as `setSelectedEntry(event.meta.originalEntry)` and keep the existing `CalendarEntryDrawer` unchanged.

- [ ] **Step 5: Preserve preset isolation coverage**

  In `calendar-views.test.ts`, retain both existing assertions:

  ```ts
  assert.notEqual(discoveryPreset.viewModes.week, "timeGrid");
  assert.equal(planningPreset.viewModes.week, "timeGrid");
  ```

  Add a direct Day check if missing:

  ```ts
  assert.notEqual(discoveryPreset.viewModes.day, "timeGrid");
  assert.equal(planningPreset.viewModes.day, "timeGrid");
  ```

- [ ] **Step 6: Run admin and preset verification**

  Run:

  ```bash
  cd frontend && npx tsx --test src/features/calendar/adapters/wat-calendar.test.ts src/features/calendar/views/calendar-views.test.ts
  cd frontend && npm run test:calendar
  cd frontend && ./node_modules/.bin/tsc --noEmit
  cd frontend && npx eslint src/features/calendar/adapters/wat-calendar.ts 'src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx'
  ```

  Expected: all commands exit 0.

- [ ] **Step 7: Commit Admin Planning composition**

  ```bash
  git add frontend/src/features/calendar/adapters/wat-calendar.ts \
    frontend/src/features/calendar/adapters/wat-calendar.test.ts \
    'frontend/src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx' \
    frontend/src/features/calendar/views/calendar-views.test.ts
  git commit -m "feat: refine admin calendar planning presentation"
  ```

## Task 5: Verify the visual contract in browser and production build

**Files:**
- Modify only if a concrete issue is observed during the checks above.

**Interfaces:**
- No new interface. This task proves the composed contract works with actual mock/feed data.

- [ ] **Step 1: Start local frontend with mock calendar data**

  Run:

  ```bash
  cd frontend && npm run dev
  ```

  Keep `NODE_ENV=development` and do not set `NEXT_PUBLIC_CALENDAR_SOURCE=api`, so the existing mock feed is used.

- [ ] **Step 2: Check Admin Month at desktop width**

  At 1200×800, open `/th/admin/calendar?view=month&date=2026-08-12` in an authenticated local session. Verify:

  - a complete seven-column grid is visible;
  - August 12 shows all-day bars before timed bars;
  - timed bars include their start time;
  - the overflow control selects the date and the selected-date panel exposes all activities;
  - clicking an event opens the existing drawer.

- [ ] **Step 3: Check Admin Week and Day at desktop width**

  Verify `/th/admin/calendar?view=week&date=2026-08-12` has a seven-column TimeGrid, all-day row, 08:00–20:00 axis, and visibly separated overlapping 09:00/09:30 entries. Switch to Day and verify the same TimeGrid geometry for one day.

- [ ] **Step 4: Check narrow viewport and keyboard behavior**

  At 390×844:

  - Month has no page-level horizontal overflow and its selected-date panel remains readable.
  - Week/Day horizontal scrolling, if needed, is limited to `[data-calendar-time-grid]`.
  - Focus Month tab, press ArrowRight, and verify Week becomes selected and receives focus.

- [ ] **Step 5: Run final static verification**

  Run:

  ```bash
  cd frontend && npm run test:calendar
  cd frontend && ./node_modules/.bin/tsc --noEmit
  cd frontend && npx eslint src/features/calendar src/components/layout/StickySocials.tsx 'src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx'
  NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED=false NEXT_PUBLIC_API_URL=https://example.com npm run build
  ```

  Expected: every command exits 0.

- [ ] **Step 6: Commit only concrete verification corrections**

  If browser checks required a code correction, stage only those corrected Calendar files and commit:

  ```bash
  git add frontend/src/features/calendar 'frontend/src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx'
  git commit -m "fix: polish custom calendar presentation"
  ```

  If no source file changed during browser verification, do not create an empty commit.

## Coverage review

- FullCalendar-style Admin Month overview: Tasks 1, 2, and 4.
- Shared Week/Day operational TimeGrid: Tasks 3 and 4.
- Existing drawer and WAT boundary: Task 4.
- Mobile, keyboard, overflow, locale, test, lint, and build requirements: Task 5.
- Custom implementation with future extension seams, without FullCalendar or excluded scheduling features: Global Constraints and Tasks 2–4.
