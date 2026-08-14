import assert from "node:assert/strict";
import test from "node:test";
import type { CalendarEntry } from "../types";
import type { CalendarEvent } from "../core/types";
import { buildTimeGridModel, isTimeGridEmpty } from "./time-grid";

function entry(overrides: Partial<CalendarEntry> = {}): CalendarEntry {
  return {
    id: "entry",
    source: "event",
    title: "Entry",
    start: "2026-08-12T09:00:00+02:00",
    end: "2026-08-12T10:00:00+02:00",
    allDay: false,
    status: "active",
    display: { tone: "default" },
    detail: { canEdit: false },
    ...overrides,
  };
}

test("uses one 30-minute time axis for all week columns", () => {
  const model = buildTimeGridModel({
    days: ["2026-08-09", "2026-08-10", "2026-08-11", "2026-08-12", "2026-08-13", "2026-08-14", "2026-08-15"],
    entries: [],
    slotMinMinutes: 8 * 60,
    slotMaxMinutes: 20 * 60,
    slotDurationMinutes: 30,
  });

  assert.equal(model.slots[0]?.minutes, 8 * 60);
  assert.equal(model.slots.at(-1)?.minutes, 19 * 60 + 30);
  assert.equal(model.days.length, 7);
  assert.ok(model.days.every((day) => day.timedEntries.length === 0));
  assert.equal(isTimeGridEmpty(model), true);
});

test("keeps all-day entries above timed entries and divides overlaps", () => {
  const model = buildTimeGridModel({
    days: ["2026-08-12"],
    entries: [
      entry({ id: "all-day", allDay: true, start: "2026-08-12", end: "2026-08-13" }),
      entry({ id: "first", start: "2026-08-12T09:00:00+02:00", end: "2026-08-12T10:30:00+02:00" }),
      entry({ id: "second", start: "2026-08-12T09:30:00+02:00", end: "2026-08-12T11:00:00+02:00" }),
    ],
    slotMinMinutes: 8 * 60,
    slotMaxMinutes: 20 * 60,
    slotDurationMinutes: 30,
  });

  assert.equal(model.days[0]?.allDayEntries[0]?.id, "all-day");
  assert.equal(model.days[0]?.timedEntries.length, 2);
  assert.notEqual(
    model.days[0]?.timedEntries[0]?.position.column,
    model.days[0]?.timedEntries[1]?.position.column,
  );
  assert.equal(isTimeGridEmpty(model), false);
});

test("keeps a multi-day event's geometry with the day where it is rendered", () => {
  const model = buildTimeGridModel({
    days: ["2026-08-12", "2026-08-13"],
    entries: [
      entry({ id: "crosses-midnight", start: "2026-08-12T19:30:00+02:00", end: "2026-08-13T10:00:00+02:00" }),
      entry({ id: "overlap-next-day", start: "2026-08-13T09:30:00+02:00", end: "2026-08-13T11:00:00+02:00" }),
    ],
    slotMinMinutes: 8 * 60,
    slotMaxMinutes: 20 * 60,
    slotDurationMinutes: 30,
  });

  assert.equal(model.days[0]?.timedEntries[0]?.position.columnCount, 1);
  assert.equal(
    model.days[1]?.timedEntries.find((item) => item.entry.id === "crosses-midnight")?.position.columnCount,
    2,
  );
});

const genericEvent: CalendarEvent<{ tone: "default" }> = {
  id: "generic",
  title: "Generic",
  start: "2026-08-12T09:00:00+02:00",
  end: "2026-08-12T10:00:00+02:00",
  allDay: false,
  meta: { tone: "default" },
};

test("accepts generic CalendarEvent metadata in the TimeGrid model", () => {
  const model = buildTimeGridModel({
    days: ["2026-08-12"],
    entries: [genericEvent],
    slotMinMinutes: 480,
    slotMaxMinutes: 1200,
    slotDurationMinutes: 30,
  });
  assert.equal(model.days[0]?.timedEntries[0]?.entry.meta.tone, "default");
});
