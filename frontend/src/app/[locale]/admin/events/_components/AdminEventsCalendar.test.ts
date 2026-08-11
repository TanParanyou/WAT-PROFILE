import assert from "node:assert/strict";
import test from "node:test";
import { toAdminCalendarEvent, type AdminCalendarSourceEvent } from "./AdminEventsCalendar";

const inactiveEvent: AdminCalendarSourceEvent = {
  id: 42,
  title: { th: "งานบุญ", en: "Merit", de: "Verdienst" },
  start_date: "2026-08-10",
  end_date: "2026-08-10",
  is_active: false,
};

const activeEvent: AdminCalendarSourceEvent = {
  id: 43,
  title: { th: "ปฏิบัติ", en: "Practice", de: "Praxis" },
  start_date: "2026-08-11",
  end_date: "2026-08-11",
  is_active: true,
};

test("inactive event is labeled but not hidden", () => {
  const calendarEvent = toAdminCalendarEvent(inactiveEvent, true, "th");

  assert.equal(calendarEvent.status, "inactive");
  assert.equal(calendarEvent.href, "/admin/events/42");
});

test("read-only staff cannot navigate from calendar chip to edit", () => {
  assert.equal(toAdminCalendarEvent(activeEvent, false, "en").href, undefined);
});
