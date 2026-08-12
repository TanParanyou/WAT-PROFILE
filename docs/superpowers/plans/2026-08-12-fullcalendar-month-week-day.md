# FullCalendar-Reference Month, Week, and Day Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the existing calendar’s Month, Week, and Day views around the familiar FullCalendar DayGrid/TimeGrid patterns, while deferring DayGrid agenda and Timeline entirely.

**Architecture:** Keep the current controller, range query, date semantics, and event contract. Reduce the controller’s visible view set to `month | week | day`, add a shared TimeGrid display model for one or many columns, and render Week and Day through that same model. Month remains a DayGrid model with a full seven-column layout on both desktop and mobile; the mobile agenda is a companion below the grid rather than a replacement view.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, TanStack Query, `date-fns`, Node test runner through `tsx --test`.

## Required execution order

Execute the cohesive commits in this order: **Task 1 → Task 2 → Task 5 → Task 3 → Task 4 → Task 6**. Task 5 establishes the required localized TimeGrid label contract before Task 3 renders it; it is intentionally numbered later to group all localization work in one place.

## Global Constraints

- Do not add or embed FullCalendar; use it only as the confirmed UI reference.
- Current navigation exposes only `month`, `week`, and `day`; DayGrid agenda and Timeline are future scope and must not be accessible by a URL, saved preference, tab, or rendered component.
- Preserve the current calendar API, `CalendarEntry`, `CalendarFeed`, mock fixtures, and `Europe/Berlin` date semantics.
- Use `site-*` tokens only for public rendering and `admin-*` tokens only for admin rendering.
- Preserve `th`, `en`, and `de` visible copy. Add a message key in every matching public and admin locale file for every new visible string.
- All interactive controls need a 44px minimum target, visible focus indicator, and keyboard support.
- Do not use `any`, `as any`, or `@ts-ignore`.
- Do not modify or remove the deferred `DayGridView.tsx` or `TimelineView.tsx`; stop importing and routing to them only.

---

## File map

| File | Responsibility |
| --- | --- |
| `frontend/src/features/calendar/types.ts` | Narrow `CalendarView` to the current three-view product contract. |
| `frontend/src/features/calendar/useCalendar.ts` | Validate URL/local-storage views against the narrowed set and emit only supported view labels. |
| `frontend/src/features/calendar/useCalendar.test.ts` | Prove deferred view URLs and preferences fall back to Month. |
| `frontend/src/features/calendar/Calendar.tsx` | Render only Month, Week, and Day and keep calendar navigation usable for an empty successful feed. |
| `frontend/src/features/calendar/CalendarToolbar.tsx` | Render a view-aware Month/Week/Day range title from the controller date and visible range. |
| `frontend/src/features/calendar/CalendarViewTabs.tsx` | Expose exactly three tabs and retain roving keyboard focus. |
| `frontend/src/features/calendar/calendar-copy.ts` | Add labels required by the FullCalendar-style TimeGrid. |
| `frontend/src/messages/{th,en,de}.json` | Add public TimeGrid labels in all locales. |
| `frontend/src/messages/admin/{th,en,de}.json` | Add admin TimeGrid labels in all locales. |
| `frontend/src/app/[locale]/(client)/calendar/CalendarPageContent.tsx` | Supply complete public localized labels. |
| `frontend/src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx` | Supply complete admin localized labels. |
| `frontend/src/features/calendar/views/time-grid.ts` | Pure model for display slots, one shared time axis, per-day all-day/timed entries, and geometry. |
| `frontend/src/features/calendar/views/time-grid.test.ts` | Unit-test shared axis, 30-minute slots, operating-hour window, and overlap geometry. |
| `frontend/src/features/calendar/views/TimeGrid.tsx` | Render reusable Day TimeGrid from the display model. |
| `frontend/src/features/calendar/views/WeekView.tsx` | Render one FullCalendar-style weekly TimeGrid with a single axis and seven day columns. |
| `frontend/src/features/calendar/views/DayView.tsx` | Render a single-column instance of the same TimeGrid. |
| `frontend/src/features/calendar/views/MonthView.tsx` | Preserve the seven-column Month grid and improve selected/today semantics without duplicating range logic. |
| `frontend/src/features/calendar/views/calendar-views.test.ts` | Cover month overflow and TimeGrid overlap behavior after the view-set reduction. |

