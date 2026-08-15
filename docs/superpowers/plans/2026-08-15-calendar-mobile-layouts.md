# Calendar Mobile Layouts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let developers configure mobile Calendar presentation so public Month uses a compact month agenda, Week uses a seven-day selector with one-day TimeGrid, and Day keeps its single-day TimeGrid.

**Architecture:** Extend Calendar presets with optional responsive layout mappings and resolve them into validated Calendar configuration. A hydration-safe `useCalendarLayout` hook selects presentation without changing semantic Month/Week/Day state; the Calendar facade then composes focused `MonthAgenda` and `DayStrip` views while fetching and URL synchronization remain unchanged.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, date-fns, happy-dom, node:test.

## Global Constraints

- Reuse the custom Calendar; do not add FullCalendar or another dependency.
- Developer configuration lives in Calendar presets; end users do not choose presentation layouts.
- Keep semantic URL views `month`, `week`, and `day`; never put layout names in query parameters.
- Keep public Calendar fetching in WAT integrations and do not add or change APIs.
- Preserve desktop Calendar behavior and the Admin preset unless it explicitly adopts responsive mappings later.
- Preserve Thai, English, and German labels and existing 44px minimum interactive targets.
- Do not add Timeline, Grid Day, new dependencies, TypeScript `any`, `as any`, or `@ts-ignore`.

---

### Task 1: Add validated responsive layout configuration

**Files:**
- Modify: `frontend/src/features/calendar/presets/types.ts`
- Modify: `frontend/src/features/calendar/presets/discovery.ts`
- Modify: `frontend/src/features/calendar/config.ts`
- Modify: `frontend/src/features/calendar/config.test.ts`
- Modify: `frontend/src/features/calendar/presets/presets.test.ts`
- Modify: `frontend/src/features/calendar/index.ts`
- Modify: `frontend/src/features/calendar/public-api.test.ts`

**Interfaces:**
- Produces: `CalendarLayout`, `CalendarResponsiveLayoutsInput`, and resolved `CalendarResponsiveLayouts` types.
- Produces: `CalendarConfig.layouts` with complete `desktop`, `mobile`, and `mobileBreakpoint` values.
- Consumes: existing `CalendarPreset.viewModes` as the fallback desktop and mobile mapping.

- [x] **Step 1: Add failing configuration tests.**

Add assertions to `config.test.ts` that verify:

```ts
const defaults = resolveCalendarConfig(planningPreset);
assert.equal(defaults.layouts.desktop.month, "monthGrid");
assert.equal(defaults.layouts.mobile.week, "timeGrid");
assert.equal(defaults.layouts.mobileBreakpoint, 640);

const responsive = resolveCalendarConfig(discoveryPreset);
assert.deepEqual(responsive.layouts.mobile, {
  month: "monthAgenda",
  week: "dayStrip",
  day: "timeGrid",
});

assert.throws(
  () => resolveCalendarConfig({
    ...discoveryPreset,
    layouts: { ...discoveryPreset.layouts, mobileBreakpoint: 0 },
  }),
  /mobileBreakpoint must be a positive finite number/,
);
```

Add preset assertions to `presets.test.ts` for the exact public mobile mapping while retaining the existing desktop `viewModes` assertions.

- [x] **Step 2: Run tests to verify the new contract fails.**

Run:

```bash
cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/config.test.ts src/features/calendar/presets/presets.test.ts
```

Expected: FAIL because presets and resolved config do not expose responsive layouts.

- [x] **Step 3: Extend preset and resolved config types.**

In `presets/types.ts`, add:

```ts
export type CalendarLayout = CalendarViewMode | "monthAgenda" | "dayStrip";

export interface CalendarResponsiveLayoutsInput {
  desktop?: Partial<Record<CalendarView, CalendarLayout>>;
  mobile?: Partial<Record<CalendarView, CalendarLayout>>;
  mobileBreakpoint?: number;
}

export interface CalendarResponsiveLayouts {
  desktop: Record<CalendarView, CalendarLayout>;
  mobile: Record<CalendarView, CalendarLayout>;
  mobileBreakpoint: number;
}
```

