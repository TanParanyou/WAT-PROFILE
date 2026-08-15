import assert from "node:assert/strict";
import test from "node:test";
import { resolveCalendarConfig } from "./config";
import { discoveryPreset } from "./presets/discovery";
import { planningPreset } from "./presets/planning";

test("calendar config resolves production defaults", () => {
  const config = resolveCalendarConfig(discoveryPreset);
  assert.deepEqual(config.enabledViews, ["month", "week", "day"]);
  assert.equal(config.month.maxVisibleEvents, 2);
  assert.equal(config.timeGrid.minMinutes, 480);
  assert.equal(config.timeGrid.maxMinutes, 1200);
  assert.equal(config.timeGrid.slotDurationMinutes, 30);
  assert.equal(config.timeGrid.maxVisibleAllDayEvents, 2);
  assert.equal(config.layouts.desktop.month, "monthGrid");
  assert.equal(config.layouts.mobile.week, "dayStrip");
  assert.equal(config.layouts.mobileBreakpoint, 640);
});

test("calendar config resolves responsive layouts with safe fallbacks", () => {
  const config = resolveCalendarConfig(planningPreset);
  assert.deepEqual(config.layouts.mobile, {
    month: "monthAgenda",
    week: "dayStrip",
    day: "timeGrid",
  });

  assert.throws(
    () => resolveCalendarConfig({
      ...discoveryPreset,
      layouts: { ...discoveryPreset.layouts, mobileBreakpoint: 0 },
    }),
    /mobileBreakpoint must be a positive finite number/,
  );
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

test("calendar config accepts developer layout overrides and rejects incompatible layouts", () => {
  const config = resolveCalendarConfig(planningPreset, {
    layouts: {
      desktop: { week: "timeline", day: "resourceDayGrid", month: "timeline" },
      mobile: { week: "timeline", day: "resourceDayGrid" },
      mobileBreakpoint: 720,
    },
  });
  assert.equal(config.layouts.desktop.week, "timeline");
  assert.equal(config.layouts.desktop.day, "resourceDayGrid");
  assert.equal(config.layouts.desktop.month, "monthGrid");
  assert.equal(config.layouts.mobile.week, "timeline");
  assert.equal(config.layouts.mobile.day, "resourceDayGrid");
  assert.equal(config.layouts.mobileBreakpoint, 720);
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
