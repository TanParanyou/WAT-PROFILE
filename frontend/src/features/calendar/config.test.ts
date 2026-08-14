import assert from "node:assert/strict";
import test from "node:test";
import { resolveCalendarConfig } from "./config";
import { discoveryPreset } from "./presets/discovery";

test("calendar config resolves production defaults", () => {
  const config = resolveCalendarConfig(discoveryPreset);
  assert.deepEqual(config.enabledViews, ["month", "week", "day"]);
  assert.equal(config.month.maxVisibleEvents, 2);
  assert.equal(config.timeGrid.minMinutes, 480);
  assert.equal(config.timeGrid.maxMinutes, 1200);
  assert.equal(config.timeGrid.slotDurationMinutes, 30);
  assert.equal(config.timeGrid.maxVisibleAllDayEvents, 2);
});

test("calendar config deduplicates views and preserves explicit layout settings", () => {
  const config = resolveCalendarConfig(discoveryPreset, {
    enabledViews: ["week", "week", "day"],
    month: { maxVisibleEvents: 4 },
    timeGrid: { minMinutes: 540, maxMinutes: 1080, slotDurationMinutes: 15, stickyHeader: false },
  });
  assert.deepEqual(config.enabledViews, ["week", "day"]);
  assert.equal(config.month.maxVisibleEvents, 4);
  assert.equal(config.timeGrid.minMinutes, 540);
  assert.equal(config.timeGrid.maxMinutes, 1080);
  assert.equal(config.timeGrid.slotDurationMinutes, 15);
  assert.equal(config.timeGrid.stickyHeader, false);
  assert.equal(config.timeGrid.stickyTimeAxis, true);
});

test("calendar config rejects invalid time windows and dimensions", () => {
  assert.throws(
    () => resolveCalendarConfig(discoveryPreset, { timeGrid: { minMinutes: 1200, maxMinutes: 480 } }),
    /maxMinutes must be greater/,
  );
  assert.throws(
    () => resolveCalendarConfig(discoveryPreset, { timeGrid: { slotDurationMinutes: 0 } }),
    /slotDurationMinutes must be a positive finite number/,
  );
  assert.throws(
    () => resolveCalendarConfig(discoveryPreset, { month: { maxVisibleEvents: -1 } }),
    /month\.maxVisibleEvents must be a positive finite number/,
  );
});