Add `layouts?: CalendarResponsiveLayoutsInput` to `CalendarPreset`. Add `layouts: CalendarResponsiveLayouts` to `CalendarConfig`. Export the three responsive layout types from `index.ts`, and extend `public-api.test.ts` with a type import plus a resolved-layout assertion so external consumers do not import internal files.

- [x] **Step 4: Resolve mappings with safe view/layout pairings.**

In `config.ts`, define valid layout sets:

```ts
const validLayouts: Record<CalendarView, readonly CalendarLayout[]> = {
  month: ["monthGrid", "monthAgenda"],
  week: ["timeGrid", "dayStrip"],
  day: ["timeGrid"],
};
```

Resolve each desktop value from `preset.layouts?.desktop?.[view] ?? preset.viewModes[view]`. Resolve each mobile value from `preset.layouts?.mobile?.[view] ?? desktop[view]`. If a requested pairing is not in `validLayouts[view]`, use `preset.viewModes[view]`. Validate `mobileBreakpoint` through `positiveFinite` with default `640`.

- [x] **Step 5: Configure the discovery preset only.**

Add to `discoveryPreset`:

```ts
layouts: {
  desktop: { month: "monthGrid", week: "timeGrid", day: "timeGrid" },
  mobile: { month: "monthAgenda", week: "dayStrip", day: "timeGrid" },
  mobileBreakpoint: 640,
},
```

Leave `planningPreset` unchanged so its resolved mobile mapping falls back to its existing desktop modes.

- [x] **Step 6: Run focused tests and commit.**

Run:

```bash
cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/config.test.ts src/features/calendar/presets/presets.test.ts
```

Expected: PASS.

Commit:

```bash
git add frontend/src/features/calendar/presets/types.ts frontend/src/features/calendar/presets/discovery.ts frontend/src/features/calendar/config.ts frontend/src/features/calendar/config.test.ts frontend/src/features/calendar/presets/presets.test.ts frontend/src/features/calendar/index.ts frontend/src/features/calendar/public-api.test.ts
git commit -m "feat(calendar): configure responsive layouts"
```

---

### Task 2: Resolve the active layout without changing semantic view

**Files:**
- Create: `frontend/src/features/calendar/useCalendarLayout.ts`
- Create: `frontend/src/features/calendar/useCalendarLayout.test.tsx`

**Interfaces:**
- Consumes: `CalendarView` and resolved `CalendarResponsiveLayouts`.
- Produces: `useCalendarLayout(view, layouts): CalendarLayout`.
- Guarantees: server snapshot and first hydration render use desktop; later viewport changes update only presentation layout.

- [x] **Step 1: Write failing hook tests with a controllable matchMedia stub.**

Use `renderToString` for the server snapshot, then happy-dom and React `createRoot` with a controllable `matchMedia` stub for client updates. Test these cases:

```ts
assert.match(serverMarkup, /monthGrid/);
assert.equal(renderedLayout, "monthGrid"); // client matchMedia initially false
setMediaMatches(true);
assert.equal(renderedLayout, "monthAgenda");
setMediaMatches(false);
assert.equal(renderedLayout, "monthGrid");
assert.equal(lastQuery, "(max-width: 639px)");
```

Also render semantic `view="week"` and assert that the resolved mobile layout is `dayStrip` without changing the supplied view.

- [x] **Step 2: Run the hook test to verify it fails.**

Run:

```bash
cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/useCalendarLayout.test.tsx
```

Expected: FAIL because `useCalendarLayout` does not exist.

- [x] **Step 3: Implement the hydration-safe resolver.**

In `useCalendarLayout.ts`, use `useSyncExternalStore` with:

```ts
const query = `(max-width: ${layouts.mobileBreakpoint - 1}px)`;
const isMobile = useSyncExternalStore(subscribe, getSnapshot, () => false);
return isMobile ? layouts.mobile[view] : layouts.desktop[view];
```

