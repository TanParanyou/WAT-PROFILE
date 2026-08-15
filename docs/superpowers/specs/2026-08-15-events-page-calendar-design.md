# Events Page Calendar Design

## Goal

Show the existing full public Calendar directly on `/[locale]/events`, before regular schedules and upcoming event rows, without duplicating Calendar state, feed logic, or presentation behavior.

## Chosen layout

The Events page order is:

1. Page header
2. Full interactive Calendar section with Month, Week, and Day
3. Regular schedules
4. Upcoming event list

The Calendar has the same controls, URL query parameters (`view`, `date`), timezone semantics, loading/error states, event navigation, and localized labels as `/[locale]/calendar`.

## Architecture

Extract the current public Calendar composition from `CalendarPageContent` into a focused client component named `PublicCalendarSection`. It owns public Calendar routing state, the calendar-feed query, labels, WAT display adapters, and event navigation. It accepts only page-specific layout props needed by its two consumers.

`CalendarPageContent` remains responsible for the dedicated page header and composes `PublicCalendarSection`. `EventsContent` composes the same section immediately below its page header. The generic `Calendar` module remains independent from routes and fetching.

## URL and data behavior

- `/events?view=week&date=2026-08-12` controls the embedded Calendar exactly as `/calendar?view=week&date=2026-08-12` does.
- The Events page uses the existing public calendar feed rather than reconstructing entries from the event-list API.
- Event activation continues to navigate to its existing public detail href.
- The Calendar feed's query cache remains separate from the Events list and schedules queries.

## UI and accessibility

- Reuse the public Calendar's existing Month/Week/Day controls, 44px targets, focus indicators, responsive TimeGrid behavior, refresh overlay, and reduced-motion behavior.
- Introduce a localized Events-page section title and concise description for the embedded Calendar.
- Remove the redundant link from the upcoming-events heading to the standalone Calendar page; the dedicated `/calendar` route remains available through navigation and direct links.
- Keep the register-style ordering and 1px dividers; do not add decorative cards or a second calendar visual system.

## Scope

- Public client only; do not change Admin Calendar, backend API, database, or OpenAPI.
- Preserve Thai, English, and German copy.
- Do not add dependencies or use FullCalendar.

## Verification

- Unit/source tests prove both public pages compose `PublicCalendarSection` and Events no longer imports direct Calendar query/view wiring.
- `npm run test:calendar`, TypeScript, focused ESLint, and production build pass.
- Browser smoke verifies `/th/events` renders Month/Week/Day, URL view/date changes work, event navigation remains intact, and mobile/desktop layout has no page overflow.
