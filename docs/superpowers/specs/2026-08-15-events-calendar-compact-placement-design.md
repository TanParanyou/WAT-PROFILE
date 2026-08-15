# Events Calendar Compact Placement Design

## Goal

Make the Calendar on the public Events page feel secondary to the regular schedule while retaining the complete custom Month, Week, and Day experience.

## Approved Layout

The Events page order becomes:

1. Page header
2. Regular schedule
3. Compact Calendar
4. Upcoming event list

The Calendar remains on `/[locale]/events` and retains its route-local `view` and `date` query parameters. The standalone `/[locale]/calendar` page remains unchanged.

## Visual Rules

- The Events page returns to its `content` page width for the schedule and upcoming list.
- The embedded Calendar is centred and constrained to the content surface, rather than using the broader `wide` page presentation.
- Its section uses the existing divider and section-heading pattern.
- The Calendar presentation uses tighter section spacing so it reads as a browse-and-discover tool, not the primary page hero.
- Month, Week, and Day are unchanged functionally. Week and Day retain their built-in horizontal scrolling behavior on narrow screens.

## Architecture

- Keep `PublicCalendarSection` prop-free and responsible for the public calendar feed, URL state, labels, adapters, and event navigation.
- Change only the composition order and page container in `EventsContent`.
- Do not change generic Calendar views, API contracts, admin Calendar, or the standalone public Calendar route.

## Verification

- Update the source-boundary test to assert schedules appear before the embedded Calendar, which appears before upcoming events.
- Run the focused Calendar test, full Calendar test suite, TypeScript, targeted ESLint, production build, and browser smoke checks at 390px and 1280px.
