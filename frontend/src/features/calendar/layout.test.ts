import assert from "node:assert/strict";
import test from "node:test";
import type { CalendarEntry } from "./types";
import { buildTimedColumns, groupEntriesByResource } from "./layout";
import { getCalendarEventResourceIds } from "./core/types";

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

test("overlapping timed entries receive separate columns", () => {
  const layout = buildTimedColumns([
    entry({
      id: "a",
      start: "2026-08-12T09:00:00+02:00",
      end: "2026-08-12T10:00:00+02:00",
    }),
    entry({
      id: "b",
      start: "2026-08-12T09:30:00+02:00",
      end: "2026-08-12T11:00:00+02:00",
    }),
  ]);

  assert.equal(layout.get("a")?.columnCount, 2);
  assert.equal(layout.get("b")?.columnCount, 2);
  assert.notEqual(layout.get("a")?.column, layout.get("b")?.column);
});

test("entries without a resource use the default lane", () => {
  assert.equal(
    groupEntriesByResource([entry({ resourceId: undefined })], []).get("default")?.length,
    1,
  );
});

test("plural resource IDs take precedence over the legacy alias", () => {
  assert.deepEqual(
    getCalendarEventResourceIds(entry({ resourceId: "hall", resourceIds: ["hall", "projector", "hall", ""] })),
    ["hall", "projector"],
  );
});

test("multi-resource entries appear once in each assigned lane", () => {
  const lanes = groupEntriesByResource(
    [entry({ resourceIds: ["hall", "projector"] })],
    [{ id: "hall", title: "Main hall" }, { id: "projector", title: "Projector" }],
  );
  assert.equal(lanes.get("hall")?.length, 1);
  assert.equal(lanes.get("projector")?.length, 1);
});
