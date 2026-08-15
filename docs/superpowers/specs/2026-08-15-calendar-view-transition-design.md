# Calendar View Transition Design

## Goal

Make switching Month, Week, Day, and date ranges feel immediate and stable without animating Calendar layout or hiding usable data.

## Observed cause

`CalendarQueryBoundary` renders the refresh status as a normal block before the Calendar whenever a visible range changes. That inserts and removes vertical space, shifting the Calendar toolbar and grid. Switching between Month and TimeGrid also replaces a large layout surface synchronously.

## Chosen approach

1. Keep the existing Calendar visible while TanStack Query refreshes its range.
2. Render refresh feedback as an in-flow-neutral overlay owned by the Calendar boundary, so it does not change the Calendar's measured position or height.
3. Mark the Calendar region as busy for assistive technology while it refreshes.
4. Apply a short, opacity-only transition to the refresh affordance. Do not animate width, height, grid rows, sticky areas, or scroll position.
5. Respect `prefers-reduced-motion` by disabling the transition.

## UX behavior

- On Month/Week/Day or previous/next/today selection, the selected view changes immediately.
- The previous query result remains rendered while the next visible range is fetched.
- A compact refresh label appears at the Calendar's top edge without pushing any content.
- Once fresh data arrives, the label fades out; the calendar never jumps vertically because of query state.
- Initial loading and blocking errors remain unchanged because there is no calendar content to preserve.

## Scope

- Change only `CalendarQueryBoundary` and its focused DOM coverage.
- Reuse existing localized `refreshing` copy.
- No new dependency, no FullCalendar, no route/API contract changes, and no animation-library migration.

## Verification

- DOM test proves refresh state does not add a layout-flow status row and sets `aria-busy`.
- Calendar test suite, TypeScript, focused ESLint, and production build pass.
- Browser smoke on public Month/Week/Day confirms stable top position and no console errors at mobile and desktop widths.
