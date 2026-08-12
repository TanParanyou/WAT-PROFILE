# Calendar Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release the existing Custom Calendar with verified Public Discovery and Admin Planning workflows, canonical URL state, and regression coverage for confirmed behavior defects.

**Architecture:** Preserve the generic calendar core. Correct presentation policy in presets: Discovery is Month Grid plus Agenda; Planning is Month Grid plus TimeGrid. Route components remain WAT adapters for data, theme, locale, and event activation.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, date-fns, TanStack Query, node:test via `tsx`, Tailwind CSS 4.

## Global Constraints

- Do not add FullCalendar, endpoints, drag/drop, resizing, recurrence, resource UI, Timeline, Grid Day, or editing.
- Do not alter `CalendarEvent<TMeta>` unless a confirmed production defect requires it.
- Preserve WAT-only routing, query, theme, and drawer behavior at adapter/route boundaries.
- Preserve Thai, English, and German copy; retain Europe/Berlin date semantics, visible focus, and 44px minimum controls.
- Do not modify `frontend/src/components/ui/DataTable.tsx` or `frontend/src/services/api.ts`.
- Keep the existing `npm run test:calendar` test runner; add no dependency.
- Treat missing authenticated Admin access as a documented manual-QA block; never bypass authentication.

---

## File structure

| File | Responsibility |
| --- | --- |
| `frontend/src/features/calendar/presets/discovery.ts` | Declare Discovery’s Month Grid plus Agenda policy. |
| `frontend/src/features/calendar/presets/presets.test.ts` | Lock public-vs-admin presentation policies and route boundaries. |
| `frontend/src/features/calendar/views/calendar-views.test.ts` | Lock TimeGrid to Planning operational views. |
| `frontend/src/features/calendar/useCalendar.ts` | Keep selection, active range, and URL synchronized. |
| `frontend/src/features/calendar/useCalendar.test.ts` | Regression tests for controller state. |
| `frontend/src/features/calendar/ui/CalendarRoot.tsx` | Render and keyboard-navigate only preset-enabled views. |
| `frontend/src/features/calendar/ui/calendar-root.test.ts` | Test pure preset-tab and roving-index helpers. |
| `frontend/src/app/[locale]/(client)/calendar/CalendarPageContent.tsx` | Compose Public from MonthView and AgendaView only. |
| `frontend/src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx` | Compose Admin from MonthView and TimeGrid only. |
| `docs/calendar-production-hardening-qa.md` | Dated browser QA matrix and evidence. |

### Task 1: Restore and lock the Discovery presentation contract

**Files:**
- Modify: `frontend/src/features/calendar/presets/discovery.ts`
- Modify: `frontend/src/features/calendar/presets/presets.test.ts`
- Modify: `frontend/src/features/calendar/views/calendar-views.test.ts`

**Interfaces:**
- Consumes: `CalendarPreset` from `frontend/src/features/calendar/presets/types.ts`.
- Produces: `discoveryPreset.viewModes.week` and `.day` equal `"agenda"`; Planning retains `"timeGrid"`.

- [ ] **Step 1: Write the failing preset assertions**

```ts
test("Discovery uses Agenda for Week and Day", () => {
  assert.equal(discoveryPreset.defaultView, "month");
  assert.equal(discoveryPreset.viewModes.week, "agenda");
  assert.equal(discoveryPreset.viewModes.day, "agenda");
});

test("Planning keeps TimeGrid for Week and Day", () => {
  assert.equal(planningPreset.viewModes.week, "timeGrid");
  assert.equal(planningPreset.viewModes.day, "timeGrid");
});
```

- [ ] **Step 2: Run the focused tests and verify Discovery fails**

Run: `cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/presets/presets.test.ts src/features/calendar/views/calendar-views.test.ts`

Expected: FAIL because Discovery currently reports `"timeGrid"` for Week and Day.

- [ ] **Step 3: Set Discovery’s Week and Day modes to Agenda**

```ts
export const discoveryPreset: CalendarPreset = {
  id: "discovery",
  defaultView: "month",
  enabledViews: ["month", "week", "day"],
  viewModes: { month: "monthGrid", week: "agenda", day: "agenda" },
};
```

