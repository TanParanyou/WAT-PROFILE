import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleRange, shiftCalendarDate } from "./calendar-state";

test("shifts Month, Week, and Day by their visible unit", () => {
  const date = new Date(2026, 7, 12);
  assert.equal(shiftCalendarDate(date, "month", 1).getMonth(), 8);
  assert.equal(shiftCalendarDate(date, "week", 1).getDate(), 19);
  assert.equal(shiftCalendarDate(date, "day", 1).getDate(), 13);
});

test("returns a complete month range and a seven-day week range", () => {
  assert.deepEqual(
    getVisibleRange(new Date(2026, 7, 12), "month", 0),
    { startDate: "2026-07-26", endDate: "2026-09-05" },
  );
  assert.deepEqual(
    getVisibleRange(new Date(2026, 7, 12), "week", 0),
    { startDate: "2026-08-09", endDate: "2026-08-15" },
  );
});
