import assert from "node:assert/strict";
import test from "node:test";
import { buildMonthGrid } from "./month-grid";
import type { CalendarEntry } from "../types";

function entry(overrides: Partial<CalendarEntry> = {}): CalendarEntry {
  return {
    id: "entry",
    source: "event",
    title: "Entry",
    start: "2026-08-12",
    end: "2026-08-13",
    allDay: true,
    status: "active",
    display: { tone: "default" },
    detail: { canEdit: false },
    ...overrides,
  };
}

function augustGridDays(): Date[] {
  return Array.from({ length: 42 }, (_, index) => new Date(2026, 6, 26 + index));
}

test("builds complete seven-day rows for August 2026", () => {
  const grid = buildMonthGrid({
    days: augustGridDays(),
    entries: [],
    monthDate: new Date(2026, 7, 12),
    selectedDate: new Date(2026, 7, 12),
    today: new Date(2026, 7, 12),
    maxVisibleEntries: 3,
  });

  assert.equal(grid.rows.length, 6);
  assert.ok(grid.rows.every((row) => row.length === 7));
  assert.equal(grid.rows[0]?.[0]?.isOutsideCurrentMonth, true);
  assert.equal(grid.rows[2]?.[3]?.isOutsideCurrentMonth, false);
});

test("marks the selected date and counts overflow without dropping events", () => {
  const entries = Array.from({ length: 6 }, (_, index) => entry({ id: `entry-${index}` }));
  const cell = buildMonthGrid({
    days: augustGridDays(),
    entries,
    monthDate: new Date(2026, 7, 12),
    selectedDate: new Date(2026, 7, 12),
    today: new Date(2026, 7, 12),
    maxVisibleEntries: 3,
  }).rows.flat().find((item) => item.key === "2026-08-12");

  assert.equal(cell?.isSelected, true);
  assert.equal(cell?.entries.length, 3);
  assert.equal(cell?.overflowCount, 3);
});

test("marks today independently from the selected date", () => {
  const cell = buildMonthGrid({
    days: augustGridDays(),
    entries: [],
    monthDate: new Date(2026, 7, 12),
    selectedDate: new Date(2026, 7, 12),
    today: new Date(2026, 7, 14),
    maxVisibleEntries: 3,
  }).rows.flat().find((item) => item.key === "2026-08-14");

  assert.equal(cell?.isToday, true);
  assert.equal(cell?.isSelected, false);
});
