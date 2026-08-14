import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { act, createElement, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { createCalendarState } from "../useCalendar";
import type { CalendarLabels } from "../calendar-copy";
import type { CalendarEvent } from "../core/types";
import { discoveryPreset } from "../presets/discovery";
import { MonthView } from "../views/MonthView";
import { TimeGrid } from "../views/TimeGrid";
import { CalendarRoot } from "./CalendarRoot";
import { MonthDayPopover } from "./MonthDayPopover";

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
  previousMonth: "Previous",
  nextMonth: "Next",
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
  eventDetails: "Event details",
  closeDialog: "Close dialog",
  scrollHorizontally: "Scroll horizontally to view the full week",
  selectedDateLabel: (date) => `date:${date.toISOString().slice(0, 10)}`,
  formatDayHeader: (date, { includeWeekday }) => includeWeekday
    ? `${labels.dayNames[date.getDay()]} ${date.getDate()}`
    : String(date.getDate()),
  formatTime: (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
  periodLabel: () => "August 2026",
};

const event: CalendarEvent = {
  id: "morning-meditation",
  title: "Morning meditation",
  start: "2026-08-12T09:00:00+02:00",
  end: "2026-08-12T10:00:00+02:00",
  allDay: false,
  meta: {},
};

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

test("Month renders seven weekday headers and selects a date", () => {
  const controller = createCalendarState({
    weekStartsOn: 0,
    initialDate: new Date(2026, 7, 12),
  });
  const screen = render(createElement(MonthView, {
    controller,
    entries: [],
    labels,
    variant: "public",
    onEntryActivate: () => undefined,
    showTooltip: false,
  }));

  try {
    const desktopGrid = screen.container.querySelector<HTMLElement>('[aria-label="Month grid"].hidden');
    assert.ok(desktopGrid);
    assert.equal(desktopGrid.querySelectorAll(":scope > div:first-child > div").length, 7);
    const dateButton = screen.container.querySelector<HTMLButtonElement>('[aria-label="date:2026-08-13"]');
    assert.ok(dateButton);
    act(() => {
      dateButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    assert.equal(controller.selectedDate.toISOString().slice(0, 10), "2026-08-13");
  } finally {
    screen.cleanup();
  }
});

test("Week and Day render their expected labelled TimeGrid columns", () => {
  const weekDays = Array.from({ length: 7 }, (_, index) => new Date(2026, 7, 9 + index));
  const week = render(createElement(TimeGrid, {
    days: weekDays,
    entries: [],
    labels,
    variant: "public",
    onEntryActivate: () => undefined,
    showDayHeaders: true,
  }));
  const day = render(createElement(TimeGrid, {
    days: [new Date(2026, 7, 12)],
    entries: [],
    labels,
    variant: "public",
    onEntryActivate: () => undefined,
    showDayHeaders: true,
  }));

  try {
    assert.equal(week.container.querySelectorAll("[data-calendar-time-grid] section").length, 7);
    assert.equal(day.container.querySelectorAll("[data-calendar-time-grid] section").length, 1);
    assert.equal(week.container.querySelector("section")?.getAttribute("aria-label"), "Sun 9");
    assert.equal(day.container.querySelector("section")?.getAttribute("aria-label"), "Wed 12");
  } finally {
    week.cleanup();
    day.cleanup();
  }
});

test("empty Week and Day render the empty state", () => {
  const week = render(createElement(TimeGrid, {
    days: Array.from({ length: 7 }, (_, index) => new Date(2026, 7, 9 + index)),
    entries: [], labels, variant: "public", onEntryActivate: () => undefined, showDayHeaders: true,
  }));
  const day = render(createElement(TimeGrid, {
    days: [new Date(2026, 7, 12)],
    entries: [], labels, variant: "public", onEntryActivate: () => undefined, showDayHeaders: true,
  }));

  try {
    assert.match(week.container.textContent ?? "", /No events on this date/);
    assert.match(day.container.textContent ?? "", /No events on this date/);
  } finally {
    week.cleanup();
    day.cleanup();
  }
});

test("TimeGrid activates the original event", () => {
  let activated: CalendarEvent | null = null;
  const screen = render(createElement(TimeGrid, {
    days: [new Date(2026, 7, 12)],
    entries: [event], labels, variant: "public", onEntryActivate: (entry) => { activated = entry; }, showDayHeaders: true, showTooltip: false,
  }));

  try {
    const button = screen.container.querySelector<HTMLButtonElement>('[aria-label="Morning meditation"]');
    assert.ok(button);
    act(() => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    assert.equal(activated, event);
  } finally {
    screen.cleanup();
  }
});

test("view tabs support Arrow keys, Home, and End", () => {
  const selectedViews: string[] = [];
  const screen = render(createElement(CalendarRoot, {
    preset: discoveryPreset,
    view: "week",
    date: new Date(2026, 7, 12),
    selectedDate: new Date(2026, 7, 12),
    visibleRange: { startDate: "2026-08-09", endDate: "2026-08-15" },
    events: [], labels,
    onViewChange: (view) => { selectedViews.push(view); },
    onPrevious: () => undefined,
    onNext: () => undefined,
    onToday: () => undefined,
    onSelectDate: () => undefined,
    onEventActivate: () => undefined,
    renderEvent: () => null,
    renderMonth: () => null,
    renderAgenda: () => null,
    renderTimeGrid: () => null,
  }));

  try {
    const weekTab = screen.container.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]');
    assert.ok(weekTab);
    act(() => {
      weekTab.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      weekTab.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
      weekTab.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    });
    assert.deepEqual(selectedViews, ["day", "month", "day"]);
  } finally {
    screen.cleanup();
  }
});

test("Calendar toolbar and TimeGrid headers use explicit 3px focus outlines", () => {
  const toolbar = render(createElement(CalendarRoot, {
    preset: discoveryPreset,
    view: "week",
    date: new Date(2026, 7, 12),
    selectedDate: new Date(2026, 7, 12),
    visibleRange: { startDate: "2026-08-09", endDate: "2026-08-15" },
    events: [], labels,
    onViewChange: () => undefined,
    onPrevious: () => undefined,
    onNext: () => undefined,
    onToday: () => undefined,
    onSelectDate: () => undefined,
    onEventActivate: () => undefined,
    renderEvent: () => null,
    renderMonth: () => null,
    renderAgenda: () => null,
    renderTimeGrid: () => null,
  }));
  const grid = render(createElement(TimeGrid, {
    days: [new Date(2026, 7, 12)],
    entries: [], labels, variant: "public", onEntryActivate: () => undefined, showDayHeaders: true,
  }));

  try {
    const controls = [...toolbar.container.querySelectorAll("button"), ...grid.container.querySelectorAll("button")];
    assert.ok(controls.length > 0);
    assert.ok(controls.every((control) => control.className.includes("focus-visible:outline-[3px]")));
  } finally {
    toolbar.cleanup();
    grid.cleanup();
  }
});

test("month overflow dialog manages focus and closes with Escape", () => {
  const trigger = document.createElement("button");
  document.body.append(trigger);
  trigger.focus();
  let closeCalls = 0;
  const screen = render(createElement(MonthDayPopover, {
    date: new Date(2026, 7, 12),
    dateKey: "2026-08-12",
    entries: [event],
    targetRect: new testWindow.DOMRect(0, 0, 1, 1),
    labels,
    variant: "public",
    showTooltip: false,
    formatTime: () => "09:00–10:00",
    formatLocation: () => null,
    getEventClass: () => "bg-current/5",
    renderEventLabel: (item) => item.title,
    onEntryActivate: () => undefined,
    onClose: () => { closeCalls += 1; },
  }));

  try {
    const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]');
    const closeButton = dialog?.querySelector<HTMLButtonElement>('[aria-label="Close dialog"]');
    const eventButton = dialog?.querySelectorAll<HTMLButtonElement>("button")[1];
    assert.ok(closeButton);
    assert.ok(eventButton);
    assert.equal(document.activeElement, closeButton);

    assert.match(eventButton.textContent ?? "", /Morning meditation/);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    assert.equal(document.activeElement, eventButton);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    assert.equal(document.activeElement, closeButton);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    screen.rerender(createElement("div"));
    assert.equal(closeCalls, 1);
    assert.equal(document.activeElement, trigger);
  } finally {
    screen.cleanup();
    trigger.remove();
  }
});

test("TimeGrid bounds all-day entries and opens the overflow dialog", () => {
  const allDayEntries: CalendarEvent[] = ["retreat", "ceremony", "market"].map((id) => ({
    id,
    title: id,
    start: "2026-08-12T00:00:00+02:00",
    end: "2026-08-13T00:00:00+02:00",
    allDay: true,
    meta: {},
  }));
  const screen = render(createElement(TimeGrid, {
    days: [new Date(2026, 7, 12), new Date(2026, 7, 13)],
    entries: allDayEntries,
    labels,
    variant: "public",
    onEntryActivate: () => undefined,
    showDayHeaders: true,
    showTooltip: false,
  }));

  try {
    assert.match(screen.container.textContent ?? "", /Scroll horizontally to view the full week/);
    assert.equal(screen.container.querySelectorAll('[aria-label="retreat"], [aria-label="ceremony"]').length, 2);
    const overflow = screen.container.querySelector<HTMLButtonElement>('[aria-label="+1 more"]');
    assert.ok(overflow);
    act(() => {
      overflow.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]');
    assert.ok(dialog);
    assert.match(dialog.textContent ?? "", /market/);
  } finally {
    screen.cleanup();
  }
});