Memoize the `MediaQueryList`, subscribe through `addEventListener("change", callback)`, and return the matching `removeEventListener` cleanup. Do not store viewport width in component state and do not read `window` during the server snapshot.

- [x] **Step 4: Run the hook test and commit.**

Run:

```bash
cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/useCalendarLayout.test.tsx
```

Expected: PASS.

Commit:

```bash
git add frontend/src/features/calendar/useCalendarLayout.ts frontend/src/features/calendar/useCalendarLayout.test.tsx
git commit -m "feat(calendar): resolve responsive layout"
```

---

### Task 3: Extract an explicit MonthAgenda view

**Files:**
- Create: `frontend/src/features/calendar/views/MonthAgenda.tsx`
- Create: `frontend/src/features/calendar/views/MonthAgenda.test.tsx`
- Create: `frontend/src/features/calendar/ui/SelectedDateAgenda.tsx`
- Modify: `frontend/src/features/calendar/views/MonthView.tsx`
- Modify: `frontend/src/features/calendar/Calendar.tsx`
- Modify: `frontend/src/features/calendar/Calendar.test.tsx`
- Modify: `frontend/src/features/calendar/ui/CalendarRoot.tsx`

**Interfaces:**
- Consumes: `CalendarController`, normalized events, `CalendarLabels`, variant, presentation callbacks, and `controller.config.month.maxVisibleEvents`.
- Produces: `MonthAgenda<TEvent>` with the same event rendering and activation inputs as `MonthView`.
- Guarantees: compact cells show only date and event count; selected-date event rows retain existing WAT presentation callbacks.

- [x] **Step 1: Write failing MonthAgenda DOM tests.**

Create a controller for August 2026 with entries on August 12. Assert:

```ts
assert.equal(screen.container.querySelectorAll('[data-calendar-month-agenda] [role="gridcell"]').length, 42);
assert.match(screen.container.textContent ?? "", /2 events/);
const picker = screen.container.querySelector('[data-calendar-month-agenda]');
assert.ok(picker);
assert.equal(picker.querySelector('[aria-label="Morning chanting"]'), null);
```

Click August 12 and assert its button becomes `aria-pressed="true"`, the selected-date section renders `Morning chanting`, and clicking its event row calls `onEntryActivate` with the original event. Add an empty selected-date case that renders `labels.noEventsOnDate`.

- [x] **Step 2: Run the view test to verify it fails.**

Run:

```bash
cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/views/MonthAgenda.test.tsx
```

Expected: FAIL because `MonthAgenda` does not exist.

- [x] **Step 3: Extract compact month presentation.**

Extract the selected-date heading, event rows, and empty state into `SelectedDateAgenda<TEvent>`, then compose it from both `MonthView` and `MonthAgenda`. Move only the current compact mobile date-grid behavior into `MonthAgenda`. Give each date wrapper `role="gridcell"`, keep the button's localized date/event-count label, and add `data-calendar-month-agenda` to the root. Use `buildMonthGrid`, `entriesOnDay`, `CalendarEventRow`, and existing focus/theme helpers; do not copy WAT formatting logic.

Keep `MonthView` focused on the desktop seven-column event-bar grid plus the shared selected-date agenda so desktop behavior remains unchanged. Its API remains unchanged, but remove the internal `sm:hidden` compact picker because responsive layout selection now occurs in the Calendar facade.

- [x] **Step 4: Compose MonthAgenda from the Calendar facade.**

In `Calendar.tsx`, call `useCalendarLayout(controller.view, controller.config.layouts)`. When the resolved layout is `monthAgenda`, render `MonthAgenda` with the same callbacks passed to `MonthView`. Set `CalendarRoot`'s `mode` through a new optional `layout` prop so `data-calendar-mode` reports the actual presentation layout while the outer `data-calendar-view` remains `month`.

- [x] **Step 5: Run focused view and facade tests and commit.**

Run:

```bash
cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/views/MonthAgenda.test.tsx src/features/calendar/Calendar.test.tsx
```

Expected: PASS with desktop Month unchanged and mobile Month resolving to `monthAgenda` in the media-query test harness.

