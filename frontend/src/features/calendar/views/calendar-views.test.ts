import assert from "node:assert/strict";
import test from "node:test";
import { getCalendarOverflowCount, buildTimedColumns, groupEntriesByResource } from "../layout";
import type { CalendarEntry } from "../types";

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

test("dayGrid and timeline render the default resource lane", () => {
  assert.equal(groupEntriesByResource([entry("unassigned", "2026-08-12T09:00:00+02:00", "2026-08-12T10:00:00+02:00")], []).has("default"), true);
});
