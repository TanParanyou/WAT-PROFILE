# Calendar UI Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public calendar usable on first visit and provide coherent, responsive calendar views without mixing public and admin visual tokens.

**Architecture:** Keep the existing `Calendar` controller, range query, and mock/API feed contract unchanged. Introduce a small calendar presentation layer that maps the existing entry tone and host variant to the correct theme tokens, and a tested month-display model shared by desktop and mobile layouts. The public page owns its compact header treatment; the global cookie component is adjusted only to stop masking page controls.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, TanStack Query, `date-fns`, Node test runner via `tsx --test`.

## Global Constraints

- Preserve the API and `CalendarEntry` contract; UI rendering must not add client-side event business logic.
- Use `site-*` tokens exclusively for public UI and `admin-*` tokens exclusively for admin UI.
- Keep all existing `th`, `en`, and `de` calendar copy intact; add translations to all three files if new visible copy is required.
- Do not add a calendar dependency or FullCalendar.
- Do not use `any`, `as any`, or `@ts-ignore`.
- Keep public interactive controls at least 44px and retain keyboard access and visible focus states.

---

## Target file map

| File | Responsibility |
| --- | --- |
| `frontend/src/components/layout/CookieConsent.tsx` | Make initial cookie choice visible without obscuring the calendar’s interactive region. |
| `frontend/src/app/[locale]/(client)/calendar/CalendarPageContent.tsx` | Compose a compact public calendar page shell. |
| `frontend/src/components/layout/PageHeader.tsx` | Support a page-specific compact header density without changing existing callers. |
| `frontend/src/features/calendar/calendar-theme.ts` | Map `variant` and entry tone to the correct visual classes. |
| `frontend/src/features/calendar/calendar-theme.test.ts` | Unit-test public/admin token isolation. |
| `frontend/src/features/calendar/views/CalendarEntryButton.tsx` | Receive the host variant and render through `calendar-theme.ts`. |
| `frontend/src/features/calendar/Calendar.tsx` | Pass visual variant consistently to every view. |
| `frontend/src/features/calendar/views/{MonthView,WeekView,DayView,DayGridView,TimelineView,TimeGrid}.tsx` | Pass variant to event buttons and use the correct focus tokens. |
| `frontend/src/features/calendar/views/month-grid.ts` | Build the stable 7-column mobile/desktop month display model. |
| `frontend/src/features/calendar/views/month-grid.test.ts` | Test dates, selected state, overflow, and cross-month cells in the month display model. |
| `frontend/src/features/calendar/views/MonthView.tsx` | Render the desktop month grid and a usable compact mobile month view. |
| `frontend/src/features/calendar/CalendarToolbar.tsx` | Keep navigation and period label usable when view tabs wrap/scroll on narrow screens. |
| `frontend/src/features/calendar/CalendarViewTabs.tsx` | Provide scrollable tabs with complete roving keyboard focus behavior. |

