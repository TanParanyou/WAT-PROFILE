# Calendar Production Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the custom Month/Week/Day calendar as a reusable production component with a real typed feed and two WAT consumers.

**Architecture:** Calendar rendering remains generic and never fetches data. WAT integration owns Next.js URL state, labels, API querying, presentation tones, and navigation. The Go feed remains the sole place that materializes persisted schedules into render-ready entries.

**Tech Stack:** Next.js 16, React 19, strict TypeScript, Tailwind CSS 4, TanStack Query, Go/Fiber/GORM, PostgreSQL.

## Global Constraints

- Do not use FullCalendar or add a calendar dependency.
- Active views are only `month`, `week`, and `day`; Timeline and DayGrid remain deferred.
- Preserve Thai, English, and German labels.
- Public controls have square corners, 44px targets, and 3px focus indicators.
- Calendar components do not fetch or construct API URLs.
- Calendar uses the real `/api/v1/public/calendar` feed in every environment.
- Keep frontend contracts typed; do not use `any`, `as any`, or `@ts-ignore`.
- Preserve existing unrelated worktree changes.

---

### Task 1: Finish Client TimeGrid UX

**Files:**
- Modify: `frontend/src/features/calendar/views/TimeGrid.tsx`
- Modify: `frontend/src/features/calendar/ui/MonthDayPopover.tsx`
- Modify: `frontend/src/features/calendar/calendar-copy.ts`
- Modify: `frontend/src/messages/{th,en,de}.json`
- Test: `frontend/src/features/calendar/ui/calendar-acceptance.test.ts`

**Produces:** bounded all-day rows, keyboard-accessible overflow dialog, and localized horizontal-scroll guidance.

- [x] **Step 1: Add failing DOM tests** for a day containing three all-day entries: only the configured two are visible, `+1` opens a labelled dialog, and Week exposes the scroll instruction.
- [x] **Step 2: Generalize `MonthDayPopover<TEvent extends CalendarEventLike>`** so TimeGrid can reuse it without converting entries; retain focus trap, Escape, and focus restoration.
- [x] **Step 3: Add `maxVisibleAllDayEvents` (default `2`)** to TimeGrid and store `{ date, entries, targetRect }` when an all-day overflow trigger is activated.
- [x] **Step 4: Add `labels.scrollHorizontally`** in all three locale files; render it as visually subtle text immediately before the horizontally scrollable Week grid.
- [x] **Step 5: Verify** `npm run test:calendar`, `tsc --noEmit`, focused ESLint; manually check 390px and 1280px Week/Day in `th`, `en`, and `de`.
- [x] **Step 6: Commit** `fix(calendar): complete client time grid ux`.

### Task 2: Create the reusable Calendar facade and config

**Files:**
- Create: `frontend/src/features/calendar/config.ts`
- Create: `frontend/src/features/calendar/Calendar.tsx`
- Create: `frontend/src/features/calendar/index.ts`
- Modify: `frontend/src/features/calendar/useCalendar.ts`
- Modify: `frontend/src/features/calendar/ui/CalendarRoot.tsx`
- Modify: `frontend/src/features/calendar/views/{MonthView,TimeGrid}.tsx`
- Test: `frontend/src/features/calendar/{config,Calendar}.test.tsx`

**Produces:** one `Calendar` component and one resolved configuration contract.

- [x] **Step 1: Write failing tests** for defaults, duplicate/invalid view removal, disabled-view fallback to month, and automatic Month/Week/Day composition.
- [x] **Step 2: Implement `resolveCalendarConfig(input)`** with defaults: enabled views `[month, week, day]`, month maximum `2`, and current TimeGrid window/slot/sticky values; throw for invalid minute windows or non-positive slot sizes.
- [x] **Step 3: Add `config` to `CalendarController`** and resolve it once in `useCalendar`; reject `setView` values not enabled by resolved config.
- [x] **Step 4: Change `CalendarRoot` to receive `children`** instead of render callbacks and remove unused event props.
- [x] **Step 5: Compose MonthView/TimeGrid internally in `Calendar.tsx`**, passing the resolved config and preserving original event object identity on activation.
- [x] **Step 6: Export only supported API** from `index.ts`: `Calendar`, `useCalendar`, config types/helpers, event/view/resource types, and presets.
- [x] **Step 7: Verify and commit** `refactor(calendar): add reusable calendar facade`.

### Task 3: Separate URL persistence from generic state

**Files:**
- Modify: `frontend/src/features/calendar/useCalendar.ts`
- Create: `frontend/src/features/calendar/integrations/next/calendar-url-state.ts`
- Create: `frontend/src/features/calendar/integrations/next/useRoutedCalendar.ts`
- Test: `frontend/src/features/calendar/useCalendar.test.ts`
- Test: `frontend/src/features/calendar/integrations/next/calendar-url-state.test.ts`

- [x] **Step 1: Add portability tests** asserting `useCalendar.ts` imports no `next/*`, navigation alias, or storage API.
- [x] **Step 2: Move parsing/canonicalization** of `view` and `date` to `calendar-url-state.ts`; preserve unrelated search parameters and validate date-only strings.
- [x] **Step 3: Implement `useRoutedCalendar({ scope, ...options })`** to read/write URL state and `wat-calendar-view:<scope>` storage while delegating transitions to generic `useCalendar`.
- [x] **Step 4: Test invalid/deferred views, browser history values, and public/admin storage isolation.**
- [x] **Step 5: Verify and commit** `refactor(calendar): isolate routed calendar state`.

