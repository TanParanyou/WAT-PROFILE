# FullCalendar Reference Calendar Design

**Status:** Approved for planning; no implementation in this document.

## Goal

Make the calendar immediately understandable by adopting the visual grammar and view responsibilities of FullCalendar without adding the FullCalendar library. The public calendar must present the same date, event, and navigation concepts consistently across every view.

## Source references

- [FullCalendar Month / DayGridMonth](https://fullcalendar.io/docs/month-view)
- [FullCalendar TimeGridWeek and TimeGridDay demo](https://fullcalendar.io/docs/timegrid-standard-view-demo)
- [FullCalendar DayGridWeek and DayGridDay demo](https://fullcalendar.io/docs/daygrid-view-demo)
- [FullCalendar Resource Timeline](https://fullcalendar.io/docs/timeline-view)
- [FullCalendar date, day-header, and time-axis display rules](https://fullcalendar.io/docs/date-display)

The project will reproduce these interaction and layout semantics with its existing React calendar platform. It will not install or embed FullCalendar.

## Shared calendar language

Every view uses the same shell and event language:

```text
<  >  วันนี้        สิงหาคม 2026

[ เดือน ] [ สัปดาห์ ] [ วัน ] [ กำหนดการวัน ] [ ไทม์ไลน์ ]
```

- Previous, next, and Today change the visible range appropriate to the active view.
- The centered title always describes the active range: month name for Month; start–end range for Week; full date for Day, Agenda Day, and Timeline.
- The active view is the only selected tab. Arrow keys, Home, and End move both selection and keyboard focus across tabs.
- A date selected in Month, Week, or Agenda Day is reflected consistently wherever the current view needs a selected date.
- Event appearance is shared: tone supplies only a left accent and subtle surface; title is primary; time is shown when the view has enough space; all event controls use the host theme (`site-*` in public, `admin-*` in admin).
- Today has a clearly distinct but restrained background. Dates outside the current Month are visible but muted.
- All controls have a 44px minimum target and visible theme-correct focus state.

## View contracts

### 1. Month — `dayGridMonth`

**Purpose:** Scan the month and find days with activity.

```text
                    สิงหาคม 2026

 อา          จ          อ          พ          พฤ         ศ          ส
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ 26       │ 27       │ 28       │ 29       │ 30       │ 31       │ 1        │
│          │          │          │          │          │ ▌ปฏิบัติฯ │ ▌ปฏิบัติฯ │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 9        │ 10       │ 11       │ [12]     │ 13       │ 14       │ 15       │
│          │          │          │ ▌ถวายภัตฯ │          │          │          │
│          │          │          │ ▌ทำบุญเช้า │          │          │          │
│          │          │          │ ▌สนทนาธรรม│          │          │          │
│          │          │          │ + อีก 3   │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

- Always show a seven-column grid with a weekday header and all leading/trailing dates required to complete its week rows.
- The desktop cell shows up to three compact event bars and then `+ n` overflow. Selecting the day or overflow opens/selects that date; it does not discard the calendar grid.
- The mobile view remains a seven-column month grid. Each cell shows its date and an event dot/count; an agenda for the selected date sits below the grid.
- Do not display an ISO date as the primary mobile heading when a localized human-readable date is available.

### 2. Week — `timeGridWeek`

**Purpose:** Plan a week by time.

```text
                     9–15 สิงหาคม 2026

             อา 9      จ 10      อ 11      พ 12      พฤ 13     ศ 14      ส 15
┌──────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ ทั้งวัน   │         │         │         │ ถวายภัตฯ│         │         │         │
│          │         │         │         │ ทำบุญเช้า│         │         │         │
├──────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ 08:00    │         │         │         │         │         │         │         │
│ 09:00    │         │         │         │ ┌───────┐         │         │         │
│          │         │         │         │ │อบรมฯ  │         │         │         │
│ 09:30    │         │         │         │ │ต้อนรับ│         │         │         │
│          │         │         │         │ └───────┘         │         │         │
└──────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

- Render one shared vertical time axis and seven day columns.
- Render the all-day area above the timed lanes, including a visible divider and localized label.
- Timed events use position and duration; overlapping events divide the available day-column width rather than obscuring each other.
- The initial visible time begins at the temple’s meaningful operating hour, not midnight. Users can scroll to earlier/later time slots.
- At narrow widths, render the selected day as `timeGridDay`; do not render seven independent 24-hour grids stacked vertically.

### 3. Day — `timeGridDay`

**Purpose:** Inspect one day’s precise schedule.

```text
                         พุธ 12 สิงหาคม 2026

┌──────────┬──────────────────────────────────────────────────────────────┐
│ ทั้งวัน   │ ▌ถวายภัตตาหาร   ▌ทำบุญตอนเช้า   ▌สนทนาธรรม   ▌สวดมนต์เย็น │
├──────────┼──────────────────────────────────────────────────────────────┤
│ 08:00    │                                                              │
│ 09:00    │  ┌──────────────────┐  ┌──────────────────┐                  │
│          │  │ อบรมอาสาสมัคร   │  │ ต้อนรับผู้มาเยือน │                  │
│ 09:30    │  │ 09:00–10:30      │  │ 09:30–11:00      │                  │
│          │  └──────────────────┘  └──────────────────┘                  │
└──────────┴──────────────────────────────────────────────────────────────┘
```

- Use exactly the Week view’s TimeGrid system with a single day column.
- Preserve the all-day row, time axis, overlap layout, and time scale.
- Give event cards enough height to show title plus time. Include location only when it fits without truncating the event title.
- On mobile, the time axis and event lane remain horizontally coherent; horizontal scrolling belongs inside the calendar pane only, never at page level.

### 4. Agenda Day — `dayGridDay`

**Purpose:** Read all activity on one day without a 24-hour time grid.

```text
                        พุธ 12 สิงหาคม 2026

┌──────────────────────────────────────────────────────────────────────────┐
│ ทั้งวัน                                                                   │
│ ▌ถวายภัตตาหาร                                                            │
│ ▌ทำบุญตอนเช้า                                                            │
│ ▌สนทนาธรรม                                                               │
│ ▌สวดมนต์เย็น                                                             │
│                                                                          │
│ ตามเวลา                                                                   │
│ 09:00  ▌อบรมอาสาสมัคร                                   09:00–10:30    │
│ 09:30  ▌ต้อนรับผู้มาเยือน                               09:30–11:00    │
└──────────────────────────────────────────────────────────────────────────┘
```

- Rename the Thai tab from `ตารางวัน` to `กำหนดการวัน`; use equivalent concise translations for English and German.
- Place all-day events first, then timed events ordered by start time. This is an agenda/list presentation, not a resource-lane table.
- Each event row shows time, title, and optional location. It does not attempt to portray time duration spatially; that is Day view’s responsibility.
- The resulting view must be useful on mobile without a horizontally scrollable grid.

### 5. Timeline — `resourceTimelineDay`

**Purpose:** See resource or space occupancy over time.

```text
                           พุธ 12 สิงหาคม 2026

ทรัพยากร / สถานที่       08:00      09:00      10:00      11:00      12:00
┌──────────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ ศาลาปฏิบัติธรรม       │          │ [อบรมอาสาสมัคร]      │          │          │
├──────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ โรงครัว               │          │ [ถวายภัตตาหาร]                   │          │
├──────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ ห้องรับรอง            │          │     [ต้อนรับผู้มาเยือน]           │          │
└──────────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

- The first column is a resource label; the remaining columns represent horizontal time.
- Each resource has one lane and event widths represent duration.
- Timeline is available only when the feed returns at least two meaningful resources with IDs other than `default`. Otherwise the tab is hidden; a single `default` lane is not a useful timeline.
- Public users may inspect resource availability but cannot edit. Admin users can activate the existing entry drawer/editor route.
- At narrow widths, retain the resource label column and provide an internal horizontal scroller for the time axis; never collapse into an unrelated list.

## Data and presentation boundary

- The server feed remains the source of truth for range, event start/end, `allDay`, title, resource ID, location, and display tone.
- The frontend may derive only presentation data: event placement in an existing range, overlap columns, visible-event count, localized labels, and responsive arrangement.
- The API must return actual resources and an event-to-resource relation before Timeline is enabled publicly.
- Date semantics remain `Europe/Berlin`; ranges are date-only inclusive bounds and all-day event end dates remain exclusive.

## Responsive rules

| View | Desktop | Mobile |
| --- | --- | --- |
| Month | Full 7-column grid, event bars and `+ n` overflow | Full 7-column grid, dots/counts, selected-date agenda below |
| Week | 7-column TimeGrid | Selected-day TimeGrid only |
| Day | One TimeGrid lane | Same TimeGrid, internal pane scrolling if required |
| Agenda Day | Event rows grouped by all-day/timed | Same event rows, no horizontal grid |
| Timeline | Resource label column plus horizontal time axis | Pinned label column plus internal time-axis scroll |

## Acceptance criteria

- A person can name the purpose of every tab from its label and first screen without reading documentation.
- Month, Week, Day, Agenda Day, and Timeline match their named FullCalendar reference pattern.
- The public page never displays admin visual tokens.
- All user-visible copy exists in Thai, English, and German.
- First-visit consent UI does not cover any calendar control or event.
- Calendar-level horizontal scrolling is contained within TimeGrid/Timeline panes; the page itself never overflows horizontally.
- Timeline is absent until at least two meaningful resources exist in the calendar feed.
