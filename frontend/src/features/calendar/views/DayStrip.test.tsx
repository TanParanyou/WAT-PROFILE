import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { act, createElement, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import type { CalendarLabels } from "../calendar-copy";
import type { CalendarEvent } from "../core/types";
import { formatCalendarDate } from "./calendar-view-utils";
import { DayStrip } from "./DayStrip";

const testWindow = new Window();
Object.defineProperties(globalThis, {
  window: { configurable: true, value: testWindow },
  document: { configurable: true, value: testWindow.document },
  navigator: { configurable: true, value: testWindow.navigator },
  HTMLElement: { configurable: true, value: testWindow.HTMLElement },
  HTMLButtonElement: { configurable: true, value: testWindow.HTMLButtonElement },
  Node: { configurable: true, value: testWindow.Node },
  Event: { configurable: true, value: testWindow.Event },
  KeyboardEvent: { configurable: true, value: testWindow.KeyboardEvent },
  MouseEvent: { configurable: true, value: testWindow.MouseEvent },
  requestAnimationFrame: { configurable: true, value: (callback: FrameRequestCallback) => setTimeout(callback, 0) },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true },
});

const labels: CalendarLabels = {
  previousMonth: "Previous month",
  nextMonth: "Next month",
  previous: "Previous",
  next: "Next",
  today: "Today",
  moreEvents: (count) => `+${count} more`,
  eventsCount: (count) => `${count} events`,
  noEventsOnDate: "No events on this date",
  calendarInstructions: "Calendar",
  dayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  viewMonth: "Month",
  viewWeek: "Week",
  viewDay: "Day",
  allDay: "All day",
  timedEvents: "Timed events",
  eventDetails: "Details",
  selectedDateLabel: (date) => formatCalendarDate(date),
  formatDayHeader: (date, { includeWeekday }) => includeWeekday ? `${labels.dayNames[date.getDay()]} ${date.getDate()}` : String(date.getDate()),
  formatTime: (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
  periodLabel: () => "August 9–15, 2026",
};

const days = Array.from({ length: 7 }, (_, index) => new Date(2026, 7, 9 + index));
const entry: CalendarEvent = {
  id: "midday-service",
  title: "Midday service",
  start: "2026-08-12T12:00:00+02:00",
  end: "2026-08-12T13:00:00+02:00",
  allDay: false,
  meta: {},
};

function render(element: ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() => root.render(element));
  return {
    container,
    cleanup() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

test("DayStrip renders seven day controls and one selected-day TimeGrid", () => {
  let selectedDate = days[0] ?? new Date(2026, 7, 9);
  const selected: Date[] = [];
  const screen = render(createElement(DayStrip, {
    days,
    selectedDate,
    entries: [entry],
    labels,
    variant: "public",
    onDaySelect: (date) => { selectedDate = date; selected.push(date); },
    onEntryActivate: () => undefined,
    showTooltip: false,
  }));

  try {
    assert.equal(screen.container.querySelectorAll('[data-calendar-day-strip] [role="tab"]').length, 7);
    assert.equal(screen.container.querySelectorAll('[data-calendar-time-grid] section').length, 1);
    const selectedTab = screen.container.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]');
    assert.equal(selectedTab?.getAttribute("aria-label"), "2026-08-09");
    assert.equal(formatCalendarDate(selectedDate), "2026-08-09");
    assert.deepEqual(selected, []);
  } finally {
    screen.cleanup();
  }
});

test("DayStrip selects days and supports roving keyboard navigation", () => {
  const selected: Date[] = [];
  const screen = render(createElement(DayStrip, {
    days,
    selectedDate: days[0] ?? new Date(2026, 7, 9),
    entries: [],
    labels,
    variant: "public",
    onDaySelect: (date) => selected.push(date),
    onEntryActivate: () => undefined,
    showTooltip: false,
  }));

  try {
    const tabs = screen.container.querySelectorAll<HTMLButtonElement>('[data-calendar-day-strip] [role="tab"]');
    const first = tabs[0];
    assert.ok(first);
    act(() => first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
    assert.equal(selected.at(-1) && formatCalendarDate(selected.at(-1) as Date), "2026-08-10");
    act(() => first.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true })));
    assert.equal(selected.at(-1) && formatCalendarDate(selected.at(-1) as Date), "2026-08-15");
    act(() => first.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true })));
    assert.equal(selected.at(-1) && formatCalendarDate(selected.at(-1) as Date), "2026-08-09");
  } finally {
    screen.cleanup();
  }
});
