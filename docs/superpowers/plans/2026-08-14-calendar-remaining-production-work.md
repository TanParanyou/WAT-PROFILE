# Calendar Remaining Production Work Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the custom Calendar as a production-ready client experience first, then stabilize its reusable React interface, backend feed contract, Admin adoption, and package-extraction boundary without using FullCalendar.

**Architecture:** Keep rendering and date layout inside a generic Calendar feature, keep WAT-specific navigation, translations, query handling, and event presentation in thin integration adapters, and keep persistence/materialization in the Go calendar feed. Month, Week, and Day are the only active views; Timeline and DayGrid remain compiled out until a separate requirement is approved.

**Tech Stack:** Next.js 16, React 19, strict TypeScript, Tailwind CSS 4, date-fns, TanStack Query, Node test runner with `tsx`/`happy-dom`, Go 1.24, Fiber, GORM, PostgreSQL.

## Global Constraints

- Do not add or use FullCalendar.
- Finish and approve the public Client Calendar before changing the Admin Calendar.
- Active views are exactly `month`, `week`, and `day`.
- Keep `timeline` and resource `dayGrid` deferred; retain only compatible event/resource types.
- Visitor dates and times use `Europe/Berlin` semantics.
- Preserve Thai, English, and German labels and behavior.
- Public controls keep square corners, 44px minimum targets, and focus indicators at least 3px.
- Components do not fetch data or construct API URLs.
- The backend returns render-ready calendar entries; the public page must not reconstruct dates, ranges, status, permissions, or URLs.
- Do not use TypeScript `any`, `as any`, `@ts-ignore`, or direct frontend database access.
- Do not extract a distributable package until the public and Admin consumers both pass the same contract tests.

---

## Scope Status

### Completed baseline

- [x] Generic event, range, view, and resource contracts.
- [x] URL date/view state and separate public/Admin saved-view preferences.
- [x] Discovery and Planning presets.
- [x] Month grid with selected-day register and overflow popover.
- [x] Week and Day operating-hour TimeGrid with all-day and overlapping timed entries.
- [x] Sticky header/time axis and grid-scoped horizontal scrolling.
- [x] Tooltip customization and WAT event tones.
- [x] Mock feed covering multi-day, all-day, overlap, inactive, and localized events.
- [x] Public and Admin calendar API routes with typed frontend validation.
- [x] Public Week/Day restoration and baseline tests (`49/49`).

### Explicitly deferred

- [ ] Timeline view.
- [ ] Resource DayGrid view.
- [ ] Drag/drop, resize, inline create/edit, recurring-event editor, and resource scheduling.
- [ ] External calendar synchronization.

Deferred items are not implementation tasks in this plan. They require a new requirement and design review.

---

### Task 1: Lock the Client Calendar acceptance contract

**Files:**
- Create: `frontend/src/features/calendar/ui/calendar-acceptance.test.tsx`
- Modify: `frontend/package.json`
- Test: `frontend/src/features/calendar/ui/calendar-acceptance.test.tsx`

**Interfaces:**
- Consumes: current `CalendarRoot`, `MonthView`, `TimeGrid`, `CalendarController`, and `CalendarEventLike` contracts.
- Produces: executable DOM assertions that protect Month, Week, and Day while the public interface is refactored.

- [ ] **Step 1: Add a happy-dom test harness without a new dependency**

  Use the already-installed `happy-dom`, `react`, and `react-dom` packages. Add a helper that installs `window`, `document`, `navigator`, `requestAnimationFrame`, and a root container, then restores them after each test.

- [ ] **Step 2: Write baseline interaction tests**

  Cover these exact behaviors:

  - Month renders seven weekday headers and activates a selected date.
  - Week renders seven labelled day columns in one TimeGrid.
  - Day renders one labelled day column in one TimeGrid.
  - Empty Week and empty Day both render `labels.noEventsOnDate`.
  - Clicking an event calls `onEventActivate` with the original typed event.
  - Arrow keys, Home, and End move the active view tab.

- [ ] **Step 3: Add a focused calendar DOM test command**

  Add `test:calendar:dom` and include it in `test:calendar` so the command remains the single calendar verification entry point.

