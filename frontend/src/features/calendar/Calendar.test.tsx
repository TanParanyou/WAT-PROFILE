import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { act, createElement, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { Calendar } from "./Calendar";
import { createCalendarState } from "./useCalendar";
import { discoveryPreset } from "./presets/discovery";
import type { CalendarLabels } from "./calendar-copy";
import type { CalendarEntry } from "./types";

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
  cancelAnimationFrame: { configurable: true, value: (handle: number) => clearTimeout(handle) },
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
  selectedDateLabel: (date) => date.toISOString().slice(0, 10),
  formatDayHeader: (date) => date.toISOString().slice(0, 10),
  formatTime: (minutes) => String(minutes),
  periodLabel: () => "August 2026",
};

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

test("Calendar facade composes Month, Week, and Day from the controller", () => {
  const controller = createCalendarState({
    weekStartsOn: 0,
    initialDate: new Date(2026, 7, 12),
    preset: discoveryPreset,
  });
  const directEntry: CalendarEntry = {
    id: "direct-entry",
    source: "event",
    title: "Direct entry",
    start: "2026-08-12T09:00:00+02:00",
    end: "2026-08-12T10:00:00+02:00",
    allDay: false,
    status: "active",
    display: { tone: "default" },
    detail: { canEdit: false },
  };
  let activated: CalendarEntry | null = null;
  const screen = render(createElement(Calendar, {
    preset: discoveryPreset,
    controller,
    events: [directEntry],
    labels,
    variant: "public",
    onEventActivate: (entry) => { activated = entry; },
  }));

  try {
    assert.equal(screen.container.querySelector("[data-calendar-view=month]")?.getAttribute("data-calendar-mode"), "monthGrid");
    const eventButton = screen.container.querySelector<HTMLButtonElement>('[aria-label="Direct entry"]');
    assert.ok(eventButton);
    act(() => eventButton.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    assert.equal(activated, directEntry);
    act(() => controller.setView("week"));
    screen.rerender(createElement(Calendar, {
      preset: discoveryPreset,
      controller,
      events: [directEntry],
      labels,
      variant: "public",
      onEventActivate: (entry) => { activated = entry; },
    }));
    assert.equal(screen.container.querySelector("[data-calendar-view=week]")?.getAttribute("data-calendar-mode"), "timeGrid");
    assert.equal(screen.container.querySelectorAll("[data-calendar-time-grid] section").length, 7);
  } finally {
    screen.cleanup();
  }
});
