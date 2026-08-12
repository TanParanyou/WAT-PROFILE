# Calendar Discovery Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the calendar into a local reusable core with Discovery and Planning presets, then make the public client use the readable Discovery experience while preserving the current admin planning behavior.

**Architecture:** Split generic calendar domain logic and visual primitives from WAT-specific API, router, locale, and theme adapters. The public adapter maps the existing feed into `CalendarEvent<CalendarEntryMeta>` and mounts the Discovery preset; the admin adapter mounts the Planning preset, which retains the current TimeGrid semantics. No package is published and no HTTP moves into the calendar library.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, TanStack Query, date-fns, next-intl, Node test runner through `tsx --test`.

## Global Constraints

- Do not add FullCalendar, a backend endpoint, drag/drop, recurrence, resource UI, Timeline, Grid Day, or event editing.
- Preserve the current `/calendar` feed, mock-data fallback, `Europe/Berlin` semantics, inclusive range dates, and exclusive all-day end dates.
- `CalendarEvent<TMeta>` is data-in only; core and UI primitives must not import Axios, TanStack Query, Next.js routing, `next-intl`, WAT API types, `site-*`, or `admin-*` tokens.
- Preserve visible public copy in `th`, `en`, and `de`; all new labels exist in all matching message files.
- Keep public and admin themes separate through adapter-supplied class names or CSS-variable-compatible theme input.
- Keep all controls keyboard operable with visible focus and a 44px target; prevent page-level horizontal overflow at all breakpoints.
- Do not use `any`, `as any`, or `@ts-ignore`.
- Leave the user-owned changes in `frontend/src/components/ui/DataTable.tsx` and `frontend/src/services/api.ts` untouched.

---

## File map

| File | Responsibility |
| --- | --- |
| `frontend/src/features/calendar/core/types.ts` | Generic event/resource/view contracts with no WAT fields. |
| `frontend/src/features/calendar/core/calendar-state.ts` | Pure visible-range, step, date, and supported-view helpers. |
| `frontend/src/features/calendar/core/agenda.ts` | Pure per-day grouping and deterministic ordering for Discovery lists. |
| `frontend/src/features/calendar/core/*.test.ts` | Unit coverage for core state and agenda behavior. |
| `frontend/src/features/calendar/ui/CalendarRoot.tsx` | Generic controlled/uncontrolled shell that selects an explicit preset and never fetches. |
| `frontend/src/features/calendar/ui/AgendaView.tsx` | Reusable Week/Day readable register UI. |
| `frontend/src/features/calendar/ui/CalendarEventRow.tsx` | Generic accessible event row with caller-provided content/action renderer. |
| `frontend/src/features/calendar/presets/discovery.ts` | Month + agenda Week/Day configuration and mobile behavior. |
| `frontend/src/features/calendar/presets/planning.ts` | Month + existing TimeGrid Week/Day configuration. |
| `frontend/src/features/calendar/adapters/wat-calendar.ts` | Maps `CalendarEntry` to `CalendarEvent<CalendarEntryMeta>` and supplies tone/detail accessors. |
| `frontend/src/features/calendar/Calendar.tsx` | Temporary compatibility wrapper replaced with the adapter-driven root or deleted after both WAT callers migrate. |
| `frontend/src/app/[locale]/(client)/calendar/CalendarPageContent.tsx` | Public Discovery adapter, `next-intl` labels, navigation/detail behavior. |
| `frontend/src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx` | Admin Planning adapter and existing drawer activation. |
| `frontend/src/features/calendar/views/*` | Move/simplify current Month/TimeGrid renderers so generic primitives own layout; retain planning semantics. |
| `frontend/package.json` | Include core/preset tests in `test:calendar`. |

## Task 1: Establish framework-neutral calendar contracts and state helpers

**Files:**
- Create: `frontend/src/features/calendar/core/types.ts`
- Create: `frontend/src/features/calendar/core/calendar-state.ts`
- Create: `frontend/src/features/calendar/core/calendar-state.test.ts`
- Modify: `frontend/src/features/calendar/types.ts`
- Modify: `frontend/src/features/calendar/range.ts`
- Modify: `frontend/src/features/calendar/useCalendar.ts`
- Modify: `frontend/src/features/calendar/useCalendar.test.ts`
- Modify: `frontend/package.json`

