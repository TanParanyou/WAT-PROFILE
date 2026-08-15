# Calendar Mobile Layouts Design

## Goal

Make the custom Calendar easy to use on mobile while keeping it reusable across projects. Developers choose responsive layouts through Calendar presets; end users continue to choose only the semantic Month, Week, and Day views.

## Configuration

Calendar presets support responsive layout mappings:

```ts
type CalendarLayout = CalendarViewMode | "monthAgenda" | "dayStrip";

interface CalendarResponsiveLayouts {
  desktop: Partial<Record<CalendarView, CalendarLayout>>;
  mobile: Partial<Record<CalendarView, CalendarLayout>>;
  mobileBreakpoint?: number;
}
```

The public discovery preset uses:

```ts
layouts: {
  desktop: {
    month: "monthGrid",
    week: "timeGrid",
    day: "timeGrid",
  },
  mobile: {
    month: "monthAgenda",
    week: "dayStrip",
    day: "timeGrid",
  },
  mobileBreakpoint: 640,
}
```

The semantic URL values remain `month`, `week`, and `day`. Layout names are presentation details and never appear in route query parameters. Missing or unsupported mobile mappings fall back to the matching desktop layout.

## Mobile Month: `monthAgenda`

- Render a compact seven-column month picker containing date numbers and event indicators only.
- Distinguish today, selected date, dates containing events, and dates outside the active month.
- Selecting a date updates the controller's selected date and the agenda below the picker.
- Render the selected date's events as accessible event rows below the picker.
- Do not render event titles inside the mobile date cells.
- Keep all date and event targets at least 44px high or wide where applicable.

## Mobile Week: `dayStrip`

- Render seven selectable days in a compact strip.
- Render a one-day TimeGrid below the strip for the selected day.
- Previous and next navigation move by a complete week.
- Selecting a strip day updates `date` in the URL but retains `view=week`.
- The Week query still loads the complete visible week, so selecting another day does not trigger a separate day-range request.
- The time axis remains sticky and the schedule scrolls vertically inside the available viewport.

## Mobile Day: `timeGrid`

- Reuse the existing single-day TimeGrid.
- Fit one day to the available width without horizontal page overflow.
- Keep the time axis sticky and the grid vertically scrollable.
- Event activation retains the existing detail navigation.

## Toolbar

- Stack navigation controls and view tabs into a compact mobile composition.
- Keep every interactive target at least 44px.
- Prevent horizontal toolbar scrolling and truncate the period label when necessary.
- Preserve the existing desktop toolbar at and above the configured breakpoint.
- Switching semantic views or responsive layouts must not replace the surrounding page shell or add a loading-layout jump.

## Architecture

- `CalendarResponsiveLayouts` extends preset configuration without adding consumer-specific logic to generic views.
- `useCalendarLayout` resolves a presentation layout from semantic view, configuration, and a media query.
- `MonthAgenda` owns only compact month presentation and delegates date/event actions to the existing controller callbacks.
- `DayStrip` owns the seven-day selector and composes the existing TimeGrid with one selected day.
- Calendar fetching remains in WAT integration consumers. Generic views receive normalized `CalendarEntry` data and do not call APIs.
- Responsive selection is internal to the Calendar facade. Pages such as Events do not inspect `window.innerWidth` or select views themselves.

## Responsive and Hydration Behavior

- The default breakpoint is `640px`; a preset may override it with a positive pixel value.
- Server rendering and the first client render use the desktop mapping to keep markup deterministic.
- After hydration, `useCalendarLayout` applies the matching mobile layout through `matchMedia`.
- Calendar data and controller state remain mounted during layout changes, preventing a refetch or reset when the viewport changes.
- Existing transition stabilization continues to apply so responsive changes do not cause a page-level loading jump.

## Accessibility

- Month dates and week-strip days are buttons with selected/current-day semantics.
- View tabs retain their tablist keyboard behavior.
- Arrow keys, Home, and End navigate the week strip without changing semantic view.
- Focus remains visible and is restored to the selected date control after keyboard navigation.
- TimeGrid and event-row labels continue using localized Calendar labels for Thai, English, and German.

## Error and Fallback Behavior

- An absent mobile mapping uses the configured desktop mapping for that view.
- An invalid breakpoint is rejected by Calendar configuration validation.
- An unsupported layout/view pairing falls back to the preset's standard view mode.
- Existing loading, refresh, empty, and error states remain owned by `CalendarQueryBoundary` and are unchanged.

## Verification

- Unit-test responsive configuration defaults, overrides, validation, and fallback behavior.
- DOM-test MonthAgenda date selection, event indicators, event activation, and empty selected dates.
- DOM-test DayStrip selection, keyboard navigation, one-day TimeGrid rendering, and week navigation semantics.
- Integration-test that `view=week` remains stable while selected `date` changes.
- Run the complete Calendar test suite, TypeScript, focused ESLint, and production build.
- Browser-check the Events and standalone Calendar pages at 390px and 1280px across Month, Week, and Day, including page overflow and URL state.

## Scope

This work does not add Timeline, Grid Day, user-selectable layout preferences, new APIs, new dependencies, or changes to Admin Calendar presentation. Admin may adopt responsive mappings later through its own preset.