Commit:

```bash
git add frontend/src/features/calendar/views/MonthAgenda.tsx frontend/src/features/calendar/views/MonthAgenda.test.tsx frontend/src/features/calendar/ui/SelectedDateAgenda.tsx frontend/src/features/calendar/views/MonthView.tsx frontend/src/features/calendar/Calendar.tsx frontend/src/features/calendar/ui/CalendarRoot.tsx frontend/src/features/calendar/Calendar.test.tsx
git commit -m "feat(calendar): add mobile month agenda"
```

---

### Task 4: Add the DayStrip mobile Week presentation

**Files:**
- Create: `frontend/src/features/calendar/views/DayStrip.tsx`
- Create: `frontend/src/features/calendar/views/DayStrip.test.tsx`
- Modify: `frontend/src/features/calendar/Calendar.tsx`
- Modify: `frontend/src/features/calendar/Calendar.test.tsx`

**Interfaces:**
- Consumes: the seven dates in `controller.visibleRange`, `controller.selectedDate`, `controller.selectDate`, normalized events, and TimeGrid presentation/configuration props.
- Produces: `DayStrip<TEvent>` that renders seven day controls and a one-day `TimeGrid`.
- Guarantees: selecting a day preserves semantic `view="week"`; routed consumers update only the date query value.

- [x] **Step 1: Write failing DayStrip DOM tests.**

Render seven dates for August 9–15, 2026 and assert exactly seven day buttons plus one TimeGrid day section. Click August 12 and assert:

```ts
assert.equal(selectedDate.toISOString().slice(0, 10), "2026-08-12");
assert.equal(screen.container.querySelectorAll('[data-calendar-time-grid] section').length, 1);
```

Focus the first day and test `ArrowRight`, `End`, `Home`, and `ArrowLeft` wrapping. Assert focus moves among buttons and selection invokes `onDaySelect` without a semantic view callback.

- [x] **Step 2: Run the DayStrip test to verify it fails.**

Run:

```bash
cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/views/DayStrip.test.tsx
```

Expected: FAIL because `DayStrip` does not exist.

- [x] **Step 3: Implement DayStrip and compose TimeGrid.**

Render a `role="tablist"` day strip with seven minimum-44px buttons, localized `formatDayHeader` labels, `aria-selected`, and roving `tabIndex`. Use one shared keyboard-index helper for ArrowLeft/ArrowRight/Home/End. Below it, render existing `TimeGrid` with `days={[selectedDate]}` and the complete week `entries`; `TimeGrid` filters entries through its model.

Add `data-calendar-day-strip` to the root. Pass all TimeGrid configuration and presentation callbacks through rather than embedding public theme values.

- [x] **Step 4: Add the facade branch and semantic-view regression.**

When active layout is `dayStrip`, pass `visibleDays`, `controller.selectedDate`, and `controller.selectDate` to `DayStrip`. Extend `Calendar.test.tsx` with a Week controller whose `selectDate` records August 12; assert the controller remains `view === "week"` after DayStrip selection. The routed adapter already serializes `controller.view` with the selected date, and Task 5 browser QA verifies `view=week&date=2026-08-12` without a layout query parameter.

- [x] **Step 5: Run focused tests and commit.**

Run:

```bash
cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/views/DayStrip.test.tsx src/features/calendar/Calendar.test.tsx
```

Expected: PASS.

Commit:

```bash
git add frontend/src/features/calendar/views/DayStrip.tsx frontend/src/features/calendar/views/DayStrip.test.tsx frontend/src/features/calendar/Calendar.tsx frontend/src/features/calendar/Calendar.test.tsx
git commit -m "feat(calendar): add mobile week day strip"
```

---

### Task 5: Make the mobile toolbar compact and verify consumers

**Files:**
- Modify: `frontend/src/features/calendar/ui/CalendarRoot.tsx`
- Modify: `frontend/src/features/calendar/ui/calendar-acceptance.test.ts`