- [ ] **Step 4: Run the tests and confirm the baseline passes**

  Run: `cd frontend && npm run test:calendar`

  Expected: the new baseline tests pass before UX changes begin. Accessibility gaps added in Task 2 must start with their own failing assertions.

- [ ] **Step 5: Commit the executable acceptance contract**

  Commit: `test(calendar): lock client view behavior`

---

### Task 2: Finish Client Month, Week, and Day UX/accessibility

**Files:**
- Modify: `frontend/src/features/calendar/ui/CalendarRoot.tsx`
- Modify: `frontend/src/features/calendar/views/MonthView.tsx`
- Modify: `frontend/src/features/calendar/views/TimeGrid.tsx`
- Modify: `frontend/src/features/calendar/ui/MonthDayPopover.tsx`
- Modify: `frontend/src/features/calendar/ui/CalendarEventRow.tsx`
- Modify: `frontend/src/features/calendar/calendar-copy.ts`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`
- Test: `frontend/src/features/calendar/ui/calendar-acceptance.test.tsx`
- Test: existing tests beside each modified Calendar module.

**Interfaces:**
- Consumes: current public Calendar behavior from Task 1.
- Produces: an approved, keyboard-complete public Month/Week/Day experience that later refactors must preserve.

- [ ] **Step 1: Add failing accessibility assertions**

  Assert all interactive Calendar controls have a 44px minimum target, an explicit focus outline of at least 3px, and an accessible name. Assert every TimeGrid day section is labelled by its own day header.

- [ ] **Step 2: Normalize focus and control sizing**

  Replace remaining `focus-visible:outline-2` Calendar classes with the shared 3px focus treatment. Keep compact event blocks readable while preserving their 44px interactive target.

- [ ] **Step 3: Complete popover focus management**

  On open, focus the close button or first event; keep Tab/Shift+Tab inside the dialog; close on Escape; restore focus to the `+N` trigger. Localize the close label in all three public message files.

- [ ] **Step 4: Bound dense all-day content**

  Add one internal all-day visible-row limit so many all-day events cannot consume the viewport. Reuse the existing day overflow dialog pattern instead of introducing a new overlay component. Task 3 exposes this approved behavior through configuration.

- [ ] **Step 5: Clarify Week horizontal navigation**

  Keep the seven-day Week grid at desktop and mobile, scope overflow to the TimeGrid, retain sticky day/time headers, and add a non-obstructive localized instruction when the content is horizontally scrollable. Do not replace Week with a one-day mobile fallback.

- [ ] **Step 6: Harden long-content rendering**

  Verify long German titles, Thai headings, multi-day entries, overlaps, and empty ranges at 200% zoom. Titles may truncate only when the full value remains available through an accessible name and the optional tooltip.

- [ ] **Step 7: Run automated and browser acceptance checks**

  Run:

  - `cd frontend && npm run test:calendar`
  - `cd frontend && ./node_modules/.bin/tsc --noEmit`
  - focused ESLint for the changed files

  Browser matrix: `th`, `en`, `de` × `month`, `week`, `day` at 390px and 1280px. Confirm no page-level horizontal overflow and no clipped toolbar labels.

- [ ] **Step 8: Commit the Client UX baseline**

  Commit: `fix(calendar): complete client view accessibility`

**Client UX Gate:** Stop here for user visual approval before changing the component interface.

---

### Task 3: Introduce the easy global Calendar component

**Files:**
- Create: `frontend/src/features/calendar/Calendar.tsx`
- Create: `frontend/src/features/calendar/config.ts`
- Create: `frontend/src/features/calendar/index.ts`
- Modify: `frontend/src/features/calendar/ui/CalendarRoot.tsx`
- Modify: `frontend/src/features/calendar/views/MonthView.tsx`
- Modify: `frontend/src/features/calendar/views/TimeGrid.tsx`
- Modify: `frontend/src/features/calendar/useCalendar.ts`
- Test: `frontend/src/features/calendar/Calendar.test.tsx`
- Test: `frontend/src/features/calendar/config.test.ts`
- Test: `frontend/src/features/calendar/useCalendar.test.ts`

**Interfaces:**
- Consumes: the approved visual behavior from Task 2.
- Produces:

  ```ts
  export interface CalendarConfigInput {
    enabledViews?: readonly CalendarView[];
    month?: { maxVisibleEvents?: number };
    timeGrid?: {
      minMinutes?: number;
      maxMinutes?: number;
      slotDurationMinutes?: number;
      slotHeight?: number;
      minimumDayWidth?: number;
      maxVisibleAllDayEvents?: number;
      stickyHeader?: boolean;
      stickyTimeAxis?: boolean;
    };
  }

  export interface CalendarProps<TEvent extends CalendarEventLike> {
    controller: CalendarController;
    events: readonly TEvent[];
    labels: CalendarLabels;
    variant: CalendarVariant;
    resources?: readonly CalendarResource[];
    onEventActivate: (event: TEvent) => void;
    renderEvent?: (
      event: TEvent,
      density: "summary" | "row" | "timeGrid",
    ) => ReactNode;
    getEventClassName?: (
      event: TEvent,
      density: "summary" | "row" | "timeGrid",
    ) => string;
    formatEventTime?: (event: TEvent, date: string) => string | null;
    formatEventLocation?: (event: TEvent) => string | null;
    showTooltip?: boolean;
    renderTooltip?: (event: TEvent) => ReactNode;
  }

  export interface CalendarController {
    view: CalendarView;
    date: Date;
    selectedDate: Date;
    visibleRange: CalendarRange;
    config: CalendarConfig;
    previous(): void;
    next(): void;
    today(): void;
    setView(view: CalendarView): void;
    setDate(date: Date): void;
    selectDate(date: Date): void;
  }
  ```

- [ ] **Step 1: Write failing public-interface tests**

  Render `<Calendar>` with only the required props. Assert Month, Week, and Day choose their internal view automatically. Assert omitted configuration resolves to the current approved defaults.

- [ ] **Step 2: Add validated configuration resolution**

  Implement a pure `resolveCalendarConfig(preset, input)` that rejects invalid time windows and slot durations, deduplicates enabled views, and falls back to `month` when the requested view is disabled. The hook resolves the preset/config once and exposes the result through `controller.config`, so consumers do not pass the same options to the hook and component twice.

- [ ] **Step 3: Make CalendarRoot an internal shell**

  Remove unused event props and the required `renderMonth`, `renderAgenda`, and `renderTimeGrid` callbacks. Accept one resolved `children` view instead. Keep toolbar, period label, and view tabs inside the shell.

- [ ] **Step 4: Compose active views inside Calendar**

  `Calendar.tsx` owns the switch between `MonthView` and `TimeGrid`. It calculates visible days once and passes resolved configuration to the active view. There is no Timeline or DayGrid branch.

- [ ] **Step 5: Add one supported barrel export**

  Export only `Calendar`, `useCalendar`, public types, config helpers, and presets from `features/calendar/index.ts`. Treat internal `ui/`, `views/`, and layout files as private implementation details.

- [ ] **Step 6: Run tests and commit**

  Run Calendar tests, TypeScript, and focused ESLint.

  Commit: `refactor(calendar): add reusable calendar facade`

---

### Task 4: Split the portable hook from Next.js URL persistence

**Files:**
- Modify: `frontend/src/features/calendar/useCalendar.ts`
- Create: `frontend/src/features/calendar/integrations/next/useRoutedCalendar.ts`
- Create: `frontend/src/features/calendar/integrations/next/calendar-url-state.ts`
- Modify: `frontend/src/features/calendar/core/calendar-state.ts`
- Test: `frontend/src/features/calendar/useCalendar.test.ts`
- Test: `frontend/src/features/calendar/integrations/next/calendar-url-state.test.ts`

**Interfaces:**
- Consumes: `CalendarView`, `CalendarController`, and `CalendarConfigInput` from Task 3.
- Produces:

  ```ts
  export interface UseCalendarOptions {
    weekStartsOn: 0 | 1;
    preset?: CalendarPreset;
    config?: CalendarConfigInput;
    initialView?: CalendarView;
    initialDate?: Date;
    onStateChange?: (state: { view: CalendarView; date: Date }) => void;
  }

  export function useCalendar(options: UseCalendarOptions): CalendarController;

  export interface UseRoutedCalendarOptions extends UseCalendarOptions {
    scope: CalendarScope;
  }

  export function useRoutedCalendar(
    options: UseRoutedCalendarOptions,
  ): CalendarController;
  ```

- [ ] **Step 1: Write failing portability tests**

  Assert `useCalendar.ts` contains no import from `next/*`, `@/navigation`, WAT services, or browser storage. Test previous/next/today/setView/selectDate against enabled views.

- [ ] **Step 2: Keep useCalendar framework-neutral**

  Move URL parsing, router replacement, and scoped localStorage behavior out of `useCalendar`. Keep date/view transitions and controlled callbacks in the generic hook.

- [ ] **Step 3: Add the WAT Next.js adapter**

  `useRoutedCalendar` reads and canonicalizes `view`/`date`, writes `wat-calendar-view:<scope>`, preserves unrelated search parameters, and delegates all calendar transitions to `useCalendar`.

- [ ] **Step 4: Test browser history and invalid values**

  Preserve existing behavior for invalid views, deferred view names, valid dates, saved preference precedence, and public/Admin storage isolation.

- [ ] **Step 5: Run tests and commit**

  Commit: `refactor(calendar): isolate routed calendar state`

---

### Task 5: Pass API entries directly and simplify the Client page

**Files:**
- Modify: `frontend/src/features/calendar/core/types.ts`
- Modify: `frontend/src/features/calendar/types.ts`
- Modify: `frontend/src/features/calendar/adapters/wat-calendar.ts`
- Modify: `frontend/src/features/calendar/queries.ts`
- Create: `frontend/src/features/calendar/integrations/wat/useClientCalendarLabels.ts`
- Create: `frontend/src/features/calendar/integrations/wat/CalendarQueryBoundary.tsx`
- Modify: `frontend/src/app/[locale]/(client)/calendar/CalendarPageContent.tsx`
- Test: `frontend/src/features/calendar/adapters/wat-calendar.test.ts`
- Test: `frontend/src/features/calendar/queries.test.ts`
- Test: `frontend/src/features/calendar/presets/presets.test.ts`

**Interfaces:**
- Consumes: `Calendar<TEvent>` and `useRoutedCalendar` from Tasks 3–4.
- Produces: `CalendarEntry extends CalendarEventBase`, allowing `query.data.entries` to be passed directly to `<Calendar>` without `toCalendarEvents`.

- [ ] **Step 1: Write a failing direct-feed test**

  Assert a parsed `CalendarEntry` can be supplied directly to the generic Calendar and the activation callback receives the same object identity and WAT `display`/`detail` fields.

- [ ] **Step 2: Remove the duplicate event wrapper**

  Make shared views generic over `TEvent extends CalendarEventLike`. Delete `CalendarEntryMeta`, `WatCalendarEvent`, `toCalendarEvent`, and `toCalendarEvents`. Keep only WAT-specific formatting and tone helpers operating on `CalendarEntry`.

- [ ] **Step 3: Move label construction out of the route component**

  `useClientCalendarLabels` owns next-intl/date-fns formatting for `th`, `en`, and `de`. It returns a complete `CalendarLabels` object.

- [ ] **Step 4: Standardize query states**

  `CalendarQueryBoundary` renders loading, stale refresh, recoverable error/retry, and data states without hiding previously loaded data. An empty feed still renders the Calendar with its empty view state.

- [ ] **Step 5: Reduce CalendarPageContent to composition**

  The page should only select locale/week start, create the routed controller, execute the feed query, define event navigation/presentation callbacks, and render `<Calendar>`.

- [ ] **Step 6: Verify no business logic remains in the page**

  Add a source-boundary assertion that the Client page does not parse API dates, filter statuses, calculate event overlaps, map permission URLs, or import internal view components.

- [ ] **Step 7: Run tests and commit**

  Commit: `refactor(calendar): consume render-ready feed entries`

**Reusable Client Gate:** At this point a new React consumer can use one hook plus one Calendar component without understanding MonthView or TimeGrid internals.

---

### Task 6: Harden the production calendar feed contract

**Files:**
- Modify: `backend/internal/calendar/types.go`
- Modify: `backend/internal/calendar/event_source.go`
- Modify: `backend/internal/handlers/calendar_handler.go`
- Modify: `backend/internal/handlers/calendar_handler_test.go`
- Modify: `backend/internal/calendar/event_source_test.go`
- Modify: `backend/docs/openapi.yaml`
- Modify: `frontend/src/features/calendar/api.ts`
- Test: `frontend/src/features/calendar/queries.test.ts`

**Interfaces:**
- Consumes: the direct `CalendarEntry` client contract from Task 5.
- Produces: bounded, localized, render-ready public/Admin feeds with identical typed fields and explicit `Europe/Berlin` semantics.

- [ ] **Step 1: Add failing handler contract tests**

  Cover missing/invalid dates, `from > to`, ranges longer than 93 inclusive days, invalid locale, public inactive filtering, Admin edit metadata, and an empty feed.

- [ ] **Step 2: Bound query ranges**

  Reject ranges longer than 93 inclusive days with HTTP 400. This covers Month grids and normal navigation while preventing accidental unbounded calendar queries.

- [ ] **Step 3: Complete event materialization cases**

  Test all-day exclusive ends, timed events, cross-midnight ranges, localized title/location fallback, inactive tone, public detail URL, and Admin editor URL. Date/time formatting stays in the backend.

- [ ] **Step 4: Preserve the source seam without premature aggregation**

  Keep `calendar.Source` as the extension interface and register only `EventSource`. Do not add a multi-source aggregator until a second real source is approved. Keep `resourceId` and `resources` in the contract for forward compatibility.

- [ ] **Step 5: Align OpenAPI and frontend parsing**

  Document the 93-day limit, inclusive request bounds, exclusive all-day end, localized fields, scopes, resources, and error responses. Update frontend validation in the same commit if the payload changes.

- [ ] **Step 6: Run cross-boundary verification**

  Run:

  - `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./...`
  - `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...`
  - `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go build -o bin/server ./cmd/app`
  - `cd frontend && npm run test:calendar`
  - `cd frontend && ./node_modules/.bin/tsc --noEmit`

- [ ] **Step 7: Commit the feed hardening**

  Commit: `fix(calendar): harden production feed contract`

---

### Task 7: Switch Client mock/API behavior through one explicit seam

**Files:**
- Modify: `frontend/src/features/calendar/api.ts`
- Modify: `frontend/src/features/calendar/mock-data.ts`
- Modify: `frontend/src/features/calendar/mock-data.test.ts`
- Modify: `frontend/.env.example`
- Create: `frontend/src/features/calendar/README.md`

**Interfaces:**
- Consumes: `fetchCalendarFeed` and `CalendarFeedRequest`.
- Produces: one documented source selector where production is always API and development can deliberately choose `mock` or `api`.

- [ ] **Step 1: Write source-selection tests**

  Assert production never uses mock data. Assert development uses mock only for `NEXT_PUBLIC_CALENDAR_SOURCE=mock`; `api` uses the real service. Invalid values fail fast in development.

- [ ] **Step 2: Make mock selection explicit**

  Replace the current implicit development default with the documented selector. Keep all mock data behind `getMockCalendarFeed`; components never import mock fixtures.

- [ ] **Step 3: Document the local QA workflow**

  Explain how to run mock mode, API mode, the August 2026 overlap fixture, Calendar tests, and the required locale/view/viewport browser matrix.

- [ ] **Step 4: Run tests and commit**

  Commit: `docs(calendar): define mock and api workflow`

---

### Task 8: Migrate Admin as the second consumer

**Start condition:** Tasks 1–7 are approved on the Client Calendar.

**Files:**
- Modify: `frontend/src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx`
- Modify: `frontend/src/app/[locale]/admin/calendar/_components/CalendarEntryDrawer.tsx`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`
- Test: `frontend/src/app/[locale]/admin/calendar/_components/CalendarEntryDrawer.test.ts`
- Test: `frontend/src/features/calendar/ui/calendar-acceptance.test.tsx`

**Interfaces:**
- Consumes: the same `Calendar`, `useRoutedCalendar`, `CalendarEntry`, and production feed contract used by the Client.
- Produces: a second real consumer proving that the generic interface supports a different theme and activation flow without forking view code.

- [ ] **Step 1: Add failing Admin consumer tests**

  Assert the Admin uses the Planning preset, retains inactive entries, exposes editor actions only when `detail.canEdit` is true, and opens the existing drawer.

- [ ] **Step 2: Replace direct internal-view composition**

  Render the shared `<Calendar>` and pass Admin theme/presentation callbacks. Do not copy MonthView or TimeGrid.

- [ ] **Step 3: Preserve RBAC and edit navigation**

  Keep permission-aware actions in the drawer and rely on backend `PermissionRequired("events", "read")` plus feed `canEdit` metadata. Frontend guards remain UX only.

- [ ] **Step 4: Verify Admin and Client together**

  Run Calendar tests, TypeScript, focused ESLint, and browser checks for both scopes.

- [ ] **Step 5: Commit the second consumer**

  Commit: `refactor(calendar): migrate admin to shared facade`

---

### Task 9: Establish the extraction-ready library boundary

**Start condition:** Both Client and Admin pass the shared contract tests.

**Files:**
- Modify: `frontend/src/features/calendar/index.ts`
- Create: `frontend/src/features/calendar/public-api.test.ts`
- Create: `frontend/src/features/calendar/dependency-boundary.test.ts`
- Modify: `frontend/src/features/calendar/README.md`
- Deferred outside this plan: `packages/calendar/` workspace package; create it only through the separate extraction plan defined in Step 5.

**Interfaces:**
- Consumes: the stable exports proven by Tasks 3–8.
- Produces: a versionable public API and a documented extraction decision; it does not publish a package automatically.

- [ ] **Step 1: Freeze supported exports**

  Snapshot the exact barrel exports: `Calendar`, `useCalendar`, config types/helpers, event/range/resource/view types, labels type, and presets. Do not export internal view/layout utilities.

- [ ] **Step 2: Enforce dependency direction**

  Add a source test that generic Calendar files cannot import Next.js, next-intl, WAT navigation/services, WAT DTOs, or public/Admin message files. Integration adapters may import the generic module, never the reverse.

- [ ] **Step 3: Document usage and extension points**

  Include minimal Month/Week/Day usage, controlled event activation, custom rendering, time-grid configuration, localization, URL integration, mock/API integration, and theming slots.

- [ ] **Step 4: Run the extraction readiness gate**

  Verify tests, TypeScript, lint, production frontend build, backend tests/vet/build, and the Client/Admin browser matrix.

- [ ] **Step 5: Decide package extraction separately**

  If another project is ready to consume the Calendar, create a new package plan for `packages/calendar` with package exports, CSS delivery, peer dependency ranges, semantic versioning, and a migration example. If there is no second repository consumer yet, keep the stable module in `frontend/src/features/calendar` to avoid speculative package infrastructure.

- [ ] **Step 6: Commit the stable boundary**

  Commit: `docs(calendar): define reusable module contract`

---

## Delivery Order and Checkpoints

1. **Client visual completion:** Tasks 1–2.
2. **Easy reusable frontend API:** Tasks 3–5.
3. **Production data boundary:** Tasks 6–7.
4. **Second consumer proof:** Task 8.
5. **Personal library/extraction readiness:** Task 9.

Do not start the next checkpoint until the previous checkpoint passes its tests and receives user approval. Timeline, DayGrid, resource lanes, editing interactions, recurrence, and external sync remain outside this plan.

## Final Definition of Done

- Public Month, Week, and Day are understandable and usable in `th`, `en`, and `de` at mobile and desktop widths.
- A consumer uses one `useCalendar`-family hook and one `<Calendar>` component; it never imports individual views.
- WAT pages pass backend entries directly without reconstructing event business rules.
- Mock/API selection is explicit and production cannot silently use mock data.
- Public and Admin feeds stay typed, permission-aware, range-bounded, localized, and documented in OpenAPI.
- Client and Admin share the same view implementation and contract tests.
- The generic Calendar module has no Next.js, WAT API, locale-file, or Admin dependency.
- Package extraction is a deliberate final step, not a prerequisite for finishing the Client experience.
