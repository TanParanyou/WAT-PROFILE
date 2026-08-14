import assert from "node:assert/strict";
import test from "node:test";
import { calendarPreferenceKey, createCalendarState } from "./useCalendar";

test("URL parameters override saved preference and navigation updates the visible range", () => {
  const controller = createCalendarState({
    initialView: "month",
    savedView: "week",
    url: "?view=day&date=2026-08-12",
    weekStartsOn: 1,
  });

  assert.equal(controller.view, "day");
  assert.equal(controller.visibleRange.startDate, "2026-08-12");
  controller.next();
  assert.equal(controller.visibleRange.startDate, "2026-08-13");
});

test("public and admin view preferences use different storage keys", () => {
  assert.notEqual(calendarPreferenceKey("public"), calendarPreferenceKey("admin"));
});

test("invalid URL and saved views resolve to month", () => {
  const controller = createCalendarState({
    initialView: "invalid",
    savedView: "also-invalid",
    url: "?view=unknown&date=not-a-date",
    weekStartsOn: 1,
    initialDate: new Date(2026, 7, 12),
  });

  assert.equal(controller.view, "month");
  assert.equal(controller.visibleRange.startDate, "2026-07-27");
});

test("deferred dayGrid and timeline views fall back to month", () => {
  const dayGrid = createCalendarState({
    initialView: "month",
    url: "?view=dayGrid&date=2026-08-12",
    weekStartsOn: 0,
  });
  const timeline = createCalendarState({
    initialView: "month",
    savedView: "timeline",
    url: "?date=2026-08-12",
    weekStartsOn: 0,
  });

  assert.equal(dayGrid.view, "month");
  assert.equal(timeline.view, "month");
});

test("a deferred URL view overrides a valid saved preference", () => {
  const controller = createCalendarState({
    initialView: "month",
    savedView: "week",
    url: "?view=timeline&date=2026-08-12",
    weekStartsOn: 0,
  });

  assert.equal(controller.view, "month");
});

test("selecting a date synchronizes the active date and visible range", () => {
  const controller = createCalendarState({
    initialView: "month",
    url: "?view=day&date=2026-08-12",
    weekStartsOn: 1,
  });

  controller.selectDate(new Date(2026, 7, 20));

  assert.equal(controller.date.getDate(), 20);
  assert.equal(controller.selectedDate.getDate(), 20);
  assert.deepEqual(controller.visibleRange, {
    startDate: "2026-08-20",
    endDate: "2026-08-20",
  });
});

test("invalid view retains a valid date while canonicalizing to month", () => {
  const controller = createCalendarState({
    initialView: "week",
    url: "?view=unsupported&date=2026-08-12",
    weekStartsOn: 1,
  });

  assert.equal(controller.view, "month");
  assert.equal(controller.date.getDate(), 12);
});
