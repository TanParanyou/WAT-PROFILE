# Calendar module

This folder contains the reusable Month/Week/Day calendar. It deliberately does not fetch data, parse WAT DTOs, read Next.js URL state, or import locale messages. Consumers use the public barrel (`features/calendar`) and keep application integration in an adapter layer.

## Minimal usage

```tsx
const controller = useCalendar({
  weekStartsOn: 1,
  initialView: "month",
  config: { enabledViews: ["month", "week", "day"] },
});

<Calendar
  preset={discoveryPreset}
  controller={controller}
  events={events}
  labels={labels}
  variant="public"
  onEventActivate={(event) => openEvent(event)}
/>
```

`events` must satisfy `CalendarEventLike`: stable `id`, display `title`, ISO `start`/`end`, and `allDay`. The component passes the original event object to `onEventActivate`; it never reconstructs dates, status, permissions, or URLs.

## Configuration

`resolveCalendarConfig` supplies production-safe defaults:

- views: `month`, `week`, `day`
- Month visible events: `2`
- TimeGrid: 08:00–20:00, 30-minute slots, 44px slot height, 136px minimum day width
- sticky day header/time axis and two visible all-day entries before overflow

Override only the values needed by a consumer. Timeline and DayGrid are intentionally deferred. Resource lanes, recurrence, drag/drop, and external sync are not part of this contract.

### Responsive presentation presets

The semantic view stays `month`, `week`, or `day`; a preset may choose a different
presentation at the mobile breakpoint without changing URL state or controller behavior:

```tsx
const preset: CalendarPreset = {
  id: "discovery",
  defaultView: "month",
  enabledViews: ["month", "week", "day"],
  viewModes: { month: "monthGrid", week: "timeGrid", day: "timeGrid" },
  layouts: {
    desktop: { month: "monthGrid", week: "timeGrid", day: "timeGrid" },
    mobile: { month: "monthAgenda", week: "dayStrip", day: "timeGrid" },
    mobileBreakpoint: 640,
  },
};
```

`monthAgenda` shows a compact date picker with the selected day's event register.
`dayStrip` keeps the semantic Week view while showing seven day controls and one
selected-day TimeGrid. Only compatible layout/view pairs are accepted; invalid values
fall back to the preset's `viewModes`.

## Integration boundary

Application adapters own labels, URL/history persistence, query state, API parsing, event tones, and navigation. In WAT, use `useRoutedCalendar`, `useCalendarEntries`, `CalendarQueryBoundary`, and the WAT presentation helpers. The backend `/api/v1/public/calendar` or `/api/v1/admin/calendar` feed is the only production data source; configure its base URL with `NEXT_PUBLIC_API_URL`.

For local QA, run the backend and frontend dev servers with `NEXT_PUBLIC_API_URL` pointing at the backend (the repository default is `http://localhost:8080`), open `/th/calendar`, and verify `month`, `week`, and `day` at 390px and 1280px in `th`, `en`, and `de`. Run `npm run test:calendar` and `./node_modules/.bin/tsc --noEmit` before release.

## Extension rules

Add a new view or interaction behind a preset/config contract and keep it generic. Put framework, transport, locale, and domain-specific behavior under `integrations/`; do not import those adapters back into this module.
