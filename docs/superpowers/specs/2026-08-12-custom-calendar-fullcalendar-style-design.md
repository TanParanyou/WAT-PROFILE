# Custom Calendar FullCalendar-style Presentation Design

**Status:** Approved design; ready for implementation planning.

## Goal

Make the in-repository Custom Calendar easier to scan and operate using the interaction model familiar from FullCalendar, without adding the FullCalendar library. The immediate scope is the Admin Planning experience across Month, Week, and Day. The existing generic core, presets, WAT adapters, feed, and event drawer remain the foundation.

## Product behavior

### Shared calendar shell

- Month, Week, and Day share one toolbar, visible-range title, navigation, URL state, selected date, and keyboard-operable tabs.
- Tabs use roving focus. Arrow keys, Home, and End move both the selected view and focus.
- Selecting an event opens the existing Admin drawer. The Calendar library remains data-in only and never owns the drawer side effect.

### Month — visual overview

- Show a full seven-column month grid with weekday headers and equal-height date cells.
- Each populated date displays compact horizontal event bars, ordered all-day before timed events, then by start, end, title, and id.
- A timed event bar includes its start time and title; an all-day bar includes only its title.
- Event bars use the domain tone supplied by the WAT adapter. Dates outside the displayed month remain visibly subdued.
- Limit the visible bars to the available cell space. A `+N more` control selects the date and reveals every event for that date in the detail panel.
- The selected-date detail panel is present on desktop and mobile. It shows the full ordered agenda, optional location, and the detail/drawer affordance.

### Week — operational planning

- Render seven date columns with one shared 08:00–20:00 time axis and a dedicated all-day row.
- Preserve existing 30-minute slots, event clipping, multi-day placement, and overlap columns.
- Show weekday/date headers that select the relevant date. Event blocks expose time and title at a minimum.
- Horizontal scrolling remains confined to the TimeGrid container only; it never creates page-level overflow.

### Day — focused planning

- Reuse the identical TimeGrid primitive and time axis from Week, rendered for one selected date.
- Keep the all-day row and all overlap/clipping behavior identical to Week.
- The selected-date agenda is not duplicated below Day because the TimeGrid itself is the primary operational view.

### Mobile behavior

- Month uses a compact seven-column date grid with event count markers, then the selected-date detail panel.
- Week and Day use the same TimeGrid only when the grid stays usable inside a horizontally scrollable calendar container; no page-level overflow is allowed.
- Event blocks and all controls retain a 44px minimum target and visible focus.

## Architecture

```text
Calendar core / state / layout
        ↓
Generic visual primitives (Toolbar, MonthGrid, TimeGrid, Agenda panel)
        ↓
Planning preset (MonthGrid + TimeGrid + TimeGrid)
        ↓
Admin WAT adapter (tone, labels, drawer activation)
```

- Keep `CalendarEvent<TMeta>` as the generic input contract.
- Extend generic visual primitives using render callbacks and theme/class inputs; do not add WAT fields to core types.
- The Planning preset owns FullCalendar-style presentation choices. Discovery remains its current readable Month/Agenda Week/Agenda Day experience.
- Refactor MonthView and TimeGrid only where needed to remove hard-coded WAT/theme assumptions from reusable layout behavior. Theme and event tone remain adapter-supplied.

## Acceptance criteria

- Admin Month clearly communicates which dates have events, shows event timing, preserves status/tone, and reveals all events through `+N more` plus the selected-date panel.
- Admin Week and Day look and behave as a single consistent TimeGrid system.
- Event activation still opens the current drawer.
- Public Discovery never gains a TimeGrid as a side effect of the work.
- Keyboard navigation, Thai/English/German labels, 44px controls, and overflow containment remain intact.
- Add/adjust tests for month event ordering/time labels, `+N more` selection, shared Week/Day TimeGrid behavior, keyboard tabs, and preset isolation.

## Explicit exclusions

- No FullCalendar dependency.
- No drag/drop, resize, recurrence editor, resource lanes/filtering, Timeline, Grid Day, event editing, or API change.
- These exclusions are deliberate extension points for later features, not limitations in the generic event contract.
