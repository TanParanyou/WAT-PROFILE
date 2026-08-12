import assert from "node:assert/strict";
import test from "node:test";
import { getCalendarVisibleRange } from "./range";

test("month range includes complete leading and trailing weeks", () => {
  assert.deepEqual(
    getCalendarVisibleRange(new Date(2026, 7, 12), "month", 1),
    { startDate: "2026-07-27", endDate: "2026-09-06" },
  );
});

test("week and day ranges use calendar-day boundaries", () => {
  assert.deepEqual(getCalendarVisibleRange(new Date(2026, 7, 12), "week", 1), {
    startDate: "2026-08-10",
    endDate: "2026-08-16",
  });
  assert.deepEqual(getCalendarVisibleRange(new Date(2026, 7, 12), "day", 1), {
    startDate: "2026-08-12",
    endDate: "2026-08-12",
  });
});