**Interfaces:**
- Consumes: resolved presentation layout from the Calendar facade.
- Produces: mobile toolbar with non-scrolling full-width view tabs and unchanged desktop alignment.
- Guarantees: 44px controls, visible focus, stable semantic tabs, and accurate `data-calendar-mode`.

- [x] **Step 1: Add failing toolbar and acceptance assertions.**

Assert source/DOM contracts for the resolved Month presentation (the Week `dayStrip` contract and semantic-view preservation are covered by `Calendar.test.tsx`):

```ts
assert.equal(screen.container.querySelector('[data-calendar-view-tabs]')?.classList.contains("overflow-x-auto"), false);
assert.equal(screen.container.querySelectorAll('[data-calendar-view-tabs] [role="tab"]').length, 3);
assert.equal(screen.container.querySelector('[data-calendar-view="month"]')?.getAttribute("data-calendar-mode"), "monthAgenda");
```

Retain existing keyboard and focus-outline assertions.

- [x] **Step 2: Run UI tests to verify they fail.**

Run:

```bash
cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/ui/calendar-root.test.ts src/features/calendar/ui/calendar-acceptance.test.ts
```

Expected: FAIL because toolbar tabs still use horizontal scrolling and acceptance tests do not render mobile layouts.

- [x] **Step 3: Apply the compact toolbar composition.**

Use a two-row mobile layout: navigation controls and truncated period heading in the first row, three equal-width tabs in the second. Add `data-calendar-view-tabs` to the semantic-view tablist, remove `overflow-x-auto`, use `grid grid-cols-3`, and retain the existing `sm:` desktop flex alignment. Do not change button labels, keyboard handlers, or focus classes.

- [x] **Step 4: Run full verification.**

Run:

```bash
cd frontend && npm run test:calendar
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && ./node_modules/.bin/eslint src/features/calendar/Calendar.tsx src/features/calendar/config.ts src/features/calendar/useCalendarLayout.ts src/features/calendar/views/MonthAgenda.tsx src/features/calendar/views/DayStrip.tsx src/features/calendar/ui/CalendarRoot.tsx src/features/calendar/presets/discovery.ts
cd frontend && NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED=false NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS=https://example.com npm run build -- --webpack
```

Expected: Calendar tests, type-check, focused ESLint, and production build all pass.

- [x] **Step 5: Run browser QA at both breakpoints.**

At 390px, verify `/th/events?view=month&date=2026-08-12` renders `data-calendar-mode="monthAgenda"`; Week renders `dayStrip` with one TimeGrid day; Day renders `timeGrid`; page width does not overflow; selecting a Week day retains `view=week`; event activation opens the existing detail route. Core responsive smoke passed against the local app; the full dynamic locale pass is dependent on the backend API being available.

At 1280px, verify both `/th/events` and `/th/calendar` retain `monthGrid` and seven-day `timeGrid`. Locale message keys for `/en/events` and `/de/events` were checked statically; the clean-proxy EN heading check passed, while the dynamic DE/API pass could not complete because the local backend process was unavailable.

- [x] **Step 6: Commit the responsive toolbar and completed checklist.**

```bash
git add frontend/src/features/calendar/ui/CalendarRoot.tsx frontend/src/features/calendar/ui/calendar-acceptance.test.ts docs/superpowers/plans/2026-08-15-calendar-mobile-layouts.md
git commit -m "feat(calendar): polish mobile calendar controls"
```

## Self-review

- Spec coverage: Tasks 1–2 cover developer configuration, fallback, validation, breakpoint behavior, and hydration. Tasks 3–4 cover MonthAgenda, DayStrip, event activation, URL semantics, keyboard behavior, and one-day TimeGrid. Task 5 covers toolbar, localization, desktop preservation, and complete verification.
- Placeholder scan: every implementation step names exact files, APIs, assertions, commands, and expected results.
- Type consistency: `CalendarLayout`, `CalendarResponsiveLayoutsInput`, `CalendarResponsiveLayouts`, `CalendarConfig.layouts`, and `useCalendarLayout` use the same names across all tasks.