- [ ] **Step 4: Replace obsolete TimeGrid-only Discovery assertions**

```ts
test("TimeGrid stays reserved for Planning operational views", () => {
  assert.equal(discoveryPreset.viewModes.week, "agenda");
  assert.equal(discoveryPreset.viewModes.day, "agenda");
  assert.equal(planningPreset.viewModes.week, "timeGrid");
  assert.equal(planningPreset.viewModes.day, "timeGrid");
});
```

- [ ] **Step 5: Run the focused tests and verify they pass**

Run: `cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/presets/presets.test.ts src/features/calendar/views/calendar-views.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the contract correction**

```bash
git add frontend/src/features/calendar/presets/discovery.ts frontend/src/features/calendar/presets/presets.test.ts frontend/src/features/calendar/views/calendar-views.test.ts
git commit -m "fix(calendar): restore discovery agenda views"
```

### Task 2: Synchronize date selection with active range and canonical URL state

**Files:**
- Modify: `frontend/src/features/calendar/useCalendar.ts`
- Modify: `frontend/src/features/calendar/useCalendar.test.ts`

**Interfaces:**
- Consumes: `getVisibleRange(date, view, weekStartsOn)` and `shiftCalendarDate(date, view, amount)`.
- Produces: `CalendarController.selectDate(date)` updates `date` and `selectedDate`; the hook writes canonical `view` and `date` query parameters.

- [ ] **Step 1: Write the failing controller regression tests**

```ts
test("selecting a date synchronizes the active date and visible range", () => {
  const controller = createCalendarState({
    initialView: "month", url: "?view=day&date=2026-08-12", weekStartsOn: 1,
  });
  controller.selectDate(new Date(2026, 7, 20));
  assert.equal(controller.date.getDate(), 20);
  assert.equal(controller.selectedDate.getDate(), 20);
  assert.deepEqual(controller.visibleRange, { startDate: "2026-08-20", endDate: "2026-08-20" });
});

test("invalid view retains a valid date while canonicalizing to month", () => {
  const controller = createCalendarState({
    initialView: "week", url: "?view=unsupported&date=2026-08-12", weekStartsOn: 1,
  });
  assert.equal(controller.view, "month");
  assert.equal(controller.date.getDate(), 12);
});
```

- [ ] **Step 2: Run the focused controller tests and verify selection fails**

Run: `cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/useCalendar.test.ts`

Expected: FAIL because `createCalendarState.selectDate` changes only `selectedDate`.

- [ ] **Step 3: Update non-React controller state atomically**

```ts
selectDate(nextDate) {
  const normalized = startOfDay(nextDate);
  date = normalized;
  selectedDate = normalized;
},
```

- [ ] **Step 4: Update hook state and URL atomically**

```ts
const selectDate = useCallback((nextDate: Date) => {
  const normalized = startOfDay(nextDate);
  setDateState(normalized);
  setSelectedDate(normalized);
  replaceUrl(view, normalized);
}, [replaceUrl, view]);
```

- [ ] **Step 5: Run focused tests and verify they pass**

Run: `cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/useCalendar.test.ts src/features/calendar/core/calendar-state.test.ts`

Expected: PASS, including the Day range for `2026-08-20` and invalid-view date preservation.

- [ ] **Step 6: Commit the synchronization**

```bash
git add frontend/src/features/calendar/useCalendar.ts frontend/src/features/calendar/useCalendar.test.ts
git commit -m "fix(calendar): synchronize selected calendar date"
```

### Task 3: Make CalendarRoot honor generic preset capabilities

**Files:**
- Modify: `frontend/src/features/calendar/ui/CalendarRoot.tsx`
- Create: `frontend/src/features/calendar/ui/calendar-root.test.ts`

**Interfaces:**
- Consumes: `preset.enabledViews: readonly CalendarView[]` and active `CalendarView`.
- Produces: `getCalendarTabViews(preset)` and `getRovingViewIndex(activeIndex, key, viewCount)`; all tabs and roving keys use only enabled views.

- [ ] **Step 1: Write failing pure-helper tests**

```ts
test("returns enabled views in preset order", () => {
  assert.deepEqual(
    getCalendarTabViews({ ...discoveryPreset, enabledViews: ["month", "day"] }),
    ["month", "day"],
  );
});

