import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { act, createElement, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import type { CalendarLabels } from "../../calendar-copy";
import {
  CalendarQueryBoundary,
  type CalendarQueryState,
} from "./CalendarQueryBoundary";

const testWindow = new Window();
Object.defineProperties(globalThis, {
  window: { configurable: true, value: testWindow },
  document: { configurable: true, value: testWindow.document },
  navigator: { configurable: true, value: testWindow.navigator },
  HTMLElement: { configurable: true, value: testWindow.HTMLElement },
  Node: { configurable: true, value: testWindow.Node },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true },
});

const labels: CalendarLabels = {
  previousMonth: "Previous month",
  nextMonth: "Next month",
  today: "Today",
  moreEvents: (count) => `+${count} more`,
  eventsCount: (count) => `${count} events`,
  noEventsOnDate: "No events",
  calendarInstructions: "Calendar",
  dayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  allDay: "All day",
  timedEvents: "Timed events",
  eventDetails: "Event details",
  selectedDateLabel: (date) => date.toISOString(),
  formatDayHeader: (date) => String(date.getDate()),
  formatTime: (minutes) => String(minutes),
  refreshing: "Refreshing",
  periodLabel: () => "August 2026",
};

interface CalendarData {
  id: string;
}

function createQuery(isFetching: boolean): CalendarQueryState<CalendarData> {
  return {
    data: { id: "calendar" },
    isPending: false,
    isError: false,
    isFetching,
    refetch: async () => undefined,
  };
}

function boundaryElement(query: CalendarQueryState<CalendarData>): ReactElement {
  return createElement(
    CalendarQueryBoundary<CalendarData>,
    { query, labels },
    (data: CalendarData) => createElement("section", { "data-calendar-content": "true" }, `Calendar body ${data.id}`),
  );
}

function render(element: ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() => {
    root.render(element);
  });
  return {
    container,
    rerender(nextElement: ReactElement) {
      act(() => {
        root.render(nextElement);
      });
    },
    cleanup() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

test("refresh feedback overlays the calendar without adding layout flow", () => {
  const screen = render(boundaryElement(createQuery(true)));

  try {
    const boundary = screen.container.firstElementChild as HTMLElement;
    const status = screen.container.querySelector<HTMLElement>("[data-calendar-refresh-status]");

    assert.equal(boundary.getAttribute("aria-busy"), "true");
    assert.ok(status);
    assert.equal(status.getAttribute("role"), "status");
    assert.match(status.className, /absolute/);
    assert.doesNotMatch(status.className, /mb-3/);
    assert.match(screen.container.textContent ?? "", /Calendar body calendar/);

    screen.rerender(boundaryElement(createQuery(false)));

    const settledBoundary = screen.container.firstElementChild as HTMLElement;
    const settledStatus = screen.container.querySelector<HTMLElement>("[data-calendar-refresh-status]");
    assert.equal(settledBoundary.getAttribute("aria-busy"), "false");
    assert.equal(settledStatus, status);
    assert.match(settledStatus?.className ?? "", /opacity-0/);
  } finally {
    screen.cleanup();
  }
});
