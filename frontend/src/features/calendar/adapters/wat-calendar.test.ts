import assert from "node:assert/strict";
import test from "node:test";
import { toCalendarEvent } from "./wat-calendar";
import type { CalendarEntry } from "../types";

function entry(overrides: Partial<CalendarEntry> = {}): CalendarEntry {
  return {
    id: "event-1",
    source: "event",
    title: "Meditation",
    start: "2026-08-12T09:00:00+02:00",
    end: "2026-08-12T10:00:00+02:00",
    allDay: false,
    status: "active",
    display: { tone: "default" },
    detail: {
      canEdit: false,
      href: "/th/events/meditation",
      location: "ศาลาปฏิบัติ",
      description: "รายละเอียด",
    },
    ...overrides,
  };
}

test("maps WAT entry data to generic event metadata without losing detail fields", () => {
  const source = entry();
  const mapped = toCalendarEvent(source);

  assert.equal(mapped.id, "event-1");
  assert.equal(mapped.meta.detail.href, "/th/events/meditation");
  assert.equal(mapped.meta.detail.location, "ศาลาปฏิบัติ");
  assert.equal(mapped.meta.detail.description, "รายละเอียด");
  assert.equal(mapped.meta.originalEntry, source);
});