## Task 1: Restrict the product contract to Month, Week, and Day

**Files:**
- Modify: `frontend/src/features/calendar/types.ts`
- Modify: `frontend/src/features/calendar/useCalendar.ts`
- Modify: `frontend/src/features/calendar/useCalendar.test.ts`
- Modify: `frontend/src/features/calendar/CalendarViewTabs.tsx`
- Modify: `frontend/src/features/calendar/Calendar.tsx`

**Interfaces:**
- Consumes: the existing `CalendarView`, `CalendarController`, and URL keys `view` / `date`.
- Produces: `CalendarView = "month" | "week" | "day"`; URLs and saved views with `dayGrid` or `timeline` resolve to `month`, and an invalid `view` query is canonicalized to `view=month` on initial client render.

- [ ] **Step 1: Write fallback tests before narrowing the union**

  Add these cases to `useCalendar.test.ts`:

  ```ts
  test("deferred dayGrid and timeline views fall back to month", () => {
    const dayGrid = createCalendarState({
      initialView: "month",
      url: "?view=dayGrid&date=2026-08-12",
      weekStartsOn: 0,
    });
    const timeline = createCalendarState({
      initialView: "month",
      savedView: "timeline",
      url: "?date=2026-08-12",
      weekStartsOn: 0,
    });

    assert.equal(dayGrid.view, "month");
    assert.equal(timeline.view, "month");
  });
  ```

- [ ] **Step 2: Run the focused test and confirm the existing code fails**

  Run: `cd frontend && npx tsx --test src/features/calendar/useCalendar.test.ts`

  Expected: FAIL because both deferred values are currently accepted as `CalendarView`.

- [ ] **Step 3: Narrow controller and tab definitions**

  Apply these exact changes:

  ```ts
  // types.ts
  export type CalendarView = "month" | "week" | "day";

  // useCalendar.ts
  const calendarViews: readonly CalendarView[] = ["month", "week", "day"];

  // CalendarViewTabs.tsx
  const views: readonly CalendarView[] = ["month", "week", "day"];
  ```

  Remove `DayGridView` and `TimelineView` imports and render branches from `Calendar.tsx`. Make `getCalendarViewLabels` return only the three supported keys. Keep the now-unused optional `viewDayGrid` and `viewTimeline` compatibility fields in `CalendarLabels` until Task 5 removes those fields together with their page-level message reads; this keeps every intermediate commit type-checkable.

  In `useCalendar`, add a client effect that detects a present but unsupported `view` parameter and calls the existing `replaceUrl(view, date)`. This changes `?view=timeline&date=2026-08-12` to `?view=month&date=2026-08-12` without a user interaction. Do not add `view=month` merely because the URL had no `view` parameter.

- [ ] **Step 4: Keep a successful empty range navigable**

  In `Calendar.tsx`, render the toolbar and current Month/Week/Day view after a successful query even if `entries.length === 0`. Keep the empty notice inside the `data-calendar-view` region, below the active grid, rather than replacing the whole calendar shell. This preserves month/week/day navigation and makes the empty range understandable.

- [ ] **Step 5: Run controller and calendar tests**

  Run: `cd frontend && npm run test:calendar`

  Expected: PASS, including the new fallback test.

- [ ] **Step 6: Commit the scope reduction**

  ```bash
  git add frontend/src/features/calendar/types.ts \
    frontend/src/features/calendar/useCalendar.ts \
    frontend/src/features/calendar/useCalendar.test.ts \
    frontend/src/features/calendar/CalendarViewTabs.tsx \
    frontend/src/features/calendar/Calendar.tsx
  git commit -m "refactor: limit calendar to month week and day"
  ```

## Task 2: Add FullCalendar-style TimeGrid display semantics

**Files:**
- Create: `frontend/src/features/calendar/views/time-grid.ts`
- Create: `frontend/src/features/calendar/views/time-grid.test.ts`
- Modify: `frontend/src/features/calendar/views/calendar-view-utils.ts`

**Interfaces:**
- Consumes: `CalendarEntry`, `CalendarRange`, `entriesOnDay`, `buildTimedColumns`, and `getTimedPosition`.
- Produces: `buildTimeGridModel(input)` containing one shared slot axis and per-day all-day/timed display items for either Week or Day. Timed geometry stays attached to each day item, so a multi-day event cannot overwrite its own layout in another column.

