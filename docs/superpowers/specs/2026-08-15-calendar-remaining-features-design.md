# Calendar Remaining Features Design

## Purpose

Extend the custom Calendar into a reusable scheduling surface without coupling its
core to WAT-PROFILE, Next.js, a transport client, or an external calendar provider.
The work is intentionally split into independent delivery slices: resources and
read-only views, scheduling interactions, recurrence and conflict rules, then
external synchronization.

## Approved decisions

- Keep the custom Calendar. Do not introduce FullCalendar.
- `view` remains the period (`month`, `week`, or `day`); `layout` is its visual
  presentation (`monthGrid`, `monthAgenda`, `timeGrid`, `dayStrip`, `timeline`,
  or `resourceDayGrid`). A developer preset maps a view to a layout. A host may
  expose that choice later, but public visitors do not receive new layout controls
  by default.
- The generic Calendar receives normalized events/resources and emits user
  intents. It neither calls HTTP nor applies WAT business rules.
- The backend is authoritative for persistence, timezone normalization,
  permissions, conflicts, recurrence expansion, and the canonical response after
  a mutation.
- Production routes use real API data only. Test fixtures may be local and
  deterministic.
- Visitor-facing date/time semantics stay `Europe/Berlin`, and UI/API content is
  complete for `th`, `en`, and `de`.

## Current baseline

The reusable core already provides Month, Week, Day, responsive presets, and a
read-only public/admin feed. `TimelineView.tsx` and `DayGridView.tsx` are early
prototypes: they are not selectable through the Calendar facade, depend on the
WAT-specific entry shape, assume a single resource assignment, and contain fixed
presentation strings. They must be replaced or hardened before exposure.

The calendar feed currently supplies one `default` resource. Event persistence has
legacy recurrence flags/patterns, but the feed does not materialize recurring
occurrences or represent exceptions. These are not production recurrence support.

## Boundary and data contracts

### Generic Calendar core

The core extends `CalendarEventLike` with optional `resourceIds: readonly string[]`.
`resourceId` remains a temporary compatibility alias for existing callers; WAT
adapters normalize it to `resourceIds`. A resource remains opaque to the core:

```ts
interface CalendarResource<TMeta = unknown> {
  id: string;
  title: string;
  color?: string;
  group?: string;
  meta?: TMeta;
}
```

The core exposes only typed intents, for example `create`, `move`, `resize`, and
`edit`, containing an event identity, an inclusive start/exclusive end, all-day
state, and resulting resource IDs. It does not optimistically persist an intent.
The host integration may show a local preview while its mutation is pending, then
replaces it with the server response or removes it on failure.

Layouts are generic presentation modules. The core can render Timeline and
Resource DayGrid with data supplied by any adapter; it cannot import WAT DTOs,
next-intl, routes, or API clients. The public barrel exports all supported
contracts and validates valid view/layout combinations in config resolution.

### WAT resource model

Introduce a first-class resource registry instead of treating a localized event
location as a schedulable resource.

`calendar_resources` holds an internal ID, stable public ID/slug, `resource_type`,
localized title, optional color, optional capacity, JSONB metadata, active/public
flags, and explicit display order. `event_resource_assignments` joins one event to
one or more resources and may carry a role/quantity in the future. This supports
locations, people, and equipment without adding a calendar-core dependency on any
of them.

The admin feed returns resources visible to the requester and normalized
`resourceIds` per entry. The public feed returns only active, public resources and
events. Existing feed fields are extended compatibly; frontend validation and
OpenAPI change in the same slice.

### Scheduling command boundary

For WAT events, scheduling uses source-specific admin commands rather than a
generic frontend mutation protocol. Event schedule commands accept only the fields
needed for calendar actions: start/end, all-day state, resource IDs, and a
concurrency version. The service validates permissions, normalized Berlin time,
event range, resource availability, and version before returning the canonical
calendar entry. The existing full Event editor remains responsible for rich event
content.

## Delivery slices

### Slice 1 — Resource foundation and read-only layouts

Add typed resource API/schema/model/service boundaries and real resource
assignments. Upgrade the Timeline and Resource DayGrid into generic, configurable
layouts with resource grouping, empty lanes, overlap treatment, deterministic
sorting, sticky headers, and an accessible small-screen fallback. Add filters at
the WAT integration layer, not inside the generic Calendar.

This slice is complete when admin users can inspect real resource schedules in
Timeline/Resource DayGrid; public presets remain limited to the existing discovery
layouts unless explicitly configured otherwise.

### Slice 2 — Calendar interaction intents and event scheduling

Add interaction primitives to the core: selection, pointer/keyboard move and
resize, create-from-empty-slot, and cancellation. Every visual interaction has a
keyboard equivalent and a non-drag editing path. WAT translates accepted intents
to an admin event command, shows pending/error feedback, and invalidates the
calendar query after the server response.

This slice applies only to one-off events. It is intentionally built before
recurrence so normal event scheduling is usable independently.

### Slice 3 — Recurrence and resource scheduling rules

Replace the legacy monthly/yearly flags with a server-owned recurrence rule,
timezone, exception dates, and occurrence overrides. The backend expands only the
requested feed range, derives stable occurrence identities, and handles DST in
`Europe/Berlin`. Edits choose a scope: this occurrence, this-and-following, or the
whole series.

Then add resource availability, blackout intervals, capacity, and conflict
validation. Conflict decisions are made by the backend and returned as structured
warnings/errors for the client to display. Calendar views can show conflicts but
cannot determine correctness independently.

### Slice 4 — External synchronization

Start with ICS export, then private/revocable feeds and one-way ICS import. Only
after event mutations and recurrence are stable, add provider adapters for Google
Calendar and Outlook. A provider connection stores encrypted credentials on the
backend, external UID mappings, sync cursor, last successful sync, and errors.
Background jobs must be idempotent, retry safely, and use an explicit conflict
policy/source of truth before two-way synchronization is enabled.

## Accessibility, localization, and performance

- Preserve 44px minimum controls, 3px visible focus, semantic grid/table roles
  where appropriate, clear labels, and reduced-motion behavior.
- Timeline/Resource DayGrid must remain operable at 200% zoom and must not require
  horizontal drag as the only way to access information. On small screens the
  configured agenda/day-strip fallback is authoritative.
- Do not use color alone to communicate a conflict, status, or selected resource.
- Test Thai, English, and German at 390px, 768px, and desktop widths; long German
  labels and Thai line wrapping may not clip.
- Query only the visible calendar range. For large resource sets, the integration
  applies server filtering/group collapsing first; virtualized lanes are evaluated
  only when evidence shows the rendered lane count requires them.

## Verification gates

Every slice updates frontend and backend contracts together and passes focused
unit/contract tests, `npm run test:calendar`, frontend type-check/lint/build, and
backend test/vet/build where backend changes occur. Browser QA covers public and
admin routes, keyboard operation, loading/error/empty states, mobile/desktop
layouts, and all three locales. API contract changes update
`backend/docs/openapi.yaml` in the same commit.

## Explicitly out of scope until its owning slice

- FullCalendar or a calendar UI replacement.
- Public drag/drop or public resource management.
- Two-way Google/Outlook synchronization before ICS and one-way sync are stable.
- Frontend-only conflict calculation, recurrence expansion, or persistence rules.
- Timeline/GridDay exposure based on the current prototype implementations.
