import assert from "node:assert/strict";
import test from "node:test";
import {
  Calendar,
  getCalendarEventResourceIds,
  discoveryPreset,
  planningPreset,
  resolveCalendarConfig,
  useCalendar,
} from "./index";
import type { CalendarLayout, CalendarResponsiveLayouts, CalendarResponsiveLayoutsInput } from "./index";

test("calendar barrel exposes the supported reusable API", () => {
  assert.equal(typeof Calendar, "function");
  assert.equal(typeof getCalendarEventResourceIds, "function");
  assert.equal(typeof useCalendar, "function");
  assert.equal(typeof resolveCalendarConfig, "function");
  assert.equal(discoveryPreset.enabledViews.join(","), "month,week,day");
  assert.equal(planningPreset.viewModes.week, "timeline");
  const layout: CalendarLayout = "dayStrip";
  const input: CalendarResponsiveLayoutsInput = { mobile: { week: layout } };
  const resolved: CalendarResponsiveLayouts = resolveCalendarConfig(discoveryPreset).layouts;
  assert.equal(input.mobile?.week, resolved.mobile.week);
});