- [ ] **Step 1: Write failing pure-model tests**

  Create `time-grid.test.ts` with a local `entry(overrides: Partial<CalendarEntry> = {})` helper matching the complete fixture shape in `month-grid.test.ts`, and include:

  ```ts
  test("uses one 30-minute time axis for all week columns", () => {
    const model = buildTimeGridModel({
      days: ["2026-08-09", "2026-08-10", "2026-08-11", "2026-08-12", "2026-08-13", "2026-08-14", "2026-08-15"],
      entries: [],
      slotMinMinutes: 8 * 60,
      slotMaxMinutes: 20 * 60,
      slotDurationMinutes: 30,
    });

    assert.equal(model.slots[0]?.minutes, 8 * 60);
    assert.equal(model.slots.at(-1)?.minutes, 19 * 60 + 30);
    assert.equal(model.days.length, 7);
    assert.ok(model.days.every((day) => day.timedEntries.length === 0));
  });

  test("keeps all-day entries above timed entries and divides overlaps", () => {
    const model = buildTimeGridModel({
      days: ["2026-08-12"],
      entries: [
        entry({ id: "all-day", allDay: true, start: "2026-08-12", end: "2026-08-13" }),
        entry({ id: "first", start: "2026-08-12T09:00:00+02:00", end: "2026-08-12T10:30:00+02:00" }),
        entry({ id: "second", start: "2026-08-12T09:30:00+02:00", end: "2026-08-12T11:00:00+02:00" }),
      ],
      slotMinMinutes: 8 * 60,
      slotMaxMinutes: 20 * 60,
      slotDurationMinutes: 30,
    });

    assert.equal(model.days[0]?.allDayEntries[0]?.id, "all-day");
    assert.equal(model.days[0]?.timedEntries.length, 2);
    assert.notEqual(model.days[0]?.timedEntries[0]?.position.column, model.days[0]?.timedEntries[1]?.position.column);
  });

  test("keeps a multi-day event's geometry with the day where it is rendered", () => {
    const model = buildTimeGridModel({
      days: ["2026-08-12", "2026-08-13"],
      entries: [
        entry({ id: "crosses-midnight", start: "2026-08-12T19:30:00+02:00", end: "2026-08-13T10:00:00+02:00" }),
        entry({ id: "overlap-next-day", start: "2026-08-13T09:30:00+02:00", end: "2026-08-13T11:00:00+02:00" }),
      ],
      slotMinMinutes: 8 * 60,
      slotMaxMinutes: 20 * 60,
      slotDurationMinutes: 30,
    });

    assert.equal(model.days[0]?.timedEntries[0]?.position.columnCount, 1);
    assert.equal(model.days[1]?.timedEntries.find((item) => item.entry.id === "crosses-midnight")?.position.columnCount, 2);
  });
  ```

- [ ] **Step 2: Run the model test and confirm it fails**

  Run: `cd frontend && npx tsx --test src/features/calendar/views/time-grid.test.ts`

  Expected: FAIL because `time-grid.ts` and `buildTimeGridModel` do not exist.

- [ ] **Step 3: Add the shared model with explicit contract**

  Create these exported types and function in `time-grid.ts`:

  ```ts
  export interface TimeGridSlot {
    minutes: number;
    isHour: boolean;
  }

  export interface TimeGridTimedEntry {
    entry: CalendarEntry;
    position: TimeGridPosition;
  }

  export interface TimeGridDay {
    date: string;
    allDayEntries: CalendarEntry[];
    timedEntries: TimeGridTimedEntry[];
  }

  export interface TimeGridPosition extends TimedEntryLayout {
    startMinutes: number;
    endMinutes: number;
  }

  export function buildTimeGridModel(input: {
    days: readonly string[];
    entries: readonly CalendarEntry[];
    slotMinMinutes: number;
    slotMaxMinutes: number;
    slotDurationMinutes: 30;
  }): {
    slots: TimeGridSlot[];
    days: TimeGridDay[];
  };
  ```

  Use an `08:00`–`20:00` operating window initially. For each day, use `entriesOnDay`, lay out only that day’s timed entries with `buildTimedColumns`, then attach that layout and the clipped visible-window position to each `TimeGridTimedEntry`. The model must not fetch, format localized labels, or render JSX.

