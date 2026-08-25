import assert from "node:assert/strict";
import test from "node:test";
import { getMoonPhaseDay, getBuddhistHolyDaysForRange } from "./lunar-calendar";
import { entriesOnDay } from "./views/calendar-view-utils";

test("getMoonPhaseDay identifies moon phase characteristics correctly", () => {
  const testDate = new Date("2026-03-03T12:00:00Z");
  const result = getMoonPhaseDay(testDate);
  assert.ok(typeof result.phaseAge === "number");
  assert.ok(typeof result.isUposatha === "boolean");
});

test("getBuddhistHolyDaysForRange includes major holidays in 2026", () => {
  const start = new Date("2026-05-01T00:00:00Z");
  const end = new Date("2026-06-30T23:59:59Z");

  const holyDaysTh = getBuddhistHolyDaysForRange(start, end, "th");
  const visakhaTh = holyDaysTh.find((item) => item.start.startsWith("2026-05-31"));
  assert.ok(visakhaTh, "Visakha Bucha 2026-05-31 should be present");
  assert.match(visakhaTh.title, /วันวิสาขบูชา/);

  const holyDaysEn = getBuddhistHolyDaysForRange(start, end, "en");
  const visakhaEn = holyDaysEn.find((item) => item.start.startsWith("2026-05-31"));
  assert.ok(visakhaEn);
  assert.match(visakhaEn.title, /Visakha Bucha Day/);

  const holyDaysDe = getBuddhistHolyDaysForRange(start, end, "de");
  const visakhaDe = holyDaysDe.find((item) => item.start.startsWith("2026-05-31"));
  assert.ok(visakhaDe);
  assert.match(visakhaDe.title, /Visakha-Bucha-Tag/);
});

test("getBuddhistHolyDaysForRange returns entries with valid CalendarEntry structure and works with entriesOnDay", () => {
  const start = new Date("2026-05-01T00:00:00Z");
  const end = new Date("2026-05-31T23:59:59Z");
  const entries = getBuddhistHolyDaysForRange(start, end, "th");

  assert.ok(entries.length > 0);
  for (const entry of entries) {
    assert.equal(entry.source, "holy_day");
    assert.equal(entry.allDay, true);
    assert.equal(entry.status, "active");
    assert.ok(entry.display.tone === "default" || entry.display.tone === "muted");
    assert.ok(entry.title.length > 0);

    // Verify entriesOnDay finds this entry on its exact start date
    const matched = entriesOnDay(entries, entry.start);
    assert.ok(
      matched.some((m) => m.id === entry.id),
      `entriesOnDay must match ${entry.id} on date ${entry.start}`,
    );
  }
});