### Task 4: Pass render-ready API entries directly to Calendar

**Files:**
- Modify: `frontend/src/features/calendar/core/types.ts`
- Modify: `frontend/src/features/calendar/types.ts`
- Modify: `frontend/src/features/calendar/adapters/wat-calendar.ts`
- Create: `frontend/src/features/calendar/integrations/wat/useClientCalendarLabels.ts`
- Create: `frontend/src/features/calendar/integrations/wat/CalendarQueryBoundary.tsx`
- Modify: `frontend/src/app/[locale]/(client)/calendar/CalendarPageContent.tsx`
- Test: `frontend/src/features/calendar/adapters/wat-calendar.test.ts`

- [x] **Step 1: Add a failing identity test** proving a parsed `CalendarEntry` is activated as the same object supplied to `Calendar`.
- [x] **Step 2: Make `CalendarEntry` satisfy `CalendarEventLike`** and delete wrapper conversion functions `toCalendarEvent(s)` and `CalendarEntryMeta`.
- [x] **Step 3: Move client label creation** from `CalendarPageContent` to `useClientCalendarLabels(locale)`.
- [x] **Step 4: Add `CalendarQueryBoundary`** for loading, stale-refresh, retryable error, and empty-data-with-calendar states.
- [x] **Step 5: Reduce `CalendarPageContent`** to routed controller, query boundary, event tone/format/navigation adapters, and `<Calendar>` composition; prohibit imports from `ui/` and `views/`.
- [x] **Step 6: Verify and commit** `refactor(calendar): consume render-ready feed entries`.

### Task 5: Harden the public feed contract

**Files:**
- Modify: `backend/internal/handlers/*calendar*.go`
- Modify: `backend/internal/calendar/event_source.go`
- Modify: `backend/internal/calendar/*_test.go`
- Modify: `backend/docs/openapi.yaml`
- Modify: `frontend/src/features/calendar/api.ts`
- Test: `frontend/src/features/calendar/queries.test.ts`

- [x] **Step 1: Add handler tests** for missing/invalid range, a maximum allowed range, invalid locale rejection, and envelope shape.
- [x] **Step 2: Enforce a documented bounded range** before loading sources, returning typed HTTP validation errors for invalid requests.
- [x] **Step 3: Add materialization cases** for all-day, multi-day, overlapping, inactive, and Europe/Berlin DST-boundary events.
- [x] **Step 4: Align OpenAPI and frontend parser** with exact query constraints and error envelopes.
- [ ] **Step 5: Verify** focused Go tests/vet, frontend parser tests, and a live endpoint smoke test (the local API is not running in this session).
- [x] **Step 6: Commit** `fix(calendar): harden public feed contract`.

### Task 6: Migrate Admin as the second consumer

**Files:**
- Modify: `frontend/src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx`
- Modify: `frontend/src/app/[locale]/admin/calendar/_components/CalendarEntryDrawer.tsx`
- Test: `frontend/src/app/[locale]/admin/calendar/_components/*.test.ts`

- [x] **Step 1: Add an Admin consumer test** for opening an entry drawer and retaining edit permission/navigation behavior.
- [x] **Step 2: Replace direct `CalendarRoot`/view composition** with `Calendar`, `useRoutedCalendar`, and Admin presentation callbacks.
- [x] **Step 3: Retain RBAC boundaries:** the calendar only emits the selected entry; drawer decides whether edit affordances are shown.
- [x] **Step 4: Verify public and Admin Calendar DOM tests, TypeScript, ESLint, and the Admin route manually.**
- [x] **Step 5: Commit** `refactor(calendar): migrate admin consumer`.

### Task 7: Freeze and document the library boundary

**Files:**
- Create: `frontend/src/features/calendar/README.md`
- Modify: `frontend/src/features/calendar/index.ts`
- Test: `frontend/src/features/calendar/public-api.test.ts`

- [x] **Step 1: Add a public-API test** that imports only the barrel and uses `Calendar`, `useCalendar`, config, and public types.
- [x] **Step 2: Document** required props, config defaults, event contract, WAT integration points, deferred views, and extension rules.
- [x] **Step 3: Verify dependency direction:** generic files do not import `next/*`, WAT services, messages, or route code.
- [x] **Step 4: Run the full calendar verification gate** (`npm run test:calendar`, DOM suite, `tsc --noEmit`, focused ESLint; backend calendar tests/vet).
- [x] **Step 5: Commit** `docs(calendar): freeze reusable component boundary`.

## Coverage review

- Client Month/Week/Day usability and accessibility: Task 1.
- Global, reusable component and hooks: Tasks 2–3.
- No frontend business reconstruction of feed data: Task 4.
- Production API contract and Berlin semantics: Task 5.
- Second consumer and reusable-library readiness: Tasks 6–7.
- Explicitly excluded: Timeline, DayGrid, drag/drop, recurrence editing, resource scheduling, and external sync.
