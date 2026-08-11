import assert from "node:assert/strict";
import test from "node:test";
import { buildCalendarDays, getMonthGridRange } from "./calendar-domain";

test("month grid contains leading and trailing display days", () => {
  const range = getMonthGridRange(new Date(2026, 7, 1), 1);

  assert.equal(range.startDate, "2026-07-27");
  assert.equal(range.endDate, "2026-09-06");
});

test("a multi-day event appears on every inclusive day", () => {
  const days = buildCalendarDays(
    [
      {
        id: "retreat",
        title: "Retreat",
        startDate: "2026-08-10",
        endDate: "2026-08-12",
      },
    ],
    { startDate: "2026-08-09", endDate: "2026-08-15" },
  );

  assert.deepEqual(
    days.filter((day) => day.events.length).map((day) => day.date),
    ["2026-08-10", "2026-08-11", "2026-08-12"],
  );
});

test("invalid and out-of-range events do not populate a day", () => {
  const days = buildCalendarDays(
    [
      {
        id: "bad",
        title: "Bad",
        startDate: "not-a-date",
        endDate: "2026-08-11",
      },
      {
        id: "outside",
        title: "Outside",
        startDate: "2026-09-01",
        endDate: "2026-09-02",
      },
    ],
    { startDate: "2026-08-01", endDate: "2026-08-31" },
  );

  assert.equal(days.flatMap((day) => day.events).length, 0);
});

test("day event ordering is stable", () => {
  const days = buildCalendarDays(
    [
      { id: "b", title: "Beta", startDate: "2026-08-10", endDate: "2026-08-10" },
      { id: "a", title: "Alpha", startDate: "2026-08-10", endDate: "2026-08-10" },
      { id: "c", title: "Gamma", startDate: "2026-08-10", endDate: "2026-08-10" },
    ],
    { startDate: "2026-08-10", endDate: "2026-08-10" },
  );

  assert.deepEqual(days[0]?.events.map(({ id }) => id), ["a", "b", "c"]);
});