test("wraps roving focus and honors Home and End", () => {
  assert.equal(getRovingViewIndex(1, "ArrowRight", 3), 2);
  assert.equal(getRovingViewIndex(2, "ArrowRight", 3), 0);
  assert.equal(getRovingViewIndex(1, "Home", 3), 0);
  assert.equal(getRovingViewIndex(0, "End", 3), 2);
});
```

- [ ] **Step 2: Run the new test and verify it fails**

Run: `cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/ui/calendar-root.test.ts`

Expected: FAIL with missing helper export errors.

- [ ] **Step 3: Extract the capability and roving-index helpers**

```ts
export function getCalendarTabViews(preset: CalendarPreset): readonly CalendarView[] {
  return preset.enabledViews;
}

export function getRovingViewIndex(activeIndex: number, key: string, viewCount: number): number | null {
  if (key === "Home") return 0;
  if (key === "End") return viewCount - 1;
  if (key === "ArrowRight" || key === "ArrowDown") return (activeIndex + 1) % viewCount;
  if (key === "ArrowLeft" || key === "ArrowUp") return (activeIndex - 1 + viewCount) % viewCount;
  return null;
}
```

- [ ] **Step 4: Wire CalendarRoot to its helpers**

```ts
const tabViews = getCalendarTabViews(preset);
const activeIndex = tabViews.indexOf(view);
// Map tabViews, index tabRefs by this map index, and invoke
// onViewChange(tabViews[nextIndex]) after getRovingViewIndex returns an index.
// Preserve aria-selected, tabIndex, requestAnimationFrame focus, and classes.
```

- [ ] **Step 5: Run helper and calendar tests**

Run: `cd frontend && npm run test:calendar`

Expected: PASS. A future preset cannot expose or keyboard-navigate to a disabled view.

- [ ] **Step 6: Commit the generic capability boundary**

```bash
git add frontend/src/features/calendar/ui/CalendarRoot.tsx frontend/src/features/calendar/ui/calendar-root.test.ts
git commit -m "refactor(calendar): honor preset enabled views"
```

### Task 4: Keep each WAT route on its intended generic views

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/calendar/CalendarPageContent.tsx`
- Modify: `frontend/src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx`
- Modify: `frontend/src/features/calendar/presets/presets.test.ts`

**Interfaces:**
- Consumes: Discovery’s Agenda modes and Planning’s TimeGrid modes.
- Produces: Public composes `MonthView` and `AgendaView`, never `TimeGrid`; Admin composes `MonthView` and `TimeGrid`, never `AgendaView`. Public event activation remains route navigation; Admin activation remains the drawer.

- [ ] **Step 1: Add failing static route-boundary checks**

```ts
test("Public calendar composes AgendaView but not TimeGrid", () => {
  const source = readFileSync(publicCalendarPath, "utf8");
  assert.match(source, /<AgendaView/);
  assert.doesNotMatch(source, /<TimeGrid/);
});

test("Admin calendar composes TimeGrid but not AgendaView", () => {
  const source = readFileSync(adminCalendarPath, "utf8");
  assert.match(source, /<TimeGrid/);
  assert.doesNotMatch(source, /<AgendaView/);
});
```

Place the tests in `presets.test.ts`, import `readFileSync` from `node:fs`, and derive each route path with `new URL(..., import.meta.url)` so the test does not depend on the process working directory.

- [ ] **Step 2: Run the route-boundary test and verify Public fails**

Run: `cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/presets/presets.test.ts`

Expected: FAIL because Public currently imports and renders `<TimeGrid />`.

- [ ] **Step 3: Remove only the unused Public TimeGrid composition**

```ts
// Remove the TimeGrid import, timeGridDays calculation, and renderTimeGrid prop.
// Keep renderAgenda: Week supplies seven visible days; Day supplies selectedDate.
```