**Interfaces:**
- Produces `CalendarEvent<TMeta>`, `CalendarResource`, `CalendarView`, `CalendarRange`, and pure `getVisibleRange`, `getViewStep`, `shiftCalendarDate` functions.
- Keeps `CalendarEntry` as the WAT feed DTO; it must not become the generic UI contract.

- [ ] **Step 1: Write failing core-state tests**

  Add `calendar-state.test.ts`:

  ```ts
  import assert from "node:assert/strict";
  import test from "node:test";
  import { getVisibleRange, shiftCalendarDate } from "./calendar-state";

  test("shifts Month, Week, and Day by their visible unit", () => {
    const date = new Date(2026, 7, 12);
    assert.equal(shiftCalendarDate(date, "month", 1).getMonth(), 8);
    assert.equal(shiftCalendarDate(date, "week", 1).getDate(), 19);
    assert.equal(shiftCalendarDate(date, "day", 1).getDate(), 13);
  });

  test("returns a complete month range and a seven-day week range", () => {
    assert.deepEqual(getVisibleRange(new Date(2026, 7, 12), "month", 0), { startDate: "2026-07-26", endDate: "2026-09-05" });
    assert.deepEqual(getVisibleRange(new Date(2026, 7, 12), "week", 0), { startDate: "2026-08-09", endDate: "2026-08-15" });
  });
  ```

- [ ] **Step 2: Run the new test and confirm it fails**

  Run: `cd frontend && npx tsx --test src/features/calendar/core/calendar-state.test.ts`

  Expected: FAIL because `core/calendar-state.ts` does not exist.

- [ ] **Step 3: Add generic core contracts**

  Create `core/types.ts` with these exact exports:

  ```ts
  export type CalendarView = "month" | "week" | "day";

  export interface CalendarRange {
    startDate: string;
    endDate: string;
  }

  export interface CalendarEvent<TMeta = Record<string, never>> {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    resourceId?: string;
    meta: TMeta;
  }

  export interface CalendarResource {
    id: string;
    title: string;
    color?: string;
  }
  ```

  In `types.ts`, re-export core `CalendarView`, `CalendarRange`, and `CalendarResource`; keep `CalendarScope`, `CalendarLocale`, `CalendarEntry`, and `CalendarFeed` there as WAT-only API contracts.

- [ ] **Step 4: Implement the pure state seam and delegate old imports**

  Implement `getVisibleRange(date, view, weekStartsOn)`, `getViewStep(view)`, and `shiftCalendarDate(date, view, direction)` in `core/calendar-state.ts`, using `date-fns` and date-only `yyyy-MM-dd` output. Move the corresponding implementation from `range.ts` into the core module, then leave exported compatibility wrappers in `range.ts` so the current query/controller calls compile during the migration.

  Update `useCalendar.ts` to import the pure helpers from core. Its URL and local-storage behavior remains unchanged: only Month/Week/Day are valid, and a present unsupported URL view canonicalizes to Month.

- [ ] **Step 5: Include nested core tests in the existing script**

  Change `test:calendar` to:

  ```json
  "test:calendar": "NODE_ENV=development tsx --test src/features/calendar/*.test.ts src/features/calendar/core/*.test.ts src/features/calendar/presets/*.test.ts src/features/calendar/adapters/*.test.ts src/features/calendar/views/*.test.ts"
  ```

- [ ] **Step 6: Run focused and aggregate tests**

  Run:

  ```bash
  cd frontend && npx tsx --test src/features/calendar/core/calendar-state.test.ts
  cd frontend && npm run test:calendar
  ```

  Expected: both commands pass.

- [ ] **Step 7: Commit the core state extraction**

  ```bash
  git add frontend/src/features/calendar/core/types.ts \
    frontend/src/features/calendar/core/calendar-state.ts \
    frontend/src/features/calendar/core/calendar-state.test.ts \
    frontend/src/features/calendar/types.ts frontend/src/features/calendar/range.ts \
    frontend/src/features/calendar/useCalendar.ts frontend/src/features/calendar/useCalendar.test.ts \
    frontend/package.json
  git commit -m "refactor: extract calendar core contracts"
  ```

## Task 2: Add a pure Discovery agenda model

**Files:**
- Create: `frontend/src/features/calendar/core/agenda.ts`
- Create: `frontend/src/features/calendar/core/agenda.test.ts`
- Modify: `frontend/src/features/calendar/views/calendar-view-utils.ts`

