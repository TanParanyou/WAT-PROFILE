import assert from "node:assert/strict";
import test from "node:test";
import { CALENDAR_MAX_RANGE_DAYS, validateCalendarFeedRange } from "./api";

test("calendar feed accepts the maximum inclusive range", () => {
  assert.doesNotThrow(() => validateCalendarFeedRange({ startDate: "2026-01-01", endDate: "2026-04-03" }));
  assert.equal(CALENDAR_MAX_RANGE_DAYS, 93);
});

test("calendar feed rejects reversed, malformed, and unbounded ranges", () => {
  for (const range of [
    { startDate: "2026-04-03", endDate: "2026-01-01" },
    { startDate: "2026-02-30", endDate: "2026-03-01" },
    { startDate: "2026-01-01", endDate: "2026-04-04" },
  ]) {
    assert.throws(() => validateCalendarFeedRange(range), /calendar feed range/i);
  }
});