## Task 1: Establish reproducible visual acceptance checks

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/src/features/calendar/*.test.ts` only when a command list needs to include an existing test

**Interfaces:**
- Consumes: Existing Node test files under `src/features/calendar/`.
- Produces: `npm run test:calendar`, which runs all calendar unit tests without relying on a browser.

- [ ] **Step 1: Add the calendar test command**

  Add this script next to `test:account`:

  ```json
  "test:calendar": "tsx --test src/features/calendar/**/*.test.ts"
  ```

- [ ] **Step 2: Run the baseline unit suite before visual edits**

  Run: `cd frontend && npm run test:calendar`

  Expected: all existing calendar tests pass. Record the count in the implementation PR description.

- [ ] **Step 3: Capture the two required visual baselines**

  With `NEXT_PUBLIC_CALENDAR_SOURCE` unset or set to the mock source, open:

  ```text
  /th/calendar?view=month&date=2026-08-12
  ```

  Capture at `1200x800` and `390x844`, once with a fresh `cookie-consent` storage state and once after accepting. The acceptance comparison must confirm that a first-time visitor can see the active calendar controls and the selected date’s events.

- [ ] **Step 4: Commit the testing entry point**

  ```bash
  git add frontend/package.json
  git commit -m "test: add calendar test command"
  ```

## Task 2: Stop consent UI from masking calendar interaction

**Files:**
- Modify: `frontend/src/components/layout/CookieConsent.tsx`

**Interfaces:**
- Consumes: existing `cookie-consent` local-storage values (`accepted`, `declined`).
- Produces: an unobtrusive consent region that keeps both choice buttons accessible and does not cover the centered calendar viewport at desktop or mobile sizes.

- [ ] **Step 1: Define the first-visit acceptance test**

  Use a fresh browser storage state and assert manually through the real page that the three calendar navigation controls, active view tab, and selected-day event list remain visible and clickable while consent is presented.

- [ ] **Step 2: Convert the banner from a modal overlay into a non-modal consent region**

  In `CookieConsent.tsx`:

  - Remove `aria-modal`, the focus-stealing `dialogRef` effect, and Escape-to-decline behavior.
  - Keep `role="region"`, `aria-labelledby`, and the two explicit accept/decline buttons.
  - Render the compact banner at the bottom with `pointer-events-auto`, `max-w-3xl`, and a layout that becomes a vertical stack below `md`.
  - Reduce the desktop copy width and padding so it remains a notice rather than a panel. Do not remove the privacy link.

  The banner must remain fixed so it is available on every public page, but it must occupy no more than the bottom 25% of an `800px` viewport at desktop width.

- [ ] **Step 3: Verify behavior and accessibility**

  Confirm keyboard tab order reaches the privacy link, decline, and accept buttons; selecting either button stores the existing value and removes the region. Confirm no focus is moved away from the calendar merely because the banner appears.

- [ ] **Step 4: Commit the isolated global fix**

  ```bash
  git add frontend/src/components/layout/CookieConsent.tsx
  git commit -m "fix: keep cookie consent from masking content"
  ```

## Task 3: Isolate public and admin calendar presentation tokens

**Files:**
- Create: `frontend/src/features/calendar/calendar-theme.ts`
- Create: `frontend/src/features/calendar/calendar-theme.test.ts`
- Modify: `frontend/src/features/calendar/Calendar.tsx`
- Modify: `frontend/src/features/calendar/views/CalendarEntryButton.tsx`
- Modify: `frontend/src/features/calendar/views/MonthView.tsx`
- Modify: `frontend/src/features/calendar/views/WeekView.tsx`
- Modify: `frontend/src/features/calendar/views/DayView.tsx`
- Modify: `frontend/src/features/calendar/views/DayGridView.tsx`
- Modify: `frontend/src/features/calendar/views/TimelineView.tsx`
- Modify: `frontend/src/features/calendar/views/TimeGrid.tsx`

**Interfaces:**
- Consumes: `CalendarEntry["display"]["tone"]` and `CalendarProps["variant"]`.
- Produces: `calendarEntryToneClass(variant, tone)` and `calendarFocusClass(variant)`, both returning theme-specific class strings.

- [ ] **Step 1: Write failing token-isolation tests**

  In `calendar-theme.test.ts`, test these exact outcomes:

  ```ts
  assert.match(calendarEntryToneClass("public", "default"), /site-/);
  assert.doesNotMatch(calendarEntryToneClass("public", "warning"), /admin-/);
  assert.match(calendarEntryToneClass("admin", "warning"), /admin-/);
  assert.doesNotMatch(calendarFocusClass("public"), /admin-/);
  ```

- [ ] **Step 2: Run the new test to verify it fails**

  Run: `cd frontend && npx tsx --test src/features/calendar/calendar-theme.test.ts`

  Expected: FAIL because `calendar-theme.ts` does not exist yet.

- [ ] **Step 3: Implement the theme mapping and thread `variant` through views**

  Create the helpers with this API:

  ```ts
  export type CalendarVariant = "public" | "admin";

  export function calendarEntryToneClass(
    variant: CalendarVariant,
    tone: CalendarEntry["display"]["tone"],
  ): string;

  export function calendarFocusClass(variant: CalendarVariant): string;
  ```

  `Calendar` must pass `variant` to every view. Every view must pass it to `CalendarEntryButton`. Replace the hard-coded `admin-*` classes in `CalendarEntryButton` and the month date button with the helpers. Use distinct public accent/warning/muted styling only from the public token family.

- [ ] **Step 4: Run the focused and complete calendar suites**

  Run: `cd frontend && npm run test:calendar`

  Expected: PASS, including the new theme tests.

- [ ] **Step 5: Commit the theme boundary**

  ```bash
  git add frontend/src/features/calendar
  git commit -m "fix: isolate calendar theme tokens"
  ```

## Task 4: Make the mobile month view remain a month view

**Files:**
- Create: `frontend/src/features/calendar/views/month-grid.ts`
- Create: `frontend/src/features/calendar/views/month-grid.test.ts`
- Modify: `frontend/src/features/calendar/views/MonthView.tsx`

**Interfaces:**
- Consumes: `visibleRange`, `selectedDate`, entries, and the existing `entriesOnDay` utility.
- Produces: `buildMonthGrid({ days, entries, selectedDate, maxVisibleEntries })`, returning seven-day rows with `date`, `key`, `isSelected`, `isOutsideCurrentMonth`, `entries`, and `overflowCount`.

- [ ] **Step 1: Write failing display-model tests**

  Add these cases in `month-grid.test.ts`:

  ```ts
  test("builds complete seven-day rows for August 2026", () => {
    const days = Array.from({ length: 42 }, (_, index) => new Date(2026, 6, 26 + index));
    const grid = buildMonthGrid({
      days,
      entries: [],
      selectedDate: new Date(2026, 7, 12),
      maxVisibleEntries: 3,
    });
    assert.equal(grid.rows.length, 6);
    assert.ok(grid.rows.every((row) => row.length === 7));
  });

  test("marks the selected date and counts overflow without dropping events", () => {
    const days = Array.from({ length: 42 }, (_, index) => new Date(2026, 6, 26 + index));
    const entries = Array.from({ length: 6 }, (_, index) => entry({ id: `entry-${index}` }));
    const cell = buildMonthGrid({
      days,
      entries,
      selectedDate: new Date(2026, 7, 12),
      maxVisibleEntries: 3,
    }).rows.flat().find((item) => item.key === "2026-08-12");
    assert.equal(cell?.isSelected, true);
    assert.equal(cell?.entries.length, 3);
    assert.equal(cell?.overflowCount, 3);
  });
  ```

  Define `entry(overrides: Partial<CalendarEntry> = {})` in this test file with default `start` and `end` values on `2026-08-12`, matching the fixture style already used in `layout.test.ts`.

- [ ] **Step 2: Run the test to verify it fails**

  Run: `cd frontend && npx tsx --test src/features/calendar/views/month-grid.test.ts`

  Expected: FAIL because `buildMonthGrid` does not exist.

- [ ] **Step 3: Implement the display model**

  Keep date/range calculations in the pure model. It must not inspect the DOM, mutate entries, or decide event routing. Preserve the existing three-entry overflow rule for desktop and expose the complete selected-day list for the mobile agenda.

- [ ] **Step 4: Render two deliberate responsive compositions**

  In `MonthView.tsx`:

  - Desktop (`sm` and up): add a weekday header row, then the six 7-column week rows; preserve title truncation and the `+ n` overflow action.
  - Mobile: show a compact 7-column date grid with dots/counts for event presence, then a labelled agenda for the selected date below it. Selecting a date must retain its existing `controller.selectDate(day)` behavior.
  - Do not present only an ISO date and a detached list as the current implementation does.
  - Use `calendarFocusClass(variant)` for all date controls.

- [ ] **Step 5: Run unit tests and visual checks**

  Run: `cd frontend && npm run test:calendar`

  Then verify at `390x844` that the month grid, selected day, six Aug 12 mock events, and overflow affordance are visible without horizontal page overflow.

- [ ] **Step 6: Commit the responsive month view**

  ```bash
  git add frontend/src/features/calendar/views
  git commit -m "fix: make mobile month calendar navigable"
  ```

## Task 5: Tighten the public page shell and view controls

**Files:**
- Modify: `frontend/src/components/layout/PageHeader.tsx`
- Modify: `frontend/src/app/[locale]/(client)/calendar/CalendarPageContent.tsx`
- Modify: `frontend/src/features/calendar/CalendarToolbar.tsx`
- Modify: `frontend/src/features/calendar/CalendarViewTabs.tsx`

**Interfaces:**
- Consumes: existing `PageHeader` callers and `CalendarController` navigation methods.
- Produces: optional `density?: "default" | "compact"` on `PageHeader`; keyboard-correct view tabs that do not force a horizontal page overflow.

- [ ] **Step 1: Add the optional compact header density without changing defaults**

  Add this prop and preserve current behavior when omitted:

  ```ts
  density?: "default" | "compact";
  ```

  `compact` must reduce the non-reading header spacing to `pt-24 pb-12` on mobile and `pt-28 pb-14` at `md`. Pass `density="compact"` only from `CalendarPageContent`.

- [ ] **Step 2: Make the toolbar preserve hierarchy on narrow screens**

  Keep prior/today/next and period label as one wrapped group. Give view tabs `max-w-full overflow-x-auto whitespace-nowrap`, preserving a 44px minimum height. The active tab must stay visible after selection.

- [ ] **Step 3: Complete roving tab focus**

  Keep `ArrowLeft`, `ArrowRight`, `Home`, and `End`, but also retain refs to tab buttons so the newly selected tab receives focus after keyboard navigation. Clicking a tab changes URL state through the existing controller as it does now.

- [ ] **Step 4: Verify all public views and URL state**

  At desktop and mobile widths, check `month`, `week`, `day`, `dayGrid`, and `timeline` with:

  ```text
  /th/calendar?view=<view>&date=2026-08-12
  ```

  For each view, verify previous/next changes the correct range, Today returns to the current date, keyboard tab navigation works, and no page-level horizontal scrollbar exists.

- [ ] **Step 5: Commit the page-shell improvements**

  ```bash
  git add frontend/src/components/layout/PageHeader.tsx \
    'frontend/src/app/[locale]/(client)/calendar/CalendarPageContent.tsx' \
    frontend/src/features/calendar/CalendarToolbar.tsx \
    frontend/src/features/calendar/CalendarViewTabs.tsx
  git commit -m "fix: refine public calendar controls"
  ```

## Task 6: Production verification and handoff

**Files:**
- No production files expected unless verification reveals a localized copy gap.

**Interfaces:**
- Consumes: all prior tasks and mock-first feed behavior.
- Produces: verified public calendar at the reported URL and a clear test record.

- [ ] **Step 1: Run static verification**

  Run:

  ```bash
  cd frontend && npm run test:calendar
  cd frontend && ./node_modules/.bin/tsc --noEmit
  make fe-lint
  ```

  Expected: all commands pass. If lint exposes unrelated pre-existing failures, report them separately and do not mask them.

- [ ] **Step 2: Perform fresh-storage visual acceptance**

  Clear `cookie-consent`, reload the reported URL, and repeat at `1200x800` and `390x844`. Confirm:

  - consent is actionable but does not obscure the selected date’s calendar controls;
  - public event chips contain no `admin-*` styles;
  - public header, toolbar, grid, selected state, and footer do not overlap;
  - Aug 12 still displays the mock entries and clicking one follows its existing detail behavior.

- [ ] **Step 3: Validate the admin isolation smoke path**

  Open the existing admin calendar under an authenticated local session. Confirm its event chips and focus styles still use the admin palette and no public token class affects it.

- [ ] **Step 4: Final commit only if validation requires a small correction**

  ```bash
  git add <only-the-corrected-files>
  git commit -m "fix: complete calendar visual validation"
  ```

## Coverage review

- First-visit obstruction: Task 2.
- Public/admin token leakage: Task 3.
- Mobile month view not behaving as a month: Task 4.
- Oversized public page shell, crowded controls, and keyboard tab behavior: Task 5.
- Data feed, URL behavior, responsive QA, type-checking, linting, and admin regression: Task 6.

No API, OpenAPI, migration, or mock-data contract change is planned because the diagnosed URL already receives and renders the expected mock entries.