- [ ] **Step 4: Preserve Admin Planning composition**

```ts
// Keep AdminCalendarContent’s MonthView and renderTimeGrid composition.
// Keep renderAgenda={() => null}: Planning does not select Agenda modes.
```

- [ ] **Step 5: Run route-boundary and type checks**

Run: `cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/presets/presets.test.ts && ./node_modules/.bin/tsc --noEmit`

Expected: PASS with no public TimeGrid symbols or TypeScript errors.

- [ ] **Step 6: Commit the route-boundary correction**

```bash
git add frontend/src/app/'[locale]'/'(client)'/calendar/CalendarPageContent.tsx frontend/src/app/'[locale]'/admin/calendar/_components/AdminCalendarContent.tsx frontend/src/features/calendar/presets/presets.test.ts
git commit -m "fix(calendar): separate discovery and planning views"
```

### Task 5: Execute and record production browser verification

**Files:**
- Create: `docs/calendar-production-hardening-qa.md`

**Interfaces:**
- Consumes: development mock feed, existing authenticated Admin session if present, and canonical calendar query URLs.
- Produces: dated QA result for every scenario: `PASS`, `FAIL`, or `BLOCKED`. Each `FAIL` names its test and correction commit before release.

- [ ] **Step 1: Establish the automated baseline**

Run:

```bash
cd frontend && npm run test:calendar
cd frontend && npm run lint
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && npm run build
```

Expected: all four PASS. Fix any failure in its owning task before browser work.

- [ ] **Step 2: Create the QA matrix**

```md
# Calendar Production Hardening QA

| Surface | Viewport | Scenario | Result | Evidence / observation |
| --- | --- | --- | --- | --- |
| Public th | 1440px | Month, Week, Day; Previous, Next, Today |  |  |
| Public th | 390px | Month selected day; Week and Day agenda; no page overflow |  |  |
| Public en | 1440px | Labels, period text, event detail navigation |  |  |
| Public de | 390px | Labels do not clip; controls remain reachable |  |  |
| Public | 1440px | Invalid `?view=unsupported&date=2026-08-12` retains date and canonicalizes to Month |  |  |
| Public | 1440px | Tab roving focus: arrows, Home, End |  |  |
| Admin th | 1440px | Month, Week, Day; TimeGrid; event drawer |  |  |
| Admin th | 390px | No page overflow; TimeGrid scroll stays in `[data-calendar-time-grid]` |  |  |
| Admin | 1440px | Loading, refreshing, error/retry, empty state |  |  |
```

- [ ] **Step 3: Run Public browser checks using the mock feed**

Navigate first to `/th/calendar?view=month&date=2026-08-12`; exercise every Public row at 1440px and 390px. Verify `document.documentElement.scrollWidth <= window.innerWidth`. Record a screenshot path or precise observation in the table.

- [ ] **Step 4: Run Admin only with an existing authenticated session**

Navigate to `/th/admin/calendar?view=month&date=2026-08-12`. Exercise Month, Week, Day, keyboard tabs, drawer activation, and TimeGrid scoped scrolling. If no session exists, write `BLOCKED — no existing local authenticated session; auth was not bypassed` in affected Admin rows. Do not set `NEXT_PUBLIC_SKIP_ADMIN_AUTH`.

- [ ] **Step 5: Resolve every confirmed browser failure before release**

For each `FAIL`: add a narrow test in the owning file named above, run it red, make the smallest correction in that owner, rerun the focused test and browser scenario, record `PASS`, then commit `fix(calendar): <specific behavior>`.

- [ ] **Step 6: Commit QA evidence**

```bash
git add docs/calendar-production-hardening-qa.md
git commit -m "docs: record calendar production QA"
```

- [ ] **Step 7: Final release verification**

Run:

```bash
cd frontend && npm run test:calendar
cd frontend && npm run lint
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && npm run build
git diff --check
git status --short
```

Expected: all verification passes; pre-existing changes to `DataTable.tsx` and `api.ts` remain untouched.
