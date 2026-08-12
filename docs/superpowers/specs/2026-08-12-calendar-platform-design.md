# Calendar Platform Design

## Summary

Replace the narrow `CalendarMonth` integration with a self-built Calendar Platform.
The platform owns calendar state, date-range calculation, responsive layouts, keyboard
interaction, and entry rendering. Screens consume a small hook-plus-component interface
instead of mapping event DTOs and constructing calendar days themselves.

The first release is mock-first and materializes Event data only. Its common contract is
intentionally source-neutral so Schedule, booking, and real resource sources can join
later without replacing the frontend module or HTTP shape.

## User experience

- Add public `/calendar` and protected `/admin/calendar` as the canonical calendar
  surfaces. Existing Events and Schedules pages retain their operational list views and
  link to the new calendar.
- Support five views: `month`, `week`, `day`, `dayGrid`, and `timeline`.
  - `month`: month grid with all-day/multi-day entries.
  - `week`: seven-day time grid.
  - `day`: one-day time grid.
  - `dayGrid`: resource-capable day grid; v1 uses one default lane.
  - `timeline`: resource-capable horizontal day timeline; v1 uses one default lane.
- Calendar starts in Month view. View and focus date synchronize to `view` and `date`
  URL parameters and persist separately for public and admin browser preferences.
- Public entry activation navigates to its public detail page. Admin activation opens a
  detail drawer; the drawer only exposes an editor link when the API declares the action
  permitted.
- All layouts must retain the existing public/Admin theme seams, 44px targets, visible
  focus, keyboard navigation, reduced-motion-safe transitions, and th/en/de labels.

## Frontend interface

The public seam is a generic Calendar module:

```tsx
const calendar = useCalendar({
  scope: "public",
  initialView: "month",
  timezone: "Europe/Berlin",
});
const entries = useCalendarEntries({
  scope: "public",
  range: calendar.visibleRange,
  locale,
});

return <Calendar controller={calendar} query={entries} />;
```

- `useCalendar` owns navigation, selected date, selected view, visible interval,
  URL/local-storage synchronization, and locale week-start behavior.
- `useCalendarEntries` owns TanStack Query keys, server fetches, stale-data retention,
  and typed loading/error states.
- `Calendar` receives only the controller and entry query. Internal view adapters own
  event grouping, overlap layout, mobile presentation, and accessible interactions.
- `CalendarEntry` contains `id`, `source`, `title`, `start`, `end`, `allDay`, optional
  `resourceId`, `status`, `display`, and a `detail` descriptor. It never exposes raw
  Event or Schedule DTOs to calendar layouts.
- `CalendarResource` is part of the interface now. v1 returns a single `default` lane;
  later resource-backed sources can return named lanes without a UI redesign.

## Backend contract and mock-first path

- Add public `GET /public/calendar` and authenticated, permission-protected
  `GET /admin/calendar`. Both require inclusive `from` and `to` date-only parameters
  and accept `locale=th|en|de`.
- The server resolves localized title, Berlin date/time semantics, source identifier,
  detail target, status, and permitted actions. The frontend does not transform Event
  fields into calendar entries.
- v1 source registry includes `event` only. Event ranges use inclusive overlap filtering.
  The registry interface accommodates future Schedule occurrence generation and booking
  sources, but no Schedule occurrence is produced in v1.
- Public responses include active Event entries only. Admin responses include entries for
  sources the authenticated role may read; edit affordances are declared per entry from
  the same permission model enforced by the route.
- Add a mock source behind `NEXT_PUBLIC_CALENDAR_SOURCE=mock|api`. It defaults to `mock`
  only when `NODE_ENV=development`; production always resolves to `api` even if the
  variable is absent. Mock entries cover all-day, timed, overlapping, multi-day,
  inactive/admin-only, overflow, and cross-month cases so every view can be exercised
  before backend integration.

## Validation and rollout

- Unit-test date ranges, view-specific visible intervals, preference/URL precedence,
  time-grid overlap columns, resource lane fallback, and mock-to-API adapter validation.
- Add handler/service tests for range validation, public visibility, locale resolution,
  and admin permission-derived actions; update OpenAPI and typed clients together.
- Add component tests for view switching, keyboard navigation, drawer permissions, empty,
  refreshing, and mobile behavior. Run frontend type-check/lint/build and backend test,
  vet, and build.
- Retire `CalendarMonth` only after `/calendar` and `/admin/calendar` use the new seam.
  Existing Events list and Schedule section remain unchanged during this rollout.

## Decisions

- No FullCalendar dependency or premium scheduler license.
- No new resource/place database entity in v1. Resource lanes are an interface seam with
  one default lane until the product introduces managed places.
- No recurrence interpretation in v1. Schedule remains outside the materialized feed.
- API is authoritative for calendar entry shaping; frontend mock data mirrors that exact
  contract rather than raw entity DTOs.