**Interfaces:**
- Consumes `CalendarEvent<TMeta>`, `CalendarRange`, and date-only helpers.
- Produces `buildAgendaDays({ days, events })`, where each output day has `{ date, allDayEvents, timedEvents }` and both arrays have deterministic order.

- [ ] **Step 1: Write failing agenda tests**

  Create a fixture helper returning `CalendarEvent<{ location?: string }>` and add:

  ```ts
  test("lists all-day events before timed events and orders timed events by start", () => {
    const days = buildAgendaDays({
      days: ["2026-08-12"],
      events: [
        event({ id: "late", start: "2026-08-12T10:00:00+02:00", end: "2026-08-12T11:00:00+02:00" }),
        event({ id: "all-day", allDay: true, start: "2026-08-12", end: "2026-08-13" }),
        event({ id: "early", start: "2026-08-12T09:00:00+02:00", end: "2026-08-12T09:30:00+02:00" }),
      ],
    });

    assert.deepEqual(days[0]?.allDayEvents.map((item) => item.id), ["all-day"]);
    assert.deepEqual(days[0]?.timedEvents.map((item) => item.id), ["early", "late"]);
  });

  test("includes a multi-day all-day event on every covered day", () => {
    const days = buildAgendaDays({
      days: ["2026-08-12", "2026-08-13"],
      events: [event({ id: "retreat", allDay: true, start: "2026-08-12", end: "2026-08-14" })],
    });

    assert.equal(days[0]?.allDayEvents[0]?.id, "retreat");
    assert.equal(days[1]?.allDayEvents[0]?.id, "retreat");
  });
  ```

- [ ] **Step 2: Run the agenda test and confirm it fails**

  Run: `cd frontend && npx tsx --test src/features/calendar/core/agenda.test.ts`

  Expected: FAIL because `buildAgendaDays` does not exist.

- [ ] **Step 3: Implement framework-neutral agenda grouping**

  Implement:

  ```ts
  export interface AgendaDay<TMeta> {
    date: string;
    allDayEvents: CalendarEvent<TMeta>[];
    timedEvents: CalendarEvent<TMeta>[];
  }

  export function buildAgendaDays<TMeta>(input: {
    days: readonly string[];
    events: readonly CalendarEvent<TMeta>[];
  }): AgendaDay<TMeta>[];
  ```

  Reuse or generalize the current `entriesOnDay` date-boundary rules. Sort each group by start, then end, then title, then id. Do not format labels or return JSX.

- [ ] **Step 4: Update the existing date utility types**

  Make `entriesOnDay` and its date-position helpers accept `CalendarEvent<TMeta>` while preserving existing `CalendarEntry` call sites through structural typing. Keep `formatEntryTime` WAT-specific for now; generic agenda rendering will receive a formatter callback in Task 3.

- [ ] **Step 5: Run tests**

  Run:

  ```bash
  cd frontend && npx tsx --test src/features/calendar/core/agenda.test.ts
  cd frontend && npm run test:calendar
  ```

  Expected: both pass.

- [ ] **Step 6: Commit agenda model**

  ```bash
  git add frontend/src/features/calendar/core/agenda.ts \
    frontend/src/features/calendar/core/agenda.test.ts \
    frontend/src/features/calendar/views/calendar-view-utils.ts
  git commit -m "feat: add calendar discovery agenda model"
  ```

## Task 3: Build generic Calendar UI primitives and preset contracts

**Files:**
- Create: `frontend/src/features/calendar/ui/CalendarEventRow.tsx`
- Create: `frontend/src/features/calendar/ui/AgendaView.tsx`
- Create: `frontend/src/features/calendar/ui/CalendarRoot.tsx`
- Create: `frontend/src/features/calendar/presets/types.ts`
- Create: `frontend/src/features/calendar/presets/discovery.ts`
- Create: `frontend/src/features/calendar/presets/planning.ts`
- Create: `frontend/src/features/calendar/presets/presets.test.ts`
- Modify: `frontend/src/features/calendar/calendar-copy.ts`

**Interfaces:**
- Produces `CalendarPreset`, `discoveryPreset`, `planningPreset`, generic `AgendaView<TMeta>`, and `CalendarRoot<TMeta>`.
- All components are data-in and accept classes/render callbacks from their caller. They do not reference WAT DTOs or query hooks.