- [ ] **Step 4: Correct TimeGrid positioning for the visible operating window**

  In `calendar-view-utils.ts`, add:

  ```ts
  export function getTimedPositionWithinWindow(
    entry: CalendarEntry,
    day: string,
    windowStartMinutes: number,
    windowEndMinutes: number,
  ): { startMinutes: number; endMinutes: number } | null;
  ```

  It must clip the full-day position into `[windowStartMinutes, windowEndMinutes]` and return `null` only when the clipped end is not after the clipped start. Do not expand a clipped event beyond the operating window; the renderer, not the model, supplies a CSS minimum height for a usable event target. Use it from `buildTimeGridModel`.

- [ ] **Step 5: Run the focused test and full calendar suite**

  Run:

  ```bash
  cd frontend && npx tsx --test src/features/calendar/views/time-grid.test.ts
  cd frontend && npm run test:calendar
  ```

  Expected: both PASS.

- [ ] **Step 6: Commit the TimeGrid model**

  ```bash
  git add frontend/src/features/calendar/views/time-grid.ts \
    frontend/src/features/calendar/views/time-grid.test.ts \
    frontend/src/features/calendar/views/calendar-view-utils.ts
  git commit -m "feat: add shared calendar time grid model"
  ```

## Task 3: Render a real shared TimeGrid for Week and Day

**Files:**
- Modify: `frontend/src/features/calendar/views/TimeGrid.tsx`
- Modify: `frontend/src/features/calendar/views/WeekView.tsx`
- Modify: `frontend/src/features/calendar/views/DayView.tsx`
- Modify: `frontend/src/features/calendar/views/calendar-views.test.ts`

**Interfaces:**
- Consumes: `buildTimeGridModel`, `CalendarEntryButton`, `CalendarController`, `CalendarLabels`, and the current variant-aware theme helpers.
- Produces: a `TimeGrid` component that accepts `days`, renders one axis plus N date columns, and drives both Week and Day presentation.

- [ ] **Step 1: Add render-contract tests to the existing view suite**

  In `calendar-views.test.ts`, add pure assertions around the TimeGrid model used by the views:

  ```ts
  test("week and day share an operating-hour time grid", () => {
    const week = buildTimeGridModel({ days: ["2026-08-09", "2026-08-10"], entries: [], slotMinMinutes: 480, slotMaxMinutes: 1200, slotDurationMinutes: 30 });
    const day = buildTimeGridModel({ days: ["2026-08-12"], entries: [], slotMinMinutes: 480, slotMaxMinutes: 1200, slotDurationMinutes: 30 });

    assert.equal(week.slots.length, day.slots.length);
    assert.equal(week.days.length, 2);
    assert.equal(day.days.length, 1);
  });
  ```

- [ ] **Step 2: Rework `TimeGrid` into the shared renderer**

  Replace the current one-day `h-[1440px]` renderer with this prop contract:

  ```ts
  interface TimeGridProps {
    days: readonly Date[];
    entries: readonly CalendarEntry[];
    labels: CalendarLabels;
    variant: CalendarVariant;
    onEntryActivate: (entry: CalendarEntry) => void;
    showDayHeaders: boolean;
    selectedDate?: Date;
    onDaySelect?: (date: Date) => void;
  }
  ```

  The output has, in order:

  1. one day-header row with date labels when `showDayHeaders` is true;
  2. one all-day header row (`labels.allDay`) and one all-day area per day;
  3. one left time axis; do not repeat time labels per day;
  4. 30-minute lanes from 08:00 to 20:00; label whole hours only;
  5. a localized accessible label for the timed region (`labels.timedEvents`), then positioned timed events that divide width when overlapping;
  6. `labels.noEventsOnDate` only for the single Day view with no all-day or timed events.

  Use CSS Grid for the left axis and day columns; put horizontal scrolling only on the outer TimeGrid pane. Use the existing `CalendarEntryButton`, preserving `variant`.

