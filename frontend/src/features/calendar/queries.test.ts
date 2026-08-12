import assert from "node:assert/strict";
import test from "node:test";
import { calendarKeys } from "./queries";

const august = { startDate: "2026-08-01", endDate: "2026-08-31" } as const;

test("calendar query keys change with scope, locale, and visible range", () => {
  assert.notDeepEqual(calendarKeys.feed("public", "th", august), calendarKeys.feed("admin", "th", august));
  assert.notDeepEqual(calendarKeys.feed("public", "th", august), calendarKeys.feed("public", "de", august));
  assert.notDeepEqual(
    calendarKeys.feed("public", "th", august),
    calendarKeys.feed("public", "th", { startDate: "2026-08-02", endDate: "2026-08-31" }),
  );
});
