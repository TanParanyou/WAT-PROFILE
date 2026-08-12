# Calendar Discovery and Reusable Library Design

**Status:** Approved design; ready for implementation planning.

## Goal

Turn the current calendar into a reusable local library with two presentation presets. The immediate delivery improves the public client experience: visitors can discover activities and open their details without learning an operational scheduling interface. A Planning preset remains available for later admin/personal use.

This design supersedes the public UX portions of `2026-08-12-fullcalendar-reference-calendar-design.md`. The existing TimeGrid work remains a reusable planning primitive, not the default public presentation.

## Product behavior

### Discovery preset — current public client

- Default view is Month. Month remains a complete seven-column grid; dates with activity show a count and up to two compact event summaries on desktop.
- Selecting a date reveals a localized agenda below the grid (or in a desktop adjacent detail region): all-day entries first, then timed entries ordered by start time. Each row shows title, time where applicable, optional location, and an explicit detail action.
- Week is an agenda of seven date sections, not a seven-column TimeGrid. Empty dates collapse to a concise empty state; dates with activity show an ordered register of event rows.
- Day is the same readable agenda for a selected day. It does not expose TimeGrid to public visitors in the initial release.
- Mobile uses the Month grid plus selected-date agenda, then Week/Day agenda lists. It never compresses or horizontally scrolls a time-planning grid.
- Toolbar keeps previous, next, Today, visible-range title, URL state, and keyboard-operable view tabs. Copy and dates remain complete in Thai, English, and German.

### Planning preset — deferred UI, supported by core

- Retains Month, TimeGrid Week, and TimeGrid Day for operational planning.
- The current shared TimeGrid, overlap placement, all-day row, and visible operating-hour configuration become planning-only primitives.
- Resource identifiers remain optional event data. There is no resource filter, lane, timeline, editing, drag/drop, or public resource display in this release.

## Library shape

Keep the library local to this repository until its API has been proven by real usage. It must have three dependency directions:

```text
core  <-  ui primitives  <-  discovery / planning presets  <-  WAT adapters
```

- **Core:** generic event types, date range/navigation state, timezone-aware range semantics, event sorting/grouping, overlap layout, and view registry. It does not import Next.js, TanStack Query, WAT API clients, translations, or theme tokens.
- **UI primitives:** Month grid, agenda list, TimeGrid, toolbar, and event row. They receive labels, render callbacks, actions, and CSS variables as inputs; they do not fetch data.
- **Presets:** `discovery` selects Month/Agenda Week/Agenda Day defaults and responsive behavior; `planning` selects Month/TimeGrid Week/TimeGrid Day. Presets may set defaults but consumers can override enabled views and renderers.
- **WAT adapters:** the current query hook, URL router synchronisation, `next-intl` labels, `site-*` / `admin-*` variable mapping, and detail/drawer behavior remain at app boundaries.

## Public interfaces

The reusable event type is generic and data-in:

```ts
interface CalendarEvent<TMeta = Record<string, never>> {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  resourceId?: string;
  meta: TMeta;
}
```

The library exposes a controlled/uncontrolled Calendar surface with these extension points:

- `preset: "discovery" | "planning"`
- `events`, `view`, `defaultView`, `date`, `defaultDate`, `onViewChange`, `onDateChange`, and `onEventClick`
- `views` to constrain a consumer to supported views; Discovery defaults to `month | week | day`, with agenda renderers for Week/Day.
- `renderEvent`, `renderDaySummary`, and `renderEventDetailAction` for project-specific metadata and links.
- `locale`, `timezone`, `weekStartsOn`, labels/formatters, and CSS-variable theme input.
- optional `resources` contract retained for future Planning work, but ignored by Discovery UI.

Calendar components never own HTTP, persistence, URLs, authentication, or edit actions. Consumers map domain records into `CalendarEvent<TMeta>` and own those side effects.

## Data, accessibility, and acceptance

- Existing WAT API feed and Berlin date semantics remain unchanged for the public migration. The adapter maps `CalendarEntry` to the generic library event without discarding existing detail/location/status metadata.
- Public event display order is: all-day first; then timed entries ascending by start, end, title, and id. Multi-day entries are included in each visible date under the existing inclusive-range/exclusive-all-day-end rules.
- All actions remain keyboard operable with visible focus and 44px targets. Event rows must have useful screen-reader labels including title, date/time, and optional location.
- On desktop and mobile, a visitor can identify activity dates, select one, understand the day’s schedule, and open an activity detail without encountering a planning grid.
- Planning behavior remains regression-tested separately: shared TimeGrid axis, overlaps, multi-day clipping, and admin theme isolation continue to work after the core split.
- Add pure tests for discovery day grouping/order and preset/view selection; add component/browser checks for Month-to-agenda selection, Week/Day list rendering, locale coverage, keyboard navigation, and no page-level horizontal overflow.

## Explicit exclusions

- Do not publish an npm package yet; extraction happens only after two or more in-repo consumers prove the public interface.
- Do not add FullCalendar, a new backend endpoint, drag/drop, recurring-event rules, resource UI, Timeline, Grid Day, or event editing in this work.
