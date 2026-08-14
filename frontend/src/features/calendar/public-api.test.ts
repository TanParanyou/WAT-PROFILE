import assert from "node:assert/strict";
import test from "node:test";
import {
  Calendar,
  discoveryPreset,
  planningPreset,
  resolveCalendarConfig,
  useCalendar,
} from "./index";

test("calendar barrel exposes the supported reusable API", () => {
  assert.equal(typeof Calendar, "function");
  assert.equal(typeof useCalendar, "function");
  assert.equal(typeof resolveCalendarConfig, "function");
  assert.equal(discoveryPreset.enabledViews.join(","), "month,week,day");
  assert.equal(planningPreset.viewModes.week, "timeGrid");
});
