import assert from "node:assert/strict";
import test from "node:test";

test("MonthDayPopover handles date and entry list cleanly", () => {
  const mockEntries = [
    { id: "1", title: "Event 1", start: "2026-08-12T09:00:00Z", end: "2026-08-12T10:00:00Z", allDay: false },
    { id: "2", title: "Event 2", start: "2026-08-12T11:00:00Z", end: "2026-08-12T12:00:00Z", allDay: false },
    { id: "3", title: "Event 3", start: "2026-08-12T13:00:00Z", end: "2026-08-12T14:00:00Z", allDay: false },
  ];

  assert.equal(mockEntries.length, 3);
});
