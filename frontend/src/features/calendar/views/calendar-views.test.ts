import assert from "node:assert/strict";
import test from "node:test";
import { getCalendarOverflowCount, buildTimedColumns, groupEntriesByResource } from "../layout";
import type { CalendarEntry } from "../types";
import { buildTimeGridModel } from "./time-grid";
import { discoveryPreset } from "../presets/discovery";
import { planningPreset } from "../presets/planning";

const entry = (id: string, start: string, end: string): CalendarEntry => ({
  id,
  source: "event",
  title: id,
  start,
  end,
  allDay: false,
  status: "active",
  display: { tone: "default" },
  detail: { canEdit: false },
});

test("month view exposes overflow count and activates the selected date", () => {
  assert.equal(getCalendarOverflowCount(4, 2), 2);
});

test("week and day views render overlapping timed entries in separate columns", () => {
  const columns = buildTimedColumns([
    entry("first", "2026-08-12T09:00:00+02:00", "2026-08-12T10:00:00+02:00"),
    entry("second", "2026-08-12T09:30:00+02:00", "2026-08-12T11:00:00+02:00"),
  ]);
  assert.notEqual(columns.get("first")?.column, columns.get("second")?.column);
});

test("unassigned entries use the default resource lane", () => {
  assert.equal(groupEntriesByResource([entry("unassigned", "2026-08-12T09:00:00+02:00", "2026-08-12T10:00:00+02:00")], []).has("default"), true);
});

test("week and day share an operating-hour time grid", () => {
  const week = buildTimeGridModel({ days: ["2026-08-09", "2026-08-10"], entries: [], slotMinMinutes: 480, slotMaxMinutes: 1200, slotDurationMinutes: 30 });
  const day = buildTimeGridModel({ days: ["2026-08-12"], entries: [], slotMinMinutes: 480, slotMaxMinutes: 1200, slotDurationMinutes: 30 });

  assert.equal(week.slots.length, day.slots.length);
  assert.equal(week.days.length, 2);
  assert.equal(day.days.length, 1);
});

test("TimeGrid stays reserved for Planning operational views", () => {
  assert.equal(discoveryPreset.viewModes.week, "agenda");
  assert.equal(discoveryPreset.viewModes.day, "agenda");
  assert.equal(planningPreset.viewModes.week, "timeGrid");
  assert.equal(planningPreset.viewModes.day, "timeGrid");
});

test("Planning still has TimeGrid for operational views", () => {
  assert.equal(planningPreset.viewModes.week, "timeGrid");
  assert.equal(planningPreset.viewModes.day, "timeGrid");
});