- [ ] **Step 3: Rework Week as one seven-column TimeGrid**

  In `WeekView.tsx`, call the new `TimeGrid` once with `getCalendarDays(controller.visibleRange)`, `showDayHeaders`, `selectedDate`, and `controller.selectDate`.

  Delete the current two-pass implementation that renders one header grid and seven separate 24-hour TimeGrid components. At width below `md`, pass `[controller.selectedDate]` so mobile is the exact same Day TimeGrid instead of seven stacked grids.

- [ ] **Step 4: Rework Day as one-column TimeGrid**

  In `DayView.tsx`, call the same `TimeGrid` with `[controller.selectedDate]` and `showDayHeaders={true}`. Do not wrap it in a separate horizontal-scrolling container; the shared TimeGrid owns that boundary.

- [ ] **Step 5: Run test, type-check, and focused lint**

  Run:

  ```bash
  cd frontend && npm run test:calendar
  cd frontend && ./node_modules/.bin/tsc --noEmit
  cd frontend && npx eslint src/features/calendar/views/TimeGrid.tsx src/features/calendar/views/WeekView.tsx src/features/calendar/views/DayView.tsx src/features/calendar/views/time-grid.ts
  ```

  Expected: all commands exit 0.

- [ ] **Step 6: Commit Week/Day TimeGrid rendering**

  ```bash
  git add frontend/src/features/calendar/views/TimeGrid.tsx \
    frontend/src/features/calendar/views/WeekView.tsx \
    frontend/src/features/calendar/views/DayView.tsx \
    frontend/src/features/calendar/views/calendar-views.test.ts
  git commit -m "feat: align week and day with time grid"
  ```

## Task 4: Complete the Month DayGrid and mobile agenda behavior

**Files:**
- Modify: `frontend/src/features/calendar/views/month-grid.ts`
- Modify: `frontend/src/features/calendar/views/month-grid.test.ts`
- Modify: `frontend/src/features/calendar/views/MonthView.tsx`
- Modify: `frontend/src/features/calendar/views/CalendarEntryButton.tsx`

**Interfaces:**
- Consumes: existing `buildMonthGrid`, `CalendarLabels`, and `CalendarEntryButton`.
- Produces: a Month view with FullCalendar-style desktop DayGrid and a mobile seven-column date grid with a selected-date agenda.

- [ ] **Step 1: Add explicit today and event-count tests**

  Change `BuildMonthGridInput` and cells to accept/expose `today: Date` and `isToday: boolean`. First add `today: new Date(2026, 7, 12)` to the two existing `buildMonthGrid` fixtures so the required input change remains explicit and deterministic. Add this test to `month-grid.test.ts`:

  ```ts
  test("marks today independently from the selected date", () => {
    const cell = buildMonthGrid({
      days: augustGridDays(),
      entries: [],
      monthDate: new Date(2026, 7, 12),
      selectedDate: new Date(2026, 7, 12),
      today: new Date(2026, 7, 14),
      maxVisibleEntries: 3,
    }).rows.flat().find((item) => item.key === "2026-08-14");

    assert.equal(cell?.isToday, true);
    assert.equal(cell?.isSelected, false);
  });
  ```

- [ ] **Step 2: Run the focused test and confirm it fails**

  Run: `cd frontend && npx tsx --test src/features/calendar/views/month-grid.test.ts`

  Expected: FAIL because `today` and `isToday` are not in the current model.

- [ ] **Step 3: Implement day-state classes and fully localized labels**

  In `MonthView.tsx`:

  - Pass `today: new Date()` to `buildMonthGrid`.
  - Render desktop weekday headers and cells exactly once; show all non-current dates muted rather than removed.
  - Apply a reserved today treatment distinct from selected-date treatment. The selected date is an interaction state; today is a factual date state.
  - Consume each cell's precomputed `entries` and `overflowCount` to render three event bars plus `labels.moreEvents(overflow)` on desktop; do not duplicate the daily range/overflow calculation in the component.
  - Mobile date cells show a date and numeric event count; their accessible name uses a localized date label plus `labels.eventsCount(count)`.
  - The agenda below the mobile grid displays a localized title using a new `labels.selectedDateLabel(date)` callback, then the day’s event buttons. It does not replace the grid.

  In `CalendarEntryButton.tsx`, preserve compact bars for Month but do not force `min-h-11` on those compact bars; Month’s event bars are dense content inside a 44px date-cell control. Keep `min-h-11` for non-compact interactive event rows.

