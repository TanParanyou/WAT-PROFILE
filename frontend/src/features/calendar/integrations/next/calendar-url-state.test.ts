import assert from "node:assert/strict";
import test from "node:test";
import { calendarPreferenceKey, formatCalendarUrlDate, isCalendarDate, parseCalendarUrlState } from "./calendar-url-state";

test("calendar URL state parses valid view/date and preserves invalid raw view", () => {
  const state = parseCalendarUrlState("https://calendar.local/th/calendar?view=week&date=2026-08-12&filter=active");
  assert.equal(state.view, "week");
  assert.equal(state.rawView, "week");
  assert.equal(formatCalendarUrlDate(state.date ?? new Date(0)), "2026-08-12");

  const invalid = parseCalendarUrlState("?view=timeline&date=2026-02-30");
  assert.equal(invalid.view, null);
  assert.equal(invalid.rawView, "timeline");
  assert.equal(invalid.date, null);
});

test("calendar URL date validation rejects malformed and normalizes valid date-only values", () => {
  assert.equal(isCalendarDate("2026-08-12"), true);
  assert.equal(isCalendarDate("2026-02-30"), false);
  assert.equal(isCalendarDate("12-08-2026"), false);
});

test("calendar preferences remain isolated by consumer scope", () => {
  assert.equal(calendarPreferenceKey("public"), "wat-calendar-view:public");
  assert.equal(calendarPreferenceKey("admin"), "wat-calendar-view:admin");
});
