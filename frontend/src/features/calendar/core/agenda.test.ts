import assert from "node:assert/strict";
import test from "node:test";
import { buildAgendaDays, compareCalendarEvents } from "./agenda";
import type { CalendarEvent } from "./types";

function event(
  overrides: Partial<CalendarEvent<{ location?: string }>> = {},
): CalendarEvent<{ location?: string }> {
  return {
    id: "event",
    title: "Event",
    start: "2026-08-12T09:00:00+02:00",
    end: "2026-08-12T10:00:00+02:00",
    allDay: false,
    meta: {},
    ...overrides,
  };
}

test("lists all-day events before timed events and orders timed events by start", () => {
  const days = buildAgendaDays({
    days: ["2026-08-12"],
    events: [
      event({ id: "late", start: "2026-08-12T10:00:00+02:00", end: "2026-08-12T11:00:00+02:00" }),
      event({ id: "all-day", allDay: true, start: "2026-08-12", end: "2026-08-13" }),
      event({ id: "early", start: "2026-08-12T09:00:00+02:00", end: "2026-08-12T09:30:00+02:00" }),
    ],
  });

  assert.deepEqual(days[0]?.allDayEvents.map((item) => item.id), ["all-day"]);
  assert.deepEqual(days[0]?.timedEvents.map((item) => item.id), ["early", "late"]);
});

test("includes a multi-day all-day event on every covered day", () => {
  const days = buildAgendaDays({
    days: ["2026-08-12", "2026-08-13"],
    events: [event({ id: "retreat", allDay: true, start: "2026-08-12", end: "2026-08-14" })],
  });

  assert.equal(days[0]?.allDayEvents[0]?.id, "retreat");
  assert.equal(days[1]?.allDayEvents[0]?.id, "retreat");
});

test("compares all-day events before timed events", () => {
  const ordered = [
    event({ id: "timed", start: "2026-08-12T09:00:00+02:00", end: "2026-08-12T10:00:00+02:00" }),
    event({ id: "all-day", allDay: true, start: "2026-08-12", end: "2026-08-13" }),
  ].sort(compareCalendarEvents);

  assert.deepEqual(ordered.map((item) => item.id), ["all-day", "timed"]);
});