- [ ] **Step 4: Run month tests and visual verification**

  Run: `cd frontend && npm run test:calendar`

  At `1200x800`, verify August 2026 has weekday headers, muted July/September dates, selected Aug 12, a distinct Today state when applicable, three visible bars, and `+ n` overflow. At `390x844`, verify the seven-column grid remains visible before the selected-day agenda and the page has no horizontal overflow.

- [ ] **Step 5: Commit the Month DayGrid refinement**

  ```bash
  git add frontend/src/features/calendar/views/month-grid.ts \
    frontend/src/features/calendar/views/month-grid.test.ts \
    frontend/src/features/calendar/views/MonthView.tsx \
    frontend/src/features/calendar/views/CalendarEntryButton.tsx
  git commit -m "feat: refine fullcalendar style month grid"
  ```

## Task 5: Complete localized labels, titles, and public/admin composition

**Files:**
- Modify: `frontend/src/features/calendar/calendar-copy.ts`
- Modify: `frontend/src/features/calendar/CalendarToolbar.tsx`
- Modify: `frontend/src/app/[locale]/(client)/calendar/CalendarPageContent.tsx`
- Modify: `frontend/src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

**Interfaces:**
- Consumes: `CalendarLabels` required by Month and TimeGrid.
- Produces: complete locale-backed labels and FullCalendar-style Month/Week/Day titles in public and admin UI without dayGrid/timeline tab labels.

- [ ] **Step 1: Extend the shared label contract**

  Update `CalendarLabels` to include:

  ```ts
  allDay: string;
  timedEvents: string;
  selectedDateLabel: (date: Date) => string;
  formatDayHeader: (date: Date, options: { includeWeekday: boolean }) => string;
  formatTime: (minutes: number) => string;
  periodLabel: (date: Date, visibleRange: CalendarRange, view: CalendarView) => string;
  ```

  Import `CalendarRange` and `CalendarView` as types from `types.ts`; remove the stale `CalendarView = "calendar" | "list"` declaration in `calendar-copy.ts`. Remove `viewDayGrid` and `viewTimeline`.

- [ ] **Step 2: Add locale keys in all six message files**

  Under each public `CalendarPage` and admin `calendar` object, add:

  ```json
  "allDay": "All-day label",
  "timedEvents": "Timed events label",
  "selectedDate": "Selected date label"
  ```

  Use these exact values:

  | Locale | `allDay` | `timedEvents` | `selectedDate` |
  | --- | --- | --- | --- |
  | th | `ทั้งวัน` | `ตามเวลา` | `กำหนดการวันที่ {date}` |
  | en | `All-day` | `Timed events` | `Schedule for {date}` |
  | de | `Ganztägig` | `Nach Uhrzeit` | `Programm für {date}` |

  Remove obsolete `views.dayGrid` and `views.timeline` keys only after no public/admin code reads them.

- [ ] **Step 3: Supply locale-aware formatter callbacks and a range-aware title**

  Change `CalendarToolbar` to call `labels.periodLabel(controller.date, controller.visibleRange, controller.view)`. In both page composition files, use their existing `dateFnsLocale` to implement:

  ```ts
  selectedDateLabel: (date) => t("selectedDate", { date: format(date, "PPP", { locale: dateFnsLocale }) }),
  formatDayHeader: (date, { includeWeekday }) => format(date, includeWeekday ? "EEE d" : "d", { locale: dateFnsLocale }),
  formatTime: (minutes) => format(new Date(2026, 0, 1, Math.floor(minutes / 60), minutes % 60), "HH:mm", { locale: dateFnsLocale }),
  ```

  Build `periodLabel` from the active view:

  - Month: `LLLL yyyy` from `date`, never from the leading visible-grid day.
  - Day: `PPP` from `date`.
  - Week: start/end from `visibleRange`, with a concise same-month form and a clear cross-month form (for example `9–15 Aug 2026` and `30 Aug – 5 Sep 2026`).

  The `2026-01-01` anchor is display-only; calendar events still retain their own Berlin date/time strings.

- [ ] **Step 4: Verify JSON and type safety**

  Run:

  ```bash
  cd frontend && node -e 'for (const file of ["src/messages/th.json","src/messages/en.json","src/messages/de.json","src/messages/admin/th.json","src/messages/admin/en.json","src/messages/admin/de.json"]) JSON.parse(require("node:fs").readFileSync(file,"utf8"))'
  cd frontend && ./node_modules/.bin/tsc --noEmit
  ```

  Expected: both exit 0.

- [ ] **Step 5: Commit localization and composition**

  ```bash
  git add frontend/src/features/calendar/calendar-copy.ts \
    frontend/src/features/calendar/CalendarToolbar.tsx \
    'frontend/src/app/[locale]/(client)/calendar/CalendarPageContent.tsx' \
    frontend/src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx \
    frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json \
    frontend/src/messages/admin/th.json frontend/src/messages/admin/en.json frontend/src/messages/admin/de.json
  git commit -m "feat: localize calendar time grid labels"
  ```

## Task 6: Verify user flows against the confirmed references

**Files:**
- No production files expected unless this verification exposes a localized copy or layout defect.

**Interfaces:**
- Consumes: all prior tasks and mock fixtures for `2026-08-12`.
- Produces: evidence that the public Calendar matches the agreed Month, Week, and Day presentation patterns.

- [ ] **Step 1: Run static verification**

  Run:

  ```bash
  cd frontend && npm run test:calendar
  cd frontend && ./node_modules/.bin/tsc --noEmit
  cd frontend && npx eslint src/features/calendar src/components/layout/PageHeader.tsx 'src/app/[locale]/(client)/calendar/CalendarPageContent.tsx' 'src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx'
  NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED=false NEXT_PUBLIC_API_URL=https://example.com npm run build
  ```

  Expected: every command exits 0. The build override is process-local and does not modify `.env.local`; it bypasses the repository’s production HTTPS guard for local verification only.

- [ ] **Step 2: Verify Month at desktop and mobile**

  Open `/th/calendar?view=month&date=2026-08-12` at `1200x800` and `390x844`. Confirm:

  - exactly three tabs: เดือน, สัปดาห์, วัน;
  - Month has one seven-column grid with weekday headers;
  - Aug 12 shows three bars and `+ อีก 3 รายการ` on desktop;
  - mobile shows a seven-column grid then the selected-date agenda;
  - neither page has horizontal overflow;
  - a fresh cookie-consent state does not cover a calendar control or event.

- [ ] **Step 3: Verify Week and Day semantics**

  Open `/th/calendar?view=week&date=2026-08-12` and `/th/calendar?view=day&date=2026-08-12`. Confirm:

  - Week has one shared left time axis, seven day columns, one all-day row, and overlapping 09:00/09:30 events divided across width;
  - mobile Week renders the selected day’s TimeGrid, not seven stacked time grids;
  - Day uses the same time axis and all-day row as Week, with one day column;
  - horizontal scroll remains inside the TimeGrid pane only.

- [ ] **Step 4: Verify URL and keyboard state**

  From Month, focus the active tab and press ArrowRight. Confirm focus and selection move to Week and the URL becomes `?view=week&date=2026-08-12`. Load `?view=timeline&date=2026-08-12` and confirm the controller falls back to Month and immediately canonicalizes the URL to `?view=month&date=2026-08-12`.

- [ ] **Step 5: Verify admin isolation**

  Under an authenticated local admin session, open `/th/admin/calendar?view=week&date=2026-08-12`. Confirm Month/Week/Day only, admin palette event chips/focus rings, and the existing entry drawer activation behavior.

- [ ] **Step 6: Commit only a verification-discovered correction**

  ```bash
  git add <only-files-corrected-by-verification>
  git commit -m "fix: complete calendar reference verification"
  ```

## Coverage review

- FullCalendar-like Month DayGrid and mobile companion agenda: Task 4.
- Shared-axis TimeGridWeek and TimeGridDay: Tasks 2 and 3.
- Only three views, including URL/local-storage fallback from deferred views: Task 1.
- All locales, public/admin composition, and no obsolete tabs: Task 5.
- Desktop/mobile, cookie first visit, keyboard, URL, admin, test/type/lint/build verification: Task 6.
- DayGrid agenda and Timeline are intentionally untouched and inaccessible; this is enforced in Task 1.
