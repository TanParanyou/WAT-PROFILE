import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { act, createElement, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { createCalendarState } from "../useCalendar";
import type { CalendarLabels } from "../calendar-copy";
import type { CalendarEvent } from "../core/types";
import { MonthAgenda } from "./MonthAgenda";
import { formatCalendarDate } from "./calendar-view-utils";

const testWindow = new Window();
Object.defineProperties(globalThis, {
  window: { configurable: true, value: testWindow },
  document: { configurable: true, value: testWindow.document },
  navigator: { configurable: true, value: testWindow.navigator },
  HTMLElement: { configurable: true, value: testWindow.HTMLElement },
  HTMLButtonElement: { configurable: true, value: testWindow.HTMLButtonElement },
  Node: { configurable: true, value: testWindow.Node },
  Event: { configurable: true, value: testWindow.Event },
  MouseEvent: { configurable: true, value: testWindow.MouseEvent },
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
  formatDayHeader: (date) => formatCalendarDate(date),
  formatTime: (minutes) => String(minutes),
  periodLabel: () => "August 2026",
};

const entries: CalendarEvent[] = [
  {
    id: "morning-chanting",
    title: "Morning chanting",
    start: "2026-08-12T09:00:00+02:00",
    end: "2026-08-12T10:00:00+02:00",
    allDay: false,
    meta: {},
  },
  {
    id: "evening-service",
    title: "Evening service",
    start: "2026-08-12T18:00:00+02:00",
    end: "2026-08-12T19:00:00+02:00",
    allDay: false,
    meta: {},
  },
];

function render(element: ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() => root.render(element));
  return {
    container,
    rerender(nextElement: ReactElement) {
      act(() => root.render(nextElement));
    },
    cleanup() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

function agendaElement(
  controller: ReturnType<typeof createCalendarState>,
  onEntryActivate: (event: CalendarEvent) => void,
) {
  return createElement(MonthAgenda, {
    controller,
    entries,
    labels,
    variant: "public",
    onEntryActivate,
    formatTime: (event) => `${event.start.slice(11, 16)}–${event.end.slice(11, 16)}`,
    formatLocation: () => null,
    showTooltip: false,
  });
}

test("MonthAgenda keeps event titles out of compact cells and shows the selected agenda", () => {
  const controller = createCalendarState({ weekStartsOn: 0, initialDate: new Date(2026, 7, 12) });
  let activated: CalendarEvent | null = null;
  const screen = render(agendaElement(controller, (event) => { activated = event; }));

  try {
    const picker = screen.container.querySelector<HTMLElement>("[data-calendar-month-agenda]");
    assert.ok(picker);
    assert.equal(picker.querySelectorAll('[role="gridcell"]').length, 42);
    assert.match(picker.textContent ?? "", /12/);
    assert.doesNotMatch(picker.textContent ?? "", /Morning chanting/);
    assert.match(screen.container.textContent ?? "", /2 events/);

    const nextDateButton = picker.querySelector<HTMLButtonElement>('[aria-label^="2026-08-13"]');
    assert.ok(nextDateButton);
    act(() => nextDateButton.click());
    screen.rerender(agendaElement(controller, (event) => { activated = event; }));
    assert.equal(formatCalendarDate(controller.selectedDate), "2026-08-13");

    const selectedDateButton = picker.querySelector<HTMLButtonElement>('[aria-label^="2026-08-13"]');
    assert.equal(selectedDateButton?.getAttribute("aria-pressed"), "true");
    const originalDateButton = picker.querySelector<HTMLButtonElement>('[aria-label^="2026-08-12"]');
    assert.ok(originalDateButton);
    act(() => originalDateButton.click());
    screen.rerender(agendaElement(controller, (event) => { activated = event; }));
    const eventRow = screen.container.querySelector<HTMLButtonElement>('[aria-label^="Morning chanting"]');
    assert.ok(eventRow);
    act(() => eventRow.click());
    assert.equal(activated, entries[0]);
  } finally {
    screen.cleanup();
  }
});

test("MonthAgenda renders the empty selected-date state", () => {
  const controller = createCalendarState({ weekStartsOn: 0, initialDate: new Date(2026, 7, 13) });
  const screen = render(agendaElement(controller, () => undefined));

  try {
    assert.match(screen.container.textContent ?? "", /No events on this date/);
  } finally {
    screen.cleanup();
  }
});
