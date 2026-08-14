import assert from "node:assert/strict";
import test from "node:test";
import { discoveryPreset } from "../presets/discovery";
import { getCalendarTabViews, getRovingViewIndex } from "./CalendarRoot";

test("returns enabled views in preset order", () => {
  assert.deepEqual(
    getCalendarTabViews({ ...discoveryPreset, enabledViews: ["month", "day"] }),
    ["month", "day"],
  );
});

test("wraps roving focus and honors Home and End", () => {
  assert.equal(getRovingViewIndex(1, "ArrowRight", 3), 2);
  assert.equal(getRovingViewIndex(2, "ArrowRight", 3), 0);
  assert.equal(getRovingViewIndex(1, "Home", 3), 0);
  assert.equal(getRovingViewIndex(0, "End", 3), 2);
});