- [ ] **Step 1: Write failing preset tests**

  Add `presets.test.ts`:

  ```ts
  import assert from "node:assert/strict";
  import test from "node:test";
  import { discoveryPreset } from "./discovery";
  import { planningPreset } from "./planning";

  test("Discovery uses readable agenda renderers for Week and Day", () => {
    assert.equal(discoveryPreset.defaultView, "month");
    assert.equal(discoveryPreset.viewModes.week, "agenda");
    assert.equal(discoveryPreset.viewModes.day, "agenda");
  });

  test("Planning keeps TimeGrid for Week and Day", () => {
    assert.equal(planningPreset.viewModes.week, "timeGrid");
    assert.equal(planningPreset.viewModes.day, "timeGrid");
  });
  ```

- [ ] **Step 2: Run the test and confirm it fails**

  Run: `cd frontend && npx tsx --test src/features/calendar/presets/presets.test.ts`

  Expected: FAIL because the preset modules do not exist.

- [ ] **Step 3: Define explicit preset and label contracts**

  Create `presets/types.ts`:

  ```ts
  export type CalendarViewMode = "monthGrid" | "agenda" | "timeGrid";

  export interface CalendarPreset {
    id: "discovery" | "planning";
    defaultView: CalendarView;
    enabledViews: readonly CalendarView[];
    viewModes: Record<CalendarView, CalendarViewMode>;
  }
  ```

  Export `discoveryPreset` with `monthGrid`, `agenda`, `agenda`; export `planningPreset` with `monthGrid`, `timeGrid`, `timeGrid`. Both presets expose Month/Week/Day and default to Month.

  Extend `CalendarLabels` with `allDay`, `timedEvents`, `noEventsOnDate`, `formatDayHeader`, `formatTime`, and a new `eventDetails: string`. Keep labels as locale-composed inputs, not core constants.

  Define the generic root inputs explicitly:

  ```ts
  interface CalendarRootProps<TMeta> {
    preset: CalendarPreset;
    view: CalendarView;
    date: Date;
    selectedDate: Date;
    visibleRange: CalendarRange;
    events: readonly CalendarEvent<TMeta>[];
    labels: CalendarLabels;
    onViewChange: (view: CalendarView) => void;
    onPrevious: () => void;
    onNext: () => void;
    onToday: () => void;
    onSelectDate: (date: Date) => void;
    onEventActivate: (event: CalendarEvent<TMeta>) => void;
    renderEvent: (event: CalendarEvent<TMeta>, density: "summary" | "row" | "timeGrid") => ReactNode;
    renderMonth: () => ReactNode;
    renderAgenda: () => ReactNode;
    renderTimeGrid?: () => ReactNode;
  }
  ```

- [ ] **Step 4: Implement `CalendarEventRow`**

  Implement this generic prop contract:

  ```ts
  interface CalendarEventRowProps<TMeta> {
    event: CalendarEvent<TMeta>;
    date: string;
    formatTime: (event: CalendarEvent<TMeta>, date: string) => string | null;
    formatLocation: (event: CalendarEvent<TMeta>) => string | null;
    onActivate: (event: CalendarEvent<TMeta>) => void;
    actionLabel: string;
    className: string;
    focusClassName: string;
  }
  ```

  Render time, title, optional location, and a visible `actionLabel` affordance. Its accessible name combines title, returned time, and returned location. The whole row is a 44px minimum button; no nested button is allowed.

- [ ] **Step 5: Implement agenda and root composition**

  `AgendaView<TMeta>` receives a visible date array and calls `buildAgendaDays`. Week renders seven day sections; it applies `hidden` only to an entirely empty day section after a visible localized empty-state summary announces that there are no activities in that week. Day always renders one day section and its empty state.

  `CalendarRoot<TMeta>` receives controller-like navigation callbacks, `events`, `preset`, labels, classes, formatters, and `onEventActivate`. It selects `renderMonth`, `renderAgenda`, or `renderTimeGrid` by `preset.viewModes[view]`; if a Planning caller omits `renderTimeGrid`, render the existing localized error state instead of silently displaying the wrong view. It receives all data as props and contains no `UseQueryResult` import. Task 4 supplies Month/Agenda render functions for Discovery; Task 5 supplies the TimeGrid function for Planning.

