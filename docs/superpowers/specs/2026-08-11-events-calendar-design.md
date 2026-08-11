# Events Calendar Design

## Summary

Add a production-ready month calendar to public `/events` and admin `/admin/events` while preserving the existing list views. The calendar is the public default unless the site administrator chooses otherwise. Visitors may always switch views; their browser preference overrides the administrator default.

The first release presents special events only. Regular daily, weekly, and online schedules remain in the existing schedule section. No calendar dependency will be added: the implementation will build on the installed `date-fns` utilities and project components.

## User experience

### Public events

- Present Calendar and List as an accessible view switcher above upcoming events.
- Render a month grid with previous month, next month, and today controls. Event chips span every in-range day for multi-day events. A day with more chips than its allocated space exposes a `+ n more` control.
- Clicking an event opens its existing event-detail page.
- On narrow viewports, show a compact date grid and an agenda list for the selected day rather than compressing desktop event chips into unreadable columns.
- Read all dates and labels in the active `th`, `en`, or `de` locale; use visitor-facing `Europe/Berlin` date semantics.
- Persist a visitor-selected view in local storage. If it has no valid saved value, use the public `events_default_view` setting, falling back to `calendar` when settings cannot be loaded.

### Admin events

- Keep the existing table and its operational controls unchanged under a List view; add an accessible Calendar/List switcher in the same page.
- Default the admin page to List. The public default setting does not change the admin operator's default view.
- Calendar clicks navigate users with update permission to the existing event editor. Users without update permission receive no edit navigation affordance.
- Include active and inactive events, with an unambiguous visual status treatment. Filters that already apply to the admin list also apply to calendar results.

## Technical design

- Introduce a domain-neutral `CalendarEvent` view model and a small calendar module containing month navigation, grid, chips, and mobile agenda. Public and admin adapters own localized titles, permitted actions, and visual variants; neither duplicates calendar math.
- Use `date-fns` for month boundaries, week layout, locale formatting, and inclusive multi-day placement. Treat date-only API fields as Berlin calendar days, never local browser instants that can shift dates across time zones.
- Extend the existing public events list contract with optional `from` and `to` date filters, using overlapping-range semantics: `event.end_date >= from` and `event.start_date <= to`. The admin list uses the same overlap condition instead of its current start-date-only filter. Retain pagination, sorting, status/type filters, and response envelopes.
- Calendar queries request the visible grid's complete date range, including leading/trailing days, and invalidate/refetch on month or applicable-filter change. Public requests return active events only; admin requests return all eligible events.
- Add public setting key `events_default_view` (`calendar` or `list`) through a new reversible migration, seeded as `calendar`. Extend the existing public settings mapper/provider and Admin Settings UI; use the existing settings endpoints rather than adding a new endpoint. Validate invalid persisted values to `calendar`.
- Keep the existing `is_recurring` and `recurring_pattern` data untouched. Calendar mapping should accept future generated occurrences, but V1 must not interpret recurrence rules.

## Production safeguards and future seams

- Preserve loading, error, empty, and refreshing states in both views. Never clear existing results while the next month is loading.
- Provide keyboard operation, visible focus, semantic buttons/links, usable labels that announce date and event count, and 44px touch targets.
- Add focused unit tests for month boundaries, inclusive multi-day events, timezone-safe date mapping, overflow counts, default-view precedence, and invalid setting/local-storage fallback.
- Add integration-level checks for public and admin overlap date filtering, filters surviving calendar navigation, and permission-aware admin event navigation. Run frontend lint/type-check/build plus relevant backend Go tests and vet.
- Defer category/location search, week/agenda views, click-empty-day creation, drag-and-drop rescheduling, full recurrence editing, iCal feed, and analytics. The view model and query boundary support adding them without replacing the grid.

## Decisions

- No FullCalendar or other new calendar dependency for V1.
- Public calendar contains special events only; regular schedules remain separate.
- Public setting controls the initial fallback view; an individual visitor's locally stored selection takes precedence.
- Admin calendar is a navigation/management view, not a drag-and-drop scheduling editor.
