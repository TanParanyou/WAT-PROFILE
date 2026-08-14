import assert from "node:assert/strict";
import test from "node:test";
import { getWatEventBarClass } from "./wat-calendar";
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

test("keeps render-ready WAT entries intact for direct Calendar consumption", () => {
  const source = entry();
  assert.equal(source.id, "event-1");
  assert.equal(source.detail.href, "/th/events/meditation");
  assert.equal(source.detail.location, "ศาลาปฏิบัติ");
  assert.equal(source.detail.description, "รายละเอียด");
});

test("keeps Admin event bar tones in the WAT adapter", () => {
  const warning = entry({ display: { tone: "warning" } });
  const className = getWatEventBarClass(warning, "admin", "timeGrid");

  assert.match(className, /admin-warning/);
  assert.match(className, /border/);
});