- [ ] **Step 6: Run preset tests and type-check**

  Run:

  ```bash
  cd frontend && npx tsx --test src/features/calendar/presets/presets.test.ts
  cd frontend && ./node_modules/.bin/tsc --noEmit
  ```

  Expected: both pass.

- [ ] **Step 7: Commit generic primitives**

  ```bash
  git add frontend/src/features/calendar/ui frontend/src/features/calendar/presets \
    frontend/src/features/calendar/calendar-copy.ts
  git commit -m "feat: add calendar discovery and planning presets"
  ```

## Task 4: Add the WAT calendar adapter and migrate public client to Discovery

**Files:**
- Create: `frontend/src/features/calendar/adapters/wat-calendar.ts`
- Create: `frontend/src/features/calendar/adapters/wat-calendar.test.ts`
- Modify: `frontend/src/app/[locale]/(client)/calendar/CalendarPageContent.tsx`
- Modify: `frontend/src/features/calendar/views/MonthView.tsx`
- Modify: `frontend/src/features/calendar/views/month-grid.ts`
- Modify: `frontend/src/features/calendar/views/CalendarEntryButton.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:**
- Produces `CalendarEntryMeta`, `toCalendarEvent(entry)`, `toCalendarEvents(entries)`, and WAT-only format/accessor callbacks.
- Public Calendar uses `discoveryPreset`; Week/Day are agendas and no public route renders `TimeGrid`.

- [ ] **Step 1: Write adapter tests**

  Add:

  ```ts
  test("maps WAT entry data to generic event metadata without losing detail fields", () => {
    const mapped = toCalendarEvent(entry({
      id: "event-1",
      detail: { canEdit: false, href: "/th/events/meditation", location: "ศาลาปฏิบัติ", description: "รายละเอียด" },
    }));

    assert.equal(mapped.id, "event-1");
    assert.equal(mapped.meta.detail.href, "/th/events/meditation");
    assert.equal(mapped.meta.detail.location, "ศาลาปฏิบัติ");
  });
  ```

- [ ] **Step 2: Run the test and confirm it fails**

  Run: `cd frontend && npx tsx --test src/features/calendar/adapters/wat-calendar.test.ts`

  Expected: FAIL because the adapter module does not exist.

- [ ] **Step 3: Implement the WAT-to-generic mapping**

  Create:

  ```ts
  export interface CalendarEntryMeta {
    originalEntry: CalendarEntry;
    source: string;
    status: "active" | "inactive";
    display: CalendarEntry["display"];
    detail: CalendarEntry["detail"];
  }

  export function toCalendarEvent(entry: CalendarEntry): CalendarEvent<CalendarEntryMeta>;
  export function toCalendarEvents(entries: readonly CalendarEntry[]): CalendarEvent<CalendarEntryMeta>[];
  ```

  Copy every WAT-specific field, including `originalEntry`, into `meta`; do not cast the source entry or mutate it. Put `formatWatEventTime`, `getWatEventLocation`, and the public/admin tone class selection in this adapter layer.

- [ ] **Step 4: Make Month generic but preserve Discovery visual behavior**

  Change MonthGrid and MonthView to accept `CalendarEvent<TMeta>`, a date-event grouping function, and generic event renderer/action inputs. Preserve the seven-column grid, desktop two-event summary limit, mobile count/dot, selected-date agenda placement, Today/selected distinction, and no page-level overflow.

  In Discovery Month desktop, render at most two summaries then `labels.moreEvents(overflow)`. The selected-date agenda is the complete source for all events on that date and uses `CalendarEventRow` with the WAT adapter formatters.

- [ ] **Step 5: Migrate `CalendarPageContent` to `CalendarRoot`**

  Keep `useCalendarEntries`, `useCalendar`, locale selection, router push, and page header in the route composition file. Once the query resolves, map `query.data.entries` with `toCalendarEvents` and pass `discoveryPreset` into `CalendarRoot`.

  The public event activation pushes only `event.meta.detail.href` when it exists. Add `eventDetails` translations:

  | Locale | Value |
  | --- | --- |
  | th | `ดูรายละเอียด` |
  | en | `View details` |
  | de | `Details ansehen` |

  Keep all existing CalendarPage keys in the three public message files.

- [ ] **Step 6: Run focused tests and public static checks**

  Run:

  ```bash
  cd frontend && npx tsx --test src/features/calendar/adapters/wat-calendar.test.ts
  cd frontend && npm run test:calendar
  cd frontend && ./node_modules/.bin/tsc --noEmit
  cd frontend && npx eslint src/features/calendar/core src/features/calendar/ui src/features/calendar/presets src/features/calendar/adapters 'src/app/[locale]/(client)/calendar/CalendarPageContent.tsx'
  ```

  Expected: every command exits 0.

- [ ] **Step 7: Commit public Discovery migration**

  ```bash
  git add frontend/src/features/calendar/adapters \
    frontend/src/features/calendar/views/MonthView.tsx \
    frontend/src/features/calendar/views/month-grid.ts \
    frontend/src/features/calendar/views/CalendarEntryButton.tsx \
    'frontend/src/app/[locale]/(client)/calendar/CalendarPageContent.tsx' \
    frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json
  git commit -m "feat: migrate public calendar to discovery preset"
  ```

## Task 5: Migrate admin to Planning preset and retain TimeGrid regression coverage

**Files:**
- Modify: `frontend/src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx`
- Modify: `frontend/src/features/calendar/views/TimeGrid.tsx`
- Modify: `frontend/src/features/calendar/views/WeekView.tsx`
- Modify: `frontend/src/features/calendar/views/DayView.tsx`
- Modify: `frontend/src/features/calendar/views/time-grid.ts`
- Modify: `frontend/src/features/calendar/views/time-grid.test.ts`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

**Interfaces:**
- Admin receives generic mapped events and `planningPreset`.
- Planning retains one shared 08:00–20:00 time axis, all-day row, overlap widths, and the existing entry drawer callback.

- [ ] **Step 1: Extend TimeGrid model test to generic events**

  Replace WAT DTO fixture use in `time-grid.test.ts` with `CalendarEvent<{ tone: "default" }>` and preserve these assertions:

  ```ts
  assert.equal(model.slots[0]?.minutes, 480);
  assert.equal(model.days.length, 7);
  assert.notEqual(first.position.column, second.position.column);
  ```

- [ ] **Step 2: Run the test and confirm it fails after generic types are introduced**

  Run: `cd frontend && npx tsx --test src/features/calendar/views/time-grid.test.ts`

  Expected: FAIL until `buildTimeGridModel` accepts generic events.

- [ ] **Step 3: Generalize TimeGrid planning primitives**

  Change `buildTimeGridModel`, `TimeGrid`, `WeekView`, and `DayView` to accept `CalendarEvent<TMeta>` plus a render-event callback. Preserve geometry and CSS behavior exactly: one shared axis, 30-minute slots, all-day events above timed events, clipping to 08:00–20:00, and separate overlap columns.

- [ ] **Step 4: Migrate admin composition**

  In `AdminCalendarContent`, map feed entries through `toCalendarEvents`, pass `planningPreset`, supply the existing admin labels/theme adapter, and call `setSelectedEntry(event.meta.originalEntry)` from `onEventActivate`.

  Add `eventDetails` translations matching public values in the three admin message files. Do not change the existing `CalendarEntryDrawer` API.

- [ ] **Step 5: Run planning verification**

  Run:

  ```bash
  cd frontend && npx tsx --test src/features/calendar/views/time-grid.test.ts
  cd frontend && npm run test:calendar
  cd frontend && ./node_modules/.bin/tsc --noEmit
  cd frontend && npx eslint src/features/calendar/views/TimeGrid.tsx src/features/calendar/views/WeekView.tsx src/features/calendar/views/DayView.tsx 'src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx'
  ```

  Expected: every command exits 0.

- [ ] **Step 6: Commit planning adapter migration**

  ```bash
  git add frontend/src/features/calendar/views/TimeGrid.tsx \
    frontend/src/features/calendar/views/WeekView.tsx \
    frontend/src/features/calendar/views/DayView.tsx \
    frontend/src/features/calendar/views/time-grid.ts \
    frontend/src/features/calendar/views/time-grid.test.ts \
    'frontend/src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx' \
    frontend/src/messages/admin/th.json frontend/src/messages/admin/en.json frontend/src/messages/admin/de.json
  git commit -m "refactor: use planning calendar preset in admin"
  ```

## Task 6: Remove the legacy WAT-coupled shell and verify end-to-end behavior

**Files:**
- Modify: `frontend/src/features/calendar/Calendar.tsx` or delete it if no import remains
- Modify: `frontend/src/features/calendar/CalendarToolbar.tsx`
- Modify: `frontend/src/features/calendar/CalendarViewTabs.tsx`
- Modify: `frontend/src/features/calendar/calendar-theme.ts`
- Modify: `frontend/src/features/calendar/views/calendar-views.test.ts`
- Modify: `frontend/src/features/calendar/mock-data.test.ts` if generic adapter coverage needs its fixture

**Interfaces:**
- No public/admin caller imports a WAT-coupled generic Calendar shell.
- Each route owns loading/error/query handling; `CalendarRoot` owns only data-present rendering.

- [ ] **Step 1: Add a regression test for preset isolation**

  Extend `calendar-views.test.ts`:

  ```ts
  test("Discovery does not expose a TimeGrid mode", () => {
    assert.notEqual(discoveryPreset.viewModes.week, "timeGrid");
    assert.notEqual(discoveryPreset.viewModes.day, "timeGrid");
  });

  test("Planning still has TimeGrid for operational views", () => {
    assert.equal(planningPreset.viewModes.week, "timeGrid");
    assert.equal(planningPreset.viewModes.day, "timeGrid");
  });
  ```

- [ ] **Step 2: Run the test and confirm it passes with the migrated presets**

  Run: `cd frontend && npx tsx --test src/features/calendar/views/calendar-views.test.ts`

  Expected: PASS.

- [ ] **Step 3: Remove the obsolete shell without removing public state UX**

  Remove `Calendar.tsx` if neither route imports it. Move its query pending/error/refresh/empty presentation into each WAT route adapter so query ownership remains outside the generic library. Keep Toolbar/Tabs generic by accepting controller callbacks and labels rather than WAT query data or theme tokens.

- [ ] **Step 4: Run full static verification**

  Run:

  ```bash
  cd frontend && npm run test:calendar
  cd frontend && ./node_modules/.bin/tsc --noEmit
  cd frontend && npx eslint src/features/calendar src/components/layout/StickySocials.tsx 'src/app/[locale]/(client)/calendar/CalendarPageContent.tsx' 'src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx'
  NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED=false NEXT_PUBLIC_API_URL=https://example.com npm run build
  ```

  Expected: every command exits 0. The build overrides are process-local and do not modify `.env.local`.

- [ ] **Step 5: Browser acceptance checks**

  Test public routes with mock data:

  1. At `1200x800`, load `/th/calendar?view=month&date=2026-08-12`; confirm Month grid has only date summaries and the selected-date agenda exposes all six mock entries with time/location/detail affordance.
  2. Select Week; confirm one readable agenda of activity days, no TimeGrid axis, and URL is `?view=week&date=2026-08-12`.
  3. Select Day; confirm one day agenda with all-day entries before 09:00 and 09:30 entries.
  4. At `390x844`, confirm Month grid + selected-date agenda and Week/Day agenda have no page-level horizontal overflow.
  5. With keyboard focus on Month tab, press ArrowRight; confirm Week becomes selected and focus moves with it.
  6. Load `?view=timeline&date=2026-08-12`; confirm Month is selected and URL canonicalizes to `?view=month&date=2026-08-12`.
  7. In an authenticated local admin session, load `/th/admin/calendar?view=week&date=2026-08-12`; confirm TimeGrid remains visible and activating an event opens the existing drawer.

- [ ] **Step 6: Commit cleanup and verified corrections**

  ```bash
  git add frontend/src/features/calendar frontend/src/app/[locale]/(client)/calendar \
    frontend/src/app/[locale]/admin/calendar
  git commit -m "refactor: finalize reusable calendar presets"
  ```

## Coverage review

- Local reusable core, no package publishing, and explicit extension points: Tasks 1 and 3.
- Generic `CalendarEvent<TMeta>` and WAT adapter boundary: Tasks 1 and 4.
- Public Month + selected-day agenda, Week agenda, and Day agenda: Tasks 2 through 4.
- Planning TimeGrid preserved for admin/personal future: Task 5.
- Resource data retained but no resource UI, Timeline, Grid Day, drag/drop, recurrence, or editing: Global Constraints and Tasks 1/5.
- th/en/de copy, keyboard/navigation, responsive no-overflow, URL fallback, tests, lint, type-check, build, and browser checks: Tasks 4 through 6.
